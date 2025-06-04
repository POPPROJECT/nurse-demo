// src/app/api/auth/google/callback/route.ts (ฝั่ง Frontend - Vercel)

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Role } from '../../../../../../lib/type'; // ตรวจสอบ path นี้ให้ถูกต้อง

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // 1. ดึงค่า accessToken, refreshToken, และ role จาก URL
  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');
  const role = searchParams.get('role') as Role | null;

  const frontendUrl = request.nextUrl.origin; // เช่น https://nurse-demo.vercel.app

  if (!accessToken || !refreshToken || !role) {
    console.error('Google Callback: Missing tokens or role in query params');
    // Redirect กลับไปหน้า login พร้อม error message
    return NextResponse.redirect(
      new URL('/?error=GoogleAuthFailedTokenMissing', frontendUrl)
    );
  }

  try {
    // 2. ตั้งค่า Cookie บนโดเมนของ Frontend
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 วัน

    (await cookies()).set('access_token', accessToken, {
      httpOnly: true,
      secure: true, // Production ต้องเป็น true
      sameSite: 'none',
      expires,
      path: '/',
    });
    (await cookies()).set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true, // Production ต้องเป็น true
      sameSite: 'none',
      expires,
      path: '/', // path สำหรับ refresh token อาจจะแตกต่างกันได้ แต่ / ก็ใช้ได้
    });

    // 3. กำหนด Path ปลายทางตาม Role
    let targetPath = '/';
    switch (role) {
      case 'STUDENT':
        targetPath = '/student/books';
        break;
      case 'APPROVER_IN':
      case 'APPROVER_OUT':
        targetPath = '/approver/approved';
        break;
      case 'ADMIN':
        targetPath = '/admin/books';
        break;
      case 'EXPERIENCE_MANAGER':
        targetPath = '/experience-manager/books';
        break;
      default:
        console.warn(
          `Google Callback: Unknown role "${role}", redirecting to home.`
        );
        targetPath = '/?error=UnknownRole'; // หรือหน้า error/แจ้งเตือน
    }

    // 4. Redirect ไปยังหน้า Dashboard ที่ถูกต้อง
    return NextResponse.redirect(new URL(targetPath, frontendUrl));
  } catch (error) {
    console.error(
      'Google Callback: Error setting cookies or redirecting',
      error
    );
    return NextResponse.redirect(
      new URL('/?error=GoogleAuthCallbackError', frontendUrl)
    );
  }
}
