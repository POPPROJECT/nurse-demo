import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";

interface CourseInfo {
  id: number;
  name: string;
}

// --- TYPE DEFINITIONS ---
interface FieldValue {
  fieldId: number;
  value: string;
}
interface Experience {
  course: CourseInfo;
  subCourse?: CourseInfo;
  subject?: string | null;
  inSubjectCount?: number;
  alwaycourse?: number;
  fieldValues: FieldValue[];
  approverName: string;
}
interface PdfData {
  fields: { id: number; label: string }[];
  experiences: Experience[];
  bookTitle: string;
  userName: string;
  studentId: string;
}

// --- DATA FETCHING (เหมือนเดิม) ---
async function getPdfData(
  bookId: number,
  accessToken: string,
): Promise<PdfData> {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  const [fieldsRes, experiencesRes, bookRes, profileRes] = await Promise.all([
    fetch(`${BASE}/experience-books/${bookId}/fields`, authHeader),
    fetch(
      `${BASE}/student-experiences?bookId=${bookId}&status=CONFIRMED&limit=9999`,
      authHeader,
    ),
    fetch(`${BASE}/experience-books/${bookId}`, authHeader),
    fetch(`${BASE}/users/me/profile`, authHeader),
  ]);

  if (!fieldsRes.ok || !experiencesRes.ok || !bookRes.ok || !profileRes.ok) {
    throw new Error("Failed to fetch required data for PDF generation.");
  }

  const fields = await fieldsRes.json();
  const experiencesPage = await experiencesRes.json();
  const book = await bookRes.json();
  const profile = await profileRes.json();

  return {
    fields,
    experiences: experiencesPage.data,
    bookTitle: book.title,
    userName: profile.user.name,
    studentId: profile.studentId,
  };
}

// ✅ [เพิ่มใหม่] ฟังก์ชันสำหรับสร้าง Header เป็นรูปภาพ SVG
function createHeaderSvg(date: string, fontBase64: string): string {
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="50px" style="font-family: 'Sarabun', sans-serif; font-size: 10pt; color: #555;">
      <style>
        @font-face {
          font-family: 'Sarabun';
          src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
        }
      </style>
      
      <foreignObject x="0" y="0" width="50%" height="50px">
        <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: center; height: 100%; padding-left: 10px;">
          ข้อมูลเมื่อวันที่: ${date}
        </div>
      </foreignObject>
      
      <foreignObject x="50%" y="0" width="50%" height="50px">
        <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: center; justify-content: flex-end; height: 100%; padding-right: 10px;">
          หน้า <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      </foreignObject>
    </svg>
  `;
  // แปลง SVG เป็น Base64
  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`;
}

// ▼▼▼ [แก้ไข] ปรับปรุงการสร้าง HTML ทั้งหมดตามโครงสร้างที่ถูกต้อง ▼▼▼
function getHtmlContent(data: PdfData) {
  // 1. อ่านไฟล์ Logo และแปลงเป็น Base64 Data URI
  const imagePath = path.join(process.cwd(), "public", "NULOGO.png");
  const imageBuffer = fs.readFileSync(imagePath);
  const logoSrc = `data:image/png;base64,${imageBuffer.toString("base64")}`;

  // ▼▼▼ [แก้ไข] อ่านไฟล์ฟอนต์ THSarabunNew.ttf ▼▼▼
  const fontPath = path.join(process.cwd(), "public/fonts", "THSarabunNew.ttf");
  const fontBuffer = fs.readFileSync(fontPath);
  const fontSrc = `data:font/truetype;charset=utf-8;base64,${fontBuffer.toString("base64")}`;
  // ▲▲▲ [สิ้นสุดส่วนที่แก้ไข] ▲▲▲

  // ▼▼▼ [แก้ไข] ปรับปรุง Logic การเรียงข้อมูลให้สมบูรณ์ ▼▼▼
  const parseVersionString = (str: string | undefined): number[] => {
    if (!str) return [0, 0];
    const numbersOnly = str.match(/[\d.]+/g)?.[0] || "";
    return numbersOnly.split(".").map((num) => parseInt(num, 10) || 0);
  };

  const sorted = [...data.experiences].sort((a, b) => {
    // ใช้ .name จาก Object ในการเรียง
    const [aCourseMain] = parseVersionString(a.course.name);
    const [bCourseMain] = parseVersionString(b.course.name);
    if (aCourseMain !== bCourseMain) return aCourseMain - bCourseMain;

    const [aSubMain, aSubMinor] = parseVersionString(a.subCourse?.name);
    const [bSubMain, bSubMinor] = parseVersionString(b.subCourse?.name);
    if (aSubMain !== bSubMain) return aSubMain - bSubMain;
    if (aSubMinor !== bSubMinor) return aSubMinor - bSubMinor;
    return 0;
  });

  const caseCounter = new Map<string, number>();
  const experiencesWithCaseNumber = sorted.map((exp) => {
    // ใช้ .name จาก Object ในการสร้าง key
    const key = `${exp.course.name}_${exp.subCourse?.name}`;
    const count = (caseCounter.get(key) || 0) + 1;
    caseCounter.set(key, count);
    return { ...exp, caseNumber: count };
  });

  // 4. Logic การจัดกลุ่มตาม Course
  const grouped = experiencesWithCaseNumber.reduce<
    Record<string, (Experience & { caseNumber: number })[]>
  >((acc, exp) => {
    const courseName = exp.course.name; // ใช้ .name เป็น Key
    if (!acc[courseName]) acc[courseName] = [];
    acc[courseName].push(exp);
    return acc;
  }, {});

  // ▼▼▼ [แก้ไข] ปรับแก้ Logic การสร้างแถวตาราง ▼▼▼
  const tableRows = Object.entries(grouped)
    .map(([courseName, exps]) => {
      const courseHeaderRow = `
      <tr class="bg-slate-100 font-bold">
        <td class="p-2 border border-slate-300" colspan="${4 + data.fields.length + 1}">${courseName}</td>
      </tr>
    `;

      let lastSubCourseName: string | undefined | null = null;

      const subCourseRows = exps
        .map((exp: Experience & { caseNumber: number }) => {
          let currentSubCourseName = exp.subCourse?.name || "";

          let experienceCell = `<td class="p-2 border border-slate-300 pl-6">${currentSubCourseName}</td>`;
          let alwaycourseCell = `<td class="p-2 text-center border border-slate-300">${exp.alwaycourse || ""}</td>`;

          const parts = [];
          if (exp.subject) parts.push(exp.subject);
          if (exp.inSubjectCount != null) parts.push(exp.inSubjectCount);
          const inSubjectDisplayValue =
            parts.length > 0 ? parts.join(" / ") : "";
          let inSubjectCell = `<td class="p-2 text-center border border-slate-300">${inSubjectDisplayValue}</td>`;

          // เปรียบเทียบด้วย .name
          if (
            currentSubCourseName &&
            currentSubCourseName === lastSubCourseName
          ) {
            experienceCell = `<td class="p-2 border border-slate-300 pl-6"></td>`;
            inSubjectCell = `<td class="p-2 text-center border border-slate-300"></td>`;
            alwaycourseCell = `<td class="p-2 text-center border border-slate-300"></td>`;
          }
          lastSubCourseName = currentSubCourseName;

          return `
            <tr>
              ${experienceCell}
              ${inSubjectCell}
              ${alwaycourseCell}
              <td class="p-2 text-center border border-slate-300">${exp.caseNumber}</td>
              ${data.fields
                .map((f) => {
                  const value =
                    exp.fieldValues.find((fv) => fv.fieldId === f.id)?.value ||
                    "";
                  return `<td class="p-2 text-center border border-slate-300">${value}</td>`;
                })
                .join("")}
              <td class="p-2 border border-slate-300">${exp.approverName}</td>
            </tr>
          `;
        })
        .join("");

      return courseHeaderRow + subCourseRows;
    })
    .join("");

  // ▼▼▼ [แก้ไข] ปรับแก้ส่วนของ <style> และ <thead> ภายใน HTML ▼▼▼
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${data.bookTitle}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @font-face {
            font-family: 'Sarabun';
            src: url(${fontSrc}) format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          
          @font-face {
            font-family: 'Sarabun';
            src: url(${fontSrc}) format('truetype');
            font-weight: bold;
            font-style: normal;
          }          
          body { font-family: 'Sarabun', sans-serif; font-size: 12px; -webkit-print-color-adjust: exact; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { vertical-align: top; padding: 4px 6px; text-align: left; word-break: break-all; }
          th.center, td.center { text-align: center; }
          tr.group-header td { background-color: #f1f5f9; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="text-center mb-4"><img src="${logoSrc}" alt="Logo" class="w-16 h-16 mx-auto" /></div>
        <div class="mt-4 mb-8 text-base">
          <p><strong>ชื่อ-นามสกุล:</strong> ${data.userName}</p>
          <p><strong>รหัสนิสิต:</strong> ${data.studentId}</p>
          <p><strong>สมุด:</strong> ${data.bookTitle}</p>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-200">
              <th class="p-2 font-semibold border border-slate-300 center" style="width: 25%;">ประสบการณ์</th>
              <th class="p-2 font-semibold border border-slate-300 center" style="width: 5.8%;">ใน<br/>วิชา</th>
              <th class="p-2 font-semibold border border-slate-300 center" style="width: 9.2%;">ตลอด<br/>หลักสูตร</th>
              <th class="p-2 font-semibold border border-slate-300 center" style="width: 4%;">ที่</th>
              ${data.fields.map((f) => `<th class="p-2 font-semibold border border-slate-300 center">${f.label}</th>`).join("")}
              <th class="p-2 font-semibold border border-slate-300 center" style="width: 20%;">ชื่อผู้นิเทศ</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `;
}
// ▲▲▲ [สิ้นสุดส่วนที่แก้ไข] ▲▲▲

export async function POST(req: NextRequest) {
  let browser = null; // ประกาศ browser ไว้ข้างนอก try-finally

  try {
    const body = await req.json();
    const { bookId, accessToken } = body;

    if (!bookId || !accessToken) {
      return new NextResponse("Missing bookId or accessToken", { status: 400 });
    } // ดึงข้อมูลและสร้าง HTML (เหมือนเดิม)
    const data = await getPdfData(bookId, accessToken);
    const htmlContent = getHtmlContent(data);
    const currentDate = new Date().toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // อ่านฟอนต์ Sarabun สำหรับใช้ใน Header SVG
    const fontPath = path.join(
      process.cwd(),
      "public/fonts",
      "THSarabunNew.ttf",
    );
    const fontBuffer = fs.readFileSync(fontPath);
    const fontBase64 = fontBuffer.toString("base64");

    // ปรับการเรียกใช้ Puppeteer ให้เข้ากับ Serverless
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // ▼▼▼ [แก้ไข] ปรับ Header/Footer Template ใหม่ทั้งหมด ▼▼▼
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      // ใช้รูป SVG ที่เราสร้างขึ้นมาเป็น Header
      headerTemplate: `
        <div style="width: 100%; padding: 0 30px; box-sizing: border-box;">
          <img src="data:image/svg+xml;base64,${Buffer.from(
            `
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="50px" style="font-family: Arial, sans-serif; font-size: 10pt; color: #555;">
              <text x="0" y="35">ข้อมูลเมื่อวันที่: ${currentDate}</text>
              <text x="100%" y="35" text-anchor="end">หน้า <span class="pageNumber"></span> / <span class="totalPages"></span></text>
            </svg>
          `,
          ).toString("base64")}" style="width: 100%; height: auto;" />
        </div>
      `,
      footerTemplate: "<div></div>",
      margin: { top: "60px", right: "30px", bottom: "30px", left: "30px" },
    });
    // ▲▲▲ [สิ้นสุดส่วนที่แก้ไข] ▲▲▲

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="progress_${data.studentId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  } finally {
    // เพิ่มการตรวจสอบเพื่อให้แน่ใจว่า browser ถูกปิดเสมอ
    if (browser) {
      await browser.close();
    }
  }
}
