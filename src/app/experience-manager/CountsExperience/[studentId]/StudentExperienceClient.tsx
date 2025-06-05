'use client';

import React, { useEffect, useState } from 'react';
import { Session } from 'lib/session'; // ตรวจสอบว่า Session interface ถูกต้อง
import axios from 'axios';
import { FaCheck } from 'react-icons/fa';
import { BACKEND_URL } from 'lib/constants';
import Swal from 'sweetalert2';
import { useAuth } from '@/app/contexts/AuthContext';

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
  alwaycourse: number; // ชื่อ property อาจจะเป็น requiredCount หรือ targetCount
  progressCount: number;
  confirmedCount: number;
}

interface StudentExperienceClientProps {
  studentIdForApi: string; // ID ของนิสิตจาก URL (อาจจะเป็น User ID ที่เป็น PK)
  studentName: string;
  studentDisplayId: string; // รหัสนิสิตที่ใช้แสดงผล (เช่น "31423532")
  session: Session; // session ของผู้ใช้ที่ login อยู่ (อาจจะเป็น Manager หรือตัวนิสิตเอง)
}

export default function StudentExperienceClient({
  studentIdForApi,
  studentName,
  studentDisplayId,
  session,
}: StudentExperienceClientProps) {
  // แปลง studentIdForApi (ที่มักจะเป็น string จาก URL params) เป็น number สำหรับใช้กับ API
  // โดยสมมติว่า API /authorized/student/:studentId คาดหวัง numeric ID ของ User Profile
  const userId = parseInt(studentIdForApi, 10);

  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<
    'success' | 'error' | 'info' | null
  >(null);
  const [expandedCourseIds, setExpandedCourseIds] = useState<number[]>([]);

  // ดึง accessToken จาก AuthContext ของผู้ใช้ที่ login อยู่
  const { accessToken } = useAuth();

  const toggleCourse = (courseId: number) => {
    setExpandedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  // useEffect for fetching authorized book details for the specific student
  useEffect(() => {
    if (isNaN(userId)) {
      console.error(
        'StudentExperienceClient: Invalid studentIdForApi, parsed to NaN.'
      );
      setBooks([]);
      setMessage('รหัสนิสิต (userId) ไม่ถูกต้องสำหรับการโหลดข้อมูลสมุด');
      setMessageType('error');
      return;
    }

    if (!accessToken) {
      console.log(
        'StudentExperienceClient: Access token not available for fetching books.'
      );
      // อาจจะตั้งค่า loading หรือปล่อยให้ UI แสดงข้อความ "กำลังโหลด..." ด้านล่าง
      setBooks([]); // ไม่ควรแสดงข้อมูลเก่าถ้า token ไม่มี
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
            `ไม่พบสมุดบันทึกที่นิสิต ${studentDisplayId} ได้รับอนุญาตให้เข้าถึง`
          );
          setMessageType('info'); // ใช้ 'info' หรือ 'warning' แทน 'error' ถ้าเป็นเคสปกติ
        }
      })
      .catch((err) => {
        console.error(
          `Error fetching authorized books for student ${userId} (${studentDisplayId}):`,
          err
        );
        setMessage(
          `เกิดข้อผิดพลาดในการโหลดข้อมูลสมุดของนิสิต ${studentDisplayId}`
        );
        setMessageType('error');
        setBooks([]);
      });
  }, [userId, accessToken, studentDisplayId]); // Dependencies ที่ถูกต้อง

  // useEffect for fetching student progress (เมื่อมีการเลือกสมุด)
  useEffect(() => {
    if (isNaN(userId) || !selectedBookId || !accessToken) {
      // ถ้ายังไม่มี selectedBookId หรือ token ก็ไม่ต้องทำอะไร
      // หรือถ้า userId ไม่ถูกต้อง
      return;
    }

    axios
      .get(
        `${BACKEND_URL}/experience-books/${selectedBookId}/progress/user-by-string-id/${studentIdForApi}`,
        // หมายเหตุ: Endpoint นี้รับ studentIdForApi (string id) ซึ่งอาจจะต้องตรงกับที่ backend คาดหวัง
        // หาก backend endpoint นี้คาดหวัง numeric User ID (เหมือน /authorized/student/:userId)
        // คุณอาจจะต้องส่ง userId (number) แทน studentIdForApi (string) หรือปรับ backend
        // จากโค้ดเดิม: user-by-string-id ดังนั้น studentIdForApi (string) น่าจะถูกต้องสำหรับ endpoint นี้
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      .then((res) => {
        const progressMap = res.data; // สมมติ progressMap คือ { [subCourseName: string]: number }
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
              : book
          )
        );
      })
      .catch((err) => {
        console.error('Error fetching student progress:', err);
        setMessage('ไม่สามารถโหลดข้อมูลความก้าวหน้าของนิสิตได้');
        setMessageType('error');
      });
  }, [selectedBookId, userId, accessToken, studentIdForApi]); // เพิ่ม accessToken และ studentIdForApi

  // updateProgress function (ไม่เปลี่ยนแปลง)
  const updateProgress = (courseId: number, subId: number, value: number) => {
    const newValue = Math.max(0, value); // Ensure value is not negative
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
                          : sub
                      ),
                    }
                  : course
              ),
            }
          : book
      )
    );
  };

  // handleSave function (ตรวจสอบการใช้ token)
  const handleSave = async () => {
    if (isNaN(userId) || !selectedBookId || !accessToken) {
      Swal.fire(
        'ข้อมูลไม่พร้อม',
        'ไม่สามารถบันทึกได้เนื่องจากข้อมูลผู้ใช้หรือสมุดไม่สมบูรณ์',
        'warning'
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
        }))
    );

    if (progressPayload.length === 0) {
      setMessage('ไม่มีการเปลี่ยนแปลงที่จะบันทึก');
      setMessageType('info');
      setTimeout(() => {
        setMessage(null);
        setMessageType(null);
      }, 3000);
      return;
    }

    setSaving(true);
    try {
      // Endpoint สำหรับ patch progress ควรใช้ studentIdForApi (string) หรือ userId (number)
      // ให้สอดคล้องกับ backend API definition (จากโค้ดเดิมคือ studentIdForApi)
      await axios.patch(
        `${BACKEND_URL}/experience-books/${selectedBookId}/progress/user-by-string-id/${studentIdForApi}`,
        { progress: progressPayload },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // Re-fetch progress to update confirmed counts and reset progress counts
      const res = await axios.get(
        `${BACKEND_URL}/experience-books/${selectedBookId}/progress/user-by-string-id/${studentIdForApi}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
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
                    progressCount: 0, // Reset progressCount after save
                  })),
                })),
              }
            : book
        )
      );
      await Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: 'ระบบได้บันทึกจำนวนประสบการณ์เรียบร้อยแล้ว',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'ตกลง',
      });
    } catch (err) {
      console.error('Error saving progress:', err);
      await Swal.fire({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: 'เกิดข้อผิดพลาดขณะบันทึก กรุณาลองใหม่',
        confirmButtonColor: '#d33',
      });
    } finally {
      setSaving(false);
      // Clear message related to "ไม่มีการเปลี่ยนแปลง"
      if (message === 'ไม่มีการเปลี่ยนแปลงที่จะบันทึก') {
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
        const progress = sub.progressCount || 0; // Count pending changes

        totalRequired += required;
        totalProgressCounted += Math.min(confirmed + progress, required);
      })
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

  // Loading state check: ควรตรวจสอบ accessToken ที่ใช้จริง
  if (!accessToken) {
    return (
      <div className="p-6 text-center">
        กำลังโหลดข้อมูลผู้ใช้หรือรอการยืนยันตัวตน...
      </div>
    );
  }

  if (isNaN(userId) && messageType === 'error') {
    // กรณี userId ไม่ถูกต้องตั้งแต่ต้น
    return (
      <div className="p-6 text-center text-red-600">
        {message || 'รหัสนิสิตไม่ถูกต้อง'}
      </div>
    );
  }

  // UI Rendering
  return (
    <div>
      <div className="mb-3 dark:text-white bg-white dark:bg-[#1E293B] text-gray-800 rounded-xl shadow-md transition-shadow mt-7 max-w-5xl p-6 mx-auto duration-300 min-w-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          บันทึกจำนวนประสบการณ์ของนิสิต: {studentDisplayId} - {studentName}
        </h1>
        <div className="mt-4">
          <label className="font-medium text-gray-700 dark:text-gray-300">
            เลือกเล่มบันทึก:
          </label>
          <select
            className="p-2 ml-2 text-gray-700 border border-gray-300 rounded dark:bg-slate-700 dark:text-gray-100 dark:border-gray-600"
            value={selectedBookId ?? ''}
            onChange={(e) =>
              setSelectedBookId(e.target.value ? Number(e.target.value) : null)
            }
            disabled={books.length === 0 && !message} // Disable if books are loading or genuinely none
          >
            <option value="">-- กรุณาเลือกเล่ม --</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>
        {message && messageType === 'info' && books.length === 0 && (
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            {message}
          </p>
        )}
      </div>

      <div className="max-w-5xl p-6 mx-auto bg-white shadow-lg dark:bg-slate-800 rounded-xl">
        {message && messageType === 'error' && (
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
                <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>0%</span>
                  <span>{stats.percent}%</span>
                  <span>100%</span>
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
                  required
                );
              });
              const coursePercent =
                courseTotalRequired > 0
                  ? Math.round(
                      (courseCurrentTotalProgress / courseTotalRequired) * 100
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
                      <span className="mr-2">{idx + 1}.</span>
                      {course.name}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-black dark:text-white">
                      <span>{coursePercent}%</span>
                      <span className="transition-transform duration-200 transform">
                        {isExpanded ? '▾' : '▸'}
                      </span>
                    </div>
                  </div>
                  <div // Progress bar for course
                    className={`h-1 ${
                      coursePercent === 100
                        ? 'bg-green-400'
                        : coursePercent >= 50
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${coursePercent}%` }}
                  />
                  {isExpanded && (
                    <div className="pt-3 space-y-3 text-gray-700">
                      {' '}
                      {/* Added pt-3 for spacing */}
                      {course.subCourses.map((sub, sIdx) => {
                        const isFullyConfirmed =
                          (sub.confirmedCount || 0) >= (sub.alwaycourse || 0);
                        // const maxInput = Math.max(
                        //   0,
                        //   (sub.alwaycourse || 0) - (sub.confirmedCount || 0)
                        // );

                        return (
                          <div
                            key={sub.id}
                            className={`flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 bg-white dark:bg-slate-700 rounded shadow-sm ${
                              isFullyConfirmed && (sub.progressCount || 0) === 0 // Only show green border if no pending changes
                                ? 'border-l-4 border-green-500 dark:border-green-400'
                                : 'border-l-4 border-transparent'
                            }`}
                          >
                            <div className="flex items-center flex-grow mb-2 md:mb-0">
                              <span className="mr-2 text-gray-800 dark:text-gray-200">
                                {idx + 1}.{sIdx + 1}
                              </span>
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
                                    (sub.progressCount || 0) - 1
                                  )
                                }
                                disabled={(sub.progressCount || 0) <= 0}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={0}
                                // max={maxInput} // Optional: limit max input based on remaining
                                value={sub.progressCount || 0}
                                onChange={(e) =>
                                  updateProgress(
                                    course.id,
                                    sub.id,
                                    parseInt(e.target.value) || 0
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
                                    (sub.progressCount || 0) + 1
                                  )
                                }
                                // disabled={isFullyConfirmed || (sub.progressCount || 0) >= maxInput}
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
                <FaCheck /> {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </div>
          </>
        ) : (
          // Show this message if no book is selected OR if there was an error message for books
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            {books.length > 0 &&
              !selectedBookId &&
              !message &&
              'กรุณาเลือกเล่มบันทึกเพื่อดูรายละเอียดและบันทึกจำนวนประสบการณ์'}
            {books.length === 0 &&
              !message && // No error, no books, implies loading or genuinely none and no info message yet
              'กำลังโหลดข้อมูลเล่มบันทึก...'}
            {/* Error/Info message for book loading is handled above or within the main content area */}
          </div>
        )}
      </div>
    </div>
  );
}
