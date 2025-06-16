"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MdLogout, MdOutlineManageSearch } from "react-icons/md";
import { FaBars, FaUserEdit } from "react-icons/fa";
import { GoChecklist } from "react-icons/go";
import { TbReport } from "react-icons/tb";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  onClick?: () => void;
}

function MenuItem({ icon, label, isCollapsed, onClick }: MenuItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 w-full px-4 py-3  rounded-lg hover:bg-[#da935a] bg-[#444444] hover:text-black text-white transition shadow-lg cursor-pointer ${
        isCollapsed ? "justify-center" : "justify-start"
      }`}
    >
      <div className="text-xl">{icon}</div>
      {!isCollapsed && <span className="text-sm">{label}</span>}
    </div>
  );
}

export default function SidebarApprover({
  role,
}: {
  role: "APPROVER_IN" | "APPROVER_OUT";
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`bg-[#FEF1E6] dark:bg-[#1E293B] text-white min-h-screen hidden md:flex ${
        isCollapsed ? "w-20" : "w-64"
      } transition-all duration-300 flex flex-col items-center shadow-lg`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mt-4 mb-8 hover:text-white dark:text-white text-black hover:bg-[#da935a] p-2 rounded-lg transition self-end mr-4"
      >
        <FaBars className="w-5 h-5" />
      </button>

      <nav className="flex flex-col w-full gap-4 px-2">
        <Link href="/approver/approved" className="text-black hover:text-white">
          <MenuItem
            isCollapsed={isCollapsed}
            icon={<FaUserEdit />}
            label="รออนุมัติรายการ"
          />
        </Link>

        {role === "APPROVER_IN" && (
          <>
            <Link
              href="/approver/check-student"
              className="text-black hover:text-white"
            >
              <MenuItem
                isCollapsed={isCollapsed}
                icon={<MdOutlineManageSearch />}
                label="รายงานผลของนิสิต"
              />
            </Link>

            <Link
              href="/approver/dashboard"
              className="text-black hover:text-white"
            >
              <MenuItem
                isCollapsed={isCollapsed}
                icon={<TbReport />}
                label="ภาพรวมความคืบหน้า"
              />
            </Link>
          </>
        )}

        <Link
          href="/approver/LogRequest"
          className="text-black hover:text-white"
        >
          <MenuItem
            isCollapsed={isCollapsed}
            icon={<GoChecklist />}
            label="ประวัติการอนุมัติ"
          />
        </Link>
        <div className="mb-6">
          <MenuItem
            isCollapsed={isCollapsed}
            icon={<MdLogout />}
            label="ออกจากระบบ"
            onClick={async () => {
              await fetch("/api/auth/signout", { method: "POST" });
              window.location.href = "/";
            }}
          />
        </div>
      </nav>
    </aside>
  );
}
