'use client';

import { useEffect, useState } from 'react';
import NavbarApprover from '@/app/components/approver/NavbarApprover';
import SidebarApprover from '@/app/components/approver/SidebarApprover';

interface SessionUser {
  id: number;
  name: string;
  role: 'APPROVER_IN' | 'APPROVER_OUT';
}

export default function ApproverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
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
    <div className="min-h-screen bg-gray-100 dark:bg-[#0F172A] mt-10 sm:mt-0">
      <NavbarApprover role={user.role} />
      <div className="flex flex-col sm:flex-row">
        <SidebarApprover role={user.role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
