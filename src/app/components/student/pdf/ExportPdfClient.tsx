"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";

interface ExportButtonProps {
  accessToken: string;
  bookId: number;
  bookTitle: string;
}

export default function ExportPdfClient({
  accessToken,
  bookId,
  bookTitle,
}: ExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/export/progress-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId, accessToken }),
      });

      if (!response.ok) {
        throw new Error("Server failed to generate PDF");
      }

      // สร้าง Blob จาก response แล้วสร้าง URL เพื่อให้ user ดาวน์โหลด
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `progress_${bookTitle.replace(/\s/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export Error:", error);
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถสร้างไฟล์ PDF ได้", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isGenerating}
      className="inline-block w-full px-4 py-2 text-white transition-colors duration-200 bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-wait"
    >
      {isGenerating ? "กำลังสร้าง PDF..." : "ดาวน์โหลด PDF"}
    </button>
  );
}
