import EditApproveInTable from "@/app/components/admin/table/edit-approverIn/EditApproverInTable";
import { getSession } from "lib/session";
import { redirect } from "next/navigation";
import React from "react";

export default async function ApprovedIn() {
  const session = await getSession();

  // ✅ การป้องกันเส้นทางใน Server Component
  if (!session || session.user.role !== "ADMIN") {
    // ตรวจสอบ Role ADMIN
    console.error(
      "⛔ [AdminApproveInPage] Session not found or not ADMIN. Redirecting.",
    );
    redirect("/");
  }

  return (
    <div className="w-full p-4 md:p-6">
      {/* Form Section */}
      <div className="w-full max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-lg dark:bg-[#26334b] md:p-6 space-y-6">
        <div className="mb-6 mt-3">
          <span className=" px-4 py-4 bg-[#da935a] text-black text-xl rounded-xl font-bold shadow-lg">
            จัดการบัญชีผู้นิเทศก์ภายใน
          </span>
        </div>
        <br />

        <EditApproveInTable accessToken={session.accessToken} />
      </div>
    </div>
  );
}
