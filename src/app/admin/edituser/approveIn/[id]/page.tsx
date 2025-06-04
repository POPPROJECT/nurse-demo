'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  FaUser,
  FaEnvelope,
  FaKey,
  FaEdit,
  FaCheck,
  FaTimes,
} from 'react-icons/fa';
import { BACKEND_URL } from 'lib/constants';
import Swal from 'sweetalert2';
import { useAuth } from '@/app/contexts/AuthContext';

// Interface สำหรับข้อมูล User ที่คาดหวังจาก API
interface ApproverData {
  id: number;
  name: string;
  email: string;
  approverProfile?: { pin: string | null };
  avatarUrl?: string; // ถ้ามี
}

// Interface สำหรับ Form state
interface ApproverFormState {
  fullName: string;
  email: string;
  pin: string;
  avatarUrl: string; // เก็บ avatarUrl ไว้ด้วย
}

export default function AdminEditApproverPage() {
  const { id: userId } = useParams();
  const router = useRouter();
  const { accessToken, session: authSession } = useAuth(); // ✅ 2. ดึง accessToken และ session จาก Context

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    pin: '',
    avatarUrl: '',
  });

  // ✅ ใช้ useCallback สำหรับ fetchData
  const fetchData = useCallback(async () => {
    if (!userId || !accessToken) {
      if (!accessToken) setError('Authentication token not found.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<ApproverData>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/admin/${userId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }, // ✅ ส่ง Token ใน Header
        }
      );
      setForm({
        fullName: res.data.name,
        email: res.data.email,
        pin: res.data.approverProfile?.pin || '',
        avatarUrl: res.data.avatarUrl || '',
      });
    } catch (err: any) {
      console.error('❌ ดึงข้อมูลผู้นิเทศล้มเหลว:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load approver data.'
      );
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === 'pin') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
      setForm((prev) => ({ ...prev, pin: digitsOnly }));
    } else {
      setForm((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      Swal.fire('ข้อผิดพลาด', 'Session หมดอายุ, กรุณา Login ใหม่', 'error');
      return;
    }
    if (form.pin !== '' && !/^\d{6}$/.test(form.pin)) {
      // อนุญาตให้ PIN เป็นค่าว่างได้ถ้าไม่ต้องการตั้งใหม่
      Swal.fire(
        'ผิดพลาด',
        'PIN ต้องเป็นตัวเลข 6 หลัก หรือเว้นว่างไว้หากไม่ต้องการเปลี่ยน',
        'warning'
      );
      return;
    }
    setSaving(true);

    try {
      // ✅ สร้าง Payload เฉพาะข้อมูลที่ต้องการส่ง (Backend อาจจะไม่รับ Field ที่ไม่รู้จัก)
      const payload: { name: string; email: string; pin?: string } = {
        name: form.fullName,
        email: form.email,
      };
      if (form.pin) {
        // ส่ง PIN ไปก็ต่อเมื่อมีการกรอก
        payload.pin = form.pin;
      }

      await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}`,
        payload,
        {
          headers: {
            // ✅ ส่ง Token ใน Authorization Header
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json', // เนื้อหาเป็น JSON
          },
        }
      );
      setEditing(false);
      Swal.fire({
        title: 'สำเร็จ!',
        text: 'แก้ไขข้อมูลเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง',
      }).then(() => {
        // fetch ข้อมูลใหม่เพื่ออัปเดต UI หลังจากบันทึกสำเร็จ
        fetchData();
        // router.push(`/admin/edituser/approveIn/${userId}`); // อาจจะไม่จำเป็นถ้าไม่ต้องการบังคับ Reload
      });
    } catch (err: any) {
      console.error('❌ ไม่สามารถอัปเดตข้อมูลได้:', err);
      Swal.fire(
        'ผิดพลาด',
        err.response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลได้',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    // Reset form กลับไปเป็นข้อมูลล่าสุดที่ fetch มา (หรือจาก authSession ถ้ามี)
    if (authSession?.user && authSession.user.id === Number(userId)) {
      // สมมติว่ากำลังแก้โปรไฟล์ตัวเอง
      // setForm({ fullName: authSession.user.name, email: authSession.user.email, pin: '******', avatarUrl: authSession.user.avatarUrl || '' });
      fetchData(); // เรียก fetchData เพื่อ reset form ให้เป็นข้อมูลล่าสุดจาก server จะดีกว่า
    } else {
      fetchData(); // ถ้าไม่ใช่โปรไฟล์ตัวเอง ก็ fetch ใหม่
    }
  };

  if (loading)
    return <div className="p-10 text-center">Loading approver data...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  // AdminLayout ควรจะป้องกันการเข้าถึงหน้านี้ถ้าไม่มีสิทธิ์อยู่แล้ว
  // แต่ถ้าต้องการป้องกันอีกชั้น หรือแสดง UI ที่แตกต่าง ก็ทำได้
  if (!authSession?.user || authSession.user.role !== 'ADMIN') {
    return (
      <div className="p-10 text-center text-orange-500">
        Verifying session... Please wait. If this persists, try logging in
        again.
      </div>
    );
  }

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
              ผู้นิเทศภายใน
            </span>
          </div>
        </div>

        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 gap-4 text-gray-800 md:grid-cols-2">
            <Field
              icon={<FaUser />}
              label="ชื่อ-สกุล"
              value={form.fullName}
              id="fullName"
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
                    window.location.reload(); // reset form
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
  maxLength,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  id?: string;
  editing?: boolean;
  readOnly?: boolean;
  hideValue?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxLength?: number;
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
          name={id} // ✅ เพิ่ม name attribute
          type={id === 'pin' && hideValue ? 'password' : 'text'} // ถ้าเป็น PIN และต้องการซ่อน ก็ใช้ type password
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          inputMode={id === 'pin' ? 'numeric' : undefined}
          className="px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      ) : (
        <p className="px-1 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {hideValue && value ? '●'.repeat(value.length) : value || '-'}
        </p>
      )}
    </div>
  );
}
