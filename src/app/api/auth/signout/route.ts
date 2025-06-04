// src/app/api/auth/signout/route.ts

import { cookies } from 'next/headers'; // ✅ ใช้ cookies() จาก next/headers เพื่อความแน่นอน
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // หรือ POST ถ้าคุณเปลี่ยน Link
  const frontendUrl = request.nextUrl.origin; // หรือ process.env.NEXT_PUBLIC_BASE_URL
  const response = NextResponse.redirect(new URL('/', frontendUrl));

  // ใช้ cookies().delete() หรือ cookies().set() ด้วย options ที่ครบถ้วน
  // วิธีที่ 1: ใช้ delete (แนะนำ)
  (await cookies()).delete('access_token');
  (await cookies()).delete('refresh_token');

  // วิธีที่ 2: ใช้ set ด้วย maxAge: 0 และ options ที่ครบถ้วนเหมือนตอนตั้งค่า
  // (ถ้าวิธี delete ไม่ทำงาน ให้ลองวิธีนี้)
  /*
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    path: '/',
    maxAge: 0, // ทำให้ cookie หมดอายุทันที
    // domain: ไม่ต้องระบุ ถ้าตอนตั้งค่าไม่ได้ระบุ (เพื่อให้ Browser จัดการสำหรับ current domain)
  };
  cookies().set('access_token', '', cookieOptions);
  cookies().set('refresh_token', '', cookieOptions);
  */

  // หมายเหตุ: การเคลียร์ session ฝั่ง Backend จริงๆ (เช่น invalidate refresh token ใน DB)
  // ควรจะถูกทำโดยการ POST request จาก client ไปยัง Backend โดยตรง
  // แต่สำหรับการลบ HttpOnly cookie ฝั่ง client, API Route นี้ทำหน้าที่ได้ดี

  return response;
}
