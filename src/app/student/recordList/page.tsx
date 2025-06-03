import RecordTable from '@/app/components/student/table/RecordTable';
import { getSession } from '../../../../lib/session';
import { redirect } from 'next/navigation';

export default async function RecordsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }
  return <RecordTable accessToken={session.accessToken} />;
}