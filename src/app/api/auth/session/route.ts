// app/api/auth/session/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('session')?.value;

  if (!accessToken) {
    return NextResponse.json({ session: null }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      credentials: 'include',
    });

    if (!res.ok) {
      return NextResponse.json({ session: null }, { status: 401 });
    }

    const user = await res.json();
    return NextResponse.json({
      session: {
        user,
        accessToken,
        refreshToken: cookieStore.get('refresh_token')?.value ?? '',
      },
    });
  } catch (err) {
    console.error('Session check failed:', err);
    return NextResponse.json({ session: null }, { status: 500 });
  }
}
