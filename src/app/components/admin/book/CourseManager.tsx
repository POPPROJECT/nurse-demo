"use client";

import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaCheck,
  FaEdit,
  FaPlus,
  FaSpinner,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

export interface Course {
  id: number;
  name: string;
}

interface CourseManagerProps {
  bookId: number;
  accessToken: string;
  onListChange?: (newList: Course[]) => void;
}

export default function CourseManager({
  bookId,
  accessToken,
  onListChange,
}: CourseManagerProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>("");

  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await axios.get<Course[]>(
        `${BASE}/experience-books/${bookId}/courses`,
        authHeader,
      );
      setCourses(res.data);
      setTimeout(() => {
        onListChange?.(res.data);
      }, 0);
    } catch {
      Swal.fire("โหลดหมวดหมู่ไม่สำเร็จ", "", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [bookId, accessToken]);

  const addCourse = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      Swal.fire("ข้อผิดพลาด", "กรุณากรอกชื่อหมวดหมู่", "error");
      return;
    }
    setAdding(true);
    try {
      await axios.post(
        `${BASE}/experience-books/${bookId}/courses`,
        { name: trimmed },
        authHeader,
      );
      Swal.fire("เพิ่มหมวดหมู่สำเร็จ", "", "success");
      setName("");
      await fetchCourses();
    } catch {
      Swal.fire("เพิ่มหมวดหมู่ไม่สำเร็จ", "", "error");
    } finally {
      setAdding(false);
    }
  };

  const deleteCourse = (id: number) => {
    Swal.fire({
      title: "ยืนยันการลบ",
      text: "คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(
            `${BASE}/experience-books/${bookId}/courses/${id}`,
            authHeader,
          )
          .then(() => {
            Swal.fire("ลบหมวดหมู่สำเร็จ", "", "success");
            const updated = courses.filter((c) => c.id !== id);
            setCourses(updated);
            setTimeout(() => onListChange?.(updated), 0);
          })
          .catch(() => Swal.fire("ลบไม่สำเร็จ", "", "error"));
      }
    });
  };

  const startEdit = (course: Course) => {
    setEditingId(course.id);
    setEditName(course.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (courseId: number) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      Swal.fire("ข้อผิดพลาด", "กรุณากรอกชื่อหมวดหมู่", "error");
      return;
    }
    try {
      await axios.patch(
        `${BASE}/experience-books/${bookId}/courses/${courseId}`,
        { name: trimmed },
        authHeader,
      );
      Swal.fire("อัปเดตหมวดหมู่สำเร็จ", "", "success");
      setEditingId(null);
      setEditName("");
      await fetchCourses();
    } catch {
      Swal.fire("อัปเดตหมวดหมู่ไม่สำเร็จ", "", "error");
    }
  };

  return (
    <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
      <div className="p-5">
        <form onSubmit={addCourse} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="ชื่อหมวดหมู่"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none transition-all "
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center sm:w-auto w-full"
          >
            {adding ? (
              <FaSpinner className="mr-2 animate-spin" />
            ) : (
              <FaPlus className="mr-2" />
            )}
            {adding ? "กำลังเพิ่ม..." : "เพิ่มหมวดหมู่"}
          </button>
        </form>
      </div>

      <div className="px-5 pb-5">
        {loading ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="text-2xl text-green-600 animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <p className="mt-4">ยังไม่มีหมวดหมู่ กรุณาเพิ่มหมวดหมู่ใหม่</p>
          </div>
        ) : (
          <ul className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {courses
              .slice()
              .sort((a, b) => a.id - b.id)
              .map((c, index) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between p-4 transition-all rounded-lg bg-gray-50 hover:bg-gray-100"
                >
                  {editingId === c.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg mr-2"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveEdit(c.id)}
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
                    </>
                  ) : (
                    <>
                      <span className="w-6 text-gray-500">{index + 1}.</span>
                      <span className="flex-1 font-medium text-gray-800">
                        {c.name}
                      </span>
                      <div className="flex gap-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEdit(c)}
                            className="px-2 py-2 text-blue-500 hover:text-blue-700"
                          >
                            <FaEdit className="inline mr-1" />
                            แก้ไข
                          </button>
                          <button
                            onClick={() => deleteCourse(c.id)}
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
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
