"use client";
import React, { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import Swal from "sweetalert2";
import axios from "axios";
import { RowData, SkippedEntry } from "lib/type";
import UploadPanel from "@/app/components/admin/ImportUser/UploadPanel";
import SummarySection from "@/app/components/admin/ImportUser/SummarySection";
import PreviewTable from "@/app/components/admin/ImportUser/PreviewTable";
import ImportResult from "@/app/components/admin/ImportUser/ImportResult";
import { useAuth } from "@/app/contexts/AuthContext";

export default function ImportUserPage() {
  const { accessToken, session: authUser } = useAuth();
  const [rows, setRows] = useState<RowData[]>([]);
  const [successList, setSuccessList] = useState<RowData[]>([]);
  const [skippedList, setSkippedList] = useState<SkippedEntry[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "invalid">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [skippedMerged, setSkippedMerged] = useState<SkippedEntry[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    if (typeof accessToken === "string" || accessToken === null) {
      setIsPageLoading(false);
      if (!accessToken && !authUser) {
        setPageError("Session not available or expired. Please login again.");
      }
    }
  }, [accessToken, authUser]);

  const validateRow = (row: RowData): boolean => {
    if (
      !row.name ||
      (typeof row.name === "object" &&
        (!row.name.firstName || !row.name.lastName)) ||
      !row.email ||
      !row.role ||
      !row.provider
    )
      return false;
    if (
      ["APPROVER_OUT", "EXPERIENCE_MANAGER"].includes(row.role) &&
      !row.password
    )
      return false;
    if (row.role === "STUDENT") {
      if (!/^\d{8}$/.test(row.studentId || "")) return false;
      if (!row.email.endsWith("@nu.ac.th")) return false;
    }
    if (row.role === "APPROVER_IN") {
      if (!row.email.endsWith("@nu.ac.th")) return false;
    }
    return true;
  };

  const filteredRows = rows.filter((row) => {
    const isValidRow = validateRow(row);
    if (filterStatus === "valid" && !isValidRow) return false;
    if (filterStatus === "invalid" && isValidRow) return false;

    const searchTerm = search.toLowerCase();
    return (
      (typeof row.name === "string"
        ? row.name.toLowerCase()
        : `${row.name?.prefix || ""}${row.name?.firstName || ""}${
            row.name?.lastName || ""
          }`.toLowerCase()
      ).includes(searchTerm) ||
      (row.email?.toLowerCase() || "").includes(searchTerm) ||
      (row.studentId?.toLowerCase() || "").includes(searchTerm)
    );
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const worksheet = workbook.worksheets[0];

    // ✅ ดึง header แบบแม่นยำ ป้องกัน null/undefined
    const headerRow = worksheet.getRow(1);
    const headerValues = Array.isArray(headerRow.values)
      ? headerRow.values.slice(1)
      : [];
    const headers: string[] = headerValues.map((cell) =>
      String(cell || "")
        .toLowerCase()
        .trim(),
    );

    const data: RowData[] = [];

    // ✅ ใช้ .getCell() เพื่อไม่ให้ค่าหลุด
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // skip header

      const rowData: any = {};
      headers.forEach((key: string, colIndex: number) => {
        const val = row.getCell(colIndex + 1).value;

        if (["prefix", "firstname", "lastname"].includes(key)) {
          if (!rowData.name) rowData.name = {};
          rowData.name[key === "firstname" ? "firstName" : key] = val
            ? String(val).trim()
            : "";
        } else if (key === "role") {
          rowData.role = String(val ?? "").toUpperCase();
        } else if (key === "provider") {
          rowData.provider = String(val ?? "").toUpperCase();
        } else if (key === "studentid") {
          rowData.studentId = val ? String(val).trim() : undefined;
        } else {
          rowData[key] = val ? String(val).trim() : undefined;
        }
      });

      data.push(rowData);
    });

    const duplicates = data.filter(
      (r, i, arr) => arr.findIndex((x) => x.email === r.email) !== i,
    );
    if (duplicates.length > 0) {
      Swal.fire({
        icon: "error",
        title: "พบอีเมลซ้ำในไฟล์",
        html: duplicates.map((d) => `<div>${d.email}</div>`).join(""),
      });
      return;
    }

    setRows(data);
    setIsValid(data.every(validateRow));
    setSuccessList([]);
    setSkippedList([]);
    setCurrentPage(1);
    e.target.value = ""; // allow re-upload of same file
  };

  const handleRemoveFile = () => {
    setFileName(null);
    setRows([]);
    setIsValid(true);
    setSuccessList([]);
    setSkippedList([]);
  };

  const handleImport = async () => {
    if (!accessToken) {
      Swal.fire(
        "ข้อผิดพลาด",
        "Session หมดอายุหรือไม่พบ Token กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
        "error",
      );
      return;
    }
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/import`,
        { users: rows.filter(validateRow) },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const skippedRaw: SkippedEntry[] = res.data?.skippedEmails ?? [];

      // 🔁 รวมข้อมูลจาก original rows + reason
      const merged = skippedRaw.map((s) => {
        const full = rows.find((r) => r.email === s.email);
        const fullName =
          typeof full?.name === "string"
            ? full.name
            : `${full?.name?.prefix || ""}${full?.name?.firstName || ""} ${
                full?.name?.lastName || ""
              }`.trim();

        return {
          name: fullName,
          studentId: full?.studentId,
          provider: full?.provider,
          role: full?.role,
          email: s.email,
          reason: s.reason,
        };
      });

      const successful = rows.filter(
        (r) => !skippedRaw.some((s) => s.email === r.email),
      );
      setSuccessList(successful);
      setSkippedMerged(merged);
      setSkippedList(skippedRaw);
      Swal.fire(
        "นำเข้าสำเร็จ",
        `สำเร็จ ${successful.length} / พลาด ${skippedRaw.length}`,
        "success",
      );
      setRows([]);
      setFileName(null);
    } catch (err: any) {
      console.error("Import error:", err);
      Swal.fire(
        "ผิดพลาด",
        err.response?.data?.message ||
          "ไม่สามารถนำเข้าข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        "error",
      );
    }
  };

  const handleUndo = async () => {
    if (!accessToken) {
      Swal.fire(
        "ข้อผิดพลาด",
        "Session หมดอายุหรือไม่พบ Token กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
        "error",
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "ยกเลิกการนำเข้าล่าสุด?",
      text: "ระบบจะลบผู้ใช้ที่เพิ่งนำเข้า",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });
    if (!confirm.isConfirmed) return;

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/import/undo`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      setSuccessList([]);
      setSkippedList([]);
      setSkippedMerged([]);
      Swal.fire("สำเร็จ", "ลบข้อมูลที่นำเข้าเรียบร้อยแล้ว", "success");
    } catch (err: any) {
      console.error("Undo error:", err);
      Swal.fire(
        "ผิดพลาด",
        err.response?.data?.message || "ไม่สามารถยกเลิกการนำเข้าได้",
        "error",
      );
    }
  };

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  if (isPageLoading)
    return <div className="p-10 text-center">Loading session...</div>;
  if (pageError)
    return (
      <div className="p-10 text-center text-red-500">Error: {pageError}</div>
    );
  if (!accessToken && !authUser) {
    return (
      <div>
        Authentication required. Please{" "}
        <a href="/" className="underline">
          Login
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 space-y-8 bg-gray-50">
      <UploadPanel
        currentStep={
          rows.length > 0
            ? 2
            : successList.length > 0 || skippedList.length > 0
              ? 3
              : 1
        }
        fileName={fileName}
        onFileSelectAction={handleFileUpload}
        onRemoveFileAction={handleRemoveFile}
      />

      {rows.length > 0 && (
        <>
          <SummarySection
            total={rows.length}
            valid={rows.filter(validateRow).length}
            invalid={rows.filter((r) => !validateRow(r)).length}
            userType={
              rows[0].role === "STUDENT"
                ? "นิสิต"
                : rows[0].role === "APPROVER_IN"
                  ? "ผู้อนุมัติภายใน"
                  : rows[0].role === "APPROVER_OUT"
                    ? "ผู้อนุมัติภายนอก"
                    : "ผู้จัดการเล่ม"
            }
            onSearch={setSearch}
            onFilterChange={setFilterStatus}
            onConfirm={handleImport}
            isValid={isValid}
          />
          <PreviewTable
            rows={paginatedRows}
            validateRow={validateRow}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {(successList.length > 0 || skippedList.length > 0) && (
        <ImportResult
          successList={successList}
          skipped={skippedMerged}
          onUndoAction={handleUndo}
        />
      )}
    </div>
  );
}
