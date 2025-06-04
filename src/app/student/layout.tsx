// src/app/student/layout.tsx
import { getSession } from 'lib/session';
import { redirect } from 'next/navigation';
import Navbar from '@/app/components/student/Navbar';
import Sidebar from '@/app/components/student/sidebar';
import Footer from '../components/Footer';
import { AuthProvider } from '../contexts/AuthContext';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ ตรวจสอบ session และ role
  const session = await getSession();

  if (!session || session.user.role !== 'STUDENT') {
    console.log(
      '[StudentLayout] Session not found or not STUDENT, redirecting'
    );
    redirect('/'); // หรือจะ redirect ไปหน้า login โดยตรงก็ได้
  }

  return (
    <AuthProvider
      initialSession={session}
      initialAccessToken={session.accessToken}
    >
      <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-[#161d2e]">
        {/* ✅ Navbar พร้อม initialUser */}
        <Navbar />

        {/* ✅ Layout */}
        <div className="flex flex-1 pt-[72px] md:pt-0">
          <Sidebar />
          <main className="flex-1 p-4">{children}</main>
        </div>

        <Footer />
      </div>
    </AuthProvider>
  );
}
