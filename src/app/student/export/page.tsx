import { redirect } from "next/navigation";
import React from "react";
import { getSession } from "../../../../lib/session";
import ExportPdfClient from "@/app/components/student/pdf/ExportPdfClient";

type Book = {
  id: number;
  title: string;
  description?: string;
};

export default async function StudentExportPage() {
  // 1. ตรวจสอบ session
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  // 2. ดึงรายการสมุดที่อนุญาต
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  let books: Book[] = [];

  try {
    const res = await fetch(`${BASE}/experience-books/authorized`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store", // เพื่อให้ดึงข้อมูลใหม่ทุกครั้ง
      credentials: "include",
    });

    if (res.status === 401) {
      // token หมดอายุ หรือไม่ผ่าน auth → กลับไปล็อกอินใหม่
      redirect("/");
    }

    if (res.ok) {
      books = await res.json();
    } else {
      // ถ้าสถานะอื่นผิดพลาด จะไม่โยน แต่เก็บให้เป็น empty array
      console.error(
        "Fetch authorized books failed:",
        res.status,
        await res.text(),
      );
      books = [];
    }
  } catch (err) {
    // network error หรือ exception อื่น ๆ
    console.error("Error fetching authorized books:", err);
    books = [];
  }

  // 3. แสดงผล
  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg duration-300 ease-in-out transition-all hover:-translate-y-1">
        <h1 className="text-xl font-semibold sm:text-2xl">ส่งออกข้อมูล</h1>
      </div>

      <div className="bg-white dark:bg-[#1E293B] shadow-md rounded-xl p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          รายการสมุดประสบการณ์
        </h2>

        {books.length === 0 ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            <p>ไม่พบสมุดประสบการณ์ที่คุณมีสิทธิ์ส่งออก</p>
            <p>กรุณาติดต่อผู้ดูแลระบบหากมีข้อสงสัย</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-gray-50 dark:bg-[#364153] p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-200"
              >
                <h3 className="mb-2 text-lg font-medium text-gray-800 dark:text-white">
                  {book.title}
                </h3>
                {book.description && (
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    {book.description}
                  </p>
                )}
                {/* ส่ง accessToken และ bookId ไปให้ Client Component */}
                <ExportPdfClient
                  accessToken={session.accessToken}
                  bookId={book.id}
                  bookTitle={book.title}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
