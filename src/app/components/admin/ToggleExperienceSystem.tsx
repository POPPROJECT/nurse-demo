'use client';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';

export default function ToggleExperienceSystem({
  accessToken,
}: {
  accessToken: string;
}) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // ✅ สร้าง Axios instance ที่มี Authorization header
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

  useEffect(() => {
    const fetchStatus = async () => {
      if (!api) {
        // ✅ ถ้ายังไม่มี api instance (เพราะไม่มี accessToken)
        console.error(
          '[ToggleExperienceSystem] No accessToken, cannot fetch status.'
        );
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get('/admin/settings/get-status'); // ใช้ api instance
        setEnabled(res.data.enabled);
      } catch (err: any) {
        console.error('❌ ไม่สามารถโหลดสถานะระบบนับประสบการณ์ได้:', err);
        Swal.fire(
          'ผิดพลาด',
          err.response?.data?.message || 'ไม่สามารถโหลดสถานะได้',
          'error'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [api]);

  const handleToggle = async () => {
    if (toggling || !api) return; // ✅ ตรวจสอบ api instance
    setToggling(true);
    try {
      const res = await api.post('/admin/settings/toggle-counting'); // ใช้ api instance
      setEnabled(res.data.enabled);
      Swal.fire(
        'สำเร็จ',
        `ระบบนับประสบการณ์ถูก${res.data.enabled ? 'เปิด' : 'ปิด'}ใช้งานแล้ว`,
        'success'
      );
    } catch (err: any) {
      console.error('❌ ไม่สามารถเปลี่ยนสถานะระบบนับประสบการณ์ได้:', err);
      Swal.fire(
        'ผิดพลาด',
        err.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะระบบได้',
        'error'
      );
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-4">
        <span className="font-semibold dark:text-white">
          ระบบนับประสบการณ์:
        </span>
        <button
          onClick={handleToggle}
          disabled={loading || toggling}
          className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium shadow transition
            ${
              enabled
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-red-500 hover:bg-red-600'
            } text-white`}
        >
          {enabled ? '✅ เปิดใช้งาน' : '❌ ปิดการใช้งาน'}
        </button>
      </div>
    </div>
  );
}
