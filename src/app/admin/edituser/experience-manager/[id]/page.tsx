"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  FaCheck,
  FaEdit,
  FaEnvelope,
  FaLock,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { BACKEND_URL } from "lib/constants";
import { useAuth } from "@/app/contexts/AuthContext";

interface ExperienceManagerData {
  id: number;
  name: string; // Backend ส่ง name
  email: string;
  avatarUrl?: string;
  // เพิ่ม field อื่นๆ ที่เกี่ยวข้องกับ Experience Manager ถ้ามี
}

// Interface สำหรับ Form state
interface ExperienceManagerFormState {
  fullName: string; // ใน Form ใช้ fullName
  email: string;
  password: string; // สำหรับตั้งรหัสผ่านใหม่
  avatarUrl: string;
}

export default function AdminEditExperienceManagerPage() {
  const { id: userId } = useParams();
  const router = useRouter();
  const { accessToken, session: authSession, updateUserInSession } = useAuth(); // ✅ 2. ดึงจาก Context

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    avatarUrl: "",
  });

  // ✅ ใช้ useCallback สำหรับ fetchData
  const fetchData = useCallback(async () => {
    if (!userId || !accessToken) {
      if (!accessToken) setError("Authentication token not available.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<ExperienceManagerData>(
        // Endpoint ควรจะเป็นสำหรับดึงข้อมูล User ทั่วไป หรือ User ที่มี Role EXPERIENCE_MANAGER โดยเฉพาะ
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/admin/${userId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }, // ✅ ส่ง Token
        },
      );
      setForm({
        fullName: res.data.name,
        email: res.data.email,
        password: "", // ไม่ set password เดิม
        avatarUrl: res.data.avatarUrl || "",
      });
    } catch (err: any) {
      console.error("❌ ดึงข้อมูลผู้จัดการเล่มล้มเหลว:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load data.",
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
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      Swal.fire("ข้อผิดพลาด", "Session หมดอายุ, กรุณา Login ใหม่", "error");
      return;
    }
    // ตรวจสอบ Password (ถ้ามีการกรอก)
    if (form.password && form.password.length < 6) {
      Swal.fire(
        "ผิดพลาด",
        "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
        "warning",
      );
      return;
    }
    setSaving(true);

    try {
      const payload: any = {
        name: form.fullName,
        email: form.email,
      };
      if (form.password) {
        // ส่ง Password ไปก็ต่อเมื่อมีการกรอก
        payload.password = form.password;
      }
      // เพิ่ม field อื่นๆ ที่ต้องการอัปเดตสำหรับ Experience Manager ถ้ามี

      const res = await axios.patch<ExperienceManagerData>( // คาดหวังข้อมูล User ที่อัปเดตแล้ว
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}`, // Endpoint สำหรับอัปเดต User
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json", // ✅ เนื้อหาเป็น JSON
          },
        },
      );

      setEditing(false);
      setForm((prev) => ({ ...prev, password: "" })); // เคลียร์ password field หลังบันทึก

      // อัปเดต Context ถ้าข้อมูลที่แก้ไขคือ User ปัจจุบันที่ Login อยู่
      // (ซึ่งไม่น่าใช่กรณีนี้ เพราะนี่คือหน้าแก้ไข User อื่น)
      // แต่ถ้า Backend ส่งข้อมูล User ที่อัปเดตแล้วกลับมา และคุณต้องการอัปเดต UI ทันที
      // คุณอาจจะเรียก fetchData() อีกครั้ง หรืออัปเดต `form` state โดยตรง
      setForm({
        // อัปเดต form state ด้วยข้อมูลใหม่
        fullName: res.data.name,
        email: res.data.email,
        password: "",
        avatarUrl: res.data.avatarUrl || "",
      });

      // ถ้า User ที่ถูกแก้ไขคือ User ปัจจุบันที่ Login อยู่ (เช่น แก้ไข Profile ตัวเอง)
      // ให้เรียก updateUserInSession เพื่ออัปเดต Navbar
      if (
        authSession?.user &&
        updateUserInSession &&
        res.data.id === authSession.user.id
      ) {
        // ✅ ตอนนี้เราสามารถส่งไปแค่ Field ที่ต้องการอัปเดตได้แล้ว!
        // ไม่ต้องสร้าง Object ใหม่ที่ซับซ้อน หรือใช้ as อีกต่อไป
        updateUserInSession({
          name: res.data.name,
          email: res.data.email,
          avatarUrl: res.data.avatarUrl,
        });
      }

      Swal.fire({
        title: "สำเร็จ!",
        text: "แก้ไขข้อมูลเรียบร้อยแล้ว",
        icon: "success",
        confirmButtonText: "ตกลง",
      }).then(() => {
        // fetchData(); // เรียก fetchData เพื่อดึงข้อมูลล่าสุดมาแสดง หรือปล่อยให้ UI อัปเดตจาก form state
      });
    } catch (err: any) {
      console.error("❌ ไม่สามารถอัปเดตข้อมูลได้:", err);
      Swal.fire(
        "ผิดพลาด",
        err.response?.data?.message || "ไม่สามารถอัปเดตข้อมูลได้",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setForm((prev) => ({ ...prev, password: "" }));
    fetchData(); // Reset form โดยการโหลดข้อมูลล่าสุด
  };

  if (loading) return <div className="p-10 text-center">Loading data...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  // AdminLayout ควรจะป้องกันแล้ว
  if (!authSession?.user || authSession.user.role !== "ADMIN") {
    return (
      <div className="p-10 text-center text-orange-500">
        Verifying session...
      </div>
    );
  }
  if (!form.email && !loading) {
    return <div className="p-10 text-center">Could not load user data.</div>;
  }

  return (
    <main className="flex-1 px-4 py-8 md:px-12">
      <div className="max-w-3xl mx-auto overflow-hidden bg-white shadow-xl rounded-2xl dark:bg-gray-800">
        <div className="p-8 bg-[#5A9ED1] flex items-center space-x-4">
          {" "}
          {/* เปลี่ยนสี Header */}
          <div className="flex items-center justify-center w-24 h-24 overflow-hidden bg-white rounded-full">
            {form.avatarUrl ? (
              <img
                src={
                  form.avatarUrl.startsWith("http")
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
              ผู้จัดการเล่มบันทึกประสบการณ์
            </span>
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
              icon={<FaEnvelope />}
              label="อีเมล (ไอดีผู้ใช้งาน)"
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
              hideValue={!editing && !!form.password}
            />
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-6 py-2 text-white transition rounded-lg bg-[#5A9ED1] hover:scale-105" // เปลี่ยนสีปุ่ม
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
                    "กำลังบันทึก..."
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

// Field Component (ควรจะเหมือนกับที่คุณใช้ในหน้าอื่นๆ)
function Field({
  icon,
  label,
  value,
  id,
  editing = false,
  readOnly = false,
  hideValue = false,
  onChange,
  type = "text",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  id?: string;
  editing?: boolean;
  readOnly?: boolean;
  hideValue?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  // maxLength ไม่ได้ใช้ใน Field นี้
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
          className="px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400" // เปลี่ยนสี focus
        />
      ) : (
        <p className="px-1 text-lg font-semibold text-gray-800 dark:text-gray-100">
          {hideValue && value ? "●".repeat(value.length || 8) : value || "-"}
        </p>
      )}
    </div>
  );
}
