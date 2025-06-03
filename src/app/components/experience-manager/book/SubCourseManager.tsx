'use client';

import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaCheck, FaEdit, FaPlus, FaTimes, FaTrash } from 'react-icons/fa';

interface SubCourse {
  id: number;
  name: string;
  subject?: number;
  alwaycourse?: number;
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
  const [name, setName] = useState('');
  const [subjectValue, setSubjectValue] = useState(0);
  const [alwaycourseValue, setAlwaycourseValue] = useState(0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState(0);
  const [editAlwaycourse, setEditAlwaycourse] = useState(0);

  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

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
        authHeader
      );
      setList(res.data);
    } catch {
      Swal.fire('Error', 'โหลดหมวดหมู่ย่อยไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addSub = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return Swal.fire('ข้อผิดพลาด', 'กรุณากรอกชื่อ', 'error');

    setAdding(true);
    try {
      await axios.post(
        `${BASE}/courses/${courseId}/subcourses`,
        {
          name: name.trim(),
          subject: subjectValue,
          alwaycourse: alwaycourseValue,
        },
        authHeader
      );
      Swal.fire('สำเร็จ', 'เพิ่มหมวดหมู่ย่อยเรียบร้อยแล้ว', 'success');
      setName('');
      setSubjectValue(0);
      setAlwaycourseValue(0);
      await fetchList();
    } catch {
      Swal.fire('Error', 'ไม่สามารถเพิ่มได้', 'error');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (sub: SubCourse) => {
    setEditingId(sub.id);
    setEditName(sub.name);
    setEditSubject(sub.subject ?? 0);
    setEditAlwaycourse(sub.alwaycourse ?? 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (id: number) => {
    if (!editName.trim())
      return Swal.fire('ข้อผิดพลาด', 'กรุณากรอกชื่อ', 'error');

    setSavingEdit(true);
    try {
      await axios.patch(
        `${BASE}/courses/${courseId}/subcourses/${id}`,
        {
          name: editName.trim(),
          subject: editSubject,
          alwaycourse: editAlwaycourse,
        },
        authHeader
      );
      Swal.fire('สำเร็จ', 'แก้ไขเรียบร้อยแล้ว', 'success');
      cancelEdit();
      await fetchList();
    } catch {
      Swal.fire('Error', 'ไม่สามารถแก้ไขได้', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteSub = (id: number) => {
    Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'ต้องการลบหมวดหมู่ย่อยนี้ใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#dc2626',
    }).then((res) => {
      if (res.isConfirmed) {
        axios
          .delete(`${BASE}/courses/${courseId}/subcourses/${id}`, authHeader)
          .then(() => {
            Swal.fire('สำเร็จ', 'ลบเรียบร้อยแล้ว', 'success');
            setList((prev) => prev.filter((s) => s.id !== id));
          })
          .catch(() => Swal.fire('Error', 'ไม่สามารถลบได้', 'error'));
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Form เพิ่ม */}
      <form
        onSubmit={addSub}
        className="flex flex-wrap items-end gap-3 p-4 mt-2 bg-white rounded-lg shadow"
      >
        <div className="flex-1 min-w-[200px] ">
          <label className="block mb-1">ชื่อหมวดหมู่ย่อย</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="w-32">
          <label className="block mb-1">ในวิชา</label>
          <input
            type="number"
            min={0}
            value={subjectValue}
            onChange={(e) => setSubjectValue(Number(e.target.value))}
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
        <button
          type="submit"
          disabled={adding}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center sm:w-auto w-full"
        >
          <FaPlus className="inline mr-2" />
          {adding ? 'กำลังเพิ่ม...' : 'เพิ่ม'}
        </button>
      </form>

      {/* รายการ */}
      <ul className="space-y-2">
        {loading ? (
          <p className="text-center text-gray-500">กำลังโหลด...</p>
        ) : list.length === 0 ? (
          <p className="text-center text-gray-500">ยังไม่มีหมวดหมู่ย่อย</p>
        ) : (
          list.map((sub) => (
            <li
              key={sub.id}
              className="flex items-center justify-between p-3 rounded bg-gray-50 hover:bg-gray-100"
            >
              {editingId === sub.id ? (
                <div className="flex flex-wrap items-end w-full gap-3">
                  <input
                    className="px-2 py-1 border rounded"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />

                  <input
                    className="w-20 px-2 py-1 border rounded"
                    type="number"
                    value={editSubject}
                    onChange={(e) => setEditSubject(Number(e.target.value))}
                  />
                  <input
                    className="w-20 px-2 py-1 border rounded"
                    type="number"
                    value={editAlwaycourse}
                    onChange={(e) => setEditAlwaycourse(Number(e.target.value))}
                  />
                  <button
                    onClick={() => saveEdit(sub.id)}
                    className="px-3 py-2 text-white bg-green-600 rounded hover:text-green-800"
                  >
                    <FaCheck className="inline mr-1" />
                    บันทึก
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-2 text-white bg-red-500 rounded hover:text-red-700"
                  >
                    <FaTimes className="inline mr-1" />
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-x-4">
                    <span className="font-medium">{sub.name}</span>
                    <span className="text-gray-500">| วิชา: {sub.subject}</span>
                    <span className="text-gray-500">
                      | ตลอดหลักสูตร: {sub.alwaycourse}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(sub)}
                        className="px-2 py-2 text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit className="inline mr-1" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => deleteSub(sub.id)}
                        className="px-2 py-2 text-red-500 hover:text-red-700"
                      >
                        <FaTrash className="inline mr-1" />
                        ลบ
                      </button>
                    </div>
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
