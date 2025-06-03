'use client';

import { signIn } from 'lib/auth';
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
    const result = await signIn(formData);

    if (result?.error) {
      setError(result.error);
      return;
    }

    // ✅ redirect client-side
    if (result.role === 'STUDENT') router.push('/student/books');
    else if (result.role === 'ADMIN') router.push('/admin/books');
    else if (result.role === 'EXPERIENCE_MANAGER')
      router.push('/experience-manager/books');
    else if (result.role === 'APPROVER_IN' || result.role === 'APPROVER_OUT')
      router.push('/approver/approved');
    else router.push('/');
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
                type="text" // ✅ เปลี่ยนตรงนี้
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
            className="w-full py-3 font-semibold text-white transition bg-orange-500 rounded-md hover:bg-orange-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
