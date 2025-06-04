import EditApproveInTable from '@/app/components/admin/table/edit-approverIn/EditApproverInTable';
import { getSession } from 'lib/session';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function ApprovedIn() {
  const session = await getSession();

  // ✅ การป้องกันเส้นทางใน Server Component
  if (!session || session.user.role !== 'ADMIN') {
    // ตรวจสอบ Role ADMIN
    console.error(
      '⛔ [AdminApproveInPage] Session not found or not ADMIN. Redirecting.'
    );
    redirect('/');
  }

  return (
    <div className="">
      <div className="flex flex-1 pt-16 sm:pt-0">
        {/* Form Section */}
        <main className="flex-1 p-6 bg-[#F2EDED] dark:bg-[#0F172A]">
          <div className="p-8 bg-white rounded-lg shadow-lg dark:bg-[#1E293B]">
            <div className="mt-4">
              <span className=" px-4 py-4 bg-[#da935a] text-black text-xl rounded-2xl font-bold shadow-lg">
                จัดการบัญชีผู้นิเทศภายใน
              </span>
            </div>
            <br />

            <EditApproveInTable accessToken={session.accessToken}/>
          </div>
        </main>
      </div>
    </div>
  );
}
