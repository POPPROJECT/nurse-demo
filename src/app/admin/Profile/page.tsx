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
import Swal from 'sweetalert2';
import { SessionUser, useAuth } from '@/app/contexts/AuthContext';
import { BACKEND_URL } from 'lib/constants';

export default function AdminProfilePage() {
  const { accessToken, session: authSession, updateUserInSession } = useAuth();

  // States สำหรับข้อมูลที่ "กำลังแสดงผล" บน UI (เมื่อไม่ได้อยู่ในโหมด edit)
  const [currentFullname, setCurrentFullname] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState('');

  // States สำหรับ "ฟอร์ม" ที่กำลังแก้ไข
  const [formFullnameInput, setFormFullnameInput] = useState('');
  // Email โดยทั่วไปจะไม่ให้แก้ไข แต่ถ้า Backend รองรับ และคุณต้องการให้แก้ไขได้ ก็เพิ่ม State นี้
  // const [formEmailInput, setFormEmailInput] = useState('');

  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // สำหรับแสดงรูปที่เพิ่งเลือก

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ฟังก์ชันสำหรับตั้งค่า state ทั้งส่วนแสดงผลและส่วนฟอร์มจากข้อมูล user
  const populateStates = useCallback((userData: SessionUser | null) => {
    if (userData) {
      // ตั้งค่า states ที่ใช้แสดงผล
      setCurrentFullname(userData.name);
      setCurrentEmail(userData.email); // ✅ แสดง Email จาก Context
      setCurrentAvatarUrl(userData.avatarUrl || '');

      // ตั้งค่า states สำหรับ form inputs (ใช้เป็นค่าเริ่มต้นเมื่อกด Edit)
      setFormFullnameInput(userData.name);
      // setFormEmailInput(userData.email); // ถ้าจะให้แก้ Email

      setPreviewUrl(userData.avatarUrl || null); // ตั้งค่า previewUrl เริ่มต้นด้วย
    }
  }, []);

  useEffect(() => {
    if (authSession?.user) {
      populateStates(authSession.user);
      setLoading(false);
    } else if (accessToken && !authSession?.user) {
      // มี Token แต่ยังไม่มี User ใน Context
      const fetchInitialUser = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await axios.get<SessionUser>(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          updateUserInSession(res.data); // อัปเดต Context
          populateStates(res.data); // อัปเดต UI และ Form states
        } catch (e: any) {
          console.error('Error fetching initial user data for profile:', e);
          setError(
            e.response?.data?.message || 'Failed to fetch initial user data.'
          );
        } finally {
          setLoading(false);
        }
      };
      fetchInitialUser();
    } else if (!accessToken && !authSession?.user) {
      setLoading(false);
      setError('Session not found or expired. Please login again.');
    }
  }, [authSession, accessToken, updateUserInSession, populateStates]);

  const handleFullnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormFullnameInput(e.target.value);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);
      setPreviewUrl(URL.createObjectURL(uploadedFile)); // แสดง preview รูปที่เพิ่งเลือก
    }
  };

  const handleEditClick = () => {
    // เมื่อกด "แก้ไข" ให้ดึงค่าจาก current states (ข้อมูลล่าสุดที่แสดงผล) มาใส่ใน form inputs
    setFormFullnameInput(currentFullname);
    // setFormEmailInput(currentEmail); // ถ้าให้แก้ Email
    setPreviewUrl(currentAvatarUrl || null); // Reset preview จากค่าล่าสุด
    setFile(null); // เคลียร์ไฟล์ที่อาจจะเลือกไว้ก่อนหน้า ถ้ามีการยกเลิกแล้วกดแก้ไขใหม่
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setFile(null);
    // Reset form inputs และ preview กลับไปเป็น current states
    setFormFullnameInput(currentFullname);
    // setFormEmailInput(currentEmail);
    setPreviewUrl(currentAvatarUrl || null);
  };

  const save = async () => {
    if (!accessToken) {
      Swal.fire('ข้อผิดพลาด', 'Session หมดอายุ, กรุณา Login ใหม่', 'error');
      return;
    }
    setSaving(true);

    const formData = new FormData();
    // ส่ง fullname ไปให้ Backend (Backend อาจจะคาดหวัง field ชื่อ 'name')
    // ตรวจสอบ API Backend ของคุณว่าต้องการ field ชื่ออะไร
    formData.append('fullname', formFullnameInput); // หรือ 'name': formFullnameInput

    if (file) {
      formData.append('avatar', file); // Backend ต้องรองรับการอัปโหลดไฟล์ชื่อ 'avatar'
    }
    // ถ้ามีการแก้ไข Email และ Backend รองรับ:
    // if (formEmailInput !== currentEmail) {
    //   formData.append('email', formEmailInput);
    // }

    try {
      const res = await axios.patch<SessionUser>( // คาดหวังข้อมูล User ที่มีโครงสร้างเดียวกับ SessionUser กลับมา
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, // Endpoint สำหรับอัปเดต Profile ตัวเอง
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data', // ✅ ถูกต้องสำหรับการส่ง FormData (ที่มีไฟล์)
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      updateUserInSession(res.data); // ✅ อัปเดตข้อมูล User ใน AuthContext
      populateStates(res.data); // ✅ อัปเดต UI และ Form states ของหน้านี้ด้วยข้อมูลใหม่จาก Backend

      setEditing(false);
      setFile(null);
      // previewUrl จะถูกอัปเดตโดย populateStates แล้ว

      Swal.fire('สำเร็จ!', 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว', 'success');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      Swal.fire(
        'เกิดข้อผิดพลาด',
        err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้',
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
  const displayEmailToShow = currentEmail; // Email จะมาจาก currentEmail เสมอ (ไม่ให้แก้ไข)
  const displayAvatarToShow = editing
    ? previewUrl || currentAvatarUrl
    : currentAvatarUrl;

  return (
    <main className="flex-1 px-4 py-8 md:px-12">
      <div className="max-w-3xl mx-auto overflow-hidden bg-white shadow-xl rounded-2xl dark:bg-gray-800">
        <div className="p-8 bg-[#F1A661] dark:bg-[#5A9ED1]">
          <div className="flex flex-col items-center md:flex-row">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                {displayAvatarToShow ? (
                  <img
                    src={
                      displayAvatarToShow.startsWith('blob:') ||
                      displayAvatarToShow.startsWith('http')
                        ? displayAvatarToShow
                        : `${BACKEND_URL}${displayAvatarToShow}` // ใช้ BACKEND_URL ถ้า path ไม่ใช่ URL เต็ม
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
              {authSession?.user?.role === 'ADMIN' && (
                <div className="mt-2">
                  <span className="px-3 py-1 text-sm text-black bg-white rounded-full bg-opacity-80">
                    ผู้ดูแลระบบ {/* หรือแสดง Role จาก authSession.user.role */}
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
              value={formFullnameInput} // Input ใช้ formFullnameInput
              id="fullname"
              editing={editing}
              onChange={handleFullnameChange} // ใช้ handleFullnameChange
              currentValue={currentFullname}
            />
            <Field
              icon={<FaEnvelope />}
              label="อีเมล"
              value={currentEmail} // ✅ Email แสดงค่าจาก currentEmail เสมอ
              id="email"
              readOnly // ✅ Email ไม่ควรให้แก้ไข
              editing={false} // ไม่ต้องแสดงเป็น input field
              currentValue={currentEmail}
            />
          </div>
          <div className="flex justify-end mt-6 space-x-3">
            {!editing ? (
              <button onClick={handleEditClick} /* ... */>
                <FaEdit /> แก้ไขข้อมูล
              </button>
            ) : (
              <>
                <button onClick={save} disabled={saving} /* ... */>
                  {saving ? (
                    'กำลังบันทึก...'
                  ) : (
                    <>
                      <FaCheck /> บันทึก
                    </>
                  )}
                </button>
                <button onClick={handleCancelEdit} disabled={saving} /* ... */>
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

// Field Component (แก้ไขให้รับ currentValue และ id/name ที่ถูกต้อง)
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
  value: string;
  id?: string; // id ของ input field
  editing?: boolean;
  readOnly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentValue?: string;
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
          id={id} // id ควรตรงกับ key ที่ใช้ใน handleChange
          name={id} // name attribute ควรตรงกับ id
          type="text"
          value={value} // ค่าสำหรับ input ตอน edit
          onChange={onChange}
          className="px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      ) : (
        <p className="px-1 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {currentValue !== undefined ? currentValue : value}
        </p>
      )}
    </div>
  );
}
