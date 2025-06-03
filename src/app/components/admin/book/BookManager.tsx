'use client';

import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import axios, { AxiosInstance } from 'axios';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
  FaSearch,
  FaTrashAlt,
  FaEdit,
  FaPlus,
  FaTimes,
  FaArrowRight,
  FaBook,
  FaCopy,
  FaEllipsisV,
} from 'react-icons/fa';

interface Book {
  id: number;
  title: string;
  description?: string;
}

interface Prefix {
  id: number;
  prefix: string;
}

export default function BookManager({ accessToken }: { accessToken: string }) {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const api: AxiosInstance = axios.create({
    baseURL: BASE,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  api.interceptors.request.use((config) => {
    if (accessToken && config.headers) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return config;
  });

  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', description: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [prefixes, setPrefixes] = useState<Prefix[]>([]);
  const [newPrefix, setNewPrefix] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({}); // Store refs for each dropdown

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    try {
      const res = await api.get<Book[]>('/experience-books');
      setBooks(res.data);
      setFilteredBooks(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('ผิดพลาด', 'ไม่สามารถโหลดรายการสมุดได้', 'error');
    }
  }

  useEffect(() => {
    const term = search.trim().toLowerCase();
    setFilteredBooks(
      !term
        ? books
        : books.filter(
            (b) =>
              b.title.toLowerCase().includes(term) ||
              (b.description && b.description.toLowerCase().includes(term))
          )
    );
  }, [search, books]);

  useEffect(() => {
    if (editingId !== null) {
      api
        .get<Prefix[]>(`/experience-books/${editingId}/prefixes`)
        .then((r) => setPrefixes(r.data))
        .catch((err) => {
          console.error(err);
          Swal.fire(
            'Error',
            err.response?.status === 401
              ? 'กรุณาเข้าสู่ระบบอีกครั้ง'
              : 'โหลด prefix ไม่ได้',
            'error'
          );
        });
    } else setPrefixes([]);
  }, [editingId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openDropdownId === null) return;
      const currentDropdownRef = dropdownRefs.current[openDropdownId];
      if (
        currentDropdownRef &&
        !currentDropdownRef.contains(event.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    }
    if (openDropdownId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  async function handleAddPrefix() {
    if (!newPrefix.trim() || editingId === null) return;
    try {
      const res = await api.post<Prefix>(
        `/experience-books/${editingId}/prefixes`,
        { prefix: newPrefix.trim() }
      );
      setPrefixes((ps) => [...ps, res.data]);
      setNewPrefix('');
    } catch (err: any) {
      Swal.fire(
        'Error',
        err.response?.status === 401
          ? 'กรุณาเข้าสู่ระบบอีกครั้ง'
          : 'ไม่สามารถเพิ่ม prefix ได้',
        'error'
      );
    }
  }

  async function handleRemovePrefix(id: number) {
    if (editingId === null) return;
    try {
      await api.delete(`/experience-books/${editingId}/prefixes/${id}`);
      setPrefixes((ps) => ps.filter((p) => p.id !== id));
    } catch (err: any) {
      Swal.fire(
        'Error',
        err.response?.status === 401
          ? 'กรุณาเข้าสู่ระบบอีกครั้ง'
          : 'ไม่สามารถลบ prefix ได้',
        'error'
      );
    }
  }

  async function handleCopy(book: Book) {
    const { value: newTitle } = await Swal.fire({
      title: 'ชื่อสมุดใหม่',
      input: 'text',
      inputLabel: 'ระบุชื่อสมุดใหม่',
      inputValue: `${book.title} (Copy)`,
      showCancelButton: true,
      confirmButtonText: 'คัดลอก',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: 'bg-white dark:bg-gray-800',
        title: 'text-gray-900 dark:text-gray-100',
        input:
          'text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600',
      },
    });
    if (!newTitle) return;

    try {
      await api.post(`/experience-books/${book.id}/copy`, { title: newTitle });
      Swal.fire('สำเร็จ', 'คัดลอกสมุดเรียบร้อยแล้ว', 'success');
      fetchBooks();
    } catch (err) {
      Swal.fire('Error', 'คัดลอกสมุดไม่สำเร็จ', 'error');
    }
  }

  function handleNewChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim())
      return Swal.fire('ผิดพลาด', 'กรุณาใส่ชื่อสมุด', 'error');
    try {
      await api.post('/experience-books', form);
      setForm({ title: '', description: '' });
      await fetchBooks();
      Swal.fire('สำเร็จ', 'สร้างสมุดใหม่เรียบร้อยแล้ว', 'success');
    } catch {
      Swal.fire('ผิดพลาด', 'สร้างสมุดไม่สำเร็จ กรุณาลองใหม่', 'error');
    }
  }

  function startEdit(book: Book) {
    setEditingId(book.id);
    setEditForm({ title: book.title, description: book.description || '' });
    setOpenDropdownId(null); // Close dropdown when starting edit
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleEditChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editForm.title.trim() || editingId === null)
      return Swal.fire('ผิดพลาด', 'กรุณาใส่ชื่อสมุด', 'error');
    try {
      await api.patch(`/experience-books/${editingId}`, editForm);
      setEditingId(null);
      await fetchBooks();
      Swal.fire('สำเร็จ', 'บันทึกการแก้ไขเรียบร้อยแล้ว', 'success');
    } catch {
      Swal.fire('ผิดพลาด', 'บันทึกการแก้ไขไม่สำเร็จ', 'error');
    }
  }

  async function handleDelete(id: number) {
    setOpenDropdownId(null); // Close dropdown before showing confirmation
    const confirm = await Swal.fire({
      title: 'ลบสมุด',
      text: 'คุณแน่ใจว่าต้องการลบสมุดนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      customClass: {
        popup: 'bg-white dark:bg-gray-800',
        title: 'text-gray-900 dark:text-gray-100',
        htmlContainer: 'text-gray-700 dark:text-gray-300',
      },
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.delete(`/experience-books/${id}`);
      await fetchBooks();
      Swal.fire('ลบแล้ว!', 'สมุดถูกลบเรียบร้อยแล้ว', 'success');
    } catch {
      Swal.fire('ผิดพลาด', 'ลบสมุดไม่สำเร็จ กรุณาลองใหม่', 'error');
    }
  }

  const toggleDropdown = (bookId: number) => {
    setOpenDropdownId(openDropdownId === bookId ? null : bookId);
  };

  return (
    <div className="p-4 mx-auto md:p-8 max-w-7xl">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {/* Create New Book Form */}
          <div className="p-6 bg-white shadow-md dark:bg-gray-800 rounded-xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
              สร้างสมุดใหม่
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  ชื่อสมุด
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={form.title}
                  onChange={handleNewChange}
                  placeholder="ใส่ชื่อสมุด"
                  className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  คำอธิบาย
                </label>
                <textarea
                  name="description"
                  id="description"
                  value={form.description}
                  onChange={handleNewChange}
                  rows={4}
                  className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="รายละเอียดเกี่ยวกับสมุดนี้"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800"
              >
                สร้างสมุดใหม่
              </button>
            </form>
          </div>
        </div>
        <div className="lg:col-span-2">
          {/* List of Books */}
          <div className="p-6 bg-white shadow-md dark:bg-gray-800 rounded-xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
              รายการสมุดทั้งหมด
            </h2>
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="ค้นหาสมุด..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full py-2 pl-10 pr-4 text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              />
              <FaSearch className="absolute text-gray-400 -translate-y-1/2 dark:text-gray-500 left-3 top-1/2" />
            </div>
            {filteredBooks.length > 0 ? (
              <div className="space-y-4">
                {filteredBooks.map((book) => (
                  <div
                    key={book.id}
                    // Removed overflow-hidden. Added relative for positioning context.
                    // Added flex flex-col to allow justify-between for manage content button.
                    // Added min-h to ensure card has some height.
                    className="relative p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md dark:hover:shadow-gray-600/50 flex flex-col justify-between min-h-[140px] sm:min-h-[120px]"
                  >
                    {editingId === book.id ? (
                      <form onSubmit={handleSaveEdit} className="space-y-3">
                        {/* Edit form fields... */}
                        <div>
                          <label
                            htmlFor={`edit-title-${book.id}`}
                            className="block mb-1 text-base text-gray-700 dark:text-gray-300"
                          >
                            ชื่อสมุด
                          </label>
                          <input
                            name="title"
                            id={`edit-title-${book.id}`}
                            value={editForm.title}
                            onChange={handleEditChange}
                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`edit-description-${book.id}`}
                            className="block mb-1 text-base text-gray-700 dark:text-gray-300"
                          >
                            คำอธิบายสมุด
                          </label>
                          <textarea
                            name="description"
                            id={`edit-description-${book.id}`}
                            value={editForm.description}
                            onChange={handleEditChange}
                            rows={3}
                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-base text-gray-700 dark:text-gray-300">
                            รหัสนิสิตที่อนุญาต (Prefixes)
                          </label>
                          <div className="flex items-center mb-2 space-x-2">
                            <input
                              type="text"
                              value={newPrefix}
                              onChange={(e) => setNewPrefix(e.target.value)}
                              className="flex-grow px-2 py-1 text-gray-900 bg-white border border-gray-300 rounded dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
                              placeholder="เช่น 64 หรือ 6436"
                            />
                            <button
                              type="button"
                              onClick={handleAddPrefix}
                              className="px-3 py-1.5 text-white bg-green-600 rounded hover:bg-green-700"
                            >
                              <FaPlus />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {prefixes.map((p) => (
                              <span
                                key={p.id}
                                className="flex items-center px-2 py-1 space-x-1 text-indigo-700 bg-indigo-100 rounded dark:text-indigo-300 dark:bg-indigo-900/50"
                              >
                                <span>{p.prefix}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePrefix(p.id)}
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                                >
                                  <FaTimes />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end pt-2 space-x-2">
                          <button
                            type="submit"
                            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                          >
                            บันทึก
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-4 py-2 text-sm text-gray-800 bg-gray-200 rounded dark:text-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {/* Top Right Dropdown Menu */}
                        <div
                          className="absolute z-10 top-3 right-3" // Adjusted padding slightly
                          ref={(el) => {
                            dropdownRefs.current[book.id] = el;
                          }}
                        >
                          <button
                            type="button"
                            className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-700 focus:ring-indigo-500"
                            id={`options-menu-button-${book.id}`}
                            aria-expanded={openDropdownId === book.id}
                            aria-haspopup="true"
                            onClick={() => toggleDropdown(book.id)}
                            title="ตัวเลือกเพิ่มเติม"
                          >
                            <FaEllipsisV
                              aria-hidden="true"
                              className="w-4 h-4 sm:w-5 sm:h-5"
                            />
                          </button>

                          {openDropdownId === book.id && (
                            <div
                              className="absolute right-0 z-30 w-48 mt-1 origin-top-right bg-white rounded-md shadow-xl dark:bg-gray-800 ring-1 ring-black dark:ring-gray-600 ring-opacity-5 focus:outline-none" // Increased z-index & shadow
                              role="menu"
                              aria-orientation="vertical"
                              aria-labelledby={`options-menu-button-${book.id}`}
                              tabIndex={-1}
                            >
                              <div className="py-1" role="none">
                                <button
                                  onClick={() => {
                                    startEdit(book);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white"
                                  role="menuitem"
                                  tabIndex={-1}
                                >
                                  <FaEdit
                                    className="mr-3 text-blue-500 dark:text-blue-400"
                                    aria-hidden="true"
                                  />{' '}
                                  แก้ไขสมุด
                                </button>
                                <button
                                  onClick={() => {
                                    handleCopy(book);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white"
                                  role="menuitem"
                                  tabIndex={-1}
                                >
                                  <FaCopy
                                    className="mr-3 text-purple-500 dark:text-purple-400"
                                    aria-hidden="true"
                                  />{' '}
                                  คัดลอกสมุด
                                </button>
                                <button
                                  onClick={() => {
                                    handleDelete(book.id);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-600 hover:text-red-700 dark:hover:text-red-300"
                                  role="menuitem"
                                  tabIndex={-1}
                                >
                                  <FaTrashAlt
                                    className="mr-3"
                                    aria-hidden="true"
                                  />{' '}
                                  ลบสมุด
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Main Content (Title and Description) */}
                        <div className="flex-grow pr-10 mb-4 sm:pr-12">
                          <h3 className="text-base font-semibold text-gray-800 break-all whitespace-normal sm:text-lg dark:text-white line-clamp-2 hover:line-clamp-none">
                            {' '}
                            {/* เพิ่ม line-clamp-2 และ hover:line-clamp-none สำหรับ Title */}
                            {book.title}
                          </h3>
                          {book.description && (
                            <p className="mt-1 text-sm text-gray-600 break-all whitespace-normal dark:text-gray-400 line-clamp-2 sm:line-clamp-3 hover:line-clamp-none">
                              {' '}
                              {/* ปรับ line-clamp สำหรับ Description และเพิ่ม hover:line-clamp-none */}
                              {book.description}
                            </p>
                          )}
                        </div>

                        {/* Bottom Right "จัดการเนื้อหา" Button */}
                        <div className="flex justify-end pt-2 mt-auto">
                          {' '}
                          {/* mt-auto pushes it to the bottom. pt-2 for spacing */}
                          <Link
                            href={`/admin/books/${book.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-700 focus:ring-blue-500"
                          >
                            จัดการเนื้อหา
                            <FaArrowRight className="ml-1.5 w-4 h-4" />
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <FaBook className="mx-auto text-5xl text-gray-300 dark:text-gray-500" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">
                  ยังไม่มีสมุดประสบการณ์
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  สร้างสมุดใหม่เพื่อเริ่มต้นใช้งาน
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
