'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaCheck } from 'react-icons/fa';
import router from 'next/router';
import { useAuth } from '@/app/contexts/AuthContext';

export default function RegisterUser() {
  const { accessToken } = useAuth();
  useEffect(() => {
    const checkSession = async () => {
      try {
        await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
          headers: {
            // ✅ ใช้ Authorization header
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (err) {
        router.push('/');
      }
    };
    checkSession();
  }, []);

  const [role, setRole] = useState<
    'student' | 'approverIn' | 'approverOut' | 'experienceManager'
  >('student');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    hospital: '',
    ward: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, password, studentId, hospital, ward } = form;

    let fullName = name;

    if (role === 'approverOut') {
      if (!hospital || !ward) {
        Swal.fire('กรุณากรอกโรงพยาบาลและหอผู้ป่วย', '', 'error');
        return;
      }
      fullName = `${hospital}-${ward}`;
    }

    if (
      !fullName ||
      !email ||
      ((role === 'approverOut' || role === 'experienceManager') && !password)
    ) {
      Swal.fire('กรุณากรอกข้อมูลให้ครบถ้วน', '', 'error');
      return;
    }

    if (
      (role === 'student' || role === 'approverIn') &&
      !email.endsWith('@nu.ac.th')
    ) {
      Swal.fire('กรุณาใช้อีเมลที่ลงท้ายด้วย @nu.ac.th', '', 'error');
      return;
    }

    if (role === 'student') {
      if (!/^\d{8}$/.test(studentId)) {
        Swal.fire('กรุณากรอกรหัสนิสิตให้ถูกต้อง (8 หลัก)', '', 'error');
        return;
      }
    }

    const dto: any = {
      name: fullName,
      email,
      role:
        role === 'student'
          ? 'STUDENT'
          : role === 'approverIn'
          ? 'APPROVER_IN'
          : role === 'approverOut'
          ? 'APPROVER_OUT'
          : 'EXPERIENCE_MANAGER',
      provider:
        role === 'student' || role === 'approverIn' ? 'GOOGLE' : 'LOCAL',
    };

    if (dto.provider === 'LOCAL') {
      dto.password = password;
    }

    if (role === 'student') {
      dto.studentId = studentId;
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup`,
        dto, // data ที่จะส่งไปใน request body
        {
          // config object
          headers: {
            Authorization: `Bearer ${accessToken}`, // Token ของ Admin ผู้สร้างบัญชี
          },
        }
      );
      Swal.fire('เพิ่มบัญชีผู้ใช้สำเร็จ', '', 'success');

      setForm({
        name: '',
        email: '',
        password: '',
        studentId: '',
        hospital: '',
        ward: '',
      });
    } catch (err: any) {
      Swal.fire(
        'เกิดข้อผิดพลาด',
        Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : err?.response?.data?.message || 'ไม่สามารถสมัครสมาชิกได้',
        'error'
      );
    }
  };

  return (
    <main className="flex-1 p-6 bg-[#F2EDED] dark:bg-[#0F172A]">
      <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
        <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 ">
          <h1 className="text-xl font-semibold sm:text-2xl">
            เพิ่มบัญชีผู้ใช้
          </h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="p-6  rounded-xl bg-white dark:bg-[#1E293B] shadow ">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
              ข้อมูลผู้ใช้งาน
            </h2>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="position"
                  className="block mb-2 font-medium text-gray-700 dark:text-white"
                >
                  บทบาทผู้ใช้งาน
                </label>
                <select
                  id="position"
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                  className="block w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg form-select bg-gray-50 focus:ring-indigo-500"
                >
                  <option value="student">นิสิต</option>
                  <option value="approverIn">ผู้นิเทศภายใน</option>
                  <option value="approverOut">ผู้นิเทศภายนอก</option>
                  <option value="experienceManager">ผู้จัดการเล่มบันทึก</option>
                </select>
              </div>

              <div className="space-y-4">
                {role === 'approverOut' && (
                  <>
                    <div>
                      <label
                        htmlFor="hospital"
                        className="block mb-1 text-gray-700 dark:text-white"
                      >
                        โรงพยาบาล
                      </label>
                      <input
                        id="hospital"
                        value={form.hospital}
                        onChange={handleChange}
                        className="text-black bg-[#ECECEC] w-full border rounded px-4 py-2"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ward"
                        className="block mb-1 text-gray-700 dark:text-white"
                      >
                        หอผู้ป่วย
                      </label>
                      <input
                        id="ward"
                        value={form.ward}
                        onChange={handleChange}
                        className="text-black bg-[#ECECEC] w-full border rounded px-4 py-2"
                      />
                    </div>
                  </>
                )}

                {role !== 'approverOut' && (
                  <div>
                    <label
                      htmlFor="name"
                      className="block mb-1 text-gray-700 dark:text-white"
                    >
                      ชื่อ-สกุล
                    </label>
                    <input
                      id="name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg bg-gray-50 "
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block mb-1 text-gray-700 dark:text-white"
                  >
                    {role === 'student' || role === 'approverIn'
                      ? 'อีเมล'
                      : 'ไอดีผู้ใช้งาน'}
                  </label>
                  <input
                    type={
                      role === 'student' || role === 'approverIn'
                        ? 'email'
                        : 'text'
                    }
                    id="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={
                      role === 'student' || role === 'approverIn'
                        ? 'yourname@nu.ac.th'
                        : 'username'
                    }
                    className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg bg-gray-50 "
                  />
                </div>

                {role === 'student' && (
                  <div>
                    <label
                      htmlFor="studentId"
                      className="block mb-1 text-gray-700 dark:text-white"
                    >
                      รหัสนิสิต
                    </label>
                    <input
                      id="studentId"
                      type="number"
                      inputMode="numeric"
                      value={form.studentId}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 8) {
                          setForm((prev) => ({ ...prev, studentId: val }));
                        }
                      }}
                      className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg bg-gray-50 "
                    />
                  </div>
                )}

                {(role === 'approverOut' || role === 'experienceManager') && (
                  <div>
                    <label
                      htmlFor="password"
                      className="block mb-1 text-gray-700 dark:text-white"
                    >
                      รหัสผ่าน
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3 font-medium text-white transition-colors duration-300 bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              <FaCheck /> เพิ่มบัญชี
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
