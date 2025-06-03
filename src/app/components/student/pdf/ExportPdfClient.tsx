// frontend/src/app/components/student/export/ExportPdfClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ProgressPDFDocument } from '../pdf/ProgressPDFDocument'; // Path เดิมของ ProgressPDFDocument

// Types ที่จำเป็นสำหรับการดึงข้อมูล PDF
type FieldConfig = { id: number; label: string };
type FieldValue = { fieldId: number; value: string };
type Experience = {
  course: string;
  subCourse?: string;
  subject?: number;
  alwaycourse?: number;
  fieldValues: FieldValue[];
  approverName: string;
};

interface ExportPdfClientProps {
  accessToken: string;
  bookId: number;
  bookTitle: string;
}

export default function ExportPdfClient({
  accessToken,
  bookId,
  bookTitle,
}: ExportPdfClientProps) {
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [loadingPdfData, setLoadingPdfData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  useEffect(() => {
    const fetchPdfData = async () => {
      setLoadingPdfData(true);
      setError(null);
      try {
        // Fetch field configuration (หัวตาราง PDF)
        const { data: fieldCfg } = await axios.get<FieldConfig[]>(
          `${BASE}/experience-books/${bookId}/fields`,
          authHeader
        );
        setFields(fieldCfg);

        // Fetch ประวัติที่ status=CONFIRMED ทั้งหมด
        const { data: expPage } = await axios.get<{
          total: number;
          data: Experience[];
        }>(`${BASE}/student-experiences`, {
          ...authHeader,
          params: {
            bookId: bookId,
            status: 'CONFIRMED',
            page: 1,
            limit: 1000,
          },
        });
        setExperiences(expPage.data);

        // Fetch ข้อมูลนิสิต (สมมติ endpoint นี้คืน studentProfile)
        const { data: profile } = await axios.get<{
          studentId: string;
          user: { name: string };
        }>(`${BASE}/users/me/profile`, authHeader);
        setUserName(profile.user.name);
        setStudentId(profile.studentId);
      } catch (err) {
        console.error('Error fetching PDF data:', err);
        Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลสำหรับ PDF ได้', 'error');
        setError('ไม่สามารถโหลดข้อมูลสำหรับ PDF ได้');
      } finally {
        setLoadingPdfData(false);
      }
    };

    fetchPdfData();
  }, [accessToken, bookId, BASE]);

  if (loadingPdfData) {
    return (
      <div className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400">
        <svg
          className="w-5 h-5 mr-3 -ml-1 text-indigo-500 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        กำลังเตรียมข้อมูล PDF...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 text-center text-red-500 dark:text-red-400">
        {error}
      </div>
    );
  }

  // พร้อมให้ดาวน์โหลด
  return (
    <div className="text-center">
      <PDFDownloadLink
        document={
          <ProgressPDFDocument
            userName={userName}
            studentId={studentId}
            bookTitle={bookTitle}
            fields={fields}
            experiences={experiences}
          />
        }
        fileName={`progress_${studentId}_${bookTitle.replace(
          /\s/g,
          '_'
        )}_${bookId}.pdf`}
        className="inline-block px-4 py-2 text-white transition-colors duration-200 bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        {({ loading }) =>
          loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2 -ml-1 text-white animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              กำลังสร้าง PDF...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              ดาวน์โหลด PDF
            </span>
          )
        }
      </PDFDownloadLink>
    </div>
  );
}
