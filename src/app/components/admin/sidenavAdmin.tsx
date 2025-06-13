"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MdLogout } from "react-icons/md";
import { FaBars, FaUserEdit, FaUserPlus } from "react-icons/fa"; // นำเข้า FaBars
import { FaBookMedical } from "react-icons/fa6";
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
      className={`flex items-center gap-4 w-full px-4 py-3 rounded-lg hover:bg-[#da935a] bg-[#444444] hover:text-black text-white transition shadow-lg cursor-pointer ${
        isCollapsed ? "justify-center" : "justify-start"
      }`}
    >
      <div className="text-xl">{icon}</div>
      {!isCollapsed && <span className="text-sm">{label}</span>}
    </div>
  );
}

function SidenavAdmin() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRegisterDropdownOpen, setIsRegisterDropdownOpen] = useState(false);
  const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false);

  return (
    <aside
      className={`bg-[#FEF1E6] dark:bg-[#1E293B] text-white min-h-screen hidden md:flex ${
        isCollapsed ? "w-20" : "w-64"
      } transition-all duration-300 flex flex-col items-center shadow-lg`}
    >
      {/* ปุ่ม Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mt-4 mb-8 hover:text-white dark:text-white text-black hover:bg-[#da935a] p-2 rounded-lg transition self-end mr-4"
      >
        <FaBars className="w-5 h-5" />
      </button>

      {/* เมนู */}
      <nav className="flex flex-col w-full gap-4 px-2">
        <Link href="/admin/books" className="text-black hover:text-white">
          <MenuItem
            isCollapsed={isCollapsed}
            icon={<FaBookMedical />}
            label="จัดการเล่มบันทึกระสบการณ์"
          />
        </Link>

        {/* Dropdown เมนูสำหรับจัดการผู้ใช้ */}
        <div>
          <MenuItem
            isCollapsed={isCollapsed}
            icon={<FaUserEdit />}
            label="จัดการผู้ใช้"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          />
          {!isCollapsed && isDropdownOpen && (
            <ul className="flex flex-col gap-2 pl-8 mt-2">
              <li>
                <Link
                  href="/admin/edituser/student"
                  className="block px-4 py-2 rounded-lg bg-[#555555] text-white hover:bg-[#da935a] hover:text-black transition"
                >
                  นิสิต
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/edituser/approveIn"
                  className="block px-4 py-2 rounded-lg bg-[#555555] text-white hover:bg-[#da935a] hover:text-black transition"
                >
                  ผู้นิเทศภายใน
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/edituser/approveOut"
                  className="block px-4 py-2 rounded-lg bg-[#555555] text-white hover:bg-[#da935a] hover:text-black transition"
                >
                  ผู้นิเทศภายนอก
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/edituser/experience-manager"
                  className="block px-4 py-2 rounded-lg bg-[#555555] text-white hover:bg-[#da935a] hover:text-black transition"
                >
                  ผู้จัดการเล่มบันทึก
                </Link>
              </li>
            </ul>
          )}
        </div>

        <div>
          <MenuItem
            isCollapsed={isCollapsed}
            icon={<FaUserPlus />}
            label="เพิ่มบัญชีผู้ใช้งาน"
            onClick={() => setIsRegisterDropdownOpen(!isRegisterDropdownOpen)}
          />
          {!isCollapsed && isRegisterDropdownOpen && (
            <ul className="flex flex-col gap-2 pl-8 mt-2">
              <li>
                <Link
                  href="/admin/RegisterUser"
                  className="block px-4 py-2 rounded-lg bg-[#555555] text-white hover:bg-[#da935a] hover:text-black transition"
                >
                  เพิ่มบัญชีผู้ใช้งาน
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/ImportUser"
                  className="block px-4 py-2 rounded-lg bg-[#555555] text-white hover:bg-[#da935a] hover:text-black transition"
                >
                  นำเข้าบัญชีผู้ใช้งาน
                </Link>
              </li>
            </ul>
          )}
        </div>

        <div>
          <MenuItem
            isCollapsed={isCollapsed}
            icon={<TbReport />}
            label="ภาพรวมความคืบหน้า"
            onClick={() => setIsDashboardDropdownOpen(!isDashboardDropdownOpen)}
          />
          {!isCollapsed && isDashboardDropdownOpen && (
            <ul className="flex flex-col gap-2 pl-8 mt-2">
              <li>
                <Link
                  href="/admin/dashboard-subject"
                  className="block px-4 py-2 rounded-lg bg-[#555555] text-white hover:bg-[#da935a] hover:text-black transition"
                >
                  ภาพรวมความคืบหน้ารายวิชา
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/dashboard-student"
                  className="block px-4 py-2 rounded-lg bg-[#555555] text-white hover:bg-[#da935a] hover:text-black transition"
                >
                  ภาพรวมความคืบหน้าตลอดหลักสูตร
                </Link>
              </li>
            </ul>
          )}
        </div>

        <Link href="/admin/logAdmin" className="text-black hover:text-white">
          <MenuItem
            isCollapsed={isCollapsed}
            icon={<GoChecklist />}
            label="ตรวจสอบ log"
          />
        </Link>
        <MenuItem
          isCollapsed={isCollapsed}
          icon={<MdLogout />}
          label="ออกจากระบบ"
          onClick={async () => {
            await fetch("/api/auth/signout", { method: "POST" });
            window.location.href = "/";
          }}
        />
      </nav>
    </aside>
  );
}

export default SidenavAdmin;
