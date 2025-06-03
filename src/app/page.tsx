'use client';

import { signIn } from 'lib/auth';
// useRouter อาจจะไม่จำเป็นแล้วสำหรับฟังก์ชัน handleSubmit แต่ยังสามารถเก็บไว้ได้หากส่วนอื่นของ Component มีการใช้งาน
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaEnvelope, FaKey } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // ป้องกันการกดปุ่มซ้ำซ้อน (แนะนำ)
    const submitButton = e.currentTarget.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Logging in...';
    }

    const result = await signIn(formData);

    // หากมี error ให้แสดงผลและเปิดให้ปุ่มทำงานอีกครั้ง
    if (result?.error) {
      setError(result.error);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
      }
      return;
    }

    // --- ✅✅✅ แก้ไขส่วนสำคัญที่นี่ ---
    // เปลี่ยนจากการใช้ router.push เป็น window.location.href เพื่อบังคับ Full Page Reload
    if (result?.role) {
      if (result.role === 'STUDENT') {
        window.location.href = '/student/books';
      } else if (result.role === 'ADMIN') {
        window.location.href = '/admin/books';
      } else if (result.role === 'EXPERIENCE_MANAGER') {
        window.location.href = '/experience-manager/books';
      } else if (
        result.role === 'APPROVER_IN' ||
        result.role === 'APPROVER_OUT'
      ) {
        window.location.href = '/approver/approved';
      } else {
        // หากไม่มี role ที่ตรงกัน ให้กลับไปหน้าหลัก (หรือแสดง error)
        window.location.href = '/';
      }
    } else {
      // กรณีที่ไม่คาดคิด: ไม่มี role ส่งกลับมา
      setError(
        'Login successful, but user role is missing. Please contact support.'
      );
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
      }
    }
    // ---------------------------------
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-center bg-cover"
      style={{ backgroundImage: 'url(/background_image.jpg)' }}
    >
      <div className="w-full max-w-md p-8 text-center text-black bg-white shadow-xl dark:bg-white dark:text-black rounded-xl">
        {/* Logo */}
        <img
          src="/NULOGO.png"
          alt="NU Logo"
          className="w-32 h-32 mx-auto mb-6"
        />

        {/* Google Login */}
        <a
          href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google/login`}
          className="flex items-center justify-center w-full gap-2 py-3 mb-6 border rounded-md hover:bg-gray-100"
        >
          <FcGoogle size={20} />
          <span className="font-medium">Login with Google</span>
        </a>

        <div className="flex items-center mb-6">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-4 text-gray-500">OR</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <p className="mb-4 text-sm font-medium text-red-500">{error}</p>
          )}

          {/* Identifier: username or email */}
          <div className="mb-4 text-left">
            <label
              htmlFor="identifier"
              className="block mb-1 text-sm text-gray-600"
            >
              ไอดีผู้ใช้
            </label>
            <div className="flex items-center px-3 bg-gray-100 border rounded-md">
              <FaEnvelope className="mr-2 text-gray-500" />
              <input
                type="text"
                id="identifier"
                name="identifier"
                required
                placeholder="username"
                className="w-full py-3 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6 text-left">
            <label
              htmlFor="password"
              className="block mb-1 text-sm text-gray-600"
            >
              รหัสผ่าน
            </label>
            <div className="flex items-center px-3 bg-gray-100 border rounded-md">
              <FaKey className="mr-2 text-gray-500" />
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="********"
                className="w-full py-3 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 font-semibold text-white transition bg-orange-500 rounded-md hover:bg-orange-600 disabled:bg-orange-300"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
