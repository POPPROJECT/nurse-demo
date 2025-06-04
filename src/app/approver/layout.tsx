'use client';

import { useEffect, useState } from 'react';
import NavbarApprover from '@/app/components/approver/NavbarApprover';
import SidebarApprover from '@/app/components/approver/SidebarApprover';
import { getSession } from 'lib/session';
import { redirect } from 'next/navigation';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

interface SessionUser {
  id: number;
  name: string;
  role: 'APPROVER_IN' | 'APPROVER_OUT';
}

export default async function ApproverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ใช้ getSession() เพื่อตรวจสอบสิทธิ์ของผู้ใช้งาน
  const session = await getSession();
  const { accessToken } = useAuth();

  // ตรวจสอบว่า session มีหรือไม่ และตรวจสอบบทบาทผู้ใช้งาน
  if (
    !session ||
    (session.user.role !== 'APPROVER_IN' &&
      session.user.role !== 'APPROVER_OUT')
  ) {
    console.log(
      '[ApproverLayout] Session check failed or not APPROVER. Redirecting to /.'
    );
    redirect('/'); // ถ้าไม่มี session หรือไม่ใช่ APPROVER ให้ redirect ไปหน้า login
  }

  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setUser({
          id: data.id,
          name: data.fullname,
          role: data.role,
        });
      } else {
        window.location.href = '/';
      }
    };

    fetchUser();
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0F172A] flex flex-col">
      <NavbarApprover role={user.role} />
      <div className="flex flex-1 ">
        <SidebarApprover role={user.role} />
        <main className="flex-1 p-6 bg-background text-foreground">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
