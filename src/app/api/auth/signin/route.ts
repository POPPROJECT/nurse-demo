// src/app/api/auth/signin/route.ts

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. ส่งข้อมูล login ไปยัง Backend ตัวจริง
    const apiRes = await fetch(`${BACKEND_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      // ถ้า Backend ตัวจริงส่ง error กลับมา
      return NextResponse.json(
        { error: data.message },
        { status: apiRes.status }
      );
    }

    // 2. สำเร็จ! แยก cookie ออกมาจาก Response Headers ของ Backend
    const accessTokenCookie = apiRes.headers.get('set-cookie');
    // หมายเหตุ: การจัดการ refresh token อาจต้องทำคล้ายๆ กัน หรือแยก header

    // 3. สร้าง Response ของเราเองเพื่อส่งกลับไปให้ Browser
    const response = NextResponse.json(data);

    // 4. ตั้งค่า Cookie บน Response ของเราเอง (สำคัญมาก!)
    // ตอนนี้ Cookie จะมี Domain เป็นของ nurse-demo.vercel.app
    if (accessTokenCookie) {
      // เราต้องแยกส่วน Header และตั้งค่าใหม่เพื่อให้เข้ากันได้
      // นี่เป็นตัวอย่างแบบง่าย, การใช้งานจริงอาจต้อง parse cookie string
      response.headers.append('Set-Cookie', accessTokenCookie);
    }

    return response;
  } catch (error) {
    console.error('/api/auth/signin error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
