'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MdLogout } from 'react-icons/md';
import { FaBars } from 'react-icons/fa';
import { FaBookMedical } from 'react-icons/fa6';
import { TbReportSearch } from 'react-icons/tb';
import { LuSquarePlus } from 'react-icons/lu';

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
        isCollapsed ? 'justify-center' : 'justify-start'
      }`}
    >
      <div className="text-xl">{icon}</div>
      {!isCollapsed && <span className="text-sm">{label}</span>}
    </div>
  );
}

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [countingEnabled, setCountingEnabled] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/settings/get-status`,
          {
            credentials: 'include',
          }
        );
        const data = await res.json();
        setCountingEnabled(data.enabled);
      } catch (e) {
        setCountingEnabled(false); // fallback เป็นปิด
      }
    };
    fetchStatus();
  }, []);

  return (
    <aside
      className={`bg-[#FEF1E6] dark:bg-[#1E293B] text-white h-auto md:h-screen hidden md:flex ${
        isCollapsed ? 'w-20' : 'w-64'
      } transition-all duration-300 flex flex-col items-center shadow-lg`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mt-4 mb-8 hover:text-white dark:text-white text-black hover:bg-[#da935a] p-2 rounded-lg transition self-end mr-4"
      >
        <FaBars className="w-5 h-5" />
      </button>

      <nav className="flex flex-col w-full gap-4 px-2">
        <Link
          href="/experience-manager/books"
          className="text-black hover:text-white"
        >
          <MenuItem
            isCollapsed={isCollapsed}
            icon={<FaBookMedical />}
            label="จัดการเล่มบันทึกประสบการณ์"
          />
        </Link>

        {/* ✅ แสดงเฉพาะเมื่อเปิดระบบนับประสบการณ์ */}
        {countingEnabled && (
          <Link
            href="/experience-manager/CountsExperience"
            className="text-black hover:text-white"
          >
            <MenuItem
              isCollapsed={isCollapsed}
              icon={<LuSquarePlus />}
              label="นับประสบการณ์"
            />
          </Link>
        )}

        <Link
          href="/experience-manager/dashboard-student"
          className="text-black hover:text-white"
        >
          <MenuItem
            isCollapsed={isCollapsed}
            icon={<TbReportSearch />}
            label="ภาพรวมความคืบหน้าของนิสิต"
          />
        </Link>

        <MenuItem
          isCollapsed={isCollapsed}
          icon={<MdLogout />}
          label="ออกจากระบบ"
          onClick={async () => {
            await fetch('/api/auth/signout', { method: 'POST' });
            window.location.href = '/';
          }}
        />
      </nav>
    </aside>
  );
}

export default Sidebar;
