'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import FilterBar from '@/app/components/approver/approved/FilterBar';
import BulkActions from '@/app/components/approver/approved/BulkAction';
import RequestCard from '@/app/components/approver/approved/RequestCard';
import { useAuth } from '@/app/contexts/AuthContext';
import { Role } from 'lib/type';

interface FieldValue {
  field: { label: string };
  value: string;
}

export interface ExperienceRequest {
  // ✅ export interface นี้เพื่อให้ RequestCard import ไปใช้ได้
  id: number;
  course: string;
  subCourse: string;
  student: {
    // ✅ Backend ส่ง "student" object
    studentId: string; // และใน student object มี studentId (จาก studentProfile table)
    user: { name: string }; // และมี user object (ที่มี name)
  };
  fieldValues: FieldValue[];
  createdAt: string;
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCEL';
}

interface FetchRequestsResponse {
  data: ExperienceRequest[];
  total: number;
}

// debounce function (ถ้ายังใช้)
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  const delta = 2;
  const range: (number | '...')[] = [];
  const rangeWithDots: (number | '...')[] = [];
  let last: number | null = null;

  for (let i = 1; i <= total; i++) {
    if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    }
  }
  for (const i of range) {
    if (last !== null && typeof i === 'number' && typeof last === 'number') {
      if (i - last === 2) rangeWithDots.push(last + 1);
      else if (i - last > 2) rangeWithDots.push('...');
    }
    rangeWithDots.push(i);
    last = typeof i === 'number' ? i : last;
  }
  return rangeWithDots;
}

export default function ApprovedPage() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const { accessToken, session: authSession } = useAuth(); // ✅ 2. ดึง accessToken และ session

  const [requests, setRequests] = useState<ExperienceRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  // ▼▼▼ ส่วนที่เพิ่มเข้ามา: 1. สร้าง state สำหรับ debounced value ▼▼▼
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  // ▲▲▲ สิ้นสุดส่วนที่เพิ่มเข้ามา ▲▲▲

  const [sortBy, setSortBy] = useState<
      'createdAt' | 'course' | 'subCourse' | 'studentName'
  >('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  // เพิ่ม state สำหรับ filter อื่นๆ ถ้ามี เช่น status, date range

  const totalPages = Math.ceil(total / limit);

  const fetchRequests = useCallback(async () => {
    if (!accessToken) {
      console.log(
          '[ApprovedPage] No accessToken, waiting for session from AuthContext.'
      );
      //setError('Waiting for authentication...');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        limit,
        sortBy,
        order,
      };
      // ใช้ debouncedSearch แทน search
      if (debouncedSearch) params.search = debouncedSearch;


      const res = await axios.get<FetchRequestsResponse>(
          `${BASE}/approver/requests`, // Endpoint สำหรับดึงรายการคำขอ
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            params,
          }
      );
      setRequests(res.data.data);
      setTotal(res.data.total);
    } catch (e: any) {
      console.error('Error fetching requests for approver:', e);
      setError(
          e.response?.data?.message || e.message || 'Failed to load requests.'
      );
      Swal.fire('Error', 'โหลดรายการคำขอไม่สำเร็จ', 'error');
      setRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, limit, debouncedSearch, sortBy, order, BASE]);

  useEffect(() => {
    if (accessToken) {
      fetchRequests();
    } else if (authSession === null && accessToken === null) {
      setLoading(false);
      setError('Session not found or expired. Please login again.');
    }
  }, [accessToken, authSession, fetchRequests]); // ใช้ fetchRequests เป็น dependency

  // ▼▼▼ ส่วนที่เพิ่มเข้ามา: 2. สร้าง useEffect สำหรับ Debouncing ▼▼▼
  useEffect(() => {
    // ตั้งเวลา delay
    const handler = setTimeout(() => {
      setPage(1); // กลับไปหน้า 1 เมื่อมีการค้นหาใหม่
      setDebouncedSearch(search); // อัปเดตค่าที่จะใช้ค้นหาจริง
    }, 500); // delay 500 ms

    // สั่งยกเลิก timeout ทุกครั้งที่มีการพิมพ์ใหม่ (cleanup function)
    return () => {
      clearTimeout(handler);
    };
  }, [search]); // useEffect นี้จะทำงานทุกครั้งที่ค่า `search` (จากช่อง input) เปลี่ยน
  // ▲▲▲ สิ้นสุดส่วนที่เพิ่มเข้ามา ▲▲▲

  const handleConfirmOrReject = async (
      actionType: 'confirm' | 'reject',
      experienceId: number,
      pinValue?: string
  ) => {
    if (!accessToken) {
      /* ... แจ้ง Error ... */ return;
    }
    // Role check
    const userRole = authSession?.user?.role;

    if (
        !userRole ||
        ![Role.APPROVER_IN, Role.APPROVER_OUT].includes(userRole)
    ) {
      Swal.fire(
          'ไม่ได้รับอนุญาต',
          'เฉพาะผู้นิเทศในและผู้นิเทศภายนอกเท่านั้นที่สามารถยืนยันคำขอได้',
          'warning'
      );
      return;
    }

    // ทั้ง Confirm และ Reject ต้องการ PIN
    if (!pinValue) {
      const { value: pin } = await Swal.fire({
        title: `กรุณาใส่ PIN 6 หลักเพื่อ ${
            actionType === 'confirm' ? 'ยืนยัน' : 'ปฏิเสธ'
        }`,
        input: 'password',
        inputPlaceholder: 'Enter your PIN',
        inputAttributes: {
          maxlength: '6',
          autocapitalize: 'off',
          autocorrect: 'off',
        },
        showCancelButton: true,
        confirmButtonText: actionType === 'confirm' ? 'ยืนยัน' : 'ปฏิเสธ',
        cancelButtonText: 'ยกเลิก',
        inputValidator: (value) => {
          if (!value || !/^\d{6}$/.test(value))
            return 'PIN ต้องเป็นตัวเลข 6 หลัก!';
        },
      });
      if (!pin) return;
      pinValue = pin;
    }

    try {
      const endpoint = `${BASE}/approver/requests/${experienceId}/${actionType}`; // Endpoint ของคุณ
      await axios.patch(
          // หรือ POST ตามที่ Backend กำหนด
          endpoint,
          { pin: pinValue },
          { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      Swal.fire(
          'สำเร็จ!',
          `${actionType === 'confirm' ? 'ยืนยัน' : 'ปฏิเสธ'}คำขอเรียบร้อยแล้ว`,
          'success'
      );
      fetchRequests(); // โหลดข้อมูลใหม่
    } catch (e: any) {
      console.error(`Error ${actionType} request:`, e);
      const msg = e.response?.data?.message || 'เกิดข้อผิดพลาด';
      if (
          e.response?.status === 400 &&
          (msg.includes('PIN') || msg.includes('pin'))
      ) {
        Swal.fire({ icon: 'warning', title: 'PIN ไม่ถูกต้อง', text: msg });
      } else {
        Swal.fire('Error', msg, 'error');
      }
    }
  };

  const handleBulkAction = async (
      actionType: 'confirm' | 'reject',
      pin: string
  ) => {
    if (!accessToken) {
      /* ... แจ้ง Error ... */ return;
    }

    if (selectedIds.length === 0) {
      /* ... แจ้งให้เลือกรายการ ... */ return;
    }

    const userRole = authSession?.user?.role;

    if (
        !userRole ||
        ![Role.APPROVER_IN, Role.APPROVER_OUT].includes(userRole)
    ) {
      Swal.fire(
          'ไม่ได้รับอนุญาต',
          'เฉพาะผู้นิเทศในและผู้นิเทศภายนอกเท่านั้นที่สามารถยืนยันคำขอแบบกลุ่มได้',
          'warning'
      );
      return;
    }

    try {
      const endpoint = `${BASE}/approver/requests/bulk-${actionType}`;
      await axios.patch(
          // หรือ POST
          endpoint,
          { ids: selectedIds, pin },
          { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      Swal.fire(
          'สำเร็จ',
          `${actionType === 'confirm' ? 'ยืนยัน' : 'ปฏิเสธ'} ${
              selectedIds.length
          } รายการเรียบร้อยแล้ว`,
          'success'
      );
      setSelectedIds([]);
      fetchRequests();
    } catch (e: any) {
      throw e;
    }
  };

  // ✅ UI สำหรับ Loading, Error, No Session
  if (loading && requests.length === 0 && !error)
    return <div className="p-10 text-center">Loading requests...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  if (!authSession?.user && !loading && !error) {
    return;
  }

  return (
      <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
        <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 ">
          <h1 className="text-xl font-semibold sm:text-2xl">รออนุมัติรายการ</h1>
        </div>
        <main className="">
          <FilterBar
              search={search}
              setSearch={setSearch}
              sortBy={sortBy}
              setSortBy={setSortBy}
              order={order}
              setOrder={setOrder}
          />

          {/* Limit selector */}
          <div className="flex justify-center mt-4 sm:justify-start">
            <div className="p-2 bg-white dark:bg-[#1E293B]  rounded-lg shadow">
              <div className="flex items-center px-4">
                <label
                    htmlFor="limit"
                    className="mr-2 text-sm font-medium dark:text-white"
                >
                  แสดง:
                </label>
                <select
                    id="limit"
                    className="bg-gray-50 px-2 py-1 border border-gray-300  rounded-lg"
                    value={limit}
                    onChange={(e) => {
                      setLimit(+e.target.value);
                      setPage(1);
                    }}
                >
                  {[5, 10, 20, 50].map((n) => (
                      <option key={n} value={n} className="text-gray-800">
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

          {selectedIds.length > 0 && (
              <BulkActions
                  selectedCount={selectedIds.length}
                  onConfirmAll={(pinFromModal) =>
                      handleBulkAction('confirm', pinFromModal)
                  }
                  onRejectAll={(pinFromModal) =>
                      handleBulkAction('reject', pinFromModal)
                  }
              />
          )}

          <div className="mt-4 space-y-4">
            {loading && requests.length === 0 ? (
                <div className="py-10 text-center">กำลังโหลด…</div>
            ) : requests.length === 0 && !error ? (
                <div className="py-10 text-center text-gray-500">
                  ไม่พบรายการคำขอ
                </div>
            ) : (
                requests.map((req) => (
                    <RequestCard
                        key={req.id}
                        req={req}
                        selected={selectedIds.includes(req.id)}
                        onCheck={(checked) =>
                            setSelectedIds((prev) =>
                                checked
                                    ? [...prev, req.id]
                                    : prev.filter((i) => i !== req.id)
                            )
                        }
                        onConfirm={(pin) =>
                            handleConfirmOrReject('confirm', req.id, pin)
                        }
                        onReject={(pin) => handleConfirmOrReject('reject', req.id, pin)}
                        currentUserRole={authSession?.user?.role as Role | undefined}
                    />
                ))
            )}
          </div>

          <div className="flex items-center justify-center pt-4 mt-6 space-x-1 border-t border-gray-200 dark:border-gray-700 sm:space-x-2">
            {/* หน้าแรก */}
            <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
            >
              หน้าแรก
            </button>

            {/* ก่อนหน้า */}
            <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
            >
              ก่อนหน้า
            </button>

            {/* ตัวเลขหน้า */}
            {getPageNumbers(page, totalPages).map((pNo, idx) => (
                <div key={idx}>
                  {pNo === '...' ? (
                      <span className="px-2 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 sm:px-3">
                  …
                </span>
                  ) : (
                      <button
                          onClick={() => setPage(pNo as number)}
                          aria-current={pNo === page ? 'page' : undefined}
                          className={`
                px-2 sm:px-3 py-1 border text-sm font-medium rounded-lg transition-colors duration-200
                ${
                              pNo === page
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-700 dark:border-blue-700 dark:text-white dark:hover:bg-blue-800'
                                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                          }
              `}
                      >
                        {pNo}
                      </button>
                  )}
                </div>
            ))}

            {/* ถัดไป */}
            <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
            >
              ถัดไป
            </button>

            {/* หน้าสุดท้าย */}
            <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || totalPages === 0}
                className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
            >
              หน้าสุดท้าย
            </button>
          </div>

        </main>
      </div>
  );
}