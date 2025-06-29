import { Role } from 'lib/type';
import { redirect } from 'next/navigation';
import StudentHistoryClient from './StudentHistoryClient';
import { getSession } from 'lib/session';

async function getExperienceCountingSystemStatus() {
  const session = await getSession(); // Get session from server-side (no useAuth here)
  const token = session?.accessToken;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/settings/get-status`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    if (!res.ok) return { enabled: false };
    const data = await res.json();
    return { enabled: data.enabled };
  } catch (e) {
    return { enabled: false };
  }
}

export default async function StudentHistoryPageServer({
  params,
}: {
  params: { studentId: string };
}) {
  const session = await getSession(); // Get session from server-side (no useAuth here)
  if (
    !session ||
    !session.user ||
    session.user.role !== Role.EXPERIENCE_MANAGER
  ) {
    redirect('/');
  }

  const { enabled } = await getExperienceCountingSystemStatus();
  if (!enabled) {
    return (
      <div className="mt-12 text-xl font-bold text-center text-red-500">
        ระบบนับประสบการณ์ถูกปิดใช้งานโดยผู้ดูแลระบบ
      </div>
    );
  }

  return <StudentHistoryClient studentId={params.studentId} />;
}
