import { getSession } from '../../../../../lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import FieldManager from '@/app/components/experience-manager/book/FieldManager';
import OverviewCourseSubCourseManager from '@/app/components/experience-manager/book/OverviewCourseManager';

export default async function Experience_ManagerBookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId: bookIdStr } = await params;
  const bookId = parseInt(bookIdStr, 10);

  const session = await getSession();
  if (!session || session.user.role !== 'EXPERIENCE_MANAGER') {
    redirect('/');
  }

  const token = session.accessToken;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/experience-books/${bookId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    console.error('❌ Failed to fetch book:', await res.text());
    redirect('/experience-manager/books');
  }

  const book = await res.json();

  return (
    <div className="p-6 space-y-8">
      <Link
        href="/experience-manager/books"
        className="inline-flex items-center text-gray-600 hover:text-gray-800"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        กลับไปหน้าสมุดทั้งหมด
      </Link>

      <h1 className="text-3xl font-semibold">
        จัดการสมุด: <span className="text-blue-600">{book.title}</span>
      </h1>

      <section className="space-y-6">
        <OverviewCourseSubCourseManager bookId={bookId} accessToken={token} />
      </section>

      <h1 className="mb-4 text-2xl">จัดการฟิลด์สมุด</h1>
      <section className="p-6 bg-white rounded shadow">
        <FieldManager bookId={bookId} accessToken={token} />
      </section>
    </div>
  );
}
