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
import { BACKEND_URL } from '../../../../lib/constants';
import Swal from 'sweetalert2';
import { SessionUser, useAuth } from '@/app/contexts/AuthContext';

export default function AdminProfilePage() {
  const { accessToken, session: authSession, updateUserInSession } = useAuth();

  const [currentFullname, setCurrentFullname] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState('');
  const [formFullnameInput, setFormFullnameInput] = useState('');
  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const populateStates = useCallback((userData: SessionUser | null) => {
    if (userData) {
      setCurrentFullname(userData.name);
      setCurrentEmail(userData.email);
      setCurrentAvatarUrl(userData.avatarUrl || '');
      setPreviewUrl(userData.avatarUrl || null);
      setFormFullnameInput(userData.name);
    } else {
      setCurrentFullname('');
      setCurrentEmail('');
      setCurrentAvatarUrl('');
      setPreviewUrl(null);
      setFormFullnameInput('');
    }
  }, []);

  useEffect(() => {
    if (authSession?.user) {
      populateStates(authSession.user);
      setLoading(false);
    } else if (accessToken && !authSession?.user) {
      const fetchInitialUser = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await axios.get<SessionUser>(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          updateUserInSession(res.data);
        } catch (e: any) {
          setError(e.response?.data?.message || 'Failed to fetch user data.');
          setLoading(false);
        }
      };
      fetchInitialUser();
    } else {
      setLoading(false);
      setError('Session not found. Please login again.');
    }
  }, [authSession, accessToken, updateUserInSession, populateStates]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.id === 'fullname') {
      setFormFullnameInput(e.target.value);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);
      setPreviewUrl(URL.createObjectURL(uploadedFile));
    }
  };

  const handleEditClick = () => {
    setFormFullnameInput(currentFullname);
    setPreviewUrl(currentAvatarUrl || null);
    setFile(null);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setFile(null);
    setFormFullnameInput(currentFullname);
    setPreviewUrl(currentAvatarUrl || null);
  };

  const save = async () => {
    if (!accessToken) return;
    setSaving(true);
    const formData = new FormData();
    formData.append('fullname', formFullnameInput);
    if (file) formData.append('avatar', file);

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
      updateUserInSession(res.data);
      setEditing(false);
      setFile(null);
      Swal.fire('สำเร็จ!', 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว', 'success');
    } catch (err: any) {
      console.error('❌ Failed to save profile:', err);
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
  if (!authSession?.user && !loading)
    return <div className="p-10 text-center">ไม่พบข้อมูลผู้ใช้</div>;

  const displayFullnameToShow = editing ? formFullnameInput : currentFullname;
  const displayEmailToShow = currentEmail;
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
                        : `${BACKEND_URL}${displayAvatarToShow}`
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
                {displayFullnameToShow}
              </h1>
              <p className="text-sm text-white opacity-90">ข้อมูลส่วนตัว</p>
              <div className="mt-2">
                <span className="px-3 py-1 text-sm text-black bg-white rounded-full bg-opacity-80">
                  ผู้ดูแลระบบ
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
              value={formFullnameInput}
              id="fullname"
              editing={editing}
              onChange={handleChange}
              currentValue={currentFullname}
            />
            <Field
              icon={<FaEnvelope />}
              label="อีเมล"
              value={displayEmailToShow}
              id="email"
              readOnly
              editing={false}
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
  id?: string;
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
          id={id}
          name={id}
          type="text"
          value={value}
          onChange={onChange}
          className="px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-gray-800 dark:border-gray-600"
        />
      ) : (
        <p className="px-1 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {currentValue !== undefined ? currentValue : value || '-'}
        </p>
      )}
    </div>
  );
}
