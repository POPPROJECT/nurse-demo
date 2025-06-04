'use client';

// useRouter อาจจะไม่จำเป็นแล้วสำหรับฟังก์ชัน handleSubmit ถ้าคุณเปลี่ยนไปใช้ window.location.href ทั้งหมด
// แต่ยังสามารถเก็บไว้ได้หากส่วนอื่นของ Component มีการใช้งาน
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaEnvelope, FaKey } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
  const router = useRouter(); // คุณยังสามารถใช้ router สำหรับการ navigate อื่นๆ ที่ไม่ใช่หลัง login ได้
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); // เคลียร์ error เก่าทุกครั้งที่กด submit

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get('identifier');
    const password = formData.get('password');

    const submitButton = e.currentTarget.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Logging in...';
    }

    try {
      // เรียก API Route ของ Frontend เอง
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        setError(result.error || 'Login failed. Please try again.');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Login';
        }
        return;
      }

      // ถ้าสำเร็จ, API Route ของ Frontend ได้จัดการตั้งค่า Cookie บน vercel.app แล้ว
      // ทำการ Redirect ด้วย window.location.href เพื่อบังคับ Full Page Reload
      const role = result.user?.role;
      console.log('[LoginPage] Login successful, user role:', role); // Log เพื่อ Debug

      if (role) {
        let targetPath = '/';
        if (role === 'ADMIN') {
          targetPath = '/admin/books';
        } else if (role === 'STUDENT') {
          targetPath = '/student/books';
        } else if (role === 'EXPERIENCE_MANAGER') {
          targetPath = '/experience-manager/books';
        } else if (role === 'APPROVER_IN' || role === 'APPROVER_OUT') {
          targetPath = '/approver/approved';
        }

        console.log(
          '[LoginPage] Redirecting to (hard navigation):',
          targetPath
        );
        window.location.href = targetPath; // ✅ เปลี่ยนมาใช้ window.location.href
      } else {
        setError('Login successful, but user role is missing.');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Login';
        }
      }
    } catch (err) {
      console.error('Login page submit error:', err);
      setError('An unexpected network error occurred.');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
      }
    }
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
