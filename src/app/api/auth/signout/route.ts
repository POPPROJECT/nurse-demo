import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// ✅ ใช้ POST เท่านั้นในการ signout
export async function POST(request: NextRequest) {
  const frontendUrl = request.nextUrl.origin;
  const response = NextResponse.redirect(new URL('/', frontendUrl));

  // ลบ cookies แบบปลอดภัย
  (await cookies()).delete('access_token');
  (await cookies()).delete('refresh_token');

  return response;
}

// 🚫 ป้องกันไม่ให้ GET ลบ session โดยไม่ตั้งใจ
export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}
