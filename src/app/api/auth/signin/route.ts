// src/app/api/auth/signin/route.ts (ฝั่ง Frontend - Vercel)

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. ส่งข้อมูลไป Backend ตัวจริง
    const apiRes = await fetch(`${BACKEND_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: data.message },
        { status: apiRes.status }
      );
    }

    // 2. สำเร็จ! ดึงค่า tokens จาก JSON body ที่ Backend ส่งมา
    const { accessToken, refreshToken, user } = data;
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 วัน

    // 3. ใช้ `cookies()` ของ Next.js เพื่อตั้งค่า Cookie บนโดเมนของ Frontend
    (await cookies()).set('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires,
      path: '/',
    });
    (await cookies()).set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires,
      path: '/',
    });

    // 4. ส่งข้อมูล user กลับไปให้หน้า Login เพื่อใช้ในการ Redirect
    return NextResponse.json({ user });
  } catch (error) {
    console.error('/api/auth/signin error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
