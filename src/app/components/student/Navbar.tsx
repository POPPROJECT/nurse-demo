'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaBars, FaBookMedical, FaUser } from 'react-icons/fa';
import { GoChecklist } from 'react-icons/go';
import { MdOutlineManageSearch, MdLogout } from 'react-icons/md';
import { PiExportBold } from 'react-icons/pi';
import ThemeToggle from '../ui/ThemeToggle';

interface SessionUser {
  id: number;
  name: string;
  role: string;
  avatarUrl?: string;
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

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
    <nav className="bg-[#F1A661] dark:bg-[#1E293B] text-white px-4 py-3 flex items-center justify-between w-full top-0 left-0 right-0 z-50 mx-auto fixed sm:relative shadow-lg">
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
            <Link href="/student/Profile">
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
        <div className="absolute w-64 p-4 text-black bg-white border rounded-md shadow-lg top-16 right-4 md:hidden">
          <div className="py-2 space-y-2">
            {user && (
              <Link
                href="/student/Profile"
                className="flex items-center justify-center px-2 py-1 rounded hover:bg-gray-100"
              >
                {user.name}
              </Link>
            )}
            <hr />

            <Link
              href="/student/books"
              className="block px-2 py-1 rounded hover:bg-gray-100"
            >
              <FaBookMedical className="inline mr-2" /> สมุดบันทึกประสบการณ์
            </Link>

            <Link
              href="/student/progress"
              className="block px-2 py-1 rounded hover:bg-gray-100"
            >
              <MdOutlineManageSearch className="inline mr-2" />{' '}
              ตรวจสอบความคืบหน้า
            </Link>

            <Link
              href="/student/recordList"
              className="block px-2 py-1 rounded hover:bg-gray-100"
            >
              <GoChecklist className="inline mr-2" /> ตรวจสอบรายการบันทึก
            </Link>

            <Link
              href="/student/export"
              className="block px-2 py-1 rounded hover:bg-gray-100"
            >
              <PiExportBold className="inline mr-2" /> ส่งออกข้อมูล
            </Link>

            <hr />
            <Link
              href="/api/auth/signout"
              className="block px-2 py-1 text-red-500 rounded hover:bg-gray-100"
            >
              <MdLogout className="inline mr-2" /> ออกจากระบบ
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
