import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaBars, FaBookMedical, FaUser } from 'react-icons/fa';
import { MdLogout } from 'react-icons/md';
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
  const [countingEnabled, setCountingEnabled] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
          { credentials: 'include' }
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

    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/settings/get-status`,
          { credentials: 'include' }
        );
        const data = await res.json();
        setCountingEnabled(data.enabled);
      } catch (err) {
        setCountingEnabled(false);
      }
    };

    fetchUser();
    fetchStatus();
  }, []);

  return (
    <nav className="bg-[#F1A661] dark:bg-[#1E293B] text-white px-4 py-3 flex items-center justify-between w-full top-0 left-0 right-0  z-50 mx-auto fixed sm:relative">
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
            <div className="border-b border-gray-300">
              {user && (
                <Link
                  href="/experience-manager/Profile"
                  className="flex items-center justify-center px-2 py-1 rounded hover:bg-gray-100"
                >
                  {user.name}
                </Link>
              )}
            </div>
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
                <FaBookMedical />
                <span>นับประสบการณ์</span>
              </Link>
            )}

            <div className="border-t border-gray-300">
              <Link
                href="/api/auth/signout"
                className="flex items-center py-2 space-x-2 rounded-md hover:bg-gray-200"
              >
                <MdLogout className="inline mr-2" />
                ออกจากระบบ
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
