"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import Swal from "sweetalert2";

interface FieldConfig {
  id: number;
  label: string;
  type: "TEXT" | "NUMBER" | "DATE" | "SELECT" | "TEXTAREA";
  required: boolean;
  options?: string[];
}

interface SubCourseOption {
  value: string;
  label: string;
  isSubjectFreeform?: boolean; // <-- เพิ่ม Flag
}

// สร้าง Interface สำหรับ state 'summary' เพื่อความชัดเจน
interface SummaryData {
  approverRole: string;
  approverName: string;
  course: string;
  subCourse: string;
  subject?: string; // <-- เพิ่ม subject เป็น optional property
  fieldValues: { label: string; value: string }[];
}

type Option = {
  value: string;
  label: string;
};

export default function ExperienceForm({
  bookId,
  studentId,
  accessToken,
}: {
  bookId: number;
  studentId: number; // ✅ เพิ่ม type ตรงนี้
  accessToken: string;
}) {
  const router = useRouter();
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  // --- Step state ---
  const [step, setStep] = useState<1 | 2>(1);

  // --- Step1 states ---
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [values, setValues] = useState<Record<number, string>>({});
  const [courses, setCourses] = useState<Option[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Option | null>(null);
  const [subCourses, setSubCourses] = useState<SubCourseOption[]>([]);
  const [selectedSubCourse, setSelectedSubCourse] =
    useState<SubCourseOption | null>(null);

  // [เพิ่ม] State สำหรับเก็บค่า subject ที่นิสิตกรอก
  const [freeformSubject, setFreeformSubject] = useState("");

  const approverRoleOptions: Option[] = [
    { value: "APPROVER_IN", label: "ผู้นิเทศก์ภายใน" },
    { value: "APPROVER_OUT", label: "ผู้นิเทศก์ภายนอก" },
  ];
  const [selectedApproverRole, setSelectedApproverRole] =
    useState<Option | null>(null);
  const [approverOptions, setApproverOptions] = useState<Option[]>([]);
  const [selectedApproverName, setSelectedApproverName] =
    useState<Option | null>(null);

  // --- Summary data (Step2) ---
  const [summary, setSummary] = useState<SummaryData | null>(null);

  // --- Prevent double submit ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Load field config
  useEffect(() => {
    axios
      .get<FieldConfig[]>(
        `${BASE}/experience-books/${bookId}/fields`,
        authHeader,
      )
      .then((r) => setFields(r.data))
      .catch(() => Swal.fire("Error", "ไม่สามารถโหลดฟิลด์ได้", "error"));
  }, [BASE, bookId, accessToken]);

  // 2. Load courses
  useEffect(() => {
    axios
      .get<{ id: number; name: string }[]>(
        `${BASE}/experience-books/${bookId}/courses`,
        authHeader,
      )
      .then((r) =>
        setCourses(
          r.data
            .sort((a, b) =>
              a.name.localeCompare(b.name, "th", { numeric: true }),
            )
            .map((c) => ({ value: c.id.toString(), label: c.name })),
        ),
      )
      .catch(() => Swal.fire("Error", "โหลดคอร์สไม่สำเร็จ", "error"));
  }, [BASE, bookId, accessToken]);

  // 3. Load subCourses
  useEffect(() => {
    setSelectedSubCourse(null);
    setFreeformSubject(""); // <-- รีเซ็ตค่าที่กรอก
    if (!selectedCourse) {
      setSubCourses([]);
      return;
    }
    axios
      .get<{ id: number; name: string; isSubjectFreeform: boolean }[]>(
        `${BASE}/courses/${selectedCourse.value}/subcourses`,
        authHeader,
      )
      .then((r) =>
        setSubCourses(
          r.data
            .sort((a, b) => a.name.localeCompare(b.name, "th")) // <-- เพิ่มตรงนี้
            .map((s) => ({
              value: s.id.toString(),
              label: s.name,
              isSubjectFreeform: s.isSubjectFreeform,
            })),
        ),
      )
      .catch(() => Swal.fire("Error", "โหลดหัวข้อย่อยไม่สำเร็จ", "error"));
  }, [selectedCourse, BASE, accessToken]);

  // 4. Load approvers by role
  useEffect(() => {
    setSelectedApproverName(null);
    if (!selectedApproverRole) {
      setApproverOptions([]);
      return;
    }
    axios
      .get<{ id: string; approverName: string }[]>(
        `${BASE}/approvers/by-role/${selectedApproverRole.value}`,
        authHeader,
      )
      .then((r) => {
        setApproverOptions(
          r.data.map((a) => ({ value: a.id, label: a.approverName })),
        );
      })
      .catch((err) => {
        Swal.fire(
          "Error",
          err.response?.status === 401
            ? "กรุณาเข้าสู่ระบบอีกครั้ง"
            : "โหลดรายชื่อไม่สำเร็จ",
          "error",
        ).then(() => err.response?.status === 401 && router.push("/"));
      });
  }, [selectedApproverRole, BASE, accessToken]);

  // เก็บค่า fields
  const handleChange = (fieldId: number, v: string) =>
    setValues((prev) => ({ ...prev, [fieldId]: v }));

  // Step1: เตรียม summary และไป Step2
  const goToSummary = (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    // validations
    if (!selectedApproverRole)
      return Swal.fire("Warning", "กรุณาเลือกประเภทผู้อนุมัติก่อน", "warning");
    if (!selectedApproverName)
      return Swal.fire("Warning", "กรุณาเลือกชื่อผู้อนุมัติก่อน", "warning");
    if (!selectedCourse)
      return Swal.fire("Warning", "กรุณาเลือกหมวดหมู่ก่อน", "warning");

    // build summary
    const fieldValues = fields.map((f) => ({
      label: f.label,
      value: values[f.id] || "-",
    }));

    const summaryData: SummaryData = {
      approverRole: selectedApproverRole!.label,
      approverName: selectedApproverName!.label,
      course: selectedCourse!.label,
      subCourse: selectedSubCourse?.label || "-",
      fieldValues,
    };

    // ตรวจสอบว่าถ้าเป็น subcourse แบบกรอกเอง ให้เพิ่มข้อมูล subject เข้าไปด้วย
    if (selectedSubCourse?.isSubjectFreeform) {
      summaryData.subject = freeformSubject.trim() || "";
    }

    setSummary(summaryData);
    setStep(2);
  };

  // ฟังก์ชันช่วย POST ข้อมูล
  const postExperience = async () => {
    if (!summary) return;
    const payload = {
      bookId,
      studentId,
      approverRole: selectedApproverRole!.value,
      approverName: selectedApproverName!.label,
      course: summary.course,
      subCourse: summary.subCourse,
      subCourseId: Number(selectedSubCourse?.value), // ✅ เพิ่มตรงนี้
      // ส่งค่า subject ที่กรอกเองไปด้วย ถ้ามี
      subject: selectedSubCourse?.isSubjectFreeform
        ? freeformSubject.trim() || null
        : null,
      fieldValues: fields.map((f) => ({
        fieldId: f.id,
        value: values[f.id] || "",
      })),
    };
    await axios.post(`${BASE}/student-experiences`, payload, authHeader);
  };

  // Step2: เสร็จสิ้น → POST แล้วกลับ /student/books
  const finalize = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    // แสดง Loader โดยไม่ await
    Swal.fire({
      title: "กำลังบันทึก...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      await postExperience();
      Swal.close();
      await Swal.fire("สำเร็จ", "บันทึกเรียบร้อย 🎉", "success");
      window.location.href = "/student/books";
    } catch {
      Swal.close();
      Swal.fire("Error", "เกิดข้อผิดพลาด ไม่สามารถบันทึกได้", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step2: ยกเลิก (ไม่บันทึก)
  const cancelAll = () => {
    if (isSubmitting) return;
    Swal.fire({
      title: "ยืนยันยกเลิก?",
      text: "ข้อมูลที่กรอกจะไม่ถูกบันทึก",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่ ยกเลิก",
      cancelButtonText: "ไม่ใช่",
    }).then((res) => {
      if (res.isConfirmed) {
        window.location.href = "/student/books";
      }
    });
  };

  // Step2: เพิ่มรายการบันทึก → POST แล้วรีเซ็ตฟอร์ม ย้อนกลับไป Step1
  const resetAndNew = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    Swal.fire({
      title: "กำลังบันทึกรายการใหม่...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      await postExperience();
      Swal.close();
      await Swal.fire("สำเร็จ", "บันทึกรายการเรียบร้อย 🎉", "success");
      // รีเซ็ตทุก state กลับค่าเริ่มต้น
      setValues({});
      setSelectedApproverRole(null);
      setSelectedApproverName(null);
      setSelectedCourse(null);
      setSelectedSubCourse(null);
      setSummary(null);
      setStep(1);
    } catch {
      Swal.close();
      Swal.fire(
        "Error",
        "เกิดข้อผิดพลาด ไม่สามารถบันทึกรายการใหม่ได้",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return step === 1 ? (
    <form
      onSubmit={goToSummary}
      className="p-6 space-y-6 bg-white dark:bg-[#1E293B] dark:text-white rounded-xl shadow text-gray-800"
    >
      {/* Course */}
      <div>
        <label className="block mb-1 font-medium">หมวดหมู่</label>
        <Select
          instanceId="course-select"
          options={courses}
          value={selectedCourse}
          onChange={(opt) => setSelectedCourse(opt as Option)}
          placeholder="เลือกหมวดหมู่..."
          className="dark:text-gray-800 "
        />
      </div>

      {/* Sub-course */}
      <div>
        <label className="block mb-1 font-medium">หมวดหมู่ย่อย</label>
        <Select
          instanceId="subcourse-select"
          options={subCourses}
          value={selectedSubCourse}
          onChange={(opt) => setSelectedSubCourse(opt as SubCourseOption)}
          isDisabled={!selectedCourse}
          placeholder="เลือกหมวดหมู่ย่อย..."
          className="dark:text-gray-800 "
        />
      </div>

      {/* แสดงช่องกรอก Subject แบบมีเงื่อนไข */}
      {selectedSubCourse && selectedSubCourse.isSubjectFreeform && (
        <div className="flex flex-col">
          <label className="block mb-1 font-medium">
            ในวิชา (กรอกหรือไม่กรอกก็ได้)
          </label>
          <input
            type="text"
            value={freeformSubject}
            onChange={(e) => setFreeformSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded hover:border-gray-400 dark:bg-white dark:text-gray-800"
          />
        </div>
      )}

      {/* Dynamic Fields */}
      {fields.map((f) => (
        <div key={f.id} className="flex flex-col ">
          <label className="mb-1 font-medium ">
            {f.label}
            {f.required && <span className="text-red-500">*</span>}
          </label>
          {f.type === "TEXT" && (
            <input
              type="text"
              required={f.required}
              value={values[f.id] || ""}
              onChange={(e) => handleChange(f.id, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded hover:border-gray-400 dark:bg-white dark:text-gray-800"
            />
          )}
          {f.type === "NUMBER" && (
            <input
              type="number"
              required={f.required}
              value={values[f.id] || ""}
              onChange={(e) => handleChange(f.id, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded hover:border-gray-400 dark:bg-white dark:text-gray-800"
            />
          )}
          {f.type === "DATE" && (
            <input
              type="date"
              required={f.required}
              value={values[f.id] || ""}
              onChange={(e) => handleChange(f.id, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded hover:border-gray-400 dark:bg-white dark:text-gray-800 "
            />
          )}
          {f.type === "TEXTAREA" && (
            <textarea
              required={f.required}
              value={values[f.id] || ""}
              onChange={(e) => handleChange(f.id, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded hover:border-gray-400 dark:bg-white dark:text-gray-800"
            />
          )}
          {f.type === "SELECT" && (
            <Select
              // ให้แต่ละฟิลด์มี instanceId เพื่อ accessibility
              instanceId={`field-${f.id}`}
              // สร้าง options จาก f.options:string[]
              options={
                f.options?.map((opt) => ({ value: opt, label: opt })) || []
              }
              // ค่าที่เลือกอยู่
              value={
                f.options
                  ? {
                      value: values[f.id] || "",
                      label: values[f.id] || "-- เลือก --",
                    }
                  : null
              }
              // ถ้าฟิลด์จำเป็นต้องกรอก ก็ให้ disable ตอนที่ยังไม่มี value
              isClearable={!f.required}
              // ป้องกันไม่ให้เลือกค่าว่างในกรณี required
              isDisabled={false}
              onChange={(opt) => {
                // opt อาจจะ null ได้ถ้า clearable
                const v = opt ? (opt as { value: string }).value : "";
                handleChange(f.id, v);
              }}
              placeholder="-- เลือก --"
              className="react-select-container dark:text-gray-800"
              classNamePrefix="react-select"
            />
          )}
        </div>
      ))}

      {/* Approver Role */}
      <div>
        <label className="block mb-1 font-medium">ประเภทผู้อนุมัติ</label>
        <Select
          instanceId="approver-role-select"
          options={approverRoleOptions}
          value={selectedApproverRole}
          onChange={(opt) => setSelectedApproverRole(opt as Option)}
          placeholder="เลือกประเภทผู้อนุมัติ..."
          className="dark:text-gray-800 "
        />
      </div>

      {/* Approver Name */}
      <div>
        <label className="block mb-1 font-medium">ชื่อผู้อนุมัติ</label>
        <Select
          instanceId="approver-name-select"
          options={approverOptions}
          value={selectedApproverName}
          onChange={(opt) => setSelectedApproverName(opt as Option)}
          isDisabled={!selectedApproverRole}
          placeholder="เลือกชื่อผู้อนุมัติ..."
          className="dark:text-gray-800 "
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 text-white transition-colors bg-blue-600 rounded disabled:opacity-50 hover:bg-blue-700"
      >
        {isSubmitting ? "กำลังประมวลผล..." : "บันทึกประสบการณ์"}
      </button>
    </form>
  ) : (
    <div className="p-6 space-y-4 bg-white dark:bg-[#1E293B] rounded-xl shadow dark:text-white ">
      <h2 className="text-xl font-semibold text-[#f46b45]">
        สรุปข้อมูลการบันทึก
      </h2>
      <ul className="space-y-2 text-gray-800 dark:text-white">
        <li>
          <strong>หมวดหมู่:</strong> {summary?.course}
        </li>
        <li>
          <strong>หมวดหมู่ย่อย:</strong> {summary?.subCourse}
        </li>
        {summary?.subject !== undefined && (
          <li>
            <strong>ในวิชา:</strong> {summary.subject || ""}
          </li>
        )}
        {summary?.fieldValues.map((fv, i) => (
          <li key={i}>
            <strong>{fv.label}:</strong> {fv.value}
          </li>
        ))}
        <li>
          <strong>ประเภทผู้อนุมัติ:</strong> {summary?.approverRole}
        </li>
        <li>
          <strong>ชื่อผู้อนุมัติ:</strong> {summary?.approverName}
        </li>
      </ul>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={finalize}
          disabled={isSubmitting}
          className="py-2 text-white bg-green-600 rounded disabled:opacity-50 hover:bg-green-700"
        >
          {isSubmitting ? "กำลังบันทึก..." : "เสร็จสิ้น"}
        </button>
        <button
          onClick={() => setStep(1)}
          disabled={isSubmitting}
          className="py-2 text-white bg-yellow-500 rounded disabled:opacity-50 hover:bg-yellow-600"
        >
          แก้ไข
        </button>
        <button
          onClick={resetAndNew}
          disabled={isSubmitting}
          className="py-2 text-white bg-blue-500 rounded disabled:opacity-50 hover:bg-blue-600"
        >
          {isSubmitting ? "กำลังบันทึกรายการ..." : "เพิ่มรายการบันทึก"}
        </button>
        <button
          onClick={cancelAll}
          disabled={isSubmitting}
          className="py-2 text-white bg-red-600 rounded disabled:opacity-50 hover:bg-red-700"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
