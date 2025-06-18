//frontend\src\app\components\admin\book\FieldManager.tsx
"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  FaCheck,
  FaEdit,
  FaPlus,
  FaRegFileAlt,
  FaRegSave,
  FaTimes,
  FaTrashAlt,
} from "react-icons/fa";
import Swal from "sweetalert2";

interface FieldConfig {
  id: number;
  name: string;
  label: string;
  type: "TEXT" | "NUMBER" | "DATE" | "SELECT" | "TEXTAREA";
  required: boolean;
  order: number;
  options: string[];
}

// <-- [แก้ไข] จุดที่ 1: สร้าง Type สำหรับฟอร์มแก้ไขโดยเฉพาะ
// โดยสืบทอดจาก FieldConfig แต่เปลี่ยนให้ options เป็น string (สำหรับ textarea)
type EditFormState = Omit<FieldConfig, "options"> & {
  options?: string;
};

interface FieldForm {
  name: string;
  label: string;
  type: "TEXT" | "NUMBER" | "DATE" | "SELECT" | "TEXTAREA";
  required: boolean;
  order: number;
}

export default function FieldManager({
  bookId,
  accessToken,
}: {
  bookId: number;
  accessToken: string;
}) {
  const router = useRouter();
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [form, setForm] = useState<FieldForm>({
    name: "",
    label: "",
    type: "TEXT",
    required: false,
    order: 1,
  });
  const [optionsRaw, setOptionsRaw] = useState("");

  // ▼▼▼ [เพิ่ม] State สำหรับจัดการ "การแก้ไข" ▼▼▼
  const [editingId, setEditingId] = useState<number | null>(null); // ID ของ Field ที่กำลังแก้ไข
  // <-- [แก้ไข] จุดที่ 2: เปลี่ยนไปใช้ Type ที่สร้างขึ้นมาใหม่
  const [editForm, setEditForm] = useState<Partial<EditFormState>>({});

  // const [editForm, setEditForm] = useState<Partial<FieldConfig & { options: string | string[] }>>({});
  // const [editForm, setEditForm] = useState<Partial<FieldConfig>>({}); // State เก็บข้อมูลที่กำลังแก้ไข
  // ▲▲▲ [สิ้นสุดส่วนที่เพิ่ม] ▲▲▲

  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  useEffect(() => {
    axios
      .get<FieldConfig[]>(
        `${BASE}/experience-books/${bookId}/fields`,
        authHeader,
      )
      .then((res) => setFields(res.data))
      .catch(console.error);
  }, [BASE, bookId]);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, type, value, checked } = e.target as HTMLInputElement;
    if (name === "options") return setOptionsRaw(value);

    let val: string | boolean | number =
      type === "checkbox"
        ? checked
        : name === "order"
          ? parseInt(value, 10) || 1
          : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  }

  function addField(e: FormEvent) {
    e.preventDefault();
    const newField: FieldConfig = {
      id: 0,
      ...form,
      options:
        form.type === "SELECT"
          ? optionsRaw
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [],
    };
    setFields((prev) => [...prev, newField]);
    setForm({
      name: "",
      label: "",
      type: "TEXT",
      required: false,
      order: fields.length + 1,
    });
    setOptionsRaw("");
  }

  // ▼▼▼ [เพิ่ม] ฟังก์ชันสำหรับจัดการการแก้ไข ▼▼▼

  // 1. เมื่อกดปุ่ม "แก้ไข"
  const handleStartEdit = (field: FieldConfig) => {
    setEditingId(field.id);
    // คัดลอกข้อมูลของ field นั้นมาใส่ใน state สำหรับฟอร์มแก้ไข
    setEditForm({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      order: field.order,
      options: field.options.join(", "),
    });
  };

  // 2. เมื่อมีการเปลี่ยนแปลงในฟอร์มแก้ไข
  const handleEditChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    const val = type === "checkbox" ? checked : value;
    setEditForm((prev) => ({ ...prev, [name]: val }));
  };

  // 3. เมื่อกดยกเลิกการแก้ไข
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // 4. เมื่อกดบันทึกการแก้ไข (อัปเดตแค่ใน State ของ Frontend)
  const handleSaveEdit = (id: number) => {
    setFields((prevFields) =>
      prevFields.map((field) => {
        if (field.id === id) {
          // แปลง options จาก string กลับไปเป็น array ก่อนบันทึก
          const optionsArray =
            typeof editForm.options === "string"
              ? editForm.options
                  .split(",")
                  .map((o) => o.trim())
                  .filter(Boolean)
              : field.options;

          return {
            ...field,
            ...editForm,
            order: Number(editForm.order) || field.order,
            options: editForm.type === "SELECT" ? optionsArray : [],
          };
        }
        return field;
      }),
    );
    // ออกจากโหมดแก้ไข
    handleCancelEdit();
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: "ต้องการลบรายการนี้?",
      text: "คุณต้องการลบรายการนี้ใช่หรือไม่ (การลบจะสมบูรณ์เมื่อกดบันทึกทั้งหมด)",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ใช่, ลบเลย",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        setFields(fields.filter((f) => f.id !== id));
      }
    });
  };

  // ▲▲▲ [สิ้นสุดส่วนที่เพิ่ม] ▲▲▲

  async function saveAll() {
    try {
      const sortedFields = [...fields]
        .sort((a, b) => a.order - b.order)
        .map((field, idx) => ({ ...field, order: idx + 1 }));

      await axios.post(
        `${BASE}/experience-books/${bookId}/fields/sync`,
        fields,
        authHeader,
      );

      setFields(sortedFields);

      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: "รายละเอียดข้อมูลถูกบันทึกแล้ว",
        timer: 2000,
        showConfirmButton: false,
      });

      router.refresh();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถบันทึกได้ กรุณาลองใหม่",
      });
    }
  }

  return (
    <div className="p-6 md:p-8">
      <form
        onSubmit={addField}
        className="p-6 mb-8 space-y-5 rounded-lg shadow-sm bg-gray-50"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              ชื่อหัวข้อในฐานข้อมูล
            </label>
            <input
              name="name"
              id="name"
              value={form.name}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm sm:text-sm"
              required
              placeholder="แนะนำให้เป็นภาษาอังกฤษ เช่น location bed"
            />
          </div>
          <div>
            <label
              htmlFor="label"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              ชื่อที่แสดงในหน้ากรอก
            </label>
            <input
              name="label"
              id="label"
              value={form.label}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm sm:text-sm"
              required
              placeholder="เช่น สถานที่ เตียง"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="type"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              รูปแบบข้อมูล
            </label>
            <select
              name="type"
              id="type"
              value={form.type}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm sm:text-sm"
            >
              <option value="TEXT">ข้อความ หรือตัวหนังสือ (Text)</option>
              <option value="NUMBER">ตัวเลข (Number)</option>
              <option value="DATE">วันที่ (Date)</option>
              <option value="SELECT">เลือก (Select)</option>
              <option value="TEXTAREA">ข้อความยาว (Textarea)</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="order"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              ลำดับข้อมูล
            </label>
            <input
              type="number"
              name="order"
              id="order"
              value={form.order}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm sm:text-sm"
              required
            />
          </div>
        </div>
        {form.type === "SELECT" && (
          <div>
            <label
              htmlFor="options"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              ตัวเลือก (คั่นด้วย comma ",")
            </label>
            <textarea
              name="options"
              id="options"
              value={optionsRaw}
              onChange={handleChange}
              rows={3}
              placeholder="เช่น นิยาย, การ์ตูน, วิชาการ"
              className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm sm:text-sm"
            />
          </div>
        )}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="required"
            id="required"
            checked={form.required}
            onChange={handleChange}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
          />
          <label
            htmlFor="required"
            className="block ml-2 text-sm text-gray-700"
          >
            จำเป็น (บังคับกรอก)
          </label>
        </div>
        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center sm:w-auto w-full"
          >
            <FaPlus className="w-4 h-4 mr-2" /> เพิ่มข้อมูล
          </button>
        </div>
      </form>

      {/* --- ส่วนแสดงรายการ Field ทั้งหมด --- */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-medium text-gray-900">
          รายการข้อมูลทั้งหมด
        </h2>
        <div className="space-y-3">
          {fields.length > 0 ? (
            fields.map((fld, idx) => (
              <div
                key={fld.id || `new-${idx}`}
                className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                {/* ▼▼▼ [แก้ไข] ใช้ Conditional Rendering เพื่อสลับหน้าจอ ▼▼▼ */}
                {editingId === fld.id ? (
                  // --- โหมดแก้ไข ---
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-indigo-600">
                      กำลังแก้ไข: {fld.label}
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">
                          ชื่อในฐานข้อมูล
                        </label>
                        <input
                          name="name"
                          value={editForm.name}
                          onChange={handleEditChange}
                          className="w-full p-2 mt-1 border rounded"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          ชื่อที่แสดง
                        </label>
                        <input
                          name="label"
                          value={editForm.label}
                          onChange={handleEditChange}
                          className="w-full p-2 mt-1 border rounded"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          รูปแบบข้อมูล
                        </label>
                        <select
                          name="type"
                          value={editForm.type}
                          onChange={handleEditChange}
                          className="w-full p-2 mt-1 border rounded"
                        >
                          <option value="TEXT">ข้อความ (Text)</option>
                          <option value="NUMBER">ตัวเลข (Number)</option>
                          <option value="DATE">วันที่ (Date)</option>
                          <option value="SELECT">เลือก (Select)</option>
                          <option value="TEXTAREA">
                            ข้อความยาว (Textarea)
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">ลำดับ</label>
                        <input
                          name="order"
                          type="number"
                          value={editForm.order}
                          onChange={handleEditChange}
                          className="w-full p-2 mt-1 border rounded"
                        />
                      </div>
                    </div>
                    {editForm.type === "SELECT" && (
                      <div>
                        <label className="text-sm font-medium">
                          ตัวเลือก (คั่นด้วย ,)
                        </label>
                        {/* <textarea name="options" value={Array.isArray(editForm.options) ? editForm.options.join(', ') : ''} onChange={handleEditChange} rows={2} className="w-full p-2 mt-1 border rounded" /> */}
                        {/* <-- [แก้ไข] จุดที่ 2: เปลี่ยน value prop ของ textarea ให้รับ string โดยตรง */}
                        <textarea
                          name="options"
                          value={editForm.options || ""}
                          onChange={handleEditChange}
                          rows={2}
                          className="w-full p-2 mt-1 border rounded"
                        />
                      </div>
                    )}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="required"
                        id={`required-${fld.id}`}
                        checked={!!editForm.required}
                        onChange={handleEditChange}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`required-${fld.id}`} className="ml-2">
                        จำเป็น (บังคับกรอก)
                      </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t">
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600"
                      >
                        <FaTimes /> ยกเลิก
                      </button>
                      <button
                        onClick={() => handleSaveEdit(fld.id)}
                        className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                      >
                        <FaCheck /> ยืนยัน
                      </button>
                    </div>
                  </div>
                ) : (
                  // --- โหมดแสดงผลปกติ ---
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full">
                        {fld.order}
                      </div>
                      <div className="font-medium text-gray-800">
                        {fld.label}
                      </div>
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                        {fld.type}
                      </span>
                      {fld.required && (
                        <span className="text-sm text-red-500">*</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(fld)}
                        className="p-2 text-gray-500 rounded-full hover:bg-blue-100 hover:text-blue-600"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(fld.id)}
                        className="p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                )}
                {/* ▲▲▲ [สิ้นสุดส่วนที่แก้ไข] ▲▲▲ */}
              </div>
            ))
          ) : (
            <div className="py-8 text-center border border-gray-300 border-dashed rounded-lg bg-gray-50">
              <FaRegFileAlt className="w-12 h-12 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">ยังไม่มีข้อมูล</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveAll}
          className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          <FaRegSave className="w-5 h-5 mr-2" /> บันทึกรายละเอียดข้อมูลทั้งหมด
        </button>
      </div>
    </div>
  );
}
