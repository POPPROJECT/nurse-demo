'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getSession } from 'lib/session';
import { Role } from 'lib/type';
import FilterBar from '@/app/components/admin/log/FilterBar';
import Pagination from '@/app/components/admin/log/Pagination';
import LogTable from '@/app/components/admin/log/LogTable';
import LogSummaryBar from '@/app/components/admin/log/LogSummeryBar';
import { HiClipboardList } from 'react-icons/hi';

export default function AdminLogPage() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<
    'all' | 'create' | 'update' | 'delete' | 'import'
  >('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const fetchLogs = async () => {
    const sess = await getSession();
    if (!sess || sess.user.role !== Role.ADMIN) {
      console.error('⛔ Session not found!');
      return;
    }
    const res = await axios.get(`${BASE}/admin/logs`, {
      headers: { Authorization: `Bearer ${sess.accessToken}` },
      params: {
        page,
        limit,
        search,
        action: action !== 'all' ? action : undefined,
        sortBy,
        order,
      },
    });
    setData(res.data.data);
    setTotal(res.data.total);
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, search, action, sortBy, order]);

  const latestUpdate =
    data.length > 0
      ? new Date(data[0].createdAt).toLocaleString('th-TH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : undefined;

  return (
    <div className="bg-[#f8fafc] dark:bg-[#1E293B] font-[Prompt] p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg">
        <div className="flex items-center mb-2">
          <HiClipboardList className="w-8 h-8 mr-3 text-black-600" />
          <h1 className="text-3xl font-bold text-white md:text-4xl bg-gradient-to-r to-h bg-clip-text">
            บันทึกการกระทำในระบบ
          </h1>
        </div>
        <p className="ml-12 text-white">
          ตรวจสอบและติดตามการเปลี่ยนแปลงทั้งหมดในระบบ
        </p>
      </header>

      {/* Filter */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        action={action}
        setAction={setAction}
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

      {/* Summary and Table */}
      <LogSummaryBar total={total} lastUpdate={latestUpdate} />
      <LogTable data={data} />

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={Math.ceil(total / limit)}
        setPage={setPage}
        totalItems={total}
        limit={limit}
      />
    </div>
  );
}
