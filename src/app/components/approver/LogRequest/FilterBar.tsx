'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FaSearch,
  FaCalendarAlt,
  FaCheckCircle,
  FaAngleDown,
} from 'react-icons/fa';

type Props = {
  search: string;
  setSearch: (v: string) => void;
  status: 'all' | 'confirmed' | 'cancel';
  setStatus: (v: 'all' | 'confirmed' | 'cancel') => void;
  sortBy: string;
  order: 'asc' | 'desc';
  setSort: (by: string, order: 'asc' | 'desc') => void;
  limit: number;
  setLimit: (n: number) => void;
};

export default function FilterBar({
  search,
  setSearch,
  status,
  setStatus,
  sortBy,
  order,
  setSort,
  limit,
  setLimit,
}: Props) {
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setShowDateMenu(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  return (
    <div className="flex flex-wrap items-center sm:justify-between justify-center  gap-4 px-6 py-3 mb-6 bg-white shadow rounded-xl dark:bg-[#1E293B]">
      {/* Search */}
      <div className="w-full max-w-md">
        <div className="relative">
          <FaSearch className="absolute text-gray-400 -translate-y-1/2 left-4 top-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหารหัสนิสิต, ชื่อ-นามสกุล, หมวดหมู่..."
            className="w-full py-2 pl-12 pr-4 transition bg-gray-100 border border-gray-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Date dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDateMenu((v) => !v)}
          className="flex items-center h-10 px-4 py-2 space-x-1 text-sm text-gray-700 transition bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <FaCalendarAlt className="text-gray-500" />
          <span>วันที่</span>
          <FaAngleDown className="text-gray-500" />
        </button>
        {showDateMenu && (
          <div className="absolute right-0 z-10 w-48 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div
              onClick={() => {
                setSort('createdAt', 'desc');
                setShowDateMenu(false);
              }}
              className={`
            px-4 py-2 text-sm cursor-pointer hover:bg-gray-100
            ${sortBy === 'createdAt' && order === 'desc' ? 'bg-gray-100' : ''}
          `}
            >
              ล่าสุด → เก่าสุด
            </div>
            <div
              onClick={() => {
                setSort('createdAt', 'asc');
                setShowDateMenu(false);
              }}
              className={`
            px-4 py-2 text-sm cursor-pointer hover:bg-gray-100
            ${sortBy === 'createdAt' && order === 'asc' ? 'bg-gray-100' : ''}
          `}
            >
              เก่าสุด → ล่าสุด
            </div>
          </div>
        )}
      </div>

      {/* Status dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowStatusMenu((v) => !v)}
          className="flex items-center h-10 px-4 py-2 space-x-1 text-sm text-gray-700 transition bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <FaCheckCircle className="text-gray-500" />
          <span>สถานะ</span>
          <FaAngleDown className="text-gray-500" />
        </button>
        {showStatusMenu && (
          <div className="absolute right-0 z-10 w-40 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div
              onClick={() => {
                setStatus('all');
                setShowStatusMenu(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                status === 'all' ? 'bg-gray-100' : ''
              }`}
            >
              ทั้งหมด
            </div>
            <div
              onClick={() => {
                setStatus('confirmed');
                setShowStatusMenu(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                status === 'confirmed' ? 'bg-gray-100' : ''
              }`}
            >
              ยืนยัน
            </div>
            <div
              onClick={() => {
                setStatus('cancel');
                setShowStatusMenu(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                status === 'cancel' ? 'bg-gray-100' : ''
              }`}
            >
              ปฏิเสธ
            </div>
          </div>
        )}
      </div>

      {/* Page Size */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 dark:text-white">แสดง</span>
        <select
          value={limit}
          onChange={(e) => setLimit(+e.target.value)}
          className="px-3 py-1 text-sm transition bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span className="text-sm text-gray-600 dark:text-white">รายการ</span>
      </div>
    </div>
  );
}
