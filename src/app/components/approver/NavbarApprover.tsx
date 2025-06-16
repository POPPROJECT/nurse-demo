"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaBars, FaUser, FaUserEdit } from "react-icons/fa";
import { MdLogout, MdOutlineManageSearch } from "react-icons/md";
import { GoChecklist } from "react-icons/go";
import { TbReport } from "react-icons/tb";
import ThemeToggle from "../ui/ThemeToggle";
import { useAuth } from "@/app/contexts/AuthContext";

interface NavbarApproverProps {
  role: "APPROVER_IN" | "APPROVER_OUT";
}

export default function NavbarApprover({ role }: NavbarApproverProps) {
  const { session } = useAuth(); // ✅ ดึง session จาก Context
  const user = session?.user; // ✅ เข้าถึง user object
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-[#F1A661] dark:bg-[#1E293B] text-white px-4 py-3 flex items-center justify-between w-full top-0 left-0 right-0 z-50 mx-auto fixed sm:relative  shadow-lg">
      <div className="flex items-center space-x-3">
        <Image
          src="/NULOGO.png"
          alt="University Logo"
          width={50}
          height={50}
          className="rounded-full"
        />
        <span className="text-lg font-semibold">มหาวิทยาลัยนเรศวร</span>
        <ThemeToggle />
      </div>

      <div className="items-center hidden gap-4 md:flex">
        {user && (
          <>
            <Link href="/approver/Profile">
              {user.avatarUrl ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${user.avatarUrl}`}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="object-cover rounded-full"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center w-10 h-10 text-gray-400 bg-white rounded-full">
                  <FaUser className="text-xl" />
                </div>
              )}
            </Link>
            <span className="text-sm font-medium">{user.name}</span>
          </>
        )}
      </div>

      <div className="md:hidden">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <FaBars className="text-2xl" />
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute w-64 p-4 text-black bg-white border rounded-md shadow-lg top-16 right-4 md:hidden ">
          <div className="py-2">
            {user && (
              <Link
                href="/approver/Profile"
                className="flex items-center justify-center px-2 py-1 rounded hover:bg-gray-100"
              >
                {user.name}
              </Link>
            )}
            <hr className="text-gray-400" />
            <Link
              href="/approver/approved"
              className="flex items-center py-2 space-x-2 rounded-md hover:bg-gray-200 "
            >
              <FaUserEdit />
              <span>รออนุมัติรายการ</span>
            </Link>
            {role === "APPROVER_IN" && (
              <>
                <Link
                  href="/approver/check-student"
                  className="flex items-center py-2 space-x-2 rounded-md hover:bg-gray-200"
                >
                  <MdOutlineManageSearch />
                  <span>รายงานผลของนิสิต</span>
                </Link>

                <Link
                  href="/approver/dashboard"
                  className="flex items-center py-2 space-x-2 rounded-md hover:bg-gray-200"
                >
                  <TbReport />
                  <span>ภาพรวมความคืบหน้า</span>
                </Link>
              </>
            )}
            <Link
              href="/approver/LogRequest"
              className="flex items-center py-2 space-x-2 rounded-md hover:bg-gray-200"
            >
              <GoChecklist />
              <span>ประวัติการอนุมัติ</span>
            </Link>
            <hr className="text-gray-400" />

            <button
              onClick={async () => {
                await fetch("/api/auth/signout", { method: "POST" });
                window.location.href = "/";
              }}
              className="flex items-center w-full py-2 space-x-2 rounded-md hover:bg-gray-200"
            >
              <MdLogout className="inline mr-2" /> ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
