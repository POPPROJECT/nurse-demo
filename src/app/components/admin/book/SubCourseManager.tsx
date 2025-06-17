"use client";

import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaCheck, FaEdit, FaPlus, FaTimes, FaTrash } from "react-icons/fa"; // [แก้ไข] 1. เปลี่ยน Type ของ subject

// [แก้ไข] 1. เปลี่ยน Type ของ subject
interface SubCourse {
  id: number;
  name: string;
  subject?: string | null; // <-- แก้จาก number เป็น string | null
  alwaycourse?: number;
  inSubjectCount?: number | null;
  isSubjectFreeform?: boolean;
}

interface SubCourseManagerProps {
  courseId: number;
  accessToken: string;
}

export default function SubCourseManager({
  courseId,
  accessToken,
}: SubCourseManagerProps) {
  const [list, setList] = useState<SubCourse[]>([]);
  const [name, setName] = useState("");

  // [แก้ไข] 2. เปลี่ยน State และค่าเริ่มต้นของ subject
  const [subjectValue, setSubjectValue] = useState(""); // <-- แก้จาก 0 เป็น ''
  const [alwaycourseValue, setAlwaycourseValue] = useState(0);

  const [inSubjectCountValue, setInSubjectCountValue] = useState(0);
  const [isFreeformValue, setIsFreeformValue] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState(""); // <-- แก้จาก 0 เป็น ''
  const [editAlwaycourse, setEditAlwaycourse] = useState(0);

  const [editInSubjectCount, setEditInSubjectCount] = useState(0);
  const [editIsFreeform, setEditIsFreeform] = useState(false);

  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  useEffect(() => {
    if (courseId) fetchList();
  }, [courseId]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axios.get<SubCourse[]>(
        `${BASE}/courses/${courseId}/subcourses`,
        authHeader,
      );
      setList(res.data);
    } catch {
      Swal.fire("Error", "โหลดหมวดหมู่ย่อยไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  };

  const addSub = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return Swal.fire("ข้อผิดพลาด", "กรุณากรอกชื่อ", "error");

    setAdding(true);
    try {
      await axios.post(
        `${BASE}/courses/${courseId}/subcourses`,
        {
          name: name.trim(),
          subject: subjectValue.trim() || null, // ส่งเป็น string หรือ null ถ้าเป็นค่าว่าง
          alwaycourse: alwaycourseValue,
          inSubjectCount: inSubjectCountValue,
          isSubjectFreeform: isFreeformValue,
        },
        authHeader,
      );
      Swal.fire("สำเร็จ", "เพิ่มหมวดหมู่ย่อยเรียบร้อยแล้ว", "success");
      setName("");
      setSubjectValue("");
      setAlwaycourseValue(0);
      setInSubjectCountValue(0);
      setIsFreeformValue(false);
      await fetchList();
    } catch {
      Swal.fire("Error", "ไม่สามารถเพิ่มได้", "error");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (sub: SubCourse) => {
    setEditingId(sub.id);
    setEditName(sub.name);
    setEditSubject(sub.subject ?? ""); // <-- แก้จาก ?? 0 เป็น ?? ''
    setEditAlwaycourse(sub.alwaycourse ?? 0);
    setEditInSubjectCount(sub.inSubjectCount ?? 0);
    setEditIsFreeform(sub.isSubjectFreeform ?? false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (id: number) => {
    if (!editName.trim())
      return Swal.fire("ข้อผิดพลาด", "กรุณากรอกชื่อ", "error");

    // ไม่ต้องมี setSavingEdit เพราะเราใช้ disabled ที่ปุ่มแทนได้
    try {
      await axios.patch(
        `${BASE}/courses/${courseId}/subcourses/${id}`,
        {
          name: editName.trim(),
          subject: editSubject.trim() || null, // ส่งเป็น string หรือ null
          alwaycourse: editAlwaycourse,
          inSubjectCount: editInSubjectCount,
          isSubjectFreeform: editIsFreeform,
        },
        authHeader,
      );
      await Swal.fire("สำเร็จ", "แก้ไขเรียบร้อยแล้ว", "success");
      cancelEdit();
      await fetchList();
    } catch {
      await Swal.fire("Error", "ไม่สามารถแก้ไขได้", "error");
    }
  };

  const deleteSub = (id: number) => {
    Swal.fire({
      title: "ยืนยันการลบ",
      text: "ต้องการลบหมวดหมู่ย่อยนี้ใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626",
    }).then((res) => {
      if (res.isConfirmed) {
        axios
          .delete(`${BASE}/courses/${courseId}/subcourses/${id}`, authHeader)
          .then(() => {
            Swal.fire("สำเร็จ", "ลบเรียบร้อยแล้ว", "success");
            setList((prev) => prev.filter((s) => s.id !== id));
          })
          .catch(() => Swal.fire("Error", "ไม่สามารถลบได้", "error"));
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Form เพิ่ม */}
      <form
        onSubmit={addSub}
        className="flex flex-wrap items-end gap-3 p-4 mt-2 bg-white rounded-lg shadow text-gray-800"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block mb-1">ชื่อหมวดหมู่ย่อย</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="w-32">
          <label className="block mb-1 text-sm">ในวิชา</label>
          <input
            type="number"
            min={0}
            value={inSubjectCountValue}
            onChange={(e) => setInSubjectCountValue(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="w-32">
          <label className="block mb-1">ตลอดหลักสูตร</label>
          <input
            type="number"
            min={0}
            value={alwaycourseValue}
            onChange={(e) => setAlwaycourseValue(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isFreeform"
            checked={isFreeformValue}
            onChange={(e) => setIsFreeformValue(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="isFreeform" className="ml-2 text-sm">
            ให้นิสิตกรอกชื่อวิชาเอง
          </label>
        </div>
        <button
          type="submit"
          disabled={adding}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center sm:w-auto w-full"
        >
          <FaPlus className="inline mr-2" />
          {adding ? "กำลังเพิ่ม..." : "เพิ่ม"}
        </button>
      </form>

      {/* รายการ */}
      <ul className="space-y-2">
        {loading ? (
          <p>กำลังโหลด...</p>
        ) : list.length === 0 ? (
          <p className="text-center text-gray-500">ยังไม่มีหมวดหมู่ย่อย</p>
        ) : (
          list
            .slice()
            .sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { numeric: true }),
            )
            .map((sub) => (
              <li
                key={sub.id}
                className="flex items-center justify-between p-3 rounded bg-gray-50 hover:bg-gray-100"
              >
                {editingId === sub.id ? (
                  // ----- โหมดแก้ไข -----
                  <div className="flex flex-wrap items-end w-full gap-3">
                    <div className="flex-grow">
                      <label className="text-xs">ชื่อ</label>
                      <input
                        className="w-full px-2 py-1 border rounded"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-xs">ในวิชา</label>
                      <input
                        className="w-full px-2 py-1 border rounded"
                        type="number"
                        min={0}
                        value={editInSubjectCount}
                        onChange={(e) =>
                          setEditInSubjectCount(Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-xs">ตลอดหลักสูตร</label>
                      <input
                        className="w-full px-2 py-1 border rounded"
                        type="number"
                        min={0}
                        value={editAlwaycourse}
                        onChange={(e) =>
                          setEditAlwaycourse(Number(e.target.value))
                        }
                      />
                    </div>

                    {/* ▼▼▼ [แก้ไข] เพิ่ม Checkbox ที่นี่ ▼▼▼ */}
                    <div className="flex items-center self-center h-[38px] pt-4">
                      <input
                        type="checkbox"
                        id={`edit-isFreeform-${sub.id}`}
                        checked={editIsFreeform}
                        onChange={(e) => setEditIsFreeform(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label
                        htmlFor={`edit-isFreeform-${sub.id}`}
                        className="ml-2 text-sm"
                      >
                        กรอกชื่อวิชาเอง
                      </label>
                    </div>

                    <div className="flex gap-2 self-end">
                      <button
                        onClick={() => saveEdit(sub.id)}
                        className="px-3 py-2 text-white bg-green-600 rounded hover:bg-green-700"
                        title="ยืนยัน"
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-2 text-white bg-red-500 rounded hover:bg-red-600"
                        title="ยกเลิก"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 space-x-4">
                      <span className="font-medium">{sub.name}</span>
                      <span className="text-gray-500">
                        | ในวิชา: {sub.inSubjectCount || "-"}
                      </span>
                      {/* แสดงชื่อ subject */}
                      <span className="text-gray-500">
                        | ตลอดหลักสูตร: {sub.alwaycourse}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(sub)}
                        className="px-2 py-2 text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit className="inline mr-1" /> แก้ไข
                      </button>
                      <button
                        onClick={() => deleteSub(sub.id)}
                        className="px-2 py-2 text-red-500 hover:text-red-700"
                      >
                        <FaTrash className="inline mr-1" /> ลบ
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))
        )}
      </ul>
    </div>
  );
}
