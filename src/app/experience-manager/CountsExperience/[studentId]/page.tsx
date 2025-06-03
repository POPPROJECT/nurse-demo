// app/experience-manager/CountsExperience/[studentId]/page.tsx

import { getSession, Session } from 'lib/session';
import { Role } from 'lib/type';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StudentExperienceClient from './StudentExperienceClient'; // Your renamed client component

// Component สำหรับแสดงข้อความเมื่อฟีเจอร์ปิดหรือเข้าไม่ได้
const FeatureDisabledMessage = ({
  message,
  backLink,
  backLinkText,
}: {
  message: string;
  backLink: string;
  backLinkText: string;
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] p-4 text-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold text-red-500 dark:text-red-400">
          ไม่สามารถเข้าถึงได้
        </h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">{message}</p>
        <Link
          href={backLink}
          className="px-6 py-2 font-semibold text-white transition bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          {backLinkText}
        </Link>
      </div>
    </div>
  );
};

// ฟังก์ชันสำหรับตรวจสอบสถานะระบบนับประสบการณ์
async function getExperienceCountingSystemStatus(): Promise<{
  enabled: boolean;
  error: string | null;
}> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/settings/get-status`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      console.error(
        `CountsExperience/[studentId]/page (Server): Failed to fetch system status, code: ${res.status}`
      );
      return { enabled: false, error: `API Error: ${res.status}` };
    }
    const data = await res.json();
    // Ensure 'enabled' property exists, default to false if not
    return {
      enabled: typeof data.enabled === 'boolean' ? data.enabled : false,
      error: null,
    };
  } catch (error) {
    console.error(
      `CountsExperience/[studentId]/page (Server): Exception fetching system status: ${error}`
    );
    return { enabled: false, error: (error as Error).message };
  }
}

// interface สำหรับข้อมูลโปรไฟล์นิสิต (ปรับตามที่ backend ส่งมา)
interface StudentProfile {
  id: number; // Database Primary Key (numeric)
  studentId: string; // The displayable/actual student ID (string, e.g., "64012345")
  fullname: string;
  // เพิ่ม field อื่นๆ ที่ backend ส่งมาและคุณต้องการใช้
}

// ฟังก์ชันสำหรับดึงข้อมูลโปรไฟล์นิสิตจาก backend
async function fetchStudentProfileByStudentId(
  studentIdFromUrlParam: string, // The ID from the URL (e.g., "45")
  token: string
): Promise<StudentProfile | null> {
  try {
    // Endpoint นี้ควรใช้ identifier ที่ backend คาดหวัง
    // หาก :studentId ใน backend คือ database PK (integer), studentIdFromUrlParam ต้องเป็น PK นั้น
    // หาก :studentId ใน backend คือ student ID string (เช่น "64012345"), studentIdFromUrlParam ต้องเป็น string นั้น
    // จากการใช้งาน ดูเหมือน studentIdFromUrlParam คือ PK ที่ใช้ใน API path
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_BACKEND_URL
      }/users/student/${encodeURIComponent(studentIdFromUrlParam)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    if (!res.ok) {
      console.error(
        `CountsExperience/[studentId]/page (Server): Failed to fetch student profile for ID ${studentIdFromUrlParam}, status: ${
          res.status
        }, Body: ${await res.text()}`
      );
      return null;
    }
    const profileData = await res.json();
    if (!profileData || !profileData.studentId || !profileData.fullname) {
      console.error(
        `CountsExperience/[studentId]/page (Server): Fetched profile for ID ${studentIdFromUrlParam} is missing required fields:`,
        profileData
      );
      return null;
    }
    return profileData as StudentProfile;
  } catch (err) {
    console.error(
      `CountsExperience/[studentId]/page (Server): Exception fetching student profile for ID ${studentIdFromUrlParam}:`,
      err
    );
    return null;
  }
}

interface StudentExperiencePageProps {
  params: {
    studentId: string;
  };
}


export default async function StudentExperiencePage({
  params,
}: StudentExperiencePageProps) {
  const { studentId } = params;

  const session: Session | null = await getSession();

  // 1. Authentication and Role Check
  if (
    !session ||
    !session.user ||
    session.user.role !== Role.EXPERIENCE_MANAGER
  ) {
    redirect('/'); // Or your login page
  }

  // Ensure accessToken exists before proceeding with API calls that need it
  if (!session.accessToken) {
    console.error('StudentExperiencePageServer: No access token in session.');
    return (
      <FeatureDisabledMessage
        message="Session ไม่ถูกต้อง หรือ token หมดอายุ ไม่สามารถดำเนินการต่อได้"
        backLink="/experience-manager/CountsExperience"
        backLinkText="กลับไปหน้ารายงานผล"
      />
    );
  }

  // 2. Check System Status (Corrected destructuring)
  const systemStatusResult = await getExperienceCountingSystemStatus();
  const { enabled: countingEnabled, error: statusFetchError } =
    systemStatusResult;

  if (statusFetchError) {
    return (
      <FeatureDisabledMessage
        message="ไม่สามารถตรวจสอบสถานะของระบบนับประสบการณ์ได้ในขณะนี้"
        backLink="/experience-manager/CountsExperience"
        backLinkText="กลับไปหน้ารายงานผล"
      />
    );
  }

  if (!countingEnabled) {
    return (
      <FeatureDisabledMessage
        message="ระบบนับประสบการณ์ถูกปิดการใช้งานโดยผู้ดูแลระบบ"
        backLink="/experience-manager/CountsExperience"
        backLinkText="กลับไปหน้ารายงานผล"
      />
    );
  }

  // 3. Fetch Student Profile
  const studentProfile = await fetchStudentProfileByStudentId(
    studentIdFromUrl, // This is the ID from the URL, e.g., "45"
    session.accessToken
  );

  if (
    !studentProfile ||
    !studentProfile.studentId ||
    !studentProfile.fullname
  ) {
    console.log(
      `StudentExperiencePageServer: Student profile not found or invalid for URL param: ${studentIdFromUrl}. Profile data received:`,
      studentProfile
    );
    return (
      <FeatureDisabledMessage
        message={`ไม่พบข้อมูลนิสิตสำหรับรหัส '${studentIdFromUrl}' หรือไม่มีสิทธิ์เข้าถึง`}
        backLink="/experience-manager/CountsExperience"
        backLinkText="กลับไปหน้ารายงานผล"
      />
    );
  }

  // 4. If all checks pass, render the client component
  // studentIdForApi: This should be the ID your client component's APIs expect (e.g., the numeric primary key or the string student ID).
  //                    Your client code uses parseInt(studentIdForApi, 10), so it expects something parsable to an int.
  //                    If studentIdFromUrl is "45" and that's the PK, it's fine.
  // studentDisplayId: This is the student ID string for display purposes (e.g., "64012345").
  // studentName: The student's full name.
  return (
    <StudentExperienceClient
      studentIdForApi={studentIdFromUrl} // Assuming studentIdFromUrl from params is what your client needs for API calls after parseInt
      studentName={studentProfile.fullname}
      studentDisplayId={studentProfile.studentId} // The actual student ID string from profile
      session={session}
    />
  );
}
