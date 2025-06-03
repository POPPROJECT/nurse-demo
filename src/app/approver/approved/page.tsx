'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { getSession } from '../../../../lib/session';
import { Role } from '../../../../lib/type';
import FilterBar from '@/app/components/approver/approved/FilterBar';
import BulkActions from '@/app/components/approver/approved/BulkAction';
import RequestCard from '@/app/components/approver/approved/RequestCard';

interface FieldValue {
  field: { label: string };
  value: string;
}

interface Experience {
  id: number;
  course: string;
  subCourse: string;
  student: {
    studentId: string;
    user: { name: string };
  };
  fieldValues: FieldValue[];
  createdAt: string;
}

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
  const [requests, setRequests] = useState<Experience[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'course' | 'subCourse'>(
    'createdAt'
  );
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const totalPages = Math.ceil(total / limit);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const sess = await getSession();
      if (
        !sess ||
        (sess.user.role !== Role.APPROVER_IN &&
          sess.user.role !== Role.APPROVER_OUT)
      ) {
        window.location.href = '/';
        return;
      }

      const res = await axios.get<{ total: number; data: Experience[] }>(
        `${BASE}/approver/requests`,
        {
          headers: { Authorization: `Bearer ${sess.accessToken}` },
          params: { search, sortBy, order, page, limit },
        }
      );
      setRequests(res.data.data);
      setTotal(res.data.total);
    } catch (e: any) {
      Swal.fire(
        'Error',
        e.response?.data?.message || 'โหลดคำขอไม่สำเร็จ',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ ใช้ useMemo เพื่อสร้าง debounce function
  const debouncedFetch = useMemo(() => {
    return debounce(() => {
      fetchRequests();
    }, 300); // 300ms delay
  }, [search, sortBy, order, limit, page]);

  useEffect(() => {
    debouncedFetch(); // เรียก fetch แบบหน่วงเวลา
  }, [search]); // ✅ เฉพาะตอนพิมพ์ search เท่านั้น

  const handleConfirm = async (id: number) => {
    const sess = await getSession();
    if (!sess || sess.user.role !== Role.APPROVER_IN) {
      Swal.fire('Error', 'กรุณาเข้าสู่ระบบก่อน', 'error');
      return;
    }
    const { isConfirmed, value } = await Swal.fire({
      title: 'กรุณาใส่ PIN 6 หลัก',
      input: 'password',
      inputAttributes: { maxlength: '6', minlength: '6' },
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
    });
    if (!isConfirmed || !value) return;
    try {
      await axios.patch(
        `${BASE}/approver/requests/${id}/confirm`,
        { pin: value },
        { headers: { Authorization: `Bearer ${sess.accessToken}` } }
      );
      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'ยืนยันแล้ว' });
      await fetchRequests();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'เกิดข้อผิดพลาด';
      if (e.response?.status === 400 && msg.includes('PIN')) {
        Swal.fire({ icon: 'warning', title: 'PIN ไม่ถูกต้อง', text: msg });
      } else {
        Swal.fire('Error', msg, 'error');
      }
    }
  };

  const handleReject = async (id: number) => {
    const sess = await getSession();
    if (
      !sess ||
      (sess.user.role !== Role.APPROVER_IN &&
        sess.user.role !== Role.APPROVER_OUT)
    ) {
      Swal.fire('Error', 'กรุณาเข้าสู่ระบบก่อน', 'error');
      return;
    }
    const { isConfirmed, value } = await Swal.fire({
      title: 'กรุณาใส่ PIN 6 หลัก',
      input: 'password',
      inputAttributes: { maxlength: '6', minlength: '6' },
      showCancelButton: true,
      confirmButtonText: 'ปฏิเสธ',
    });
    if (!isConfirmed || !value) return;
    try {
      await axios.patch(
        `${BASE}/approver/requests/${id}/reject`,
        { pin: value },
        { headers: { Authorization: `Bearer ${sess.accessToken}` } }
      );
      Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'ปฏิเสธแล้ว' });
      await fetchRequests();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'เกิดข้อผิดพลาด';
      if (e.response?.status === 400 && msg.includes('PIN')) {
        Swal.fire({ icon: 'warning', title: 'PIN ไม่ถูกต้อง', text: msg });
      } else {
        Swal.fire('Error', msg, 'error');
      }
    }
  };

  const handleBulkConfirm = async (pin: string) => {
    const sess = await getSession();
    if (
      !sess ||
      (sess.user.role !== Role.APPROVER_IN &&
        sess.user.role !== Role.APPROVER_OUT)
    ) {
      Swal.fire('Error', 'กรุณาเข้าสู่ระบบก่อน', 'error');
      return;
    }
    try {
      await axios.patch(
        `${BASE}/approver/requests/bulk-confirm`,
        { ids: selectedIds, pin },
        { headers: { Authorization: `Bearer ${sess.accessToken}` } }
      );
      Swal.fire('สำเร็จ', 'ยืนยันทั้งหมดแล้ว', 'success');
      setSelectedIds([]);
      await fetchRequests();
    } catch (e) {
      throw e;
    }
  };

  const handleBulkReject = async (pin: string) => {
    const sess = await getSession();
    if (
      !sess ||
      (sess.user.role !== Role.APPROVER_IN &&
        sess.user.role !== Role.APPROVER_OUT)
    ) {
      Swal.fire('Error', 'กรุณาเข้าสู่ระบบก่อน', 'error');
      return;
    }
    try {
      await axios.patch(
        `${BASE}/approver/requests/bulk-reject`,
        { ids: selectedIds, pin },
        { headers: { Authorization: `Bearer ${sess.accessToken}` } }
      );
      Swal.fire('สำเร็จ', 'ปฏิเสธทั้งหมดแล้ว', 'success');
      setSelectedIds([]);
      await fetchRequests();
    } catch (e) {
      throw e;
    }
  };

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 ">
        <h1 className="text-xl font-semibold sm:text-2xl">บันทึกประสบการณ์</h1>
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
                className="px-2 py-1 border border-gray-300 rounded dark:text-white"
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
            onConfirmAll={handleBulkConfirm}
            onRejectAll={handleBulkReject}
          />
        )}

        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="py-10 text-center">กำลังโหลด…</div>
          ) : (
            requests.map((req) => (
              <RequestCard
                key={req.id}
                req={{ ...req, studentProfile: req.student }}
                selected={selectedIds.includes(req.id)}
                onCheck={(checked) =>
                  setSelectedIds((prev) =>
                    checked
                      ? [...prev, req.id]
                      : prev.filter((i) => i !== req.id)
                  )
                }
                onConfirm={() => handleConfirm(req.id)}
                onReject={() => handleReject(req.id)}
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
        {/* Pagination
      <div className="flex items-center justify-center pt-4 mt-6 space-x-1 border-t border-gray-200 sm:space-x-2">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          className="px-2 py-1 border rounded sm:px-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          หน้าแรก
        </button>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-2 py-1 border rounded sm:px-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ก่อนหน้า
        </button>
        {getPageNumbers(page, totalPages).map((pNo, idx) => (
          <div key={idx}>
            {pNo === '...' ? (
              <span className="px-2 py-1 border rounded">…</span>
            ) : (
              <button
                onClick={() => setPage(pNo as number)}
                className={`px-2 py-1 border rounded ${
                  pNo === page ? 'bg-blue-500 text-white' : 'bg-white'
                }`}
              >
                {pNo}
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || requests.length < limit}
          className="px-2 py-1 border rounded sm:px-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ถัดไป
        </button>
        <button
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages || requests.length < limit}
          className="px-2 py-1 border rounded sm:px-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          หน้าสุดท้าย
        </button>
      </div> */}
      </main>
    </div>
  );
}
