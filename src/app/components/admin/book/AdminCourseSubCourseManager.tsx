"use client";

import { useEffect, useRef, useState } from "react";
import CourseManager, { Course } from "./CourseManager";
import SubCourseManager from "./SubCourseManager";

export default function AdminCourseSubCourseManager({
  bookId,
  accessToken,
}: {
  bookId: number;
  accessToken: string;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current && courses.length > 0) {
      hasInitialized.current = true;
      setSelectedCourseId(courses[0].id);
    }
  }, [courses]);

  return (
    <div className="space-y-6">
      <h1 className="pl-4 mb-4 text-lg text-gray-800 border-l-4 border-orange-500 sm:text-xl dark:text-white">
        จัดการหมวดหมู่
      </h1>
      <CourseManager
        bookId={bookId}
        accessToken={accessToken}
        onListChange={(newList: Course[]) => {
          setCourses(newList);
        }}
      />

      {/* selector ให้แอดมินเลือกคอร์สก่อน */}
      <h1 className="pl-4 mb-4 text-lg text-gray-800 border-l-4 border-orange-500 sm:text-xl dark:text-white">
        จัดการหมวดหมู่ย่อย
      </h1>

      <div className="p-4 overflow-hidden bg-white border border-gray-100 shadow rounded-xl">
        {courses.length > 0 && (
          <div className="">
            <label className="block mb-2 text-base font-medium text-gray-800 sm:text-lg ">
              เลือกหมวดหมู่
            </label>
            <select
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={selectedCourseId ?? undefined}
              onChange={(e) =>
                setSelectedCourseId(parseInt(e.target.value, 10))
              }
            >
              {courses
                .slice()
                .sort((a, b) =>
                  a.name.localeCompare(b.name, undefined, { numeric: true }),
                )
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* เมื่อมี selectedCourseId แล้ว จึง render SubCourseManager */}
        {selectedCourseId && (
          <SubCourseManager
            courseId={selectedCourseId}
            accessToken={accessToken}
          />
        )}
      </div>
    </div>
  );
}
