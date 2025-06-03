import { Role } from '../../../../../../lib/type';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');

  if (!role) throw new Error('Missing role');

  let targetPath = '/';
  switch (role) {
    case 'STUDENT':
      targetPath = '/student/books';
      break;
    case 'APPROVER_IN':
    case 'APPROVER_OUT':
      targetPath = '/approver/approved';
      break;
    case 'ADMIN':
      targetPath = '/admin/books';
      break;
    case 'EXPERIENCE_MANAGER':
      targetPath = '/experience-manager/books';
      break;
    default:
      targetPath = '/auth-failed';
  }

  return redirect(targetPath);
}
