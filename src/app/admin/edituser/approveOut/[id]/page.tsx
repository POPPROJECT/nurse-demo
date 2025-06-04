// src/app/admin/edituser/approveOut/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  FaUser,
  FaEnvelope,
  FaKey,
  FaEdit,
  FaCheck,
  FaTimes,
  FaLock,
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { BACKEND_URL } from 'lib/constants'; // ตรวจสอบ Path
import { useAuth } from '@/app/contexts/AuthContext';

// Interface สำหรับข้อมูล User ที่คาดหวังจาก API (อาจจะต้องปรับให้ตรงกับข้อมูล ApproverOut)
interface ApproverOutData {
  id: number;
  name: string; // Backend ส่ง name
  email: string;
  approverProfile?: { pin: string | null };
  avatarUrl?: string;
  // เพิ่ม field อื่นๆ ที่เกี่ยวข้องกับ ApproverOut ถ้ามี
}

// Interface สำหรับ Form state
interface ApproverOutFormState {
  fullName: string; // ใน Form ใช้ fullName
  email: string;
  pin: string;
  password: string;
  avatarUrl: string;
}

export default function AdminEditApproverOutPage() {
  const { id: userId } = useParams(); // เปลี่ยน id เป็น userId เพื่อความชัดเจน
  const router = useRouter();
  const { accessToken, session: authSession, updateUserInSession } = useAuth(); // ✅ 2. ดึงจาก Context

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ApproverOutFormState>({
    fullName: '',
    email: '',
    pin: '',
    password: '',
    avatarUrl: '',
  });

  const fetchData = useCallback(async () => {
    if (!userId || !accessToken) {
      if (!accessToken) setError('Authentication token not available.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<ApproverOutData>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/admin/${userId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }, // ✅ ส่ง Token
        }
      );
      setForm({
        fullName: res.data.name,
        email: res.data.email,
        pin: res.data.approverProfile?.pin || '',
        password: '', // ไม่ set password เดิม
        avatarUrl: res.data.avatarUrl || '',
      });
    } catch (err: any) {
      console.error('❌ ดึงข้อมูลผู้นิเทศภายนอกล้มเหลว:', err);
      setError(
        err.response?.data?.message || err.message || 'Failed to load data.'
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
    // ตรวจสอบ PIN (ถ้ายังต้องการ PIN สำหรับ Approver Out และมีการกรอก)
    if (form.pin && !/^\d{6}$/.test(form.pin)) {
      Swal.fire('ผิดพลาด', 'PIN ต้องเป็นตัวเลข 6 หลัก', 'warning');
      return;
    }
    // ตรวจสอบ Password (ถ้ามีการกรอก)
    if (form.password && form.password.length < 6) {
      Swal.fire(
        'ผิดพลาด',
        'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร',
        'warning'
      );
      return;
    }
    setSaving(true);

    try {
      const payload: any = {
        name: form.fullName,
        email: form.email,
      };
      if (form.pin) payload.pin = form.pin;
      if (form.password) payload.password = form.password;
      // เพิ่ม field อื่นๆ ที่ต้องการอัปเดตสำหรับ ApproverOut ถ้ามี

      // ✅ ถ้า Backend ของคุณสำหรับ PATCH /users/:id รับ JSON:
      const res = await axios.patch<ApproverOutData>( // คาดหวังข้อมูล User ที่อัปเดตแล้ว
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json', // ✅ เนื้อหาเป็น JSON
          },
        }
      );

      setEditing(false);
      setForm((prev) => ({ ...prev, password: '' })); // เคลียร์ password field หลังบันทึก

      // อัปเดต Context ถ้าข้อมูลที่แก้ไขคือ User ปัจจุบัน (ซึ่งไม่น่าใช่กรณีนี้ แต่ใส่ไว้เป็นแนวทาง)
      if (
        authSession?.user &&
        updateUserInSession &&
        res.data.id === authSession.user.id
      ) {
        updateUserInSession({
          ...authSession.user,
          name: res.data.name, // หรือ fullname ตามที่ Backend ส่งกลับ
          // อัปเดต field อื่นๆ
        });
      }

      Swal.fire({
        title: 'สำเร็จ!',
        text: 'แก้ไขข้อมูลเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง',
      }).then(() => {
        fetchData(); // โหลดข้อมูลล่าสุดมาแสดง
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
    setForm((prev) => ({ ...prev, password: '' }));
    fetchData(); // Reset form โดยการโหลดข้อมูลล่าสุด
  };

  if (loading)
    return <div className="p-10 text-center">Loading approver data...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  if (!authSession?.user || authSession.user.role !== 'ADMIN') {
    return (
      <div className="p-10 text-center text-orange-500">
        Verifying session... Please wait or login again.
      </div>
    );
  }
  if (!form.email && !loading) {
    // ตรวจสอบว่ามีข้อมูลใน form หรือไม่หลังจาก loading เสร็จ
    return (
      <div className="p-10 text-center">Could not load approver data.</div>
    );
  }

  return (
    <main className="flex-1 px-4 py-8 md:px-12">
      <div className="max-w-3xl mx-auto overflow-hidden bg-white shadow-xl rounded-2xl dark:bg-gray-800">
        <div className="p-8 bg-[#F1A661] dark:bg-[#5A9ED1] flex items-center space-x-4">
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
            <p className="text-sm text-white opacity-90">
              ข้อมูลผู้นิเทศภายนอก
            </p>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-700">
          <div className="grid grid-cols-1 gap-4 text-gray-800 dark:text-gray-200 md:grid-cols-2">
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
              label="รหัส PIN (6 หลัก, หากต้องการเปลี่ยน)"
              value={form.pin}
              id="pin"
              editing={editing}
              onChange={handleChange}
              hideValue={!editing && !!form.pin}
              maxLength={6}
            />
            <Field
              icon={<FaEnvelope />}
              label="อีเมล"
              value={form.email}
              id="email"
              editing={editing}
              onChange={handleChange}
            />
            <Field
              icon={<FaLock />}
              label="รหัสผ่านใหม่ (เว้นว่างหากไม่เปลี่ยน)"
              value={form.password}
              id="password"
              editing={editing}
              onChange={handleChange}
              type="password"
              hideValue={!editing && !!form.password} // อาจจะไม่จำเป็นต้อง hide ถ้าเป็น input type password
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
                  onClick={handleSubmit}
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

// Field Component (ควรจะเหมือนกับที่คุณใช้ใน AdminProfilePage)
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
  type = 'text',
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
  type?: string;
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
          type={type}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          inputMode={id === 'pin' ? 'numeric' : undefined}
          className="px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      ) : (
        <p className="px-1 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {hideValue && value ? '●'.repeat(value.length || 6) : value || '-'}
        </p>
      )}
    </div>
  );
}
