import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // ✅ ยังคงรับ POST request
  try {
    const cookieStore = await cookies();
    const accessTokenExists = cookieStore.has('access_token');
    const refreshTokenExists = cookieStore.has('refresh_token');
    console.log(
      `[Signout API Route] Before delete: access_token exists: ${accessTokenExists}, refresh_token exists: ${refreshTokenExists}`
    );

    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');

    // ✅ ตอบกลับเป็น JSON แทนการ Redirect
    return NextResponse.json(
      { message: 'Signed out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Signout API Route] Error clearing cookies:', error);
    return NextResponse.json(
      { message: 'Sign out failed during cookie clearing' },
      { status: 500 }
    );
  }
}

// ป้องกัน GET เหมือนเดิม
export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}
