"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import Swal from "sweetalert2";
import { CiMenuKebab } from "react-icons/ci";
import withReactContent from "sweetalert2-react-content";
import { FaCheck } from "react-icons/fa";

const MySwal = withReactContent(Swal);

// 1. สร้าง type ใหม่สำหรับ SubCourseOption (เก็บ subject และ alwaycourse ได้)
type SubCourseOption = {
  value: string; // id ของ subCourse (เป็น string)
  label: string; // ชื่อ subCourse
  subject: number; // ค่า subject
  alwaycourse: number; // ค่า alwaycourse
};

interface Book {
  id: number;
  title: string;
}

interface FieldConfig {
  id: number;
  label: string;
  type: "TEXT" | "NUMBER" | "DATE" | "SELECT" | "TEXTAREA";
  required: boolean;
  options?: string[]; // สำหรับ SELECT
}

interface FieldValue {
  fieldId?: number;
  field?: { label: string };
  value: string;
}

interface Experience {
  id: number;
  bookId: number;
  course: string;
  subCourse: string;
  approverRole: "APPROVER_IN" | "APPROVER_OUT";
  approverName: string;
  status: "PENDING" | "CONFIRMED" | "CANCEL";
  createdAt: string;
  fieldValues: FieldValue[];
}

interface Paginated<T> {
  data: T[];
  total: number;
}

type Option = { value: string; label: string };

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

export default function RecordTable({ accessToken }: { accessToken: string }) {
  /** ---------- state ---------- */
  const [books, setBooks] = useState<Book[]>([]);
  const [bookFilter, setBookFilter] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "CONFIRMED" | "CANCEL"
  >("ALL");
  const [limit, setLimit] = useState(5);
  const [sortBy, setSortBy] = useState<
    "" | "date-desc" | "date-asc" | "course-asc" | "status-asc"
  >("");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<Experience[]>([]);
  const [total, setTotal] = useState(0); // เก็บจำนวนหลัง filter
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  /** editing state */
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editCourse, setEditCourse] = useState<Option | null>(null);
  const [editSubCourse, setEditSubCourse] = useState<SubCourseOption | null>(
    null,
  );
  const [editApproverType, setEditApproverType] = useState<Option | null>(null);
  const [editApproverName, setEditApproverName] = useState<Option | null>(null);
  const [editFieldValues, setEditFieldValues] = useState<FieldValue[]>([]);

  /** options for editing */
  const [courses, setCourses] = useState<Option[]>([]);
  const [subCourses, setSubCourses] = useState<SubCourseOption[]>([]);
  const [approverOptions, setApproverOptions] = useState<Option[]>([]);

  const approverTypeOptions: Option[] = [
    { value: "APPROVER_IN", label: "อาจารย์ภายใน" },
    { value: "APPROVER_OUT", label: "อาจารย์ภายนอก" },
  ];

  /** ---------- axios helper ---------- */
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  // new for confirm-pin
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // single confirm
  const handleConfirm = async (rec: Experience) => {
    // require same approverName check  ให้แน่ใจว่า rec.approverName ตรงกับ backend
    const pinRes = await MySwal.fire({
      title: `กรุณากรอก PIN`,
      text: `PIN สำหรับ ${rec.approverName}`,
      input: "password",
      inputAttributes: {
        autocapitalize: "off",
      },
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      inputValidator: (value) => {
        if (!value || !/^\d{6,}$/.test(value)) {
          return "PIN ต้องเป็นตัวเลขอย่างน้อย 6 ตัว!";
        }
      },
    });
    if (!pinRes.isConfirmed || !pinRes.value) return;
    try {
      // เรียก API ใหม่ student-experiences/:id/confirm
      await axios.post(
        `${BASE}/student-experiences/${rec.id}/confirm-by-approver`,
        { approverName: rec.approverName, pin: pinRes.value },
        authHeader,
      );

      Swal.fire("สำเร็จ", "ยืนยันแล้ว", "success");
      // reload only this record
      setRecords((rs) =>
        rs.map((r) => (r.id === rec.id ? { ...r, status: "CONFIRMED" } : r)),
      );
    } catch (e: any) {
      const msg = e.response?.data?.message || "เกิดข้อผิดพลาด";
      Swal.fire(
        msg.includes("PIN") ? "warning" : "error",
        msg,
        msg.includes("PIN") ? "warning" : "error",
      );
    }
  };

  // bulk confirm
  const handleBulkConfirm = async () => {
    if (selectedIds.length === 0) return;
    // must all same approverName
    const names = new Set(
      records
        .filter((r) => selectedIds.includes(r.id))
        .map((r) => r.approverName),
    );
    if (names.size > 1) {
      return Swal.fire(
        "Warning",
        "กรุณาเลือกรายการที่มีผู้นิเทศคนเดียวกัน",
        "warning",
      );
    }

    // ถอดเอาชื่อ approver คนแรกออกมา
    const [firstApproverName] = Array.from(names);
    if (!firstApproverName) return;

    const pinRes = await MySwal.fire({
      title: `กรุณากรอก PIN`,
      text: `PIN สำหรับ ${firstApproverName}`,
      input: "password",
      showCancelButton: true,
      confirmButtonText: "ยืนยันทั้งหมด",
      inputValidator: (value) => {
        if (!value || !/^\d{6,}$/.test(value)) {
          return "PIN ต้องเป็นตัวเลขอย่างน้อย 6 ตัว!";
        }
      },
    });
    if (!pinRes.isConfirmed || !pinRes.value) return;
    try {
      // ถ้ามี API bulk ใน student-experiences ก็เปลี่ยนเป็น:
      await axios.post(
        `${BASE}/student-experiences/bulk-confirm-by-approver`,
        {
          approverName: firstApproverName,
          pin: pinRes.value,
          // Prisma DTO ต้องการ string[] – map ให้เป็น string
          ids: selectedIds.map((i) => i.toString()),
        },
        authHeader,
      );

      Swal.fire("สำเร็จ", "ยืนยันทั้งหมดแล้ว", "success");
      setRecords((rs) =>
        rs.map((r) =>
          selectedIds.includes(r.id) ? { ...r, status: "CONFIRMED" } : r,
        ),
      );
      setSelectedIds([]);
    } catch (e: any) {
      const msg = e.response?.data?.message || "เกิดข้อผิดพลาด";
      Swal.fire(
        msg.includes("PIN") ? "warning" : "error",
        msg,
        msg.includes("PIN") ? "warning" : "error",
      );
    }
  };

  /** 1. โหลดสมุดที่นิสิตมีสิทธิ์ */
  useEffect(() => {
    axios
      .get<Book[]>(`${BASE}/experience-books/authorized`, authHeader)
      .then((r) => setBooks(r.data))
      .catch(() => Swal.fire("Error", "โหลดสมุดไม่ได้", "error"));
  }, [BASE, accessToken]);

  /** 2. โหลด field config ของสมุด */
  // useEffect ด้านใน RecordTable
  useEffect(() => {
    if (!bookFilter) {
      setFieldConfigs([]);
      return;
    }
    axios
      .get<FieldConfig[]>(
        `${BASE}/experience-books/${bookFilter}/fields`,
        authHeader,
      )
      .then((r) => setFieldConfigs(r.data))
      .catch(() => Swal.fire("Error", "โหลดฟิลด์ไม่สำเร็จ", "error"));
  }, [bookFilter, BASE, accessToken]);

  /** 3. โหลดรายการ + client-side search/status */
  useEffect(() => {
    if (!bookFilter) {
      setRecords([]);
      setTotal(0);
      return;
    }
    // แยก sb, so เฉพาะเมื่อมี value
    let sb: string | undefined, so: string | undefined;
    if (sortBy) {
      // ตรวจสอบว่า sortBy มีค่าก่อน split
      [sb, so] = sortBy.split("-");
    }

    const params: any = {
      page,
      limit,
      bookId: bookFilter,
      ...(sb && so && { sortBy: sb === "date" ? "createdAt" : sb, order: so }),
      ...((search || "").trim() && { search: (search || "").trim() }),
      ...(statusFilter !== "ALL" && { status: statusFilter }), // <--- ตรงนี้คือการส่ง status filter
    };

    axios
      .get<Paginated<Experience>>(`${BASE}/student-experiences`, {
        ...authHeader,
        params,
      })
      .then((r) => {
        // ใช้ total จาก server ที่กรองมาแล้ว
        setTotal(r.data.total);
        // เอาข้อมูลหน้าปัจจุบันมาแสดง โดยไม่กรองซ้ำ
        setRecords(r.data.data);
      })
      .catch(() => Swal.fire("Error", "โหลดรายการไม่ได้", "error"));
  }, [
    bookFilter,
    statusFilter,
    sortBy,
    page,
    limit,
    search,
    BASE,
    accessToken,
  ]);

  /** 4. โหลด courses เมื่อเปลี่ยนสมุด (ใช้ใน modal) */
  useEffect(() => {
    if (!bookFilter) {
      setCourses([]);
      return;
    }
    axios
      .get<{ id: number; name: string }[]>(
        `${BASE}/experience-books/${bookFilter}/courses`,
        authHeader,
      )
      .then((r) =>
        setCourses(
          r.data.map((c) => ({ value: c.id.toString(), label: c.name })),
        ),
      )
      .catch(() => {});
  }, [bookFilter, BASE, accessToken]);

  /** 5. โหลด subcourses เมื่อเปลี่ยน course */
  useEffect(() => {
    setEditSubCourse(null);
    if (!editCourse) {
      setSubCourses([]);
      return;
    }

    axios
      .get<
        {
          id: number;
          name: string;
          subject: number | null;
          alwaycourse: number | null;
        }[]
      >(`${BASE}/courses/${editCourse.value}/subcourses`, authHeader)
      .then((r) => {
        const scOpts: SubCourseOption[] = r.data.map((s) => ({
          value: s.id.toString(),
          label: s.name,
          subject: s.subject ?? 0,
          alwaycourse: s.alwaycourse ?? 0,
        }));
        setSubCourses(scOpts);
      })
      .catch(() => {
        setSubCourses([]);
      });
  }, [editCourse, BASE, accessToken]);

  /** 6. โหลด approvers เมื่อเปลี่ยน approverType */
  useEffect(() => {
    setEditApproverName(null);
    if (!editApproverType) {
      setApproverOptions([]);
      return;
    }
    axios
      .get<{ id: string; approverName: string }[]>(
        `${BASE}/approvers/by-role/${editApproverType.value}`,
        authHeader,
      )
      .then((r) =>
        setApproverOptions(
          r.data.map((a) => ({ value: a.id, label: a.approverName })),
        ),
      )
      .catch(() => {});
  }, [editApproverType, BASE, accessToken]);

  /* ---------- action handlers ---------- */

  /** เปิด modal แก้ไข พร้อม preload ค่า */
  const onEdit = (rec: Experience) => {
    setEditId(rec.id);
    // course
    const foundCourse = courses.find((c) => c.label === rec.course);
    setEditCourse(foundCourse || null);
    // subCourse (จะ load ใน useEffect ข้างบน)
    // รอ subCourses โหลดเสร็จ → match label
    setTimeout(() => {
      const foundSub = subCourses.find((s) => s.label === rec.subCourse);
      setEditSubCourse(foundSub || null);
    }, 0);
    // approverType + approverName
    const aproTypeOption = approverTypeOptions.find(
      (o) => o.value === rec.approverRole,
    )!;
    setEditApproverType(aproTypeOption);
    // จะโหลด approverOptions จาก useEffect ข้างบน → จากนั้น match name
    setTimeout(() => {
      const foundApr = approverOptions.find(
        (a) => a.label === rec.approverName,
      );
      setEditApproverName(
        foundApr || { value: rec.approverName, label: rec.approverName },
      );
    }, 0);
    // fieldValues
    setEditFieldValues(
      rec.fieldValues.map((fv) => ({
        fieldId: fv.fieldId,
        value: fv.value,
      })),
    );
    setIsEditing(true);
    setOpenMenuId(null);
  };

  /** บันทึกการแก้ไข */
  const onSaveEdit = () => {
    if (!editId) return;

    // --- validation: ต้องกรอก 4 ฟิลด์นี้ให้ครบ ---
    if (!editCourse) {
      Swal.fire("Error", "กรุณาเลือกหมวดหมู่", "warning");
      return;
    }
    if (!editSubCourse) {
      Swal.fire("Error", "กรุณาเลือกหมวดหมู่ย่อย", "warning");
      return;
    }
    if (!editApproverType) {
      Swal.fire("Error", "กรุณาเลือกประเภทผู้นิเทศก์", "warning");
      return;
    }
    if (!editApproverName) {
      Swal.fire("Error", "กรุณาเลือกผู้นิเทศก์", "warning");
      return;
    }

    const payload = {
      course: editCourse?.label || "",
      subCourse: editSubCourse?.label || "",
      subject: editSubCourse.subject,
      alwaycourse: editSubCourse.alwaycourse,
      approverRole: editApproverType?.value || "",
      approverName: editApproverName?.label || "",
      fieldValues: editFieldValues,
    };
    axios
      .patch<Experience>(
        `${BASE}/student-experiences/${editId}`,
        payload,
        authHeader,
      )
      .then((r) => {
        Swal.fire("สำเร็จ", "บันทึกการแก้ไขแล้ว", "success");
        setRecords((prev) =>
          prev.map((rec) =>
            rec.id === r.data.id ? { ...rec, ...r.data } : rec,
          ),
        );
        setIsEditing(false);
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "บันทึกไม่สำเร็จ";
        Swal.fire("Error", msg, "error");
      });
  };

  /** ยกเลิกรายการ */
  const onCancel = (id: number) => {
    Swal.fire({
      title: "ยกเลิกรายการ?",
      text: "คุณแน่ใจว่าต้องการยกเลิกรายการนี้หรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    }).then((res) => {
      if (!res.isConfirmed) return;
      axios
        .delete(`${BASE}/student-experiences/${id}`, authHeader)
        .then(() => {
          Swal.fire("ยกเลิกแล้ว", "รายการถูกยกเลิกเรียบร้อย", "success");
          setOpenMenuId(null);
          setRecords((prev) => prev.filter((r) => r.id !== id));
          setTotal((prev) => prev - 1);
        })
        .catch((err) => {
          Swal.fire(
            "Error",
            err.response?.data?.message || "ยกเลิกไม่สำเร็จ",
            "error",
          );
        });
    });
  };

  /** ลบรายการ */
  const onDelete = (id: number) => {
    Swal.fire({
      title: "ลบรายการนี้?",
      text: "ลบแล้วไม่สามารถกู้คืนได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    }).then((res) => {
      if (!res.isConfirmed) return;
      axios
        .delete(`${BASE}/student-experiences/${id}`, authHeader)
        .then(() => {
          Swal.fire("ลบแล้ว", "รายการถูกลบเรียบร้อย", "success");
          setRecords((prev) => prev.filter((r) => r.id !== id));
          setTotal((prev) => prev - 1);
        })
        .catch((err) => {
          Swal.fire(
            "Error",
            err.response?.data?.message || "ลบไม่สำเร็จ",
            "error",
          );
        });
    });
  };

  const totalPages = Math.ceil(total / limit);

  //padding เลขหน้า
  function getPageNumbers(current: number, total: number, delta = 2) {
    const range: (number | "...")[] = [];
    let l = 0;
    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        if (l + 1 !== i) {
          range.push("...");
        }
        range.push(i);
        l = i;
      }
    }
    return range;
  }

  return (
    <div className="">
      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-80 backdrop-blur-sm">
          {" "}
          {/* เพิ่ม p-4 เพื่อให้มีระยะห่างรอบ modal บนมือถือ */}
          <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-lg sm:p-6">
            {" "}
            {/* เปลี่ยน max-w-lg เป็น max-w-md และปรับ padding */}
            <h2 className="mb-4 text-lg font-semibold text-center sm:text-xl">
              แก้ไขรายการ
            </h2>{" "}
            {/* ลดขนาด font เล็กน้อยบนมือถือ */}
            {/* เลือก Course */}
            <div className="mb-4">
              <label
                htmlFor="editCourse"
                className="block mb-1 text-sm font-medium"
              >
                หมวดหมู่
              </label>{" "}
              {/* เพิ่ม htmlFor */}
              <Select
                id="editCourse" // เพิ่ม id ให้สอดคล้องกับ htmlFor
                options={courses}
                value={editCourse}
                onChange={(opt) => setEditCourse(opt as Option)}
                placeholder="เลือกหมวดหมู่..."
              />
            </div>
            {/* เลือก SubCourse */}
            <div className="mb-4">
              <label
                htmlFor="editSubCourse"
                className="block mb-1 text-sm font-medium"
              >
                หมวดหมู่ย่อย
              </label>
              <Select
                id="editSubCourse"
                options={subCourses}
                value={editSubCourse}
                onChange={(opt) =>
                  setEditSubCourse(opt as SubCourseOption | null)
                }
                placeholder="เลือกหมวดหมู่ย่อย..."
                isDisabled={!editCourse}
              />
            </div>
            {/* เลือก ApproverType */}
            <div className="mb-4">
              <label
                htmlFor="editApproverType"
                className="block mb-1 text-sm font-medium"
              >
                ประเภทผู้นิเทศก์
              </label>
              <Select
                id="editApproverType"
                options={approverTypeOptions}
                value={editApproverType}
                onChange={(opt) => setEditApproverType(opt as Option)}
                placeholder="เลือกภายใน/ภายนอก..."
                // className="text-sm"
              />
            </div>
            {/* เลือก ApproverName */}
            <div className="mb-4">
              <label
                htmlFor="editApproverName"
                className="block mb-1 text-sm font-medium"
              >
                ผู้นิเทศก์
              </label>
              <Select
                id="editApproverName"
                options={approverOptions}
                value={editApproverName}
                onChange={(opt) => setEditApproverName(opt as Option)}
                placeholder="เลือกผู้นิเทศก์..."
                isDisabled={!editApproverType}
                // className="text-sm"
              />
            </div>
            {/* แก้ไข FieldValues */}
            {fieldConfigs.map((cfg) => {
              const fv = editFieldValues.find((x) => x.fieldId === cfg.id);
              return (
                <div key={cfg.id} className="mb-4">
                  <label
                    htmlFor={`field-${cfg.id}`}
                    className="block mb-1 text-sm font-medium"
                  >
                    {cfg.label}
                    {cfg.required && <span className="text-red-500">*</span>}
                  </label>

                  {cfg.type === "SELECT" ? (
                    <Select
                      instanceId={`field-${cfg.id}`}
                      options={
                        cfg.options?.map((opt) => ({
                          value: opt,
                          label: opt,
                        })) || []
                      }
                      value={
                        cfg.options
                          ? {
                              value: fv?.value || "",
                              label: fv?.value || "-- เลือก --",
                            }
                          : null
                      }
                      isClearable={!cfg.required}
                      onChange={(opt) => {
                        const v = opt ? (opt as { value: string }).value : "";
                        setEditFieldValues((prev) =>
                          prev.map((x) =>
                            x.fieldId === cfg.id ? { ...x, value: v } : x,
                          ),
                        );
                      }}
                      placeholder="-- เลือก --"
                      className="react-select-container "
                      classNamePrefix="react-select"
                    />
                  ) : (
                    <input
                      id={`field-${cfg.id}`}
                      type={
                        cfg.type === "NUMBER"
                          ? "number"
                          : cfg.type === "DATE"
                            ? "date"
                            : "text"
                      }
                      required={cfg.required}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded hover:border-gray-400"
                      value={fv?.value || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditFieldValues((prev) =>
                          prev.map((x) =>
                            x.fieldId === cfg.id ? { ...x, value: val } : x,
                          ),
                        );
                      }}
                    />
                  )}
                </div>
              );
            })}
            {/* ปุ่มบันทึก/ยกเลิก */}
            {/* ปรับให้ปุ่ม stack กันบนมือถือ และเรียงแนวนอนบนจอใหญ่ขึ้น */}
            <div className="flex flex-col mt-6 space-y-3 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-3">
              <button
                className={`w-full sm:w-auto px-4 py-2 rounded text-sm ${
                  !editCourse ||
                  !editSubCourse ||
                  !editApproverType ||
                  !editApproverName
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
                onClick={onSaveEdit}
                disabled={
                  !editCourse ||
                  !editSubCourse ||
                  !editApproverType ||
                  !editApproverName
                }
              >
                บันทึก
              </button>
              <button
                className="w-full px-4 py-2 text-sm text-white bg-gray-400 rounded sm:w-auto hover:bg-gray-600" // w-full บนมือถือ, w-auto บน sm ขึ้นไป
                onClick={() => setIsEditing(false)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
        {/* Header */}

        <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 ">
          <h1 className="text-xl font-semibold sm:text-2xl">
            ตรวจสอบรายการบันทึก
          </h1>
        </div>

        {/* Filter */}
        <div className="p-6 mb-6 bg-white shadow rounded-xl dark:bg-[#1E293B] dark:text-white text-gray-800">
          <div className="flex flex-wrap items-end gap-y-4 gap-x-6">
            {/* Book Filter */}
            <div className="flex flex-col">
              <label htmlFor="bookFilter" className="mb-1 text-sm font-medium">
                สมุด
              </label>
              <select
                id="bookFilter"
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg dark:text-gray-800"
                value={bookFilter ?? ""}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setBookFilter(isNaN(v) ? null : v);
                  setPage(1);
                }}
              >
                <option value="" className="dark:text-black">
                  -- เลือกสมุด --
                </option>
                {books.map((b) => (
                  <option key={b.id} value={b.id} className="dark:text-black">
                    {b.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col">
              <label
                htmlFor="statusFilter"
                className="mb-1 text-sm font-medium"
              >
                สถานะ
              </label>
              <select
                id="statusFilter"
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg dark:text-black"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
              >
                <option value="ALL" className="dark:text-black">
                  ทั้งหมด
                </option>
                <option value="PENDING" className="dark:text-black">
                  รอดำเนินการ
                </option>
                <option value="CONFIRMED" className="dark:text-black">
                  ยืนยันแล้ว
                </option>
                <option value="CANCEL" className="dark:text-black">
                  ปฏิเสธ
                </option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex flex-col">
              <label htmlFor="sortBy" className="mb-1 text-sm font-medium">
                เรียงตาม
              </label>
              <select
                id="sortBy"
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg dark:text-black"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
              >
                <option value="" className="dark:text-black">
                  -- เลือก --
                </option>
                <option value="date-desc" className="dark:text-black">
                  วันที่ (ล่าสุด)
                </option>
                <option value="date-asc" className="dark:text-black">
                  วันที่ (เก่าสุด)
                </option>
                <option value="course-asc" className="dark:text-black">
                  หมวดหมู่
                </option>
                <option value="status-asc" className="dark:text-black">
                  สถานะ
                </option>
              </select>
            </div>

            {/* Search */}
            <div className="flex flex-col flex-grow min-w-[180px]">
              <label htmlFor="search" className="mb-1 text-sm font-medium">
                ค้นหา
              </label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  className="w-full py-2 pl-10 pr-4 bg-white border border-gray-300 rounded-lg dark:text-black"
                  placeholder="ค้นหา…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2
              8a6 6 0 1110.89 3.476l4.817 4.817a1
              1 0 01-1.414 1.414l-4.816-4.816A6 6
              0 012 8z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Limit */}
            <div className="flex items-center">
              <label htmlFor="limit" className="mr-2 text-sm font-medium">
                แสดง:
              </label>
              <select
                id="limit"
                className="px-2 py-1 border border-gray-300 rounded-lg dark:bg-white dark:text-gray-800"
                value={limit}
                onChange={(e) => {
                  setLimit(+e.target.value);
                  setPage(1);
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n} className="dark:text-gray-800">
                    {n}
                  </option>
                ))}
              </select>
              <span className="ml-2 text-sm text-gray-600 dark:text-white">
                รายการ
              </span>
            </div>
          </div>
        </div>

        {/* BulkAction */}
        {selectedIds.length > 0 && (
          <div className="p-6 mb-4  shadow-lg bg-white rounded-xl mt-3 dark:bg-[#1E293B]">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <span className="px-4 py-2 text-sm text-blue-800 bg-blue-100 rounded-full">
                {selectedIds.length} รายการที่เลือก
              </span>
              <button
                onClick={handleBulkConfirm}
                className="flex items-center px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                <FaCheck className="mr-2" /> ยืนยันทั้งหมด ({selectedIds.length}{" "}
                รายการ)
              </button>
            </div>
          </div>
        )}

        {/* Cards */}
        <div className="mt-3 mb-6 space-y-4">
          {bookFilter === null ? (
            <div className="py-10 text-center text-gray-500 dark:text-white">
              กรุณาเลือกสมุดก่อน
            </div>
          ) : records.length === 0 ? (
            <div className="py-10 text-center text-gray-500 dark:text-white">
              ไม่พบรายการ
            </div>
          ) : (
            records.map((rec) => (
              <div
                key={rec.id}
                className={`bg-white dark:bg-[#1E293B] hover:-translate-y-1 hover:shadow-lg   transition-all  dark:text-white rounded-xl shadow border-l-4 overflow-hidden
                       ${rec.status === "PENDING" ? "border-yellow-400" : ""}
                       ${rec.status === "CONFIRMED" ? "border-green-400" : ""}
                       ${rec.status === "CANCEL" ? "border-red-400" : ""}`}
              >
                <div className="p-6">
                  <div className="flex flex-col justify-between md:flex-row">
                    <div className="flex-1">
                      {/* checkbox */}
                      {rec.status === "PENDING" && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(rec.id)}
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedIds((s) => [...s, rec.id]);
                            else
                              setSelectedIds((s) =>
                                s.filter((i) => i !== rec.id),
                              );
                          }}
                          className="mt-1"
                        />
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-blue-600">
                          {rec.course}
                        </h3>
                        <span
                          className={`
                            text-xs px-2 py-1 rounded-full font-medium
                            ${
                              rec.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : ""
                            }
                            ${
                              rec.status === "CONFIRMED"
                                ? "bg-green-100 text-green-800"
                                : ""
                            }
                            ${
                              rec.status === "CANCEL"
                                ? "bg-red-100 text-red-800"
                                : ""
                            }
                          `}
                        >
                          {rec.status === "PENDING"
                            ? "รอดำเนินการ"
                            : rec.status === "CONFIRMED"
                              ? "ยืนยันแล้ว"
                              : "ปฏิเสธ"}
                        </span>
                      </div>
                      <div className="mb-2 font-medium text-blue-600">
                        {rec.subCourse}
                      </div>
                      <div className="grid grid-cols-1 mb-4 text-gray-800 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 dark:text-white">
                        {(rec.fieldValues ?? []).map((fv, i) => {
                          const label =
                            fv.field?.label ??
                            fieldConfigs.find((f) => f.id === fv.fieldId!)
                              ?.label ??
                            "";
                          return (
                            <div key={i}>
                              <span className="text-gray-600 dark:text-gray-300">
                                {label}:
                              </span>
                              <span className="ml-1 font-medium">
                                {fv.value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300">
                        ผู้นิเทศก์:{" "}
                        <span className="font-medium text-blue-600">
                          {rec.approverName}
                        </span>
                      </div>
                      <div className="mt-1 mb-1 text-gray-400">
                        วันที่ส่งข้อมูล:{" "}
                        <span className="">
                          {new Date(rec.createdAt).toLocaleDateString("th")}
                        </span>
                      </div>
                    </div>
                    {/* actions */}
                    <div className="flex items-start mt-4 space-x-2 md:mt-0 md:ml-4">
                      {rec.status === "PENDING" && (
                        <>
                          {/* บนหน้าจอขนาด sm ขึ้นไป: ใช้เมนู kebab */}
                          <div className="relative hidden sm:block">
                            <button
                              className="p-2 rounded-full cursor-pointer hover:bg-gray-100"
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === rec.id ? null : rec.id,
                                )
                              }
                            >
                              <CiMenuKebab className="w-5 h-5 text-gray-600 hover:text-blue-600 dark:text-white" />
                            </button>
                            {openMenuId === rec.id && (
                              <div className="absolute right-0 z-10 w-40 mt-2 bg-white border border-gray-200 rounded shadow-lg ">
                                <button
                                  className="flex items-center w-full px-4 py-2 space-x-2 text-left text-gray-600 cursor-pointer hover:bg-green-50 hover:text-green-600"
                                  onClick={() => handleConfirm(rec)}
                                >
                                  <FaCheck />
                                  <span>ยืนยัน</span>
                                </button>

                                <button
                                  className="flex items-center w-full px-4 py-2 space-x-2 text-left text-gray-600 cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                                  onClick={() => onEdit(rec)}
                                >
                                  <EditIcon />
                                  <span>แก้ไข</span>
                                </button>
                                <button
                                  className="flex items-center w-full px-4 py-2 space-x-2 text-left text-gray-600 cursor-pointer hover:bg-red-50 hover:text-red-600"
                                  onClick={() => onCancel(rec.id)}
                                >
                                  <DeleteIcon />
                                  <span>ยกเลิก</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* บนหน้าจอขนาด < sm: แสดงปุ่มตรงสองปุ่ม */}
                          <div className="flex space-x-2 sm:hidden">
                            <button
                              title="ยืนยัน"
                              className="p-2 text-green-500 transition bg-green-100 rounded-full"
                              onClick={() => handleConfirm(rec)}
                            >
                              <FaCheck />
                            </button>

                            <button
                              title="แก้ไข"
                              className="p-2 text-blue-500 transition bg-blue-100 rounded-full"
                              onClick={() => onEdit(rec)}
                            >
                              <EditIcon />
                            </button>

                            <button
                              title="ยกเลิก"
                              className="p-2 text-red-500 transition bg-red-100 rounded-full"
                              onClick={() => onCancel(rec.id)}
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        </>
                      )}

                      {rec.status === "CANCEL" && (
                        <button
                          className="sm:text-gray-400 text-red-500 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 bg-red-100 sm:bg-white transition-colors"
                          onClick={() => onDelete(rec.id)}
                        >
                          <DeleteIcon />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* {totalPages > 1 && bookFilter !== null && records.length > 0 && ( // เพิ่ม records.length > 0 เพื่อความแน่นอน */}
        {/* Pagination */}
        <div className="flex items-center justify-center pt-4 mt-6 space-x-1 border-t border-gray-200 dark:border-gray-700 sm:space-x-2">
          {/* ปุ่มหน้าแรก */}
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
          >
            หน้าแรก
          </button>

          {/* ปุ่มก่อนหน้า */}
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
          >
            ก่อนหน้า
          </button>

          {/* เลขหน้า */}
          {getPageNumbers(page, totalPages).map((pNo, index) => (
            <div key={index}>
              {pNo === "..." ? (
                <span className="px-2 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 sm:px-3">
                  ...
                </span>
              ) : (
                <button
                  onClick={() => setPage(pNo as number)}
                  className={`
            px-2 sm:px-3 py-1 border text-sm font-medium rounded-lg transition-colors duration-200
            ${
              pNo === page
                ? "bg-blue-600 border-blue-600 text-white shadow-sm hover:bg-blue-700" // Active state for Light mode
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800" // Inactive state for Light mode
            }
            ${
              pNo === page
                ? "dark:bg-blue-700 dark:border-blue-700 dark:text-white dark:hover:bg-blue-800" // Active state for Dark mode
                : "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white" // Inactive state for Dark mode
            }
          `}
                  aria-current={pNo === page ? "page" : undefined}
                >
                  {pNo}
                </button>
              )}
            </div>
          ))}

          {/* ปุ่มถัดไป */}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
          >
            ถัดไป
          </button>

          {/* ปุ่มหน้าสุดท้าย */}
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || totalPages === 0}
            className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
          >
            หน้าสุดท้าย
          </button>
        </div>
      </div>
    </div>
  );
}
