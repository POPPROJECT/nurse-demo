'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Session } from 'lib/session'; // ประเภทของ session ที่ส่งเข้ามาจาก parent component
import FilterBar from '@/app/components/experience-manager/CountsExperience/FilterBar';
import StudentTable from '@/app/components/experience-manager/CountsExperience/StudentTable';
import Pagination from '@/app/components/experience-manager/CountsExperience/Pagination';

interface CountsExperienceClientProps {
  session: Session; // รับ session ที่มี accessToken และข้อมูลผู้ใช้
}

export default function CountsExperienceClient({
  session,
}: CountsExperienceClientProps) {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!; // URL backend จาก environment variable

  // รายชื่อสมุดประสบการณ์ทั้งหมด
  const { accessToken } = session;
  const [books, setBooks] = useState<{ id: number; title: string }[]>([]);
  const [bookId, setBookId] = useState<number | string>(''); // สมุดที่เลือก
  const [search, setSearch] = useState(''); // คำค้นหา
  const [limit, setLimit] = useState(10); // จำนวนรายการต่อหน้า
  const [page, setPage] = useState(1); // หน้าปัจจุบัน
  const [sortBy, setSortBy] = useState<'studentId' | 'name' | 'percent'>(
    'studentId'
  ); // คอลัมน์ที่ใช้เรียง
  const [order, setOrder] = useState<'asc' | 'desc'>('asc'); // ลำดับการเรียง
  const [data, setData] = useState<any[]>([]); // ข้อมูลนิสิต
  const [total, setTotal] = useState(0); // จำนวนทั้งหมด

  // โหลดรายการสมุดบันทึกประสบการณ์ทั้งหมด เมื่อ component โหลด
  useEffect(() => {
    if (accessToken) {
      axios
        .get<{ id: number; title: string }[]>(`${BASE}/experience-books`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((r) => setBooks(r.data)) // บันทึกสมุดที่โหลดได้
        .catch((err) => {
          console.error('Error fetching books:', err); // แสดง error ถ้าโหลดไม่สำเร็จ
        });
    }
  }, [accessToken, BASE]); // ทำงานใหม่เมื่อ accessToken หรือ BASE เปลี่ยน

  // โหลดข้อมูลนิสิตทุกครั้งที่มีการเปลี่ยน filter, page หรือ sort
  useEffect(() => {
    // ถ้ายังไม่ได้เลือกสมุด จะล้างข้อมูลและไม่โหลด
    if (!bookId) {
      setData([]);
      setTotal(0);
      return;
    }

    if (session?.accessToken) {
      axios
        .get<{ total: number; data: any[] }>(
          `${BASE}/approver/check-students`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
            params: { bookId, page, limit, search, sortBy, order }, // ส่ง query parameters ไปกับ request
          }
        )
        .then((r) => {
          const responseData = r.data;
          // ตรวจสอบว่า response มีโครงสร้างตามที่คาดไว้
          if (
            responseData &&
            typeof responseData.total === 'number' &&
            Array.isArray(responseData.data)
          ) {
            setData(responseData.data); // บันทึกข้อมูลนิสิต
            setTotal(responseData.total); // บันทึกจำนวนทั้งหมด
          } else {
            console.error(
              'Unexpected data structure for student list from API:',
              responseData
            );
            setData([]);
            setTotal(0);
          }
        })
        .catch((err) => {
          console.error('Error fetching student data:', err); // โหลดล้มเหลว
          setData([]);
          setTotal(0);
        });
    }
  }, [bookId, page, limit, search, sortBy, order, session, BASE]); // รันใหม่เมื่อค่าที่ใช้ filter เปลี่ยน

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-7 sm:mt-0">
      {/* หัวข้อของหน้า */}
      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 ">
        <h1 className="text-xl font-semibold sm:text-2xl">
          ระบบรายงานผลของนิสิต
        </h1>
      </div>

      {/* ส่วนกรองข้อมูล */}
      <FilterBar
        books={books}
        selectedBook={bookId}
        setSelectedBook={(b) => {
          setBookId(b);
          setPage(1); // รีเซ็ตหน้าทุกครั้งที่เปลี่ยนสมุด
        }}
        search={search}
        setSearch={(s) => {
          setSearch(s);
          setPage(1); // รีเซ็ตหน้าทุกครั้งที่เปลี่ยนคำค้นหา
        }}
        limit={limit}
        setLimit={(n) => {
          setLimit(n);
          setPage(1); // รีเซ็ตหน้าทุกครั้งที่เปลี่ยนจำนวนต่อหน้า
        }}
      />

      {/* ตารางแสดงผลนิสิต */}
      <StudentTable
        data={data}
        sortBy={sortBy}
        order={order}
        onSort={(col) => {
          if (sortBy === col) {
            setOrder((o) => (o === 'asc' ? 'desc' : 'asc')); // สลับลำดับเรียง
          } else {
            setSortBy(col as 'studentId' | 'name' | 'percent'); // เปลี่ยนคอลัมน์เรียง
            setOrder('asc'); // เริ่มเรียงใหม่เป็น asc
          }
        }}
      />

      {/* แสดงจำนวนข้อมูลที่แสดงอยู่ */}
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        แสดง <span className="font-medium">{data.length}</span> จาก{' '}
        <span className="font-medium">{total}</span> รายการ
      </div>

      {/* ปุ่มเปลี่ยนหน้า */}
      <Pagination
        page={page}
        totalPages={Math.ceil(total / limit) || 1} // ถ้าไม่มีข้อมูลให้แสดง 1 หน้า
        setPage={setPage}
      />
    </div>
  );
}
