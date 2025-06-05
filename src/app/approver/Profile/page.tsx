'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FaUser,
  FaEnvelope,
  FaKey,
  FaEdit,
  FaCheck,
  FaTimes,
  FaLock,
  FaCamera,
} from 'react-icons/fa';
import { BACKEND_URL } from 'lib/constants';
import { useAuth } from '@/app/contexts/AuthContext';

interface UserProfile {
  id: number;
  fullname: string;
  email: string;
  pin: string;
  password?: string;
  role: string;
  avatarUrl?: string;
}

export default function ApproverProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullname: '',
    email: '',
    pin: '',
    password: '',
    avatarUrl: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { accessToken } = useAuth(); // ✅ ดึง accessToken และ session จาก Context

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setUser(res.data);
        setForm({
          fullname: res.data.fullname,
          email: res.data.email,
          pin: res.data.pin,
          password: '',
          avatarUrl: res.data.avatarUrl || '',
        });
      } catch (err) {
        // ❌ ถ้าไม่มี session → redirect ไปหน้า login
        window.location.href = '/';
      }
    };
    fetchUser();
  }, [accessToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === 'pin') {
      const alphanumericOnly = value.replace(/[^a-zA-Z0-9]/g, '');
      setForm((prev) => ({ ...prev, [id]: alphanumericOnly }));
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
    if (form.pin.length !== 6) {
      alert('กรุณากรอกรหัส PIN ให้ครบ 6 ตัวอักษร');
      return;
    }

    const formData = new FormData();
    formData.append('fullname', form.fullname);
    formData.append('pin', form.pin);
    if (form.password) formData.append('password', form.password);
    if (file) formData.append('avatar', file);

    await axios.patch(`${BACKEND_URL}/users/me`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    setEditing(false);
    window.location.reload();
  };

  if (!user) return <div className="p-10">Loading...</div>;

  const isApproverOut = user.role === 'APPROVER_OUT';

  return (
    <main className="flex-1 px-4 py-8 md:px-12">
      <div className="max-w-3xl mx-auto overflow-hidden bg-white shadow-xl rounded-2xl">
        <div className="p-8 bg-[#F1A661] dark:bg-[#5A9ED1]">
          <div className="flex flex-col items-center md:flex-row">
            {/* รูปโปรไฟล์ + ปุ่มกล้อง */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                {editing ? (
                  <>
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
                  </>
                ) : (
                  <>
                    {user.avatarUrl ? (
                      <img
                        src={
                          user.avatarUrl.startsWith('http')
                            ? user.avatarUrl
                            : `${BACKEND_URL}${user.avatarUrl}`
                        }
                        alt="avatar"
                        className="object-cover w-32 h-32 border-4 border-white rounded-full shadow-md"
                      />
                    ) : (
                      <FaUser className="w-32 h-32 p-4 text-gray-300 bg-white rounded-full" />
                    )}
                  </>
                )}
              </div>

              {/* ปุ่มคลิกเพื่อเปลี่ยนรูป */}
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

              {/* input ซ่อน */}
              <input
                id="avatarInput"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* ข้อมูลชื่อ บทบาท */}
            <div className="mt-4 text-center md:ml-6 md:text-left md:mt-0">
              <h1 className="text-3xl font-bold text-white">
                {editing ? form.fullname : user.fullname}
              </h1>
              <p className="text-sm text-white opacity-90">ข้อมูลส่วนตัว</p>
              <div className="mt-2 space-x-2">
                <span className="px-3 py-1 text-sm text-black bg-white rounded-full bg-opacity-80">
                  {user.role === 'APPROVER_OUT'
                    ? 'ผู้นิเทศภายนอก'
                    : 'ผู้นิเทศภายใน'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 gap-4 text-gray-800 md:grid-cols-2">
            <Field
              icon={<FaUser />}
              label="ชื่อ-สกุล"
              value={form.fullname}
              id="fullname"
              editing={editing}
              onChange={handleChange}
            />
            <Field
              icon={<FaKey />}
              label="รหัส PIN"
              value={form.pin}
              id="pin"
              editing={editing}
              onChange={handleChange}
              hideValue={!editing}
            />
            <Field
              icon={<FaEnvelope />}
              label="อีเมล"
              value={form.email}
              readOnly
            />
            {isApproverOut && (
              <Field
                icon={<FaLock />}
                label="รหัสผ่าน"
                value={form.password}
                id="password"
                editing={editing}
                onChange={handleChange}
                hideValue={!editing}
              />
            )}
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
                      email: user.email,
                      fullname: user.fullname,
                      pin: user.pin,
                      password: '',
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
  hideValue = false,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  id?: string;
  editing?: boolean;
  readOnly?: boolean;
  hideValue?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const isPinField = id === 'pin';
  const isPasswordField = id === 'password';

  return (
    <div className="flex flex-col">
      <label className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-500">
        {icon} {label}
      </label>
      {editing && !readOnly ? (
        <input
          id={id}
          type={isPasswordField ? 'password' : 'text'}
          value={value}
          onChange={onChange}
          inputMode={isPinField ? 'numeric' : undefined}
          maxLength={isPinField ? 6 : undefined}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      ) : (
        <p className="px-1 text-lg font-semibold">
          {hideValue || isPasswordField
            ? '●'.repeat(value?.length || 8)
            : value}
        </p>
      )}
    </div>
  );
}
