'use client';

import { useState } from 'react'; // useEffect ไม่จำเป็นแล้ว
import Link from 'next/link';
import Image from 'next/image';
import { FaBars, FaBookMedical, FaUser } from 'react-icons/fa';
import { GoChecklist } from 'react-icons/go';
import { MdOutlineManageSearch, MdLogout } from 'react-icons/md';
import { PiExportBold } from 'react-icons/pi';
import ThemeToggle from '../ui/ThemeToggle'; // ตรวจสอบ Path
import { useAuth } from '@/app/contexts/AuthContext';

export default function Navbar() {
  const { session } = useAuth(); // ✅ 2. ดึง session object มาจาก AuthContext
  const user = session?.user; // ✅ 3. เข้าถึง user object จาก session

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // 🗑️ ไม่ต้องมี useState สำหรับ user และ useEffect สำหรับ fetchUser อีกต่อไป

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
        {user && ( // ✅ ส่วนนี้จะใช้ user จาก Context
          <>
            <Link href="/student/Profile">
              {' '}
              {/* ✅ Path สำหรับ Profile ของ Student */}
              {user.avatarUrl ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${user.avatarUrl}`}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="object-cover rounded-full"
                  unoptimized // เพิ่ม unoptimized ถ้า URL เป็น external และ Next.js บ่นเรื่อง config
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
            {user && ( // ✅ ใช้ user จาก Context
              <Link
                href="/student/Profile" // ✅ Path สำหรับ Profile ของ Student
                className="flex items-center justify-center px-2 py-1 rounded hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)} // ✅ ปิดเมนูเมื่อคลิก
              >
                {user.name}
              </Link>
            )}
            <hr />

            <Link
              href="/student/books"
              className="block px-2 py-1 rounded hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <FaBookMedical className="inline mr-2" /> สมุดบันทึกประสบการณ์
            </Link>
            <Link
              href="/student/progress"
              className="block px-2 py-1 rounded hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <MdOutlineManageSearch className="inline mr-2" />{' '}
              ตรวจสอบความคืบหน้า
            </Link>
            <Link
              href="/student/recordList"
              className="block px-2 py-1 rounded hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <GoChecklist className="inline mr-2" /> ตรวจสอบรายการบันทึก
            </Link>
            <Link
              href="/student/export"
              className="block px-2 py-1 rounded hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <PiExportBold className="inline mr-2" /> ส่งออกข้อมูล
            </Link>

            <hr />
            <button // ✅ เปลี่ยน Link เป็น button เพื่อเรียกฟังก์ชัน logout
              onClick={async () => {
                setIsMenuOpen(false); // ปิดเมนูก่อน
                await fetch('/api/auth/signout', { method: 'GET' }); // หรือ POST ตาม API Route ของคุณ
                window.location.href = '/'; // Redirect ไปหน้า Login
              }}
              className="flex items-center w-full px-2 py-1 text-left text-red-500 rounded hover:bg-gray-100"
            >
              <MdLogout className="inline mr-2" /> ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
