"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaBars, FaBookMedical, FaUser } from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import ThemeToggle from "../ui/ThemeToggle";
import { useAuth } from "@/app/contexts/AuthContext";
import { TbReport } from "react-icons/tb";
import { LuSquarePlus } from "react-icons/lu";

export default function Navbar() {
  const { session, accessToken } = useAuth(); // ✅ ดึง session และ accessToken จาก Context
  const user = session?.user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [countingEnabled, setCountingEnabled] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!accessToken) {
        // ✅ รอให้ accessToken พร้อมใช้งานก่อน
        console.log(
          "[Navbar ExperienceManager] No accessToken, skipping fetchStatus.",
        );
        // อาจจะไม่ต้องทำอะไร เพราะถ้าไม่มี token ก็ไม่ควรจะเห็นหน้านี้ (Layout ป้องกันแล้ว)
        return;
      }
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/settings/get-status`,
          {
            // credentials: 'include', // ไม่จำเป็นแล้วถ้า Backend ใช้ Bearer Token
            headers: {
              // ✅ ส่ง Token ใน Header
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        if (res.ok) {
          // ✅ ตรวจสอบ res.ok ก่อน .json()
          const data = await res.json();
          setCountingEnabled(data.enabled);
        } else {
          console.error(
            "Navbar ExperienceManager: Failed to fetch counting status",
            res.status,
          );
          setCountingEnabled(false); // ตั้งค่า Default ถ้า fetch ล้มเหลว
        }
      } catch (err) {
        console.error(
          "❌ Navbar ExperienceManager: Failed to fetch counting status:",
          err,
        );
        setCountingEnabled(false);
      }
    };

    fetchStatus();
  }, [accessToken]);

  return (
    <nav className="bg-[#F1A661] dark:bg-[#1E293B] text-white px-4 py-3 flex items-center justify-between w-full top-0 left-0 right-0  z-50 mx-auto fixed sm:relative shadow-xl">
      {/* โลโก้และชื่อมหาลัย */}
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

      {/* เมนูสำหรับขนาดจอใหญ่ */}
      <div className="items-center hidden gap-4 md:flex">
        {user && (
          <>
            <Link href="/experience-manager/Profile">
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

      {/* ปุ่มเมนูสำหรับจอเล็ก */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="mt-4 mb-4 hover:text-white dark:text-white text-black hover:bg-[#da935a] p-2 rounded-lg transition self-end mr-4"
        >
          <FaBars className="text-2xl" />
        </button>
      </div>

      {/* เมนูแบบ dropdown เมื่อกดปุ่ม */}
      {isMenuOpen && (
        <div className="absolute w-64 p-4 text-black bg-white border rounded-md shadow-lg top-16 right-4 md:hidden">
          <div className="py-2">
            {user && (
              <Link
                href="/experience-manager/Profile"
                className="flex items-center justify-center px-2 py-1 rounded hover:bg-gray-100"
              >
                {user.name}
              </Link>
            )}

            <hr className="text-gray-400" />

            <Link
              href="/experience-manager/books"
              className="flex items-center py-2 space-x-2 rounded-md hover:bg-gray-200"
            >
              <FaBookMedical />
              <span>จัดการเล่มบันทึกประสบการณ์</span>
            </Link>

            {/* ✅ เงื่อนไขแสดงเมนูนับประสบการณ์ */}
            {countingEnabled && (
              <Link
                href="/experience-manager/CountsExperience"
                className="flex items-center py-2 space-x-2 rounded-md hover:bg-gray-200"
              >
                <LuSquarePlus />
                <span>จัดการประสบการณ์ของนิสิต</span>
              </Link>
            )}

            <Link
              href="/experience-manager/dashboard"
              className="flex items-center py-2 space-x-2 rounded-md hover:bg-gray-200 "
            >
              <TbReport />
              <span>ภาพรวมความคืบหน้า</span>
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
