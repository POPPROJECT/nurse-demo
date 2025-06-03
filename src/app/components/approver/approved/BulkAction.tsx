import React from 'react';
import Swal from 'sweetalert2';

type Props = {
  selectedCount: number;
  onConfirmAll: (pin: string) => Promise<void>;
  onRejectAll: (pin: string) => Promise<void>;
};

export default function BulkActions({
  selectedCount,
  onConfirmAll,
  onRejectAll,
}: Props) {
  const askPinAndRun = async (
    fn: (pin: string) => Promise<void>,
    actionText: string
  ) => {
    const { isConfirmed, value } = await Swal.fire({
      title: `${actionText} ${selectedCount} รายการ`,
      text: `คุณแน่ใจจะ${actionText.toLowerCase()} ${selectedCount} รายการ?`,
      input: 'password',
      inputAttributes: { maxlength: '6', minlength: '6' },
      showCancelButton: true,
      confirmButtonText: actionText,
      icon: 'question',
    });
    if (!isConfirmed || !value) return;
    try {
      await fn(value);
    } catch (e: any) {
      const msg = e.response?.data?.message || 'เกิดข้อผิดพลาด';
      // ถ้าเป็นการกรอก PIN ผิด ให้เตือนแบบ warning ไม่ต้องดีดเป็น network error
      if (e.response?.status === 400 && msg.includes('PIN')) {
        Swal.fire({ icon: 'warning', title: 'PIN ไม่ถูกต้อง', text: msg });
      } else {
        Swal.fire('Error', msg, 'error');
      }
    }
  };

  return (
    <div className="p-6 mb-4  shadow-lg bg-white rounded-xl mt-3 dark:bg-[#1E293B]">
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <span className="px-4 py-2 text-sm text-blue-800 bg-blue-100 rounded-full">
          {selectedCount} รายการที่เลือก
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => askPinAndRun(onConfirmAll, 'ยืนยันทั้งหมด')}
            className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            ยืนยันทั้งหมด
          </button>
          <button
            onClick={() => askPinAndRun(onRejectAll, 'ปฏิเสธทั้งหมด')}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            ปฏิเสธทั้งหมด
          </button>
        </div>
      </div>
    </div>
  );
}
