import { BACKEND_URL } from './constants';

export async function signIn(formData: FormData) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ยังคงต้องมีเพื่อให้เบราว์เซอร์รับ Cookie
      body: JSON.stringify({
        identifier: formData.get('identifier'),
        password: formData.get('password'),
      }),
    });

    // แปลง Response เป็น JSON
    const result = await res.json();

    // หาก Request ไม่สำเร็จ (Backend ส่ง error message มา)
    if (!res.ok) {
      return {
        error: result.message || 'Login failed. Please check your credentials.',
      };
    }

    // หากสำเร็จ แต่ไม่มี role ส่งกลับมา
    if (!result.user?.role) {
      return { error: 'Invalid login response from server.' };
    }

    // ✅ ส่ง role กลับไปให้ page.tsx ได้เลย ไม่ต้องเรียก /me อีก
    return { role: result.user.role };
  } catch (error) {
    console.error('An unexpected error occurred during sign-in:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function refreshToken(
  refreshToken: string
): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) throw new Error('Refresh failed');

    const { accessToken } = await res.json();
    return accessToken;
  } catch (err) {
    console.error('🔁 refreshToken error:', err);
    return null;
  }
}
