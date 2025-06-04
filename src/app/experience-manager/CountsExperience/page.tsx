import { getSession  } from 'lib/session'; // Make sure Session type is exported from lib/session.ts
import { Role } from 'lib/type'; // Your Role enum/type
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CountsExperienceClient from './CountsExperienceClient'; // The renamed client component

const FeatureDisabledMessage = ({ message }: { message: string }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] p-4 text-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold text-red-500 dark:text-red-400">
          ไม่สามารถเข้าถึงได้
        </h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">{message}</p>
        <Link
          href="/experience-manager/books" // Adjust if needed
          className="px-6 py-2 font-semibold text-white transition bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
};


async function getExperienceCountingSystemStatus() {
  const session = await getSession();
  const token = session?.accessToken;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/settings/get-status`,
      {
        // For server-to-server fetch, 'credentials: include' is not standard.
        // If your backend needs auth from the Next.js server, use API keys/tokens in headers.
        // This endpoint is public, so it should be fine.
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store', // Ensures you always get the latest status
      }
    );

    if (!res.ok) {
      console.error(
        'CountsExperiencePage (Server): Failed to fetch system status, code:',
        res.status
      );
      return { enabled: false, error: `API Error: ${res.status}` };
    }
    const data = await res.json();
    return { enabled: data.enabled, error: null };
  } catch (error) {
    console.error(
      'CountsExperiencePage (Server): Exception fetching system status:',
      error
    );
    return { enabled: false, error: (error as Error).message };
  }
}

export default async function CountsExperiencePageServer() {
  const session = await getSession();

  if (!session || session.user.role !== Role.EXPERIENCE_MANAGER) {
    redirect('/'); // Redirect to login if not authorized
  }

  const { enabled, error } = await getExperienceCountingSystemStatus();
  if (error) {
    console.error('Error fetching system status:', error);
    return (
      <FeatureDisabledMessage message="ไม่สามารถตรวจสอบสถานะของระบบนับประสบการณ์ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" />
    );
  }

  if (!enabled) {
    return (
      <FeatureDisabledMessage message="ระบบนับประสบการณ์ถูกปิดการใช้งานโดยผู้ดูแลระบบ" />
    );
  }

  // Pass the session to the client-side component
  return <CountsExperienceClient session={session} />;
}