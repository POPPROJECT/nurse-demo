import ExperienceForm from '@/app/components/student/book/ExperienceForm';
import { getSession } from '../../../../../lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function StudentBookPage({
  params,
}: {
  params: { bookId: string }; // คุณสามารถคง type นี้ไว้ได้
}) {
  // แก้ไขตรงนี้: await params ก่อน แล้วค่อยเข้าถึง .bookId
  // const resolvedParams = await params;
  // const bookIdStr = resolvedParams.bookId;
  // หรือจะเขียนรวบรัดแบบนี้ก็ได้:
  const bookIdStr = (await params).bookId;

  const bookId = parseInt(bookIdStr, 10);

  // เช็ค session ถ้าไม่มี → redirect
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  // โหลด title ของสมุดมาจาก backend
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const res = await fetch(`${BASE}/experience-books/${bookId}`, {
    headers: session?.accessToken
      ? {
          Authorization: `Bearer ${session.accessToken}`,
        }
      : undefined,
    credentials: 'include', // รองรับ session cookie ด้วย
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Cannot load book ${bookId}`);

  const book = (await res.json()) as { title: string };

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
      <Link
        href="/student/books"
        className="inline-flex items-center mb-2 text-gray-600 hover:text-gray-700 dark:text-gray-300"
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
      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 ">
        <h1 className="text-xl font-semibold sm:text-2xl">บันทึกประสบการณ์</h1>
      </div>

      <div className="p-3 mb-6  dark:text-white bg-white dark:bg-[#1E293B] text-gray-800 rounded-xl shadow-md transition-shadow duration-300 min-w-auto">
        <h2 className="text-lg font-semibold sm:text-xl ">✏️ {book.title}</h2>
      </div>

      <ExperienceForm
        bookId={bookId}
        studentId={session.user.id}
        accessToken={session.accessToken}
      />
    </div>
  );
}
