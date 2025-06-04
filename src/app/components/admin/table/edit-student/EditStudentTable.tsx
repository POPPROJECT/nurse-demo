'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import TableSearchBar from './TableSearchBar';
import TableDisplay from './TableDisplay';
import TablePagination from './TablePagination';
import { useAuth } from '@/app/contexts/AuthContext';

interface User {
  id: number;
  studentId: string;
  fullName: string;
  email: string;
  status: 'ENABLE' | 'DISABLE';
}

export default function EditStudentTable() {
  const { accessToken } = useAuth(); // ✅ ใช้ accessToken จาก context
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
    const fetchInitialUsers = async () => {
      // ✅ เปลี่ยนชื่อฟังก์ชันให้สื่อความหมาย
      try {
        // 🎯 ตรวจสอบการเรียก API นี้
        // ถ้า API นี้ต้องใช้ Token ให้แน่ใจว่าส่งไปใน Header อย่างถูกต้อง
        // ถ้าใช้ Axios Instance ที่ตั้งค่า Interceptor ไว้แล้ว มันควรจะทำงานอัตโนมัติ
        // ถ้าใช้ fetch โดยตรง ต้องมั่นใจว่าใส่ credentials: 'include' หรือ Authorization header
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users?role=STUDENT`,
          {
            method: 'GET', // ระบุ method ให้ชัดเจน (ถึงแม้ GET จะเป็น default)
            headers: accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : {}, // ส่ง Token ถ้ามี
            // credentials: 'include', // ใช้ credentials หรือ Authorization header อย่างใดอย่างหนึ่ง
          }
        );

        if (!res.ok) {
          // ถ้าเกิด Error (เช่น 401) ให้แสดง Error แต่ "ห้าม" Redirect
          const errorData = await res
            .json()
            .catch(() => ({ message: 'Failed to parse error response' }));
          console.error(
            'Error fetching students in EditStudentTable:',
            res.status,
            errorData
          );
          Swal.fire(
            'ผิดพลาด',
            `โหลดข้อมูลนิสิตไม่สำเร็จ (Status: ${res.status}): ${
              errorData.message || 'Unknown error'
            }`,
            'error'
          );
          setUsers([]); // อาจจะ set เป็น [] หรือแสดงสถานะ Error ใน UI
          return; // ออกจากฟังก์ชัน
        }

        const data = await res.json();
        setUsers(
          data.map((u: any) => ({
            id: u.id,
            studentId: u.studentProfile?.studentId ?? '',
            fullName: u.name,
            email: u.email,
            status: u.status ?? 'ENABLED', // ควรจะเป็น ENABLE หรือ DISABLE ตาม Enum
          }))
        );
      } catch (err) {
        console.error('Exception fetching students in EditStudentTable:', err);
        Swal.fire(
          'ผิดพลาด',
          'โหลดข้อมูลนิสิตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
          'error'
        );
        setUsers([]);
      }
    };

    fetchInitialUsers();
  }, [accessToken]);

  const deleteUser = async (id: number) => {
    // ตรวจสอบว่ามี accessToken หรือไม่ (ถ้าใช้ AuthContext หรือ Prop)
    if (!accessToken) {
      // accessToken นี้ต้องถูกส่งเข้ามาใน Component หรือดึงจาก Context
      Swal.fire(
        'ข้อผิดพลาด',
        'ไม่พบ Authentication Token กรุณา Login ใหม่',
        'error'
      );
      return;
    }

    const confirm = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: 'คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้นี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก',
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`, // ✅ ส่ง Token ใน Header
            // 'Content-Type': 'application/json', // ไม่จำเป็นสำหรับ DELETE ที่ไม่มี body
          },
          // credentials: 'include', // ไม่จำเป็นแล้วถ้าส่ง Token ใน Header
        }
      );

      if (!res.ok) {
        let errorMessage = 'ลบไม่สำเร็จ';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || `เกิดข้อผิดพลาด: ${res.status}`;
        } catch (e) {
          // ถ้า response ไม่ใช่ JSON หรือมีปัญหาในการ parse
          errorMessage = `เกิดข้อผิดพลาด: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage); // โยน Error พร้อม Message ที่ได้จาก Backend
      }

      // ถ้าสำเร็จ ลบ user ออกจาก state ใน UI
      setUsers((prev) => prev.filter((u) => u.id !== id)); // สมมติว่ามีฟังก์ชัน setUsers
      Swal.fire('ลบสำเร็จ!', 'ผู้ใช้ถูกลบเรียบร้อยแล้ว', 'success');
    } catch (err: any) {
      // รับ err เป็น any เพื่อเข้าถึง message
      console.error('Error deleting user:', err);
      Swal.fire(
        'ผิดพลาด',
        err.message || 'ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
        'error'
      );
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
