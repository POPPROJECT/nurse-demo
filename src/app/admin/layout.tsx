// src/app/admin/layout.tsx

import { getSession } from 'lib/session';
import NavbarAdmin from '../components/admin/navbarAdmin'; // ตรวจสอบ Path ให้ถูกต้อง
import SidenavAdmin from '../components/admin/sidenavAdmin'; // ตรวจสอบ Path ให้ถูกต้อง
import { redirect } from 'next/navigation'; // ✅ Import redirect สำหรับ Server Component
import { AuthProvider } from '../contexts/AuthContext';

// ✅ ทำให้เป็น async function เพื่อเรียก await getSession()
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ เรียก getSession() เพื่อดึงข้อมูล session บน Server
  const session = await getSession();

  // ✅ ตรวจสอบสิทธิ์ใน Layout นี้เลย
  // ถ้าไม่มี session หรือไม่ใช่ ADMIN ให้ redirect กลับไปหน้าแรก (หน้า Login)
  if (!session || session.user.role !== 'ADMIN') {
    console.log(
      '[AdminLayout] Session check failed or not ADMIN. Redirecting to /. Session:',
      session
    );
    redirect('/'); // หรือ redirect ไปหน้า Login ที่คุณต้องการ
  }

  return (
    <AuthProvider
      initialSession={session}
      initialAccessToken={session.accessToken}
    >
      <div className="min-h-screen bg-gray-100 dark:bg-[#0F172A]">
        {/* ✅ ส่ง session.user ไปเป็น prop ชื่อ initialUser ให้ NavbarAdmin */}
        <NavbarAdmin initialUser={session.user} />
        <div className="flex">
          <SidenavAdmin />
          <main className="flex-1 p-6 bg-background text-foreground">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
