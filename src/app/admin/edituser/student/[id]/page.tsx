'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FaUser,
  FaEnvelope,
  FaIdBadge,
  FaEdit,
  FaCheck,
  FaTimes,
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { BACKEND_URL } from 'lib/constants';

export default function AdminEditStudentPage() {
  const { id } = useParams();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    studentId: '',
    avatarUrl: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/admin/${id}`,
          { withCredentials: true }
        );
        setForm({
          fullName: res.data.name,
          email: res.data.email,
          studentId: res.data.studentProfile?.studentId || '',
          avatarUrl: res.data.avatarUrl || '',
        });
      } catch (err) {
        console.error('❌ ดึงข้อมูลล้มเหลว', err);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === 'studentId') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 8);
      setForm((prev) => ({ ...prev, studentId: digitsOnly }));
    } else {
      setForm((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!/^\d{8}$/.test(form.studentId)) {
      alert('กรุณากรอกรหัสนิสิตเป็นตัวเลข 8 หลัก');
      return;
    }

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`,
        {
          name: form.fullName,
          email: form.email,
          studentId: form.studentId,
        },
        { withCredentials: true }
      );

      setEditing(false);

      await Swal.fire({
        title: 'สำเร็จ!',
        text: 'แก้ไขข้อมูลเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง',
      });

      router.push(`/admin/edituser/student/${id}`);
    } catch (err) {
      alert('❌ ไม่สามารถอัปเดตข้อมูลได้');
    }
  };

  return (
    <main className="flex-1 px-4 py-8 md:px-12">
      <div className="max-w-3xl mx-auto overflow-hidden bg-white shadow-xl rounded-2xl">
        <div className="p-8 bg-[#F1A661] flex items-center space-x-4">
          <div className="flex items-center justify-center w-24 h-24 overflow-hidden bg-white rounded-full">
            {form.avatarUrl ? (
              <img
                src={
                  form.avatarUrl.startsWith('http')
                    ? form.avatarUrl
                    : `${BACKEND_URL}${form.avatarUrl}`
                }
                alt="avatar"
                className="object-cover w-full h-full rounded-full"
              />
            ) : (
              <FaUser className="text-4xl text-gray-300" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{form.fullName}</h1>
            <p className="text-sm text-white opacity-90">ข้อมูลส่วนตัว</p>
            <span className="inline-block px-3 py-1 mt-1 text-sm text-black bg-white rounded-full bg-opacity-80">
              นิสิตพยาบาล
            </span>
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
              value={form.fullName}
              id="fullName"
              editing={editing}
              onChange={handleChange}
            />
            <Field
              icon={<FaEnvelope />}
              label="อีเมล"
              value={form.email}
              id="email"
              editing={editing}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-6 py-2 text-white transition rounded-lg bg-[#F1A661] hover:scale-105"
              >
                <FaEdit /> แก้ไขข้อมูล
              </button>
            ) : (
              <>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2 text-white transition bg-green-500 rounded-lg hover:scale-105"
                >
                  <FaCheck /> บันทึก
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    window.location.reload();
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
          type="text"
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
