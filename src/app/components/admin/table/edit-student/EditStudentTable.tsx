'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import TableSearchBar from './TableSearchBar';
import TableDisplay from './TableDisplay';
import TablePagination from './TablePagination';

interface User {
  id: number;
  studentId: string;
  fullName: string;
  email: string;
  status: 'ENABLE' | 'DISABLE';
}

export default function EditStudentTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'fullName' | 'email' | 'studentId'>(
    'studentId'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageIndex, setPageIndex] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users?role=STUDENT`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(
          data.map((u: any) => ({
            id: u.id,
            studentId: u.studentProfile?.studentId ?? '',
            fullName: u.name,
            email: u.email,
            status: u.status ?? 'ENABLED',
          }))
        );
      })

      .catch(() => Swal.fire('ผิดพลาด', 'โหลดข้อมูลไม่สำเร็จ', 'error'));
  }, []);

  const deleteUser = async (id: number) => {
    const confirm = await Swal.fire({
      title: 'ยืนยันการลบ?',
      icon: 'warning',
      showCancelButton: true,
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u.id !== id));
      Swal.fire('ลบสำเร็จ', '', 'success');
    } catch {
      Swal.fire('ผิดพลาด', 'ลบไม่สำเร็จ', 'error');
    }
  };

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
      let va = a[sortBy];
      let vb = b[sortBy];

      if (sortBy === 'studentId') {
        // ถ้า studentId เป็นตัวเลขใน string ให้แปลงเป็นตัวเลขก่อนเปรียบเทียบ
        return sortOrder === 'asc'
          ? Number(va) - Number(vb)
          : Number(vb) - Number(va);
      }

      // fullName, email → ใช้ localeCompare
      const cmp = va.toLowerCase().localeCompare(vb.toLowerCase(), 'th', {
        numeric: true,
      });
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

  return (
    <div className="space-y-6">
      <TableSearchBar
        search={search}
        setSearch={setSearch}
        perPage={perPage}
        setPerPage={(n) => {
          setPerPage(n);
          setPageIndex(0);
        }}
        setPage={(n) => {
          setPage(n);
          setPageIndex(n - 1);
        }}
        totalCount={users.length}
        filteredCount={filtered.length}
      />
      <TableDisplay data={paged} setData={setUsers} deleteUser={deleteUser} />
      <div className="text-sm text-gray-600 dark:text-gray-300">
        แสดง {paged.length} จาก {filtered.length} รายการ
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
