// src/app/admin/Profile/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  FaUser,
  FaEnvelope,
  FaEdit,
  FaCheck,
  FaTimes,
  FaCamera,
} from 'react-icons/fa';
import { BACKEND_URL } from '../../../../lib/constants'; // ตรวจสอบ Path
import Swal from 'sweetalert2';
import { SessionUser, useAuth } from '@/app/contexts/AuthContext'; // ตรวจสอบ Path ไปยัง AuthContext

export default function AdminProfilePage() {
  const { accessToken, session: authSession, updateUserInSession } = useAuth();

  // State สำหรับข้อมูลที่แสดงบน UI และใช้เป็นค่าเริ่มต้นของ Form
  const [currentFullname, setCurrentFullname] = useState(
    authSession?.user?.name || ''
  );
  const [currentEmail, setCurrentEmail] = useState(
    authSession?.user?.email || ''
  );
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(
    authSession?.user?.avatarUrl || ''
  );

  // State สำหรับ Controlled Form Inputs ตอน Edit
  const [formFullnameInput, setFormFullnameInput] = useState('');
  // Email มักจะไม่ให้แก้ไข แต่ถ้าต้องการ ก็สร้าง state แยก
  // const [formEmailInput, setFormEmailInput] = useState('');

  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true); // Loading สำหรับการ fetch ข้อมูลเริ่มต้น
  const [saving, setSaving] = useState(false); // Loading สำหรับตอนกด Save
  const [error, setError] = useState<string | null>(null);

  // ฟังก์ชันสำหรับตั้งค่า Form และ UI States จากข้อมูล User
  const populateUserData = useCallback((userData: SessionUser | null) => {
    if (userData) {
      setCurrentFullname(userData.name);
      setCurrentEmail(userData.email);
      setCurrentAvatarUrl(userData.avatarUrl || '');
      setPreviewUrl(userData.avatarUrl || null); // ตั้งค่า previewUrl เริ่มต้นด้วย

      // ตั้งค่า form inputs ตอนกด Edit จะดึงจาก current states
      setFormFullnameInput(userData.name);
      // setFormEmailInput(userData.email);
    }
  }, []);

  useEffect(() => {
    if (authSession?.user) {
      populateUserData(authSession.user);
      setLoading(false);
    } else if (accessToken) {
      // ถ้ามี token แต่ยังไม่มี user ใน context ให้ลอง fetch
      const fetchInitialUser = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await axios.get<SessionUser>(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          updateUserInSession(res.data); // อัปเดต Context
          populateUserData(res.data); // อัปเดต UI และ Form states
        } catch (e: any) {
          console.error('Error fetching initial user data:', e);
          setError(
            e.response?.data?.message || 'Failed to fetch initial user data.'
          );
        } finally {
          setLoading(false);
        }
      };
      fetchInitialUser();
    } else {
      // ไม่มีทั้ง token และ user ใน context (AdminLayout ควรจะ redirect ไปแล้ว)
      setLoading(false);
      setError('Session not found or expired. Please login again.');
    }
  }, [authSession, accessToken, updateUserInSession, populateUserData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormFullnameInput(e.target.value);
  };
  // ถ้าจะให้ Email แก้ไขได้ ก็เพิ่ม handleEmailChange

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);
      setPreviewUrl(URL.createObjectURL(uploadedFile));
    }
  };

  const handleEditClick = () => {
    // เมื่อกดปุ่ม "แก้ไขข้อมูล" ให้ดึงค่าล่าสุดจาก current states มาใส่ใน form inputs
    if (authSession?.user) {
      setFormFullnameInput(currentFullname); // หรือ authSession.user.name
      // setFormEmailInput(currentEmail); // ถ้าให้แก้ Email
      setPreviewUrl(currentAvatarUrl || null); // Reset preview ถ้ามีการเปลี่ยนรูปแล้วยกเลิก
    }
    setFile(null); // เคลียร์ไฟล์ที่อาจจะเลือกไว้ก่อนหน้า
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setFile(null);
    // Reset form และ preview กลับไปเป็นค่าล่าสุดที่แสดงผลอยู่ (current states)
    setFormFullnameInput(currentFullname);
    // setFormEmailInput(currentEmail);
    setPreviewUrl(currentAvatarUrl || null);
  };

  const save = async () => {
    if (!accessToken) {
      Swal.fire(
        'ข้อผิดพลาด',
        'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
        'error'
      );
      return;
    }
    setSaving(true);

    const formData = new FormData();
    formData.append('fullname', formFullnameInput); // ✅ ใช้ค่าจาก formFullnameInput
    if (file) {
      formData.append('avatar', file);
    }
    // ถ้ามีการแก้ไข Email และ Backend รองรับ ก็ส่งไปด้วย
    // if (formEmailInput !== currentEmail) {
    //   formData.append('email', formEmailInput);
    // }

    try {
      const res = await axios.patch<SessionUser>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      updateUserInSession(res.data); // ✅ อัปเดตข้อมูล User ใน AuthContext
      populateUserData(res.data); // ✅ อัปเดต current states ที่ใช้แสดงผล และ form states สำหรับการแก้ไขครั้งถัดไป

      setEditing(false);
      setFile(null);
      // previewUrl จะถูกอัปเดตโดย populateUserData แล้ว

      Swal.fire('สำเร็จ!', 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      Swal.fire(
        'เกิดข้อผิดพลาด',
        err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="p-10 text-center">Loading user profile...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  if (!authSession?.user && !loading) {
    return (
      <div className="p-10 text-center">
        User data not available. You might have been logged out. Please{' '}
        <a href="/" className="underline">
          login
        </a>
        .
      </div>
    );
  }

  // ใช้ current states สำหรับการแสดงผลเมื่อไม่ได้อยู่ในโหมด editing
  // และใช้ form input states เมื่ออยู่ในโหมด editing
  const displayFullname = editing ? formFullnameInput : currentFullname;
  const displayEmail = currentEmail; // Email ไม่ได้ให้แก้ในตัวอย่างนี้
  const displayAvatarUrl = previewUrl || currentAvatarUrl;

  return (
    <main className="flex-1 px-4 py-8 md:px-12">
      <div className="max-w-3xl mx-auto overflow-hidden bg-white shadow-xl rounded-2xl dark:bg-gray-800">
        <div className="p-8 bg-[#F1A661] dark:bg-[#5A9ED1]">
          <div className="flex flex-col items-center md:flex-row">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                {displayAvatarUrl ? (
                  <img
                    src={
                      displayAvatarUrl.startsWith('blob:') ||
                      displayAvatarUrl.startsWith('http') // previewUrl จะเป็น blob:
                        ? displayAvatarUrl
                        : `${BACKEND_URL}${displayAvatarUrl}`
                    }
                    alt="avatar"
                    className="object-cover w-32 h-32 border-4 border-white rounded-full shadow-md"
                  />
                ) : (
                  <div className="flex items-center justify-center w-32 h-32 bg-white border-4 border-white rounded-full shadow-md">
                    <FaUser className="text-4xl text-gray-300" />
                  </div>
                )}
                {editing && (
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById('avatarInput')?.click()
                    }
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700"
                    title="เปลี่ยนรูปโปรไฟล์"
                    disabled={saving}
                  >
                    <FaCamera className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
              {editing && (
                <button
                  onClick={() =>
                    document.getElementById('avatarInput')?.click()
                  }
                  className="px-4 py-1 text-sm font-bold text-white bg-gray-700 rounded-full shadow hover:bg-gray-800"
                  disabled={saving}
                >
                  คลิกเพื่อเปลี่ยนรูป
                </button>
              )}
              <input
                id="avatarInput"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div className="mt-4 text-center md:ml-6 md:text-left md:mt-0">
              <h1 className="text-3xl font-bold text-white">
                {displayFullname}
              </h1>
              <p className="text-sm text-white opacity-90">ข้อมูลส่วนตัว</p>
              {authSession?.user?.role === 'ADMIN' && ( // แสดง Role ถ้าต้องการ
                <div className="mt-2">
                  <span className="px-3 py-1 text-sm text-black bg-white rounded-full bg-opacity-80">
                    ผู้ดูแลระบบ
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-700">
          <div className="grid grid-cols-1 gap-4 text-gray-800 dark:text-gray-200 md:grid-cols-2">
            <Field
              icon={<FaUser />}
              label="ชื่อ-สกุล"
              value={formFullnameInput} // Input ใช้ form state
              id="fullname"
              editing={editing}
              onChange={handleChange}
              currentValue={currentFullname} // ส่งค่าปัจจุบันไปให้ Field component แสดงผล
            />
            <Field
              icon={<FaEnvelope />}
              label="อีเมล"
              value={displayEmail} // Email แสดงค่าปัจจุบันเสมอ (ไม่อนุญาตให้แก้ในตัวอย่างนี้)
              id="email"
              readOnly // Email มักจะไม่ให้แก้ไข
              editing={false} // ไม่ต้องแสดงเป็น input field แม้จะอยู่ในโหมด editing
              currentValue={currentEmail}
            />
          </div>
          <div className="flex justify-end mt-6 space-x-3">
            {!editing ? (
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2 px-6 py-2 text-white transition rounded-lg bg-[#F1A661] dark:bg-[#5A9ED1] hover:scale-105"
              >
                <FaEdit /> แก้ไขข้อมูล
              </button>
            ) : (
              <>
                <button
                  onClick={save}
                  className="flex items-center gap-2 px-6 py-2 text-white transition bg-green-500 rounded-lg hover:scale-105 disabled:bg-green-300"
                  disabled={saving}
                >
                  {saving ? (
                    'กำลังบันทึก...'
                  ) : (
                    <>
                      <FaCheck /> บันทึก
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-6 py-2 text-white transition bg-gray-400 rounded-lg hover:scale-105"
                  disabled={saving}
                >
                  <FaTimes /> ยกเลิก
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// แก้ไข Field Component เล็กน้อยเพื่อแสดงค่าปัจจุบันเมื่อไม่ได้ Edit
function Field({
  icon,
  label,
  value,
  id,
  editing = false,
  readOnly = false,
  onChange,
  currentValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string; // ค่าสำหรับ input field ตอน editing
  id?: string;
  editing?: boolean;
  readOnly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentValue?: string; // ค่าปัจจุบันสำหรับแสดงผล
}) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-500 dark:text-gray-400"
      >
        {icon} {label}
      </label>
      {editing && !readOnly ? (
        <input
          id={id}
          name={id}
          type="text"
          value={value} // Input field ใช้ value จาก form state
          onChange={onChange}
          className="px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      ) : (
        // แสดง currentValue ถ้ามี, หรือ value (ซึ่งควรจะเป็นค่าเดียวกับ currentValue ถ้าไม่ได้ edit)
        <p className="px-1 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {currentValue !== undefined ? currentValue : value}
        </p>
      )}
    </div>
  );
}
