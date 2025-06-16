import { getSession } from "lib/session";
import { Role } from "lib/type";
import { redirect } from "next/navigation";
import CountsExperienceClient from "./CountsExperienceClient";

// Component สำหรับแสดงข้อความเมื่อฟีเจอร์ปิดหรือเข้าไม่ได้
const FeatureDisabledMessage = ({ message }: { message: string }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 text-center">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl dark:bg-slate-800">
        <h2 className="mb-4 text-2xl font-bold text-red-500 dark:text-red-400">
          ไม่สามารถใช้งานได้
        </h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">{message}</p>
      </div>
    </div>
  );
};

// ฟังก์ชันสำหรับตรวจสอบสถานะระบบ
async function getExperienceCountingSystemStatus(accessToken: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/settings/get-status`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );
    if (!res.ok) return { enabled: false, error: `API Error: ${res.status}` };
    const data = await res.json();
    return { enabled: data.enabled, error: null };
  } catch (error) {
    return { enabled: false, error: (error as Error).message };
  }
}

export default async function CountsExperiencePageServer() {
  const session = await getSession();

  if (
    !session ||
    !session.user ||
    session.user.role !== Role.EXPERIENCE_MANAGER
  ) {
    redirect("/");
  }

  // ส่ง accessToken ไปด้วยเพื่อความปลอดภัย
  const { enabled, error } = await getExperienceCountingSystemStatus(
    session.accessToken!,
  );

  if (error) {
    return (
      <FeatureDisabledMessage message="ไม่สามารถตรวจสอบสถานะของระบบนับประสบการณ์ได้" />
    );
  }
  if (!enabled) {
    return (
      <FeatureDisabledMessage message="ระบบนับประสบการณ์ถูกปิดการใช้งานโดยผู้ดูแลระบบ" />
    );
  }

  // ส่ง session ทั้งหมดไปให้ Client Component
  return <CountsExperienceClient session={session} />;
}
