import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.redirect(
    new URL('/', process.env.NEXT_PUBLIC_BASE_URL)
  );

  // ลบ cookies โดย set ค่าใหม่ให้หมดอายุ
  response.cookies.set('access_token', '', { path: '/', maxAge: 0 });
  response.cookies.set('refresh_token', '', { path: '/', maxAge: 0 });

  return response;
}
