import EditStudentTable from "@/app/components/admin/table/edit-student/EditStudentTable";
import { getSession } from "lib/session";
import React from "react";

export default async function Student() {
  const session = await getSession();
  if (!session) {
    console.error("⛔ Session not found!");
    return;
  }

  return (
    <div className="">
      <div className="w-full p-4 md:p-6">
        {/* Form Section */}
        <div className="w-full max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-lg dark:bg-[#26334b] md:p-6 space-y-6">
          <div className="mb-6 mt-3">
            <span className=" px-4 py-4 bg-[#da935a] text-black text-xl rounded-xl font-bold shadow-lg">
              จัดการบัญชีนิสิต
            </span>
          </div>
          <br />

          <EditStudentTable />
        </div>
      </div>
    </div>
  );
}
