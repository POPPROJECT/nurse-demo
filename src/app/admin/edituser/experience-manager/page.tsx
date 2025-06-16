import EditExperienceManagerTable from "@/app/components/admin/table/edit-experience_manager/EditExperience-ManagerTable";
import ToggleExperienceSystem from "@/app/components/admin/ToggleExperienceSystem";
import { getSession } from "lib/session";
import { redirect } from "next/navigation";
import React from "react";

export default async function Experience_Manager() {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    // ตรวจสอบ Role ADMIN
    console.error(
      "⛔ [AdminExperienceManagerPage] Session not found or not ADMIN. Redirecting.",
    );
    redirect("/");
  }

  return (
    <div className="w-full p-4 md:p-6">
      {/* Form Section */}
      <div className="w-full max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-lg dark:bg-[#26334b] md:p-6 space-y-6">
        <div className="mb-6 mt-3">
          <span className=" px-4 py-4 bg-[#da935a] text-black text-xl rounded-xl font-bold shadow-lg">
            จัดการบัญชีผู้จัดการเล่มบันทึก
          </span>
        </div>
        <br />

        <ToggleExperienceSystem accessToken={session.accessToken} />

        <EditExperienceManagerTable accessToken={session.accessToken} />
      </div>
    </div>
  );
}
