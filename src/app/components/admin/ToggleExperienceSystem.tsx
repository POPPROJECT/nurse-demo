"use client";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { FaCog } from "react-icons/fa"; // Import icon for visual flair

export default function ToggleExperienceSystem({
  accessToken,
}: {
  accessToken: string;
}) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // --- ส่วนของ Logic ไม่ต้องแก้ไข เพราะทำงานได้ดีอยู่แล้ว ---
  const api = useMemo(() => {
    if (!accessToken) return null;
    return axios.create({
      baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }, [accessToken]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!api) {
        console.error(
          "[ToggleExperienceSystem] No accessToken, cannot fetch status.",
        );
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get("/admin/settings/get-status");
        setEnabled(res.data.enabled);
      } catch (err: any) {
        console.error("❌ ไม่สามารถโหลดสถานะระบบนับประสบการณ์ได้:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [api]);

  const handleToggle = async () => {
    if (loading || toggling || !api) return;
    setToggling(true);
    try {
      const res = await api.post("/admin/settings/toggle-counting");
      setEnabled(res.data.enabled);
      Swal.fire(
        "สำเร็จ",
        `ระบบนับประสบการณ์ถูก ${res.data.enabled ? "เปิด" : "ปิด"} ใช้งานแล้ว`,
        "success",
      );
    } catch (err: any) {
      console.error("❌ ไม่สามารถเปลี่ยนสถานะระบบนับประสบการณ์ได้:", err);
      Swal.fire(
        "ผิดพลาด",
        err.response?.data?.message || "ไม่สามารถเปลี่ยนสถานะระบบได้",
        "error",
      );
    } finally {
      setToggling(false);
    }
  };

  // --- เริ่มส่วน UI ที่ออกแบบใหม่ ---
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
          <FaCog className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>

        {/* Title and Description */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            สถานะระบบนับประสบการณ์
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            เปิดหรือปิดการนับชั่วโมงประสบการณ์ของนิสิตทั้งระบบ
          </p>
        </div>
      </div>

      {/* Status and Toggle Switch */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          {/* Status Indicator Dot */}
          <span
            className={`w-3 h-3 rounded-full ${enabled ? "bg-green-500" : "bg-gray-400"}`}
          ></span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            สถานะปัจจุบัน:{" "}
            {loading ? "กำลังโหลด..." : enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
          </span>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading || toggling}
          className={`relative inline-flex items-center h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-wait
            ${enabled ? "bg-green-600" : "bg-gray-300 dark:bg-slate-600"}`}
        >
          <span className="sr-only">Use setting</span>
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
              ${enabled ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
      </div>
    </div>
  );
}
