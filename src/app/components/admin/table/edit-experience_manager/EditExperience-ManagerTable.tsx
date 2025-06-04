'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import TableSearchBar from './TableSearchBar';
import TablePagination from './TablePagination';
import Experience_ManagerTable from './Experience-ManagerTable';
import axios from 'axios';

interface ExperienceManager {
  // เปลี่ยนชื่อ Interface ให้สื่อความหมาย
  id: number;
  fullName: string;
  email: string;
  status: 'ENABLE' | 'DISABLE';
}

export default function EditExperience_ManagerTable({
  accessToken,
}: {
  accessToken: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<ExperienceManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'fullName' | 'email'>('fullName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageIndex, setPageIndex] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const api = useMemo(() => {
    if (!accessToken) return null;
    return axios.create({
      baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }, [accessToken]);

  const fetchExperienceManagers = useCallback(async () => {
    if (!api) {
      setError('Authentication token not available.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users?role=EXPERIENCE_MANAGER');
      setUsers(
        res.data.map((u: any) => ({
          id: u.id,
          fullName: u.name,
          email: u.email,
          status: u.status,
        }))
      );
    } catch (err: any) {
      console.error('Error fetching experience managers:', err);
      setError(
        err.response?.data?.message || err.message || 'Failed to load data.'
      );
      Swal.fire('ผิดพลาด', 'โหลดข้อมูลผู้จัดการเล่มบันทึกไม่สำเร็จ', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchExperienceManagers();
  }, [fetchExperienceManagers]);

  const filtered = useMemo(() => {
    const f = search.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(f) ||
        u.email.toLowerCase().includes(f)
    );
  }, [users, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = a[sortBy].toLowerCase();
      const vb = b[sortBy].toLowerCase();
      const cmp = va.localeCompare(vb, 'th', { numeric: true });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortBy, sortOrder]);

  const totalPages = Math.ceil(sorted.length / perPage) || 1;
  const paged = useMemo(() => {
    const start = pageIndex * perPage;
    return sorted.slice(start, start + perPage);
  }, [sorted, pageIndex, perPage]);

  const toggleSort = (col: 'fullName' | 'email') => {
    if (sortBy === col) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
    setPageIndex(0);
  };

  const handleEdit = (id: number) => {
    // หน้านี้ยังไม่มีการแก้ไขรายบุคคล ถ้ามี ต้องสร้าง Path และ Page แยกต่างหาก
    // หรือจะทำ Modal popup สำหรับแก้ไขก็ได้
    router.push(`/admin/edituser/experience-manager/${id}`);
    Swal.fire(
      'แจ้งเตือน',
      'ฟังก์ชันแก้ไขสำหรับผู้จัดการเล่มยังไม่ถูก Implement',
      'info'
    );
  };

  const handleDelete = async (id: number) => {
    if (!api) {
      // ตรวจสอบ api instance (ซึ่งสร้างจาก accessToken)
      Swal.fire(
        'ข้อผิดพลาด',
        'Session หมดอายุหรือไม่พบ Authentication Token',
        'error'
      );
      return;
    }

    const confirmResult = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: 'คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้นี้? การกระทำนี้ไม่สามารถย้อนกลับได้!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก',
    });

    if (confirmResult.isConfirmed) {
      try {
        // ใช้ api instance ที่มี Authorization header อยู่แล้ว
        const res = await api.delete(`/users/${id}`);

        // ไม่จำเป็นต้องเช็ค res.ok ถ้า axios ไม่โยน error ออกมา แสดงว่าสำเร็จ
        // axios จะโยน error โดยอัตโนมัติถ้า status code เป็น 4xx หรือ 5xx

        setUsers((currentUsers) =>
          currentUsers.filter((user) => user.id !== id)
        );
        Swal.fire('ลบสำเร็จ!', 'ผู้ใช้ถูกลบออกจากระบบเรียบร้อยแล้ว', 'success');
      } catch (err: any) {
        console.error('Error deleting user:', err);
        Swal.fire(
          'เกิดข้อผิดพลาด!',
          err.response?.data?.message ||
            'ไม่สามารถลบผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง',
          'error'
        );
      }
    }
  };

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    const cur = pageIndex + 1;
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (cur > 3) pages.push('...');
      for (
        let i = Math.max(2, cur - 1);
        i <= Math.min(totalPages - 1, cur + 1);
        i++
      )
        pages.push(i);
      if (cur < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading) return <div className="p-10 text-center">Loading data...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 space-y-6">
      <TableSearchBar
        search={search}
        setSearch={setSearch}
        perPage={perPage}
        setPerPage={(n) => {
          setPerPage(n);
          setPageIndex(0);
        }}
        setPage={(n) => setPageIndex(n - 1)} // แก้ไข setPage
        totalCount={users.length}
        filteredCount={filtered.length}
      />

      <Experience_ManagerTable
        data={paged}
        pageIndex={pageIndex}
        pageSize={perPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        setData={setUsers}
        toggleSort={toggleSort}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />

      <div className="text-sm text-gray-700 dark:text-gray-300">
        แสดง {paged.length} จาก {filtered.length} รายการ (ทั้งหมด {users.length}{' '}
        รายการ)
      </div>

      <TablePagination
        pageIndex={pageIndex}
        setPageIndex={setPageIndex}
        totalPages={totalPages}
        getPageNumbers={getPageNumbers}
      />
    </div>
  );
}
