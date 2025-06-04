// src/app/admin/Profile/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react'; // ✅ เพิ่ม useCallback
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
import { SessionUser, useAuth } from '@/app/contexts/AuthContext';

// ไม่จำเป็นต้องมี UserProfile interface แยกแล้ว ถ้า SessionUser ใน Context ครอบคลุม
// interface UserProfile { ... }

export default function AdminProfilePage() {
  // ✅ ดึง accessToken, session (ที่มี user) และฟังก์ชัน updateUserInSession จาก AuthContext
  const { accessToken, session: authSession, updateUserInSession } = useAuth();

  // State สำหรับ form (ใช้ข้อมูลจาก authSession.user เป็นค่าเริ่มต้น)
  const [formFullname, setFormFullname] = useState(
    authSession?.user?.name || ''
  );
  const [formEmail, setFormEmail] = useState(authSession?.user?.email || ''); // Email มักจะไม่ให้แก้ไข
  const [formAvatarUrl, setFormAvatarUrl] = useState(
    authSession?.user?.avatarUrl || ''
  );

  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    authSession?.user?.avatarUrl || null
  ); // ค่าเริ่มต้นสำหรับ preview

  const [loading, setLoading] = useState(true); // Loading สำหรับการ fetch ข้อมูลเริ่มต้น (ถ้าจำเป็น)
  const [saving, setSaving] = useState(false); // Loading สำหรับตอนกด Save
  const [error, setError] = useState<string | null>(null);

  // ✅ ใช้ useCallback เพื่อ memoize ฟังก์ชัน fetchUser
  const fetchUser = useCallback(async () => {
    if (!accessToken) {
      console.log('AdminProfilePage: No accessToken, skipping fetchUser.');
      // ถ้า AdminLayout ทำงานถูกต้อง ไม่ควรมาถึงจุดนี้โดยไม่มี accessToken ถ้า user login แล้ว
      // แต่ถ้ามาถึงได้ แสดงว่า session อาจจะหมดอายุจริงๆ
      if (!authSession?.user) {
        // ถ้าใน context ก็ไม่มี user ด้วย
        setError(
          'Session expired or user data not available. Please try logging in again.'
        );
      }
      setLoading(false);
      return;
    }

    console.log(
      '[AdminProfilePage] Fetching user data with token:',
      accessToken ? ' vorhanden' : 'nicht vorhanden'
    );
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<SessionUser>( // คาดหวังข้อมูล User ที่มีโครงสร้างเดียวกับ SessionUser
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      // อัปเดต Context และ State ของหน้านี้ด้วยข้อมูลล่าสุด
      updateUserInSession(res.data); // อัปเดต Context ก่อน

      // จากนั้นอัปเดต local form states
      setFormFullname(res.data.name);
      setFormEmail(res.data.email);
      setFormAvatarUrl(res.data.avatarUrl || '');
      setPreviewUrl(res.data.avatarUrl || null);
    } catch (err: any) {
      console.error('Error fetching user profile in AdminProfilePage:', err);
      setError(
        err.response?.data?.message || err.message || 'Failed to load profile.'
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, updateUserInSession, authSession]); // เพิ่ม authSession เข้า dependency ด้วย

  useEffect(() => {
    // ถ้ามี user ใน context อยู่แล้ว อาจจะไม่ต้อง fetch ซ้ำ หรือ fetch เพื่อให้ได้ข้อมูลล่าสุด
    if (authSession?.user) {
      setFormFullname(authSession.user.name);
      setFormEmail(authSession.user.email);
      setFormAvatarUrl(authSession.user.avatarUrl || '');
      setPreviewUrl(authSession.user.avatarUrl || null);
      setLoading(false); // ถ้าใช้ข้อมูลจาก context โดยตรง
      // หากต้องการ fetch ข้อมูลล่าสุดเสมอ ให้เรียก fetchUser() ที่นี่
      // fetchUser();
    } else if (accessToken) {
      // ถ้ามี token แต่ยังไม่มี user ใน context (อาจจะกำลังรอ initial load จาก AuthProvider)
      fetchUser();
    } else {
      // ไม่มีทั้ง token และ user ใน context (AdminLayout ควรจะ redirect ไปแล้ว)
      setLoading(false);
      setError('Session not found. Please log in.');
    }
  }, [authSession, accessToken, fetchUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === 'fullname') setFormFullname(value);
    // ถ้าอนุญาตให้แก้ไข email ก็เพิ่ม setFormEmail
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);
      setPreviewUrl(URL.createObjectURL(uploadedFile));
    }
  };

  const save = async () => {
    if (!accessToken || !authSession?.user) {
      Swal.fire(
        'ข้อผิดพลาด',
        'Session หมดอายุหรือไม่พบ Token/User กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
        'error'
      );
      return;
    }
    setSaving(true); // ✅ เริ่ม Saving state

    const formData = new FormData();
    formData.append('fullname', formFullname);
    if (file) {
      formData.append('avatar', file);
    }
    // ถ้ามีการเปลี่ยนแปลง email ก็ append email เข้าไปด้วย (แต่ต้องมั่นใจว่า Backend รองรับ)
    // if (formEmail !== authSession.user.email) {
    //   formData.append('email', formEmail);
    // }

    try {
      const res = await axios.patch<SessionUser>( // คาดหวังข้อมูล User ที่มีโครงสร้างเดียวกับ SessionUser กลับมา
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // ✅ อัปเดต User ใน AuthContext ด้วยข้อมูลใหม่ที่ได้จาก Backend
      updateUserInSession(res.data);

      setEditing(false);
      setFile(null);
      setPreviewUrl(res.data.avatarUrl || null); // อัปเดต previewUrl ด้วยรูปใหม่
      setFormFullname(res.data.name); // อัปเดต form state ด้วยข้อมูลที่เพิ่งอัปเดต
      setFormAvatarUrl(res.data.avatarUrl || '');

      Swal.fire('สำเร็จ!', 'บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
      // ไม่จำเป็นต้อง window.location.reload() แล้ว Navbar จะอัปเดตเองผ่าน Context
    } catch (err: any) {
      console.error('Error saving profile:', err);
      Swal.fire(
        'เกิดข้อผิดพลาด',
        err.response?.data?.message ||
          'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
        'error'
      );
    } finally {
      setSaving(false); // ✅ สิ้นสุด Saving state
    }
  };

  // ✅ แสดงสถานะ Loading, Error, หรือ No User ให้ชัดเจน
  if (loading)
    return <div className="p-10 text-center">Loading user profile...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  if (!authSession?.user) {
    // ตรวจสอบจาก authSession.user โดยตรง
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

  // ถ้ามาถึงตรงนี้ได้ แสดงว่ามี authSession.user
  const displayUser = authSession.user;

  return (
    <main className="flex-1 px-4 py-8 md:px-12">
      {' '}
      {/* ลบ mt-10 ออกไปถ้า AdminLayout จัดการแล้ว */}
      <div className="max-w-3xl mx-auto overflow-hidden bg-white shadow-xl rounded-2xl dark:bg-gray-800">
        <div className="p-8 bg-[#F1A661] dark:bg-[#5A9ED1]">
          <div className="flex flex-col items-center md:flex-row">
            <div className="flex flex-col items-center space-y-3">
              {/* รูปโปรไฟล์ */}
              <div className="relative">
                {previewUrl || formAvatarUrl ? (
                  <img
                    src={
                      previewUrl ||
                      (formAvatarUrl.startsWith('http')
                        ? formAvatarUrl
                        : `${BACKEND_URL}${formAvatarUrl}`)
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
                    disabled={saving} // ✅ ปิดปุ่มตอนกำลัง saving
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
                  disabled={saving} // ✅ ปิดปุ่มตอนกำลัง saving
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
                {editing ? formFullname : displayUser.name}
              </h1>
              <p className="text-sm text-white opacity-90">ข้อมูลส่วนตัว</p>
              <div className="mt-2">
                <span className="px-3 py-1 text-sm text-black bg-white rounded-full bg-opacity-80">
                  ผู้ดูแลระบบ {/* หรือแสดง Role จาก displayUser.role */}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-700">
          <div className="grid grid-cols-1 gap-4 text-gray-800 dark:text-gray-200 md:grid-cols-2">
            <Field
              icon={<FaUser />}
              label="ชื่อ-สกุล"
              value={formFullname}
              id="fullname" // ID ของ input ควรเป็น fullname ให้ตรงกับ key ใน form state และ handleChange
              editing={editing}
              onChange={handleChange}
            />
            <Field
              icon={<FaEnvelope />}
              label="อีเมล"
              value={formEmail}
              id="email"
              readOnly // Email มักจะไม่ให้แก้ไข หรือถ้าให้แก้ต้องระวังเรื่อง Unique constraint
            />
          </div>
          <div className="flex justify-end mt-6 space-x-3">
            {!editing ? (
              <button
                onClick={() => {
                  setEditing(true);
                  // เมื่อกดแก้ไข ให้ตั้งค่า form จากข้อมูลล่าสุดใน context
                  if (authSession?.user) {
                    setFormFullname(authSession.user.name);
                    setFormEmail(authSession.user.email);
                    setFormAvatarUrl(authSession.user.avatarUrl || '');
                    setPreviewUrl(authSession.user.avatarUrl || null); // ตั้งค่า preview ด้วย
                  }
                }}
                className="flex items-center gap-2 px-6 py-2 text-white transition rounded-lg bg-[#F1A661] dark:bg-[#5A9ED1] hover:scale-105"
              >
                <FaEdit /> แก้ไขข้อมูล
              </button>
            ) : (
              <>
                <button
                  onClick={save}
                  className="flex items-center gap-2 px-6 py-2 text-white transition bg-green-500 rounded-lg hover:scale-105 disabled:bg-green-300"
                  disabled={saving} // ✅ ปิดปุ่มตอนกำลัง saving
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
                  onClick={() => {
                    setEditing(false);
                    setPreviewUrl(null);
                    setFile(null);
                    // Reset form กลับไปเป็นค่าจาก authSession.user ที่แสดงผลอยู่
                    if (authSession?.user) {
                      setFormFullname(authSession.user.name);
                      setFormEmail(authSession.user.email);
                      setFormAvatarUrl(authSession.user.avatarUrl || '');
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2 text-white transition bg-gray-400 rounded-lg hover:scale-105"
                  disabled={saving} // ✅ ปิดปุ่มตอนกำลัง saving
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

// Field Component
function Field({
  /* ... props ... */ id,
  value,
  onChange,
  editing,
  readOnly,
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  id?: string; // id ควรเป็น string
  editing?: boolean;
  readOnly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
          id={id} // id ของ input ควรจะตรงกับ key ใน form state
          name={id} // ✅ เพิ่ม name attribute ให้ตรงกับ id เพื่อให้ handleChange ทำงานได้ถูกต้อง
          type="text"
          value={value}
          onChange={onChange}
          className="px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      ) : (
        <p className="px-1 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {value}
        </p>
      )}
    </div>
  );
}
