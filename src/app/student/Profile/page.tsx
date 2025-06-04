'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FaUser,
  FaEnvelope,
  FaIdBadge,
  FaEdit,
  FaCheck,
  FaTimes,
  FaCamera,
} from 'react-icons/fa';
import { BACKEND_URL } from '../../../../lib/constants';
import { useAuth } from '@/app/contexts/AuthContext';

export default function StyledStudentProfile() {
  const { session: authSession, accessToken, updateUserInSession } = useAuth();
  const user = authSession?.user;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    studentId: '',
    fullname: '',
    email: '',
    avatarUrl: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        studentId: (user as any).studentId || '',
        fullname: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    if (id === 'studentId') {
      const numericOnly = value.replace(/\D/g, '').slice(0, 8);
      setForm((prev) => ({ ...prev, studentId: numericOnly }));
    } else {
      setForm((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);
      setPreviewUrl(URL.createObjectURL(uploadedFile));
    }
  };

  const save = async () => {
    if (!accessToken) return;

    const formData = new FormData();
    formData.append('studentId', form.studentId);
    formData.append('fullname', form.fullname);
    if (file) formData.append('avatar', file);

    try {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      updateUserInSession(res.data); // ✅ อัปเดต Context
      setForm({
        studentId: res.data.studentId,
        fullname: res.data.fullname,
        email: res.data.email,
        avatarUrl: res.data.avatarUrl || '',
      });
      setPreviewUrl(null);
      setFile(null);
      setEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  if (!user) return <div className="p-10">Loading...</div>;

  return (
    <main className="flex-1 px-4 py-8 md:px-12">
      <div className="max-w-3xl mx-auto overflow-hidden bg-white shadow-xl rounded-2xl">
        <div className="p-8 bg-[#F1A661] dark:bg-[#5A9ED1]">
          <div className="flex flex-col items-center md:flex-row">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                {previewUrl || form.avatarUrl ? (
                  <img
                    src={
                      previewUrl ||
                      (form.avatarUrl.startsWith('http')
                        ? form.avatarUrl
                        : `${BACKEND_URL}${form.avatarUrl}`)
                    }
                    alt="avatar"
                    className="object-cover w-32 h-32 border-4 border-white rounded-full shadow-md"
                  />
                ) : (
                  <div className="flex items-center justify-center w-32 h-32 bg-white border-4 border-white rounded-full shadow-md">
                    <FaUser className="text-4xl text-gray-400" />
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
              <h1 className="text-3xl font-bold text-white">{form.fullname}</h1>
              <p className="text-sm text-white opacity-90">ข้อมูลส่วนตัว</p>
              <div className="mt-2 space-x-2">
                <span className="px-3 py-1 text-sm text-black bg-white rounded-full bg-opacity-80">
                  นิสิตปริญญาตรี
                </span>
                <span className="px-3 py-1 text-sm text-black bg-white rounded-full bg-opacity-80">
                  คณะพยาบาลศาสตร์
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 gap-4 text-gray-800 md:grid-cols-2">
            <Field
              icon={<FaIdBadge />}
              label="รหัสนิสิต"
              value={form.studentId}
              id="studentId"
              editing={editing}
              onChange={handleChange}
            />
            <Field
              icon={<FaUser />}
              label="ชื่อ-สกุล"
              value={form.fullname}
              id="fullname"
              editing={editing}
              onChange={handleChange}
            />
            <Field
              icon={<FaEnvelope />}
              label="อีเมล"
              value={form.email}
              id="email"
              readOnly
            />
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-6 py-2 text-white transition rounded-lg bg-[#F1A661] dark:bg-[#5A9ED1] hover:scale-105"
              >
                <FaEdit /> แก้ไขข้อมูล
              </button>
            ) : (
              <>
                <button
                  onClick={save}
                  className="flex items-center gap-2 px-6 py-2 text-white transition bg-green-500 rounded-lg hover:scale-105"
                >
                  <FaCheck /> บันทึก
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setPreviewUrl(null);
                    setForm({
                      studentId: (user as any).studentId || '',
                      fullname: user.name,
                      email: user.email,
                      avatarUrl: user.avatarUrl || '',
                    });
                    setFile(null);
                  }}
                  className="flex items-center gap-2 px-6 py-2 text-white transition bg-gray-400 rounded-lg hover:scale-105"
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

function Field({
  icon,
  label,
  value,
  id,
  editing = false,
  readOnly = false,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  id?: string;
  editing?: boolean;
  readOnly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-500">
        {icon} {label}
      </label>
      {editing && !readOnly ? (
        <input
          id={id}
          value={value}
          onChange={onChange}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      ) : (
        <p className="px-1 text-lg font-semibold">{value || '-'}</p>
      )}
    </div>
  );
}
