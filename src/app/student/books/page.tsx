import { redirect } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import { getSession } from '../../../../lib/session';

type Book = {
  id: number;
  title: string;
  description?: string;
};

export default async function StudentBooksPage() {
  // 1. ตรวจสอบ session
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  // 2. ดึงรายการสมุดที่อนุญาต
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  let books: Book[] = [];

  try {
    const res = await fetch(`${BASE}/experience-books/authorized`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: 'no-store',
      credentials: 'include',
    });

    if (res.status === 401) {
      // token หมดอายุ หรือไม่ผ่าน auth → กลับไปล็อกอินใหม่
      redirect('/');
    }

    if (res.ok) {
      books = await res.json();
    } else {
      // ถ้าสถานะอื่นผิดพลาด จะไม่โยน แต่เก็บให้เป็น empty array
      console.error(
        'Fetch authorized books failed:',
        res.status,
        await res.text()
      );
      books = [];
    }
  } catch (err) {
    // network error หรือ exception อื่น ๆ
    console.error('Error fetching authorized books:', err);
    books = [];
  }

  // 3. แสดงผล
  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B]  rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 cursor-pointer">
        <h1 className="text-2xl font-semibold">สมุดบันทึกประสบการณ์</h1>
      </div>

      {books.length === 0 ? (
        <p className="text-center text-gray-600">คุณยังไม่มีสิทธิ์ใช้สมุดใดๆ</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => (
            <Link
              key={b.id}
              href={`/student/books/${b.id}`}
              className="block p-6 transition bg-white rounded-lg shadow hover:shadow-lg hover:-translate-y-1 "
            >
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {b.title}
              </h2>
              {b.description && (
                <p className="mb-4 text-gray-600">{b.description}</p>
              )}
              <span className="font-medium text-blue-600 hover:underline">
                บันทึกข้อมูล &rarr;
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
