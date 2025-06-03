'use client';
import React, { useEffect, useState } from 'react';
import { RowData, SkippedEntry } from 'lib/type';

interface Props {
  successList: RowData[];
  skipped: SkippedEntry[];
  onUndo: () => void;
}

export default function ImportResult({ successList, skipped, onUndo }: Props) {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* ✅ Success Box */}
      {successList.length > 0 && (
        <div className="p-4 border border-green-200 rounded-lg shadow bg-green-50">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-green-700">
              ✅ นำเข้าสำเร็จ {successList.length} รายการ
            </p>
            <button
              onClick={onUndo}
              className="px-3 py-1 text-sm text-red-600 bg-white border border-red-300 rounded hover:bg-red-50"
            >
              🗑 ยกเลิกการนำเข้าล่าสุด ({countdown}s)
            </button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm bg-white border border-gray-200 rounded">
              <thead className="text-gray-700 bg-gray-100">
                <tr>
                  <th className="p-2 border">ชื่อ</th>
                  <th className="p-2 border">อีเมล</th>
                  <th className="p-2 border">รหัสนิสิต</th>
                  <th className="p-2 border">Provider</th>
                  <th className="p-2 border">Role</th>
                </tr>
              </thead>
              <tbody>
                {successList.map((u, i) => (
                  <tr key={i} className="text-gray-800">
                    <td className="p-2 border">{u.name}</td>
                    <td className="p-2 border">{u.email}</td>
                    <td className="p-2 border">{u.studentId || '-'}</td>
                    <td className="p-2 border">{u.provider}</td>
                    <td className="p-2 border">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ❌ Failed Box */}
      {skipped.length > 0 && (
        <div className="p-4 border border-red-200 rounded-lg shadow bg-red-50">
          <h3 className="mb-2 font-semibold text-red-700">
            ❌ รายการที่ไม่สามารถนำเข้าได้
          </h3>
          <div className="overflow-auto">
            <table className="w-full text-sm bg-white border border-red-300 rounded">
              <thead className="text-red-800 bg-red-100">
                <tr>
                  <th className="p-2 border">ชื่อ</th>
                  <th className="p-2 border">อีเมล</th>
                  <th className="p-2 border">รหัสนิสิต</th>
                  <th className="p-2 border">Provider</th>
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">สาเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {skipped.map((s, i) => (
                  <tr key={i}>
                    <td className="p-2 border">{s.name}</td>
                    <td className="p-2 border">{s.email}</td>
                    <td className="p-2 border">{s.studentId || '-'}</td>
                    <td className="p-2 border">{s.provider}</td>
                    <td className="p-2 border">{s.role}</td>
                    <td className="p-2 border">{s.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
