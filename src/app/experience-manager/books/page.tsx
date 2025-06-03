import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '../../../../lib/session';
import BookManager from '@/app/components/experience-manager/book/BookManager';

export default async function Experience_ManagerBooksPage() {
  const session = await getSession();
  if (!session || session.user.role !== 'EXPERIENCE_MANAGER') {
    redirect('/');
  }

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
