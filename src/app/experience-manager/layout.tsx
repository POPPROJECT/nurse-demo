import { getSession } from "lib/session";
import Navbar from "../components/experience-manager/Navbar";
import Sidebar from "../components/experience-manager/Sidebar";
import Footer from "../components/Footer";
import { redirect } from "next/navigation";
import { AuthProvider } from "../contexts/AuthContext";

export default async function Experience_ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // ✅ ตรวจสอบสิทธิ์ว่าต้องเป็น EXPERIENCE_MANAGER
  if (!session || session.user.role !== "EXPERIENCE_MANAGER") {
    console.log(
      "[Experience_ManagerLayout] Session check failed or not EXPERIENCE_MANAGER. Redirecting to /.",
      session,
    );
    redirect("/");
  }

  return (
    <AuthProvider
      initialSession={session}
      initialAccessToken={session.accessToken}
    >
      <div className="min-h-screen bg-gray-100 dark:bg-[#0F172A] flex flex-col overflow-x-hidden">
        {/* Navbar รองรับ initialUser ถ้าคุณแก้ให้รับ prop ได้ */}
        <Navbar />

        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 mt-15 sm:mt-0">{children}</main>
        </div>

        <Footer />
      </div>
    </AuthProvider>
  );
}
