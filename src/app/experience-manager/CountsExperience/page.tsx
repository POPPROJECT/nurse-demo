import { getSession, Session } from 'lib/session'; // Make sure Session type is exported from lib/session.ts
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
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/settings/get-status`,
      {
        // For server-to-server fetch, 'credentials: include' is not standard.
        // If your backend needs auth from the Next.js server, use API keys/tokens in headers.
        // This endpoint is public, so it should be fine.
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
  const session: Session | null = await getSession(); // Uses your lib/session.ts

  // 1. Authentication and Authorization Check (Server-Side)
  if (
    !session ||
    !session.user ||
    session.user.role !== Role.EXPERIENCE_MANAGER
  ) {
    redirect('/'); // Or to your login page e.g. '/auth/signin'
    // redirect() throws an error that Next.js handles, so no explicit return null is needed.
  }

  // 2. Check System Status (Server-Side)
  const { enabled: countingEnabled, error: statusFetchError } =
    await getExperienceCountingSystemStatus();

  if (statusFetchError) {
    // Log the error for your records and inform the user.
    console.error(
      `CountsExperiencePage (Server): System status fetch error - ${statusFetchError}`
    );
    return (
      <FeatureDisabledMessage message="ไม่สามารถตรวจสอบสถานะของระบบนับประสบการณ์ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" />
    );
  }

  if (!countingEnabled) {
    // If the system is disabled, prevent access by showing a message.
    return (
      <FeatureDisabledMessage message="ระบบนับประสบการณ์ถูกปิดการใช้งานโดยผู้ดูแลระบบ" />
    );
  }

  // 3. If all checks pass, render the client component.
  // Pass the session (or just the accessToken) to the client component to avoid re-fetching session there.
  return <CountsExperienceClient session={session} />;
}
