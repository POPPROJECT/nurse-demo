"use client";
import React, { useRef } from "react";

interface Props {
  currentStep: 1 | 2 | 3;
  fileName: string | null;
  onFileSelectAction: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFileAction: () => void;
}

export default function UploadPanel({
  currentStep,
  fileName,
  onFileSelectAction,
  onRemoveFileAction,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { title: "อัพโหลดไฟล์", desc: "เลือกไฟล์ Excel" },
    { title: "ตรวจสอบข้อมูล", desc: "ตรวจสอบความถูกต้อง" },
    { title: "นำเข้าข้อมูล", desc: "ยืนยันการนำเข้า" },
  ];

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelectAction(e);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    onRemoveFileAction();
  };

  return (
    <div className="space-y-8">
      {/* ✅ หัวข้อและ Step Indicator แสดงตลอด */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-800">
          นำเข้าบัญชีผู้ใช้งาน
        </h1>
        <p className="text-sm text-gray-500">
          อัปโหลดไฟล์ Excel เพื่อนำเข้าข้อมูลผู้ใช้งานในระบบ
        </p>
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, i) => {
              const isActive = currentStep === i + 1;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center w-1/3 text-center"
                >
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full font-semibold ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div
                    className={`mt-2 font-medium ${
                      isActive ? "text-blue-900" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-sm text-gray-500">{step.desc}</div>
                </div>
              );
            })}
          </div>
          <div className="h-1 bg-gray-200 rounded-full">
            <div
              className="h-1 transition-all duration-300 bg-blue-600 rounded-full"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ✅ ถ้ามีไฟล์: แสดงชื่อไฟล์ */}
      {fileName ? (
        <div className="flex items-center justify-between p-4 bg-white shadow-sm rounded-xl">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              เปลี่ยนไฟล์
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleSelectFile}
          />
        </div>
      ) : (
        // ✅ ถ้ายังไม่มีไฟล์: แสดงส่วน Upload ปกติ
        <div className="p-6 bg-white shadow-sm rounded-xl">
          <div className="flex flex-col mb-6 md:flex-row md:items-center md:justify-between">
            <h2 className="mb-4 text-xl font-semibold md:mb-0">อัพโหลดไฟล์</h2>
            <div className="flex flex-wrap gap-2">
              {[
                "STUDENT",
                "APPROVER_IN",
                "APPROVER_OUT",
                "EXPERIENCE_MANAGER",
              ].map((role) => {
                const labelMap = {
                  STUDENT: "นิสิต",
                  APPROVER_IN: "ผู้อนุมัติภายใน",
                  APPROVER_OUT: "ผู้อนุมัติภายนอก",
                  EXPERIENCE_MANAGER: "ผู้จัดการเล่ม",
                };

                const colorClassMap = {
                  STUDENT:
                    "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
                  APPROVER_IN:
                    "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100",
                  APPROVER_OUT:
                    "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
                  EXPERIENCE_MANAGER:
                    "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
                };

                return (
                  <button
                    key={role}
                    onClick={() =>
                      window.open(
                        `/template/${role.toLowerCase()}-template.xlsx`,
                        "_blank",
                      )
                    }
                    className={`px-3 py-1.5 text-sm rounded-lg border flex items-center ${
                      colorClassMap[role as keyof typeof colorClassMap]
                    }`}
                  >
                    ⬇ Template {labelMap[role as keyof typeof labelMap]}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 transition border-2 border-gray-300 border-dashed cursor-pointer upload-area rounded-xl hover:border-blue-500 hover:bg-blue-50"
          >
            <svg
              className="w-16 h-16 mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mb-2 font-medium text-center text-gray-700">
              ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์
            </p>
            <p className="text-sm text-gray-500">รองรับไฟล์ .xlsx เท่านั้น</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleSelectFile}
            />
          </div>
        </div>
      )}
    </div>
  );
}
