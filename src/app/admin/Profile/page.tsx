"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaCamera,
  FaCheck,
  FaEdit,
  FaEnvelope,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { BACKEND_URL } from "../../../../lib/constants";
import { useAuth } from "@/app/contexts/AuthContext";

interface UserProfile {
  id: number;
  fullname: string;
  email: string;
  avatarUrl?: string;
}

export default function AdminProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    avatarUrl: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        setUser(res.data);
        setForm({
          email: res.data.email,
          fullname: res.data.fullname,
          avatarUrl: res.data.avatarUrl || "",
        });
      } catch (err) {
        // ❌ ถ้าไม่มี session → redirect ไปหน้า login
        window.location.href = "/";
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);
      setPreviewUrl(URL.createObjectURL(uploadedFile));
    }
  };

  const save = async () => {
    const formData = new FormData();
    formData.append("fullname", form.fullname);
    if (file) formData.append("avatar", file);

    await axios.patch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );
    setEditing(false);
    window.location.reload();
  };

  if (!user) return <div className="p-10">Loading...</div>;

  return (
    <main className="flex-1 px-4 py-8 md:px-12">
      <div className="max-w-3xl mx-auto overflow-hidden bg-white shadow-xl rounded-2xl">
        <div className="p-8 bg-[#F1A661] dark:bg-[#5A9ED1]">
          <div className="flex flex-col items-center md:flex-row">
            <div className="flex flex-col items-center space-y-3">
              {/* รูปโปรไฟล์ + ปุ่มกล้อง */}
              <div className="relative">
                {previewUrl || form.avatarUrl ? (
                  <img
                    src={
                      previewUrl ||
                      (form.avatarUrl.startsWith("http")
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
                      document.getElementById("avatarInput")?.click()
                    }
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700"
                    title="เปลี่ยนรูปโปรไฟล์"
                  >
                    <FaCamera className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>

              {/* ปุ่มด้านล่าง */}
              {editing && (
                <button
                  onClick={() =>
                    document.getElementById("avatarInput")?.click()
                  }
                  className="px-4 py-1 text-sm font-bold text-white bg-gray-700 rounded-full shadow hover:bg-gray-800"
                >
                  คลิกเพื่อเปลี่ยนรูป
                </button>
              )}

              {/* ซ่อนไว้ */}
              <input
                id="avatarInput"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="mt-4 text-center md:ml-6 md:text-left md:mt-0">
              <h1 className="text-3xl font-bold text-white">{user.fullname}</h1>
              <p className="text-sm text-white opacity-90">ข้อมูลส่วนตัว</p>
              <div className="mt-2">
                <span className="px-3 py-1 text-sm text-black bg-white rounded-full bg-opacity-80">
                  ผู้ดูแลระบบ
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
                      email: user.email,
                      fullname: user.fullname,
                      avatarUrl: user.avatarUrl || "",
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
        <p className="px-1 text-lg font-semibold">{value}</p>
      )}
    </div>
  );
}
