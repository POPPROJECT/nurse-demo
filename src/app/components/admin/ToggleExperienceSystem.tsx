'use client';
import { useEffect, useState } from 'react';

export default function ToggleExperienceSystem() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/settings/get-status`,
          {
            credentials: 'include',
          }
        );
        const data = await res.json();
        setEnabled(data.enabled);
      } catch {
        console.error('❌ ไม่สามารถโหลดสถานะได้');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/settings/toggle-counting`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      const data = await res.json();
      setEnabled(data.enabled);
    } catch {
      alert('❌ ไม่สามารถเปลี่ยนสถานะระบบนับประสบการณ์ได้');
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
