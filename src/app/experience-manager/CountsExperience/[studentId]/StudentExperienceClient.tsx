// //frontend\src\app\experience-manager\CountsExperience\[studentId]\StudentExperienceClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Session } from "lib/session";
import axios from "axios";
import { FaCheck } from "react-icons/fa";
import { BACKEND_URL } from "lib/constants";
import Swal from "sweetalert2";
import { useAuth } from "@/app/contexts/AuthContext";
import Link from "next/link";

interface Book {
  id: number;
  title: string;
  courses: Course[];
}

interface Course {
  id: number;
  name: string;
  subCourses: SubCourse[];
}

interface SubCourse {
  id: number;
  name: string;
  alwaycourse: number;
  progressCount: number;
  confirmedCount: number;
}

interface StudentExperienceClientProps {
  studentIdForApi: string;
  studentName: string;
  studentDisplayId: string;
  session: Session;
}

export default function StudentExperienceClient({
  studentIdForApi,
  studentName,
  studentDisplayId,
  session,
}: StudentExperienceClientProps) {
  const userId = parseInt(studentIdForApi, 10);

  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info" | null
  >(null);
  const [expandedCourseIds, setExpandedCourseIds] = useState<number[]>([]);
  const { accessToken } = useAuth();

  const toggleCourse = (courseId: number) => {
    setExpandedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  useEffect(() => {
    if (isNaN(userId)) {
      console.error(
        "StudentExperienceClient: Invalid studentIdForApi, parsed to NaN.",
      );
      setBooks([]);
      setMessage("รหัสนิสิต (userId) ไม่ถูกต้องสำหรับการโหลดข้อมูลสมุด");
      setMessageType("error");
      return;
    }

    if (!accessToken) {
      console.log(
        "StudentExperienceClient: Access token not available for fetching books.",
      );
      setBooks([]);
      return;
    }

    axios
      .get(`${BACKEND_URL}/experience-books/authorized/student/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        const authorizedBooks = res.data as Book[];
        const initializedBooks = authorizedBooks.map((book: Book) => ({
          ...book,
          courses: (book.courses || []).map((course: Course) => ({
            ...course,
            subCourses: (course.subCourses || []).map((sub: SubCourse) => ({
              ...sub,
              progressCount: 0,
              confirmedCount: 0,
            })),
          })),
        }));

        setBooks(initializedBooks);
        if (initializedBooks.length > 0) {
          setSelectedBookId(initializedBooks[0].id);
          setMessage(null);
          setMessageType(null);
        } else {
          setSelectedBookId(null);
          setMessage(
            `ไม่พบสมุดบันทึกที่นิสิต ${studentDisplayId} ได้รับอนุญาตให้เข้าถึง`,
          );
          setMessageType("info");
        }
      })
      .catch((err) => {
        console.error(
          `Error fetching authorized books for student ${userId} (${studentDisplayId}):`,
          err,
        );
        setMessage(
          `เกิดข้อผิดพลาดในการโหลดข้อมูลสมุดของนิสิต ${studentDisplayId}`,
        );
        setMessageType("error");
        setBooks([]);
      });
  }, [userId, accessToken, studentDisplayId]);

  useEffect(() => {
    if (isNaN(userId) || !selectedBookId || !accessToken) {
      return;
    }

    axios
      .get(
        `${BACKEND_URL}/experience-books/${selectedBookId}/progress/user-by-string-id/${encodeURIComponent(
          studentDisplayId,
        )}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )
      .then((res) => {
        const progressMap = res.data;
        setBooks((prevBooks) =>
          prevBooks.map((book) =>
            book.id === selectedBookId
              ? {
                  ...book,
                  courses: book.courses.map((course) => ({
                    ...course,
                    subCourses: course.subCourses.map((sub) => ({
                      ...sub,
                      confirmedCount: progressMap[sub.name] || 0,
                      progressCount: 0, // Reset progressCount ที่กรอกใหม่
                    })),
                  })),
                }
              : book,
          ),
        );
      })
      .catch((err) => {
        console.error(
          `Error fetching student progress for displayId ${studentDisplayId}:`,
          err,
        );
        setMessage(
          `ไม่สามารถโหลดข้อมูลความก้าวหน้าของนิสิต ${studentDisplayId} ได้`,
        );
        setMessageType("error");
      });
  }, [selectedBookId, userId, accessToken, studentDisplayId]);

  const updateProgress = (courseId: number, subId: number, value: number) => {
    const newValue = Math.max(0, value);
    setBooks((prev) =>
      prev.map((book) =>
        book.id === selectedBookId
          ? {
              ...book,
              courses: book.courses.map((course) =>
                course.id === courseId
                  ? {
                      ...course,
                      subCourses: course.subCourses.map((sub) =>
                        sub.id === subId
                          ? { ...sub, progressCount: newValue }
                          : sub,
                      ),
                    }
                  : course,
              ),
            }
          : book,
      ),
    );
  };

  const handleSave = async () => {
    if (isNaN(userId) || !selectedBookId || !accessToken) {
      Swal.fire(
        "ข้อมูลไม่พร้อม",
        "ไม่สามารถบันทึกได้เนื่องจากข้อมูลผู้ใช้หรือสมุดไม่สมบูรณ์",
        "warning",
      );
      return;
    }
    const currentBook = books.find((b) => b.id === selectedBookId);
    if (!currentBook) return;

    const progressPayload = currentBook.courses.flatMap((course) =>
      course.subCourses
        .filter((sub) => (sub.progressCount || 0) > 0)
        .map((sub) => ({
          subCourseId: sub.id,
          count: (sub.confirmedCount || 0) + (sub.progressCount || 0),
        })),
    );

    if (progressPayload.length === 0) {
      setMessage("ไม่มีการเปลี่ยนแปลงที่จะบันทึก");
      setMessageType("info");
      setTimeout(() => {
        setMessage(null);
        setMessageType(null);
      }, 3000);
      return;
    }

    setSaving(true);
    try {
      await axios.patch(
        `${BACKEND_URL}/experience-books/${selectedBookId}/progress/user-by-string-id/${encodeURIComponent(
          studentDisplayId,
        )}`,
        { progress: progressPayload },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      const res = await axios.get(
        `${BACKEND_URL}/experience-books/${selectedBookId}/progress/user-by-string-id/${encodeURIComponent(
          studentDisplayId,
        )}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const progressMap = res.data;
      setBooks((prev) =>
        prev.map((book) =>
          book.id === selectedBookId
            ? {
                ...book,
                courses: book.courses.map((course) => ({
                  ...course,
                  subCourses: course.subCourses.map((sub) => ({
                    ...sub,
                    confirmedCount: progressMap[sub.name] || 0,
                    progressCount: 0,
                  })),
                })),
              }
            : book,
        ),
      );
      await Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: "ระบบได้บันทึกจำนวนประสบการณ์เรียบร้อยแล้ว",
        confirmButtonColor: "#16a34a",
        confirmButtonText: "ตกลง",
      });
    } catch (err) {
      console.error("Error saving progress:", err);
      await Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        text: "เกิดข้อผิดพลาดขณะบันทึก กรุณาลองใหม่",
        confirmButtonColor: "#d33",
      });
    } finally {
      setSaving(false);
      if (message === "ไม่มีการเปลี่ยนแปลงที่จะบันทึก") {
        setMessage(null);
        setMessageType(null);
      }
    }
  };

  const currentSelectedBook = books.find((b) => b.id === selectedBookId);
  const stats = (() => {
    if (!currentSelectedBook)
      return { total: 0, confirmed: 0, remaining: 0, percent: 0 };
    let totalRequired = 0;
    let totalProgressCounted = 0;

    currentSelectedBook.courses.forEach((course) =>
      course.subCourses.forEach((sub) => {
        const required = sub.alwaycourse || 0;
        const confirmed = sub.confirmedCount || 0;
        const progress = sub.progressCount || 0;

        totalRequired += required;
        totalProgressCounted += Math.min(confirmed + progress, required);
      }),
    );

    const remaining = Math.max(0, totalRequired - totalProgressCounted);
    const percent =
      totalRequired > 0
        ? Math.round((totalProgressCounted / totalRequired) * 100)
        : 0;

    return {
      total: totalRequired,
      confirmed: totalProgressCounted,
      remaining,
      percent: Math.min(percent, 100),
    };
  })();

  if (!accessToken) {
    return (
      <div className="p-6 text-center">
        กำลังโหลดข้อมูลผู้ใช้หรือรอการยืนยันตัวตน...
      </div>
    );
  }

  if (isNaN(userId) && messageType === "error") {
    return (
      <div className="p-6 text-center text-red-600">
        {message || "รหัสนิสิตไม่ถูกต้อง"}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 dark:text-white bg-white dark:bg-[#1E293B] text-gray-800 rounded-xl shadow-md transition-shadow mt-7 max-w-5xl p-6 mx-auto duration-300 min-w-auto">
        <Link
          href="/experience-manager/CountsExperience"
          className="inline-flex items-center mb-2 text-gray-600 hover:text-gray-700 dark:text-gray-300"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          กลับไปหน้าจัดการข้อมูลประสบการณ์นิสิต
        </Link>

        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          บันทึกจำนวนประสบการณ์ของนิสิต: {studentDisplayId} - {studentName}
        </h1>
        <div className="mt-4">
          <label className="font-medium text-gray-700 dark:text-gray-300">
            เลือกเล่มบันทึก:
          </label>
          <select
            className="p-2 ml-2 text-gray-700 border border-gray-300 rounded dark:bg-slate-700 dark:text-gray-100 dark:border-gray-600"
            value={selectedBookId ?? ""}
            onChange={(e) =>
              setSelectedBookId(e.target.value ? Number(e.target.value) : null)
            }
            disabled={books.length === 0 && !message}
          >
            <option value="">-- กรุณาเลือกเล่ม --</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>
        {message && messageType === "info" && books.length === 0 && (
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            {message}
          </p>
        )}
      </div>

      <div className="max-w-5xl p-6 mx-auto bg-white shadow-lg dark:bg-slate-800 rounded-xl">
        {message && messageType === "error" && (
          <div className="p-4 mb-4 text-center text-red-700 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-300">
            {message}
          </div>
        )}
        {selectedBookId && currentSelectedBook ? (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
              <div className="p-4 text-white bg-indigo-600 rounded-lg">
                <h2 className="text-xl font-semibold">รวมทั้งหมด</h2>
                <p className="mt-3 text-2xl">{stats.total} ครั้ง</p>
              </div>
              <div className="p-4 text-white rounded-lg bg-emerald-600">
                <h2 className="text-xl font-semibold">
                  ทำไปแล้ว (รวมที่กรอกใหม่)
                </h2>
                <p className="mt-3 text-2xl">{stats.confirmed} ครั้ง</p>
              </div>
              <div className="p-4 text-white rounded-lg bg-amber-500">
                <h2 className="text-xl font-semibold">คงเหลือ</h2>
                <p className="mt-3 text-2xl">{stats.remaining} ครั้ง</p>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mb-6 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-700 dark:border-gray-600">
              <div className="p-4 border-b border-gray-200 bg-indigo-50 dark:bg-indigo-900/50 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">
                  ความคืบหน้าโดยรวม
                </h2>
              </div>
              <div className="p-4">
                <div className="w-full h-4 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-600">
                  <div
                    className="h-full transition-all duration-300 bg-indigo-600"
                    style={{ width: `${stats.percent}%` }}
                  ></div>
                </div>
                <div className="flex justify-end mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{stats.percent}%</span>
                </div>
              </div>
            </div>

            {/* Courses and SubCourses */}
            {currentSelectedBook.courses.map((course, idx) => {
              let courseTotalRequired = 0;
              let courseCurrentTotalProgress = 0;
              course.subCourses.forEach((sub) => {
                const required = sub.alwaycourse || 0;
                const confirmed = sub.confirmedCount || 0;
                const pending = sub.progressCount || 0;
                courseTotalRequired += required;
                courseCurrentTotalProgress += Math.min(
                  confirmed + pending,
                  required,
                );
              });
              const coursePercent =
                courseTotalRequired > 0
                  ? Math.round(
                      (courseCurrentTotalProgress / courseTotalRequired) * 100,
                    )
                  : 0;
              const isExpanded = expandedCourseIds.includes(course.id);

              return (
                <div
                  key={course.id}
                  className="p-4 mb-6 rounded-lg bg-gray-50 dark:bg-slate-700/50"
                >
                  <div
                    className="flex items-center justify-between p-4 text-black bg-gray-200 rounded-t-lg cursor-pointer hover:bg-gray-100 dark:bg-slate-600 dark:hover:bg-slate-500"
                    onClick={() => toggleCourse(course.id)}
                  >
                    <div className="font-semibold text-black dark:text-white">
                      {course.name}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-black dark:text-white">
                      <span>{coursePercent}%</span>
                      <span className="transition-transform duration-200 transform">
                        {isExpanded ? "▾" : "▸"}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`h-1 ${
                      coursePercent === 100
                        ? "bg-green-400"
                        : coursePercent >= 50
                          ? "bg-yellow-400"
                          : "bg-red-400"
                    }`}
                    style={{ width: `${coursePercent}%` }}
                  />
                  {isExpanded && (
                    <div className="pt-3 space-y-3 text-gray-700">
                      {" "}
                      {course.subCourses.map((sub, sIdx) => {
                        const isFullyConfirmed =
                          (sub.confirmedCount || 0) >= (sub.alwaycourse || 0);

                        return (
                          <div
                            key={sub.id}
                            className={`flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 bg-white dark:bg-slate-700 rounded shadow-sm ${
                              isFullyConfirmed && (sub.progressCount || 0) === 0
                                ? "border-l-4 border-green-500 dark:border-green-400"
                                : "border-l-4 border-transparent"
                            }`}
                          >
                            <div className="flex items-center flex-grow mb-2 md:mb-0">
                              <span className="text-gray-800 dark:text-gray-200">
                                {sub.name}
                              </span>
                              {isFullyConfirmed &&
                                (sub.progressCount || 0) === 0 && (
                                  <span className="ml-2 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded dark:bg-green-800 dark:text-green-200">
                                    ครบแล้ว
                                  </span>
                                )}
                            </div>
                            <div className="flex items-center self-end gap-2 md:self-center">
                              <button
                                className="w-8 h-8 text-gray-600 bg-gray-100 rounded-l hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                                onClick={() =>
                                  updateProgress(
                                    course.id,
                                    sub.id,
                                    (sub.progressCount || 0) - 1,
                                  )
                                }
                                disabled={(sub.progressCount || 0) <= 0}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={0}
                                value={sub.progressCount || 0}
                                onChange={(e) =>
                                  updateProgress(
                                    course.id,
                                    sub.id,
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                className="w-16 h-8 px-2 text-center border border-gray-300 dark:bg-slate-600 dark:text-gray-100 dark:border-gray-500"
                                disabled={
                                  isFullyConfirmed &&
                                  (sub.progressCount || 0) === 0 &&
                                  (sub.alwaycourse || 0) > 0
                                }
                              />
                              <button
                                className="w-8 h-8 text-gray-600 bg-gray-100 rounded-r hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                                onClick={() =>
                                  updateProgress(
                                    course.id,
                                    sub.id,
                                    (sub.progressCount || 0) + 1,
                                  )
                                }
                              >
                                +
                              </button>
                              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                / {sub.alwaycourse || 0} ครั้ง
                                <span className="ml-1 text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                  (ยืนยัน: {sub.confirmedCount || 0})
                                </span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex justify-end mt-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 font-bold text-white transition bg-green-600 rounded hover:bg-green-700 disabled:opacity-70"
              >
                <FaCheck /> {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            {books.length > 0 &&
              !selectedBookId &&
              !message &&
              "กรุณาเลือกเล่มบันทึกเพื่อดูรายละเอียดและบันทึกจำนวนประสบการณ์"}
            {books.length === 0 && !message && "กำลังโหลดข้อมูลเล่มบันทึก..."}
          </div>
        )}
      </div>
    </div>
  );
}
