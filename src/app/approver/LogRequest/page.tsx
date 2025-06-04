'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FilterBar from '@/app/components/approver/LogRequest/FilterBar';
import LogTable from '@/app/components/approver/LogRequest/LogTable';
import Pagination from '@/app/components/approver/LogRequest/Pagination';
import { useAuth } from '@/app/contexts/AuthContext';

export default function LogRequestPage() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'confirmed' | 'cancel'>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const { accessToken } = useAuth(); // ใช้ useAuth เพื่อดึง accessToken

  const fetchLogs = async () => {
    const res = await axios.get<{ total: number; data: any[] }>(
      `${BASE}/approver/log-requests`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          page,
          limit,
          search,
          status,
          sortBy,
          order,
          startDate,
          endDate,
        },
      }
    );
    setData(res.data.data);
    setTotal(res.data.total);
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, search, status, sortBy, order, startDate, endDate]);

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
      {/* Header */}
      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 ">
        <h1 className="text-xl font-semibold sm:text-2xl">
          ประวัติการจัดการคำขอ
        </h1>
      </div>
      <FilterBar
        search={search}
        setSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        status={status}
        setStatus={(v) => {
          setStatus(v);
          setPage(1);
        }}
        sortBy={sortBy}
        order={order}
        setSort={(by, ord) => {
          setSortBy(by);
          setOrder(ord);
          setPage(1);
        }}
        limit={limit}
        setLimit={(n) => {
          setLimit(n);
          setPage(1);
        }}
      />
      <LogTable data={data} />
      <div className="mt-2 text-sm text-gray-600">
        แสดง {data.length} จาก {total} รายการ
      </div>
      <Pagination
        page={page}
        totalPages={Math.ceil(total / limit)}
        setPage={setPage}
      />
    </div>
  );
}
