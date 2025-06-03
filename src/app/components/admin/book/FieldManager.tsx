'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FaPlus, FaTrashAlt, FaRegSave, FaRegFileAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';

interface FieldConfig {
  id: number;
  name: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'TEXTAREA';
  required: boolean;
  order: number;
  options: string[];
}

interface FieldForm {
  name: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'TEXTAREA';
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
    name: '',
    label: '',
    type: 'TEXT',
    required: false,
    order: 1,
  });
  const [optionsRaw, setOptionsRaw] = useState('');

  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  useEffect(() => {
    axios
      .get<FieldConfig[]>(
        `${BASE}/experience-books/${bookId}/fields`,
        authHeader
      )
      .then((res) => setFields(res.data))
      .catch(console.error);
  }, [BASE, bookId]);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, type, value, checked } = e.target as HTMLInputElement;
    if (name === 'options') return setOptionsRaw(value);

    let val: string | boolean | number =
      type === 'checkbox'
        ? checked
        : name === 'order'
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
        form.type === 'SELECT'
          ? optionsRaw
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean)
          : [],
    };
    setFields((prev) => [...prev, newField]);
    setForm({
      name: '',
      label: '',
      type: 'TEXT',
      required: false,
      order: fields.length + 1,
    });
    setOptionsRaw('');
  }

  async function saveAll() {
    try {
      const sortedFields = [...fields]
        .sort((a, b) => a.order - b.order)
        .map((field, idx) => ({ ...field, order: idx + 1 }));

      await axios.post(
        `${BASE}/experience-books/${bookId}/fields/sync`,
        fields,
        authHeader
      );

      setFields(sortedFields);

      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: 'รายละเอียดข้อมูลถูกบันทึกแล้ว',
        timer: 2000,
        showConfirmButton: false,
      });

      router.refresh();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถบันทึกได้ กรุณาลองใหม่',
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
        {form.type === 'SELECT' && (
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

      <div className="mb-6">
        <h2 className="mb-4 text-lg font-medium text-gray-900">
          รายการข้อมูลทั้งหมด
        </h2>
        <div className="space-y-3">
          {fields.length > 0 ? (
            fields
              .sort((a, b) => a.order - b.order)
              .map((fld, idx) => (
                <div
                  key={`${fld.id}-${fld.order}-${idx}`}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center w-6 h-6 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full">
                      {idx + 1}
                    </div>
                    <div className="font-medium text-gray-800">{fld.label}</div>
                    <span className="inline-block bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {fld.type}
                    </span>
                    {fld.required && (
                      <span className="text-sm text-red-500">*</span>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      const confirm = await Swal.fire({
                        title: 'ต้องการลบรายการนี้?',
                        text: 'คุณต้องการลบรายการนี้ใช่หรือไม่',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'ใช่, ลบเลย',
                        cancelButtonText: 'ยกเลิก',
                      });

                      if (confirm.isConfirmed) {
                        setFields(
                          fields.filter(
                            (x) => x.name !== fld.name || x.order !== fld.order
                          )
                        );
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50"
                  >
                    <FaTrashAlt className="w-5 h-5" />
                  </button>
                </div>
              ))
          ) : (
            <div className="py-8 mt-4 text-center border border-gray-300 border-dashed rounded-lg bg-gray-50">
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
