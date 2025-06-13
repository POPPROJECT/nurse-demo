import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

// --- TYPE DEFINITIONS ---
interface FieldValue {
  fieldId: number;
  value: string;
}
interface Experience {
  course: string;
  subCourse?: string;
  subject?: string | null;
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

// ▼▼▼ [แก้ไข] ปรับปรุงการสร้าง HTML ทั้งหมดตามโครงสร้างที่ถูกต้อง ▼▼▼
function getHtmlContent(data: PdfData) {
  // 1. อ่านไฟล์ Logo และแปลงเป็น Base64 Data URI
  const imagePath = path.resolve("./public", "NULOGO.png");
  const imageBuffer = fs.readFileSync(imagePath);
  const logoSrc = `data:image/png;base64,${imageBuffer.toString("base64")}`;

  // ▼▼▼ [แก้ไข] อ่านไฟล์ฟอนต์ THSarabunNew.ttf ▼▼▼
  const fontPath = path.resolve("./public/fonts", "THSarabunNew.ttf");
  const fontBuffer = fs.readFileSync(fontPath);
  const fontSrc = `data:font/truetype;charset=utf-8;base64,${fontBuffer.toString("base64")}`;
  // ▲▲▲ [สิ้นสุดส่วนที่แก้ไข] ▲▲▲

  // ▼▼▼ [แก้ไข] ปรับปรุง Logic การเรียงข้อมูลให้สมบูรณ์ ▼▼▼
  const parseVersionString = (str: string | undefined): number[] => {
    if (!str) return [0, 0];
    // แยกตัวเลขออกจากข้อความก่อน แล้วค่อย split ด้วยจุด
    const numbersOnly = str.match(/[\d.]+/g)?.[0] || "";
    return numbersOnly.split(".").map((num) => parseInt(num, 10) || 0);
  };

  const sorted = [...data.experiences].sort((a, b) => {
    // 1. เรียงตาม Course หลักก่อน
    const [aCourseMain] = parseVersionString(a.course);
    const [bCourseMain] = parseVersionString(b.course);
    if (aCourseMain !== bCourseMain) return aCourseMain - bCourseMain;

    // 2. ถ้า Course หลักเหมือนกัน ให้เรียงตาม SubCourse
    const [aSubMain, aSubMinor] = parseVersionString(a.subCourse);
    const [bSubMain, bSubMinor] = parseVersionString(b.subCourse);

    // 2.1 เทียบเลขหน้าจุดทศนิยมของ SubCourse
    if (aSubMain !== bSubMain) return aSubMain - bSubMain;

    // 2.2 ถ้าเลขหน้าจุดเท่ากัน ให้เทียบเลขหลังจุดทศนิยม
    if (aSubMinor !== bSubMinor) return aSubMinor - bSubMinor;

    return 0; // ถ้าเหมือนกันหมด
  });
  // ▲▲▲ [สิ้นสุดส่วนที่แก้ไข] ▲▲▲

  // 3. Logic การนับลำดับ "ที่"
  const caseCounter = new Map<string, number>();
  const experiencesWithCaseNumber = sorted.map((exp) => {
    const key = `${exp.course}_${exp.subCourse}`;
    const count = (caseCounter.get(key) || 0) + 1;
    caseCounter.set(key, count);
    return { ...exp, caseNumber: count };
  });

  // 4. Logic การจัดกลุ่มตาม Course
  const grouped = experiencesWithCaseNumber.reduce<
    Record<string, (Experience & { caseNumber: number })[]>
  >((acc, exp) => {
    if (!acc[exp.course]) acc[exp.course] = [];
    acc[exp.course].push(exp);
    return acc;
  }, {});

  // ▼▼▼ [แก้ไข] ปรับแก้ Logic การสร้างแถวตาราง ▼▼▼
  const tableRows = Object.entries(grouped)
    .map(([course, exps]) => {
      const courseHeaderRow = `
      <tr class="bg-slate-100 font-bold">
        <td class="p-2 border border-slate-300" colspan="${4 + data.fields.length + 1}">${course}</td>
      </tr>
    `;

      let lastSubCourse: string | undefined | null = null; // ตัวแปรสำหรับจำ subCourse ก่อนหน้า

      //   const subCourseRows = exps.map((exp: Experience & { caseNumber: number }) => `
      //       <tr>
      //         <td class="p-2 border border-slate-300 pl-6">${exp.subCourse || ''}</td>
      //         <td class="p-2 text-center border border-slate-300">${exp.subject || ''}</td>
      //         <td class="p-2 text-center border border-slate-300">${exp.alwaycourse || ''}</td>
      //         <td class="p-2 text-center border border-slate-300">${exp.caseNumber}</td>
      //         ${data.fields.map(f => {
      //     const value = exp.fieldValues.find(fv => fv.fieldId === f.id)?.value || '';
      //     return `<td class="p-2 text-center border border-slate-300">${value}</td>`;
      //   }).join('')}
      //         <td class="p-2 border border-slate-300">${exp.approverName}</td>
      //       </tr>
      //     `).join('');
      //   return courseHeaderRow + subCourseRows;
      // }).join('');

      const subCourseRows = exps
        .map((exp: Experience & { caseNumber: number }) => {
          let experienceCell = `<td class="p-2 border border-slate-300 pl-6">${exp.subCourse || ""}</td>`;
          let subjectCell = `<td class="p-2 text-center border border-slate-300">${exp.subject || ""}</td>`;
          let alwaycourseCell = `<td class="p-2 text-center border border-slate-300">${exp.alwaycourse || ""}</td>`;

          // ตรวจสอบว่า subCourse ปัจจุบันเหมือนกับแถวก่อนหน้าหรือไม่
          if (exp.subCourse && exp.subCourse === lastSubCourse) {
            // ถ้าเหมือนกัน ให้สร้าง cell ว่างๆ แทน
            experienceCell = `<td class="p-2 border border-slate-300 pl-6"></td>`;
            subjectCell = `<td class="p-2 text-center border border-slate-300"></td>`;
            alwaycourseCell = `<td class="p-2 text-center border border-slate-300"></td>`;
          }

          // อัปเดตค่าล่าสุดสำหรับใช้ใน loop ถัดไป
          lastSubCourse = exp.subCourse;

          // ประกอบร่าง HTML ของแถว
          return `
        <tr>
          ${experienceCell}
          ${subjectCell}
          ${alwaycourseCell}
          <td class="p-2 text-center border border-slate-300">${exp.caseNumber}</td>
          ${data.fields
            .map((f) => {
              const value =
                exp.fieldValues.find((fv) => fv.fieldId === f.id)?.value || "";
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
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
          body { 
            font-family: 'Sarabun', sans-serif; 
            font-size: 12px; /* อาจจะลดขนาดฟอนต์เล็กน้อยเพื่อให้พอดีขึ้น */
            -webkit-print-color-adjust: exact; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            table-layout: fixed; /* <-- บังคับให้ตารางใช้ความกว้างที่เรากำหนด */
          }
          th, td { 
            vertical-align: top; 
            padding: 4px 6px; 
            text-align: left; 
            word-break: break-all; /* <-- บังคับให้ตัดคำขึ้นบรรทัดใหม่ */
          }
          th.center, td.center { text-align: center; }
          tr.group-header td { background-color: #f1f5f9; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="text-center mb-4">

<img src="${logoSrc}" alt="Logo" class="w-16 h-16 mx-auto" />
</div>
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
  try {
    const body = await req.json();
    const { bookId, accessToken } = body;

    if (!bookId || !accessToken) {
      return new NextResponse("Missing bookId or accessToken", { status: 400 });
    }

    const data = await getPdfData(bookId, accessToken);
    const htmlContent = getHtmlContent(data);
    const currentDate = new Date().toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // ▼▼▼ [แก้ไข] ปรับ Header/Footer Template ใหม่ทั้งหมด ▼▼▼
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-family: 'THSarabunNew', sans-serif; font-size: 10px; color: #808080; padding: 0 30px; width: 100%; display: flex; justify-content: space-between;">
            <span>ข้อมูลเมื่อวันที่: ${currentDate}</span>
            <span>หน้า <span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>
      `,
      footerTemplate: "<div></div>",
      margin: { top: "50px", right: "30px", bottom: "30px", left: "30px" },
    });
    // ▲▲▲ [สิ้นสุดส่วนที่แก้ไข] ▲▲▲

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="progress_${data.studentId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}
