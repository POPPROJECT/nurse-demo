import React from 'react';
import { redirect } from 'next/navigation';
import BookManager from '@/app/components/admin/book/BookManager';
import { getSession } from '../../../../lib/session';

export default async function AdminBooksPage() {
  console.log('--- [AdminBooksPage] Checking session... ---');

  const session = await getSession();
  console.log('[AdminBooksPage] Session object received:', session);

  if (!session || session.user.role !== 'ADMIN') {
    console.log(
      '[AdminBooksPage] Redirecting to / because session is invalid or not ADMIN.'
    );

    redirect('/');
  }
  console.log('[AdminBooksPage] Session is valid. Rendering page.');

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 ">
        <h1 className="text-xl font-semibold sm:text-2xl">
          จัดการสมุดประสบการณ์
        </h1>
      </div>
      <BookManager accessToken={session.accessToken} />
    </div>
  );
}
