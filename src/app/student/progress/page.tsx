import { redirect } from 'next/navigation';
import ProgressClient from '@/app/components/student/book/ProgressClient';
import { getSession } from '../../../../lib/session';

export default async function ProgressPage() {
  // ตรวจ session
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  return (
    // ส่ง accessToken ให้ ProgressClient
    <ProgressClient accessToken={session.accessToken} />
  );
}
