'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import รูปภาพ
import { FaBars, FaBookMedical, FaUser, FaUserEdit } from 'react-icons/fa';
import { MdLogout, MdOutlineManageSearch } from 'react-icons/md';
import { GoChecklist } from 'react-icons/go';
import { TbReportSearch } from 'react-icons/tb';
import { IoPersonAdd } from 'react-icons/io5';
import ThemeToggle from '../ui/ThemeToggle';

interface SessionUser {
  id: number;
  name: string;
  role: string;
  avatarUrl?: string;
}

export default function NavbarAdmin() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isRegisterDropdownOpen, setIsRegisterDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
          {
            credentials: 'include',
          }
        );
        if (res.ok) {
          const data = await res.json();
          setUser({
            id: data.id,
            name: data.fullname || 'ไม่ระบุชื่อ',
            role: data.role,
            avatarUrl: data.avatarUrl || null,
          });
        }
      } catch (err) {
        console.error('❌ Failed to fetch user:', err);
      }
    };

    fetchUser();
  }, []);

  return (
    <nav className="bg-[#F1A661] dark:bg-[#1E293B] text-white px-4 py-3 flex items-center justify-between w-full top-0 left-0 right-0  z-50 mx-auto fixed sm:relative shadow-lg">
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
            <Link href="/admin/Profile">
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
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <FaBars className="text-2xl" />
        </button>
      </div>

      {/* เมนูแบบ dropdown เมื่อกดปุ่ม */}
      {isMenuOpen && (
        <div className="absolute w-64 p-4 text-black bg-white border rounded-md shadow-lg top-16 right-4 md:hidden ">
          <div className="py-2">
            <div className="border-b border-gray-300 ">
              {user && (
                <Link
                  href="/admin/Profile"
                  className="flex items-center justify-center px-2 py-1 rounded hover:bg-gray-100"
                >
                  {user.name}
                </Link>
              )}
            </div>
            <Link
              href="/admin/books"
              className="flex items-center py-2 space-x-2 rounded-md hover:bg-gray-200 "
            >
              <FaBookMedical />
              <span>จัดการเล่มบันทึกประสบการณ์</span>
            </Link>

            {/* Dropdown สำหรับจัดการผู้ใช้ */}
            {/* <div className="py-2"> */}
            <button
              className="flex items-center w-full py-2 space-x-2 text-left rounded-md hover:bg-gray-200 "
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <FaUserEdit />
              <span>จัดการผู้ใช้</span>
            </button>
            {isDropdownOpen && (
              <div className="pl-6">
                <Link
                  href="/admin/edituser/student"
                  className="block px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  นิสิต
                </Link>
                <Link
                  href="/admin/edituser/approveIn"
                  className="block px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  ผู้นิเทศภายใน
                </Link>
                <Link
                  href="/admin/edituser/approveOut"
                  className="block px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  ผู้นิเทศภายนอก
                </Link>
                <Link
                  href="/admin/edituser/experience-manager"
                  className="block px-4 py-2 rounded-lg bg-[#555555] text-white hover:bg-[#da935a] hover:text-black transition"
                >
                  ผู้จัดการเล่มบันทึก
                </Link>
              </div>
            )}
            {/* </div> */}

            {/* Dropdown สำหรับเพิ่มบัญชีผู้ใช้งาน */}
            <button
              className="flex items-center w-full py-2 space-x-2 text-left rounded-md hover:bg-gray-200"
              onClick={() => setIsRegisterDropdownOpen(!isRegisterDropdownOpen)}
            >
              <MdOutlineManageSearch />
              <span>เพิ่มบัญชีผู้ใช้งาน</span>
            </button>
            {isRegisterDropdownOpen && (
              <div className="pl-6">
                <Link
                  href="/admin/RegisterUser"
                  className="block px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  เพิ่มบัญชีผู้ใช้งาน
                </Link>
                <Link
                  href="/admin/ImportUser"
                  className="block px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  นำเข้าบัญชีผู้ใช้งาน
                </Link>
              </div>
            )}

            <Link
              href="/admin/RegisterUser"
              className="flex items-center py-2 space-x-2 rounded-md hover:bg-gray-200"
            >
              <TbReportSearch />
              <span>ภาพรวมความคืบหน้าของนิสิต</span>
            </Link>

            <Link
              href="/admin/logAdmin"
              className="flex items-center py-2 space-x-2 rounded-md hover:bg-gray-200"
            >
              <GoChecklist />
              <span>ตรวจสอบ log</span>
            </Link>

            <br />

            <div className="border-t border-gray-300">
              <Link
                href="/api/auth/signout"
                className="flex items-center py-2 space-x-2 rounded-md hover:bg-gray-200"
              >
                <MdLogout className="inline mr-2" /> ออกจากระบบ
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
