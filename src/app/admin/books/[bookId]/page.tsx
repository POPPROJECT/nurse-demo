import { getSession } from "../../../../../lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminCourseSubCourseManager from "@/app/components/admin/book/AdminCourseSubCourseManager";
import FieldManager from "@/app/components/admin/book/FieldManager";

export default async function AdminBookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId: bookIdStr } = await params;
  const bookId = parseInt(bookIdStr, 10);

  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    console.error("⛔ Session not found!");
    return;
  }

  const token = session.accessToken;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/experience-books/${bookId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    console.error("❌ Failed to fetch book:", await res.text());
    redirect("/admin/books");
  }

  const book = await res.json();

  return (
    <div className="w-full max-w-6xl p-6 mx-auto space-y-8 sm:mt-0 mt-10">
      <Link
        href="/admin/books"
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
        <h1 className="text-xl font-semibold sm:text-2xl ">
          จัดการเนื้อหาสมุด
        </h1>
      </div>

      <div className="p-3 mb-6  dark:text-white bg-white dark:bg-[#1E293B] text-gray-800 rounded-xl shadow-md transition-shadow duration-300 min-w-auto">
        <h2 className="text-lg font-semibold sm:text-xl ">✏️ {book.title}</h2>
      </div>

      <section className="space-y-6">
        <AdminCourseSubCourseManager bookId={bookId} accessToken={token} />
      </section>

      <h1 className="pl-4 mt-5 mb-5 text-lg text-gray-800 uppercase border-l-4 border-orange-500 sm:text-xl dark:text-white">
        จัดการรายละเอียดข้อมูล
      </h1>
      <section className="p-6 bg-white shadow rounded-xl">
        <FieldManager bookId={bookId} accessToken={token} />
      </section>
    </div>
  );
}
