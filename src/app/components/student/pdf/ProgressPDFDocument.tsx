'use client';

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// ลงทะเบียนฟอนต์ภาษาไทย
Font.register({
  family: 'THSarabunNew',
  fonts: [{ src: '/fonts/THSarabunNew.ttf', fontWeight: 'normal' }],
});

// ช่วย wrap ไทยโดยแทรก zero-width space
const injectZWSP = (text: string) =>
  String(text).replace(/([^\u0020-\u007E])/g, '$1\u200B');

const styles = StyleSheet.create({
  page: {
    paddingTop: 50, // เพิ่ม padding ด้านบนสำหรับ header (วันที่, เลขหน้า)
    paddingRight: 30,
    paddingBottom: 30,
    paddingLeft: 30,
    fontSize: 13,
    fontFamily: 'THSarabunNew',
  },
  pageNumber: {
    // Style สำหรับเลขหน้า
    position: 'absolute',
    fontSize: 10,
    top: 20, // ปรับตำแหน่งด้านบน
    right: 30, // ปรับตำแหน่งด้านขวา
    textAlign: 'right',
    color: 'grey',
  },
  exportDateText: {
    // Style สำหรับวันที่ export
    position: 'absolute',
    fontSize: 10,
    top: 20, // ปรับตำแหน่งด้านบน
    left: 30, // ปรับตำแหน่งด้านซ้าย
    color: 'grey',
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    // marginTop: 10, // อาจจะไม่จำเป็นแล้วถ้า paddingTop ของ page พอ
  },
  logo: {
    width: 50,
    height: 50,
  },
  info: {
    marginBottom: 16,
    textAlign: 'left',
    // marginTop: 15, // เพิ่ม margin ด้านบนเล็กน้อยสำหรับส่วนข้อมูลหลัง header
  },
  studentLine: {
    marginBottom: 2,
  },
  bookTitle: {
    marginTop: 4,
    fontSize: 16,
    // fontWeight: 'bold', // ใน react-pdf, font weight ต้องมาจาก font file ที่ register
  },
  table: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    minPresenceAhead: 30,
  },
  rowHeader: {
    backgroundColor: '#eee',
    // fontWeight: 'bold', // สำหรับ header ควรใช้ font ที่มี bold variant หรือปล่อยให้เป็น normal
  },
  cell: {
    borderColor: '#bbb',
    borderStyle: 'solid',
    padding: 4,
    justifyContent: 'center',
    flexShrink: 0,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  headerCell: {
    borderTopWidth: 1,
    lineHeight: 1.2,
  },
  firstCellInRow: {
    borderLeftWidth: 1,
  },
  textCenter: {
    textAlign: 'center',
    alignItems: 'center',
  },
  experienceMain: {
    backgroundColor: '#f7f7f7',
    // fontWeight: 'bold',
    paddingLeft: 6,
  },
  experienceSub: {
    paddingLeft: 16,
  },
});

const colWidths = {
  experience: '25%',
  subject: '5%',
  alwaycourse: '9%',
  approver: '23%',
  field: (n: number) => `${(100 - (25 + 5 + 9 + 23)) / (n > 0 ? n : 1)}%`, // ป้องกันการหารด้วยศูนย์
};

interface FieldConfig {
  id: number;
  label: string;
}
interface FieldValue {
  fieldId: number;
  value: string;
}
interface Experience {
  course: string;
  subCourse?: string;
  subject?: number;
  alwaycourse?: number;
  fieldValues: FieldValue[];
  approverName: string;
}
interface Props {
  userName: string;
  studentId: string;
  bookTitle: string;
  fields: FieldConfig[];
  experiences: Experience[];
}

export const ProgressPDFDocument: React.FC<Props> = ({
  userName,
  studentId,
  bookTitle,
  fields,
  experiences,
}) => {
  const sorted = [...experiences].sort((a, b) => {
    const [ai] = a.course.split('.');
    const [bi] = b.course.split('.');
    const na = parseInt(ai) || 0;
    const nb = parseInt(bi) || 0;
    if (na !== nb) return na - nb;
    if (a.subCourse && b.subCourse) {
      const [asi] = a.subCourse.split('.');
      const [bsi] = b.subCourse.split('.');
      return (parseInt(asi) || 0) - (parseInt(bsi) || 0);
    }
    return 0;
  });

  const grouped = sorted.reduce<Record<string, Experience[]>>((acc, exp) => {
    if (!acc[exp.course]) acc[exp.course] = [];
    acc[exp.course].push(exp);
    return acc;
  }, {});

  const fieldWidth = colWidths.field(fields.length);

  // สร้างวันที่ export
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, '0');
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มจาก 0
  const year = currentDate.getFullYear();
  const exportDateFormatted = `${day}/${month}/${year}`;

  const renderCell = (
    cellKey: string,
    content: string | number, // Allow number for subject/alwaycourse
    width: string,
    isHeader: boolean = false,
    isLastCellInRow: boolean = false,
    isFirstCellInRow: boolean = false,
    isLastRowInTable: boolean = false,
    extraStyle: any = {}
  ) => (
    <View
      key={cellKey}
      style={[
        styles.cell,
        { width },
        isHeader && styles.headerCell,
        isFirstCellInRow && styles.firstCellInRow,
        isLastCellInRow && { borderRightWidth: 1 }, // react-pdf อาจจะไม่ re-apply ถ้า style นี้อยู่ใน styles.cell อยู่แล้ว
        // isLastRowInTable && { borderBottomWidth: 1 }, // ตรวจสอบการทำงานของ border อีกครั้ง
        extraStyle,
      ]}
    >
      <Text>{injectZWSP(String(content))}</Text>
    </View>
  );

  const courseKeys = Object.keys(grouped);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header ของหน้า: วันที่ Export และ เลขหน้า */}
        <Text style={styles.exportDateText} fixed>
          ข้อมูลเมื่อวันที่: {exportDateFormatted}
        </Text>
        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) =>
            `หน้า ${pageNumber} / ${totalPages}`
          }
        />

        {/* โลโก้กลาง */}
        <View style={styles.logoContainer}>
          <Image src="/NULOGO.png" style={styles.logo} />
        </View>

        {/* ข้อมูลนิสิต + ชื่อสมุด */}
        <View style={styles.info}>
          <Text style={styles.studentLine}>
            ชื่อ-นามสกุล: {injectZWSP(userName)}
          </Text>
          <Text style={styles.studentLine}>
            รหัสนิสิต: {injectZWSP(studentId)}
          </Text>
          <Text style={styles.studentLine}>สมุด: {injectZWSP(bookTitle)}</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header ของตาราง (fixed ซ้ำทุกหน้า) */}
          <View fixed style={[styles.row, styles.rowHeader]}>
            {renderCell(
              'h-exp',
              'ประสบการณ์',
              colWidths.experience,
              true,
              false,
              true,
              false,
              styles.textCenter
            )}
            {renderCell(
              'h-subj',
              'ใน\nวิชา',
              colWidths.subject,
              true,
              false,
              false,
              false,
              styles.textCenter
            )}
            {renderCell(
              'h-alw',
              'ตลอด\nหลักสูตร',
              colWidths.alwaycourse,
              true,
              false,
              false,
              false,
              styles.textCenter
            )}
            {fields.map((f, index) =>
              renderCell(
                `h-field-${f.id}`,
                f.label,
                fieldWidth,
                true,
                index === fields.length - 1,
                false,
                false,
                styles.textCenter
              )
            )}
            {renderCell(
              'h-app',
              'ชื่อผู้นิเทศ',
              colWidths.approver,
              true,
              true,
              false,
              false,
              styles.textCenter
            )}
          </View>

          {/* Body ของตาราง */}
          {Object.entries(grouped).map(([course, exps], groupIdx) => (
            <React.Fragment key={`grp-${course}`}>
              {/* main row */}
              <View style={styles.row} wrap={false}>
                {renderCell(
                  `m-${course}`,
                  course,
                  colWidths.experience,
                  false,
                  false,
                  true,
                  groupIdx === courseKeys.length - 1 && exps.length === 0,
                  styles.experienceMain
                )}
                {renderCell(
                  `m-subj-${course}`,
                  '',
                  colWidths.subject,
                  false,
                  false,
                  false,
                  groupIdx === courseKeys.length - 1 && exps.length === 0
                )}
                {renderCell(
                  `m-alw-${course}`,
                  '',
                  colWidths.alwaycourse,
                  false,
                  false,
                  false,
                  groupIdx === courseKeys.length - 1 && exps.length === 0
                )}
                {fields.map((_, i) =>
                  renderCell(
                    `m-field-${course}-${i}`,
                    '',
                    fieldWidth,
                    false,
                    i === fields.length - 1,
                    false,
                    groupIdx === courseKeys.length - 1 && exps.length === 0
                  )
                )}
                {renderCell(
                  `m-app-${course}`,
                  '',
                  colWidths.approver,
                  false,
                  true,
                  false,
                  groupIdx === courseKeys.length - 1 && exps.length === 0
                )}
              </View>

              {/* sub rows */}
              {exps.map((exp, idx) => (
                <View
                  key={`sub-${course}-${idx}`}
                  style={styles.row}
                  wrap={false}
                >
                  {renderCell(
                    `s-exp-${course}-${idx}`,
                    exp.subCourse || '',
                    colWidths.experience,
                    false,
                    false,
                    true,
                    idx === exps.length - 1 &&
                      groupIdx === courseKeys.length - 1,
                    styles.experienceSub
                  )}
                  {renderCell(
                    `s-subj-${course}-${idx}`,
                    exp.subject || '',
                    colWidths.subject,
                    false,
                    false,
                    false,
                    idx === exps.length - 1 &&
                      groupIdx === courseKeys.length - 1,
                    styles.textCenter
                  )}
                  {renderCell(
                    `s-alw-${course}-${idx}`,
                    exp.alwaycourse || '',
                    colWidths.alwaycourse,
                    false,
                    false,
                    false,
                    idx === exps.length - 1 &&
                      groupIdx === courseKeys.length - 1,
                    styles.textCenter
                  )}
                  {fields.map((f, fieldIdx) => {
                    const raw =
                      exp.fieldValues.find((v) => v.fieldId === f.id)?.value ||
                      '';
                    return renderCell(
                      `s-field-${course}-${idx}-${f.id}`,
                      raw,
                      fieldWidth,
                      false,
                      fieldIdx === fields.length - 1,
                      false,
                      idx === exps.length - 1 &&
                        groupIdx === courseKeys.length - 1,
                      styles.textCenter
                    );
                  })}
                  {renderCell(
                    `s-app-${course}-${idx}`,
                    exp.approverName,
                    colWidths.approver,
                    false,
                    true,
                    false,
                    idx === exps.length - 1 &&
                      groupIdx === courseKeys.length - 1,
                    styles.textCenter
                  )}
                </View>
              ))}
            </React.Fragment>
          ))}
        </View>
      </Page>
    </Document>
  );
};
