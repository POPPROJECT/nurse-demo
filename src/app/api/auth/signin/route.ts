// src/app/api/auth/signin/route.ts (ฝั่ง Frontend - Vercel)
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
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

    const { accessToken, refreshToken, user } = data;
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 วัน

    // ✅✅✅ แก้ไขส่วนนี้: เรียก cookies() ครั้งเดียวแล้ว set ต่อเนื่อง ✅✅✅
    const cookieStore = await cookies(); // เรียกครั้งเดียว
    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires,
      path: '/',
    });
    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires,
      path: '/',
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('/api/auth/signin error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
