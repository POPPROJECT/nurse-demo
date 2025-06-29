"use server";

import { cookies } from "next/headers";
import { Role } from "./type";

export type Session = {
  user: {
    id: number;
    name: string;
    email: string;
    role: Role;
    studentId?: string;
    avatarUrl?: string;
  };
  accessToken: string;
  refreshToken: string;
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  // 1. ตรวจสอบแค่ access_token ก็เพียงพอแล้ว
  if (!accessToken) {
    return null;
  }

  try {
    // 2. ส่ง Token ไปใน Header โดยตรงเพื่อความแน่นอน
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(await res.text());
      return null;
    }

    const user = await res.json();

    const refreshToken = cookieStore.get("refresh_token")?.value;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as Role,
        studentId: user.studentId ?? "",
        avatarUrl: user.avatarUrl || "",
      },
      accessToken,
      refreshToken: refreshToken || "", // อาจจะไม่มีก็ได้ถ้ายังไม่ได้ไป path ของมัน
    };
  } catch (err) {
    console.error("❌ getSession(): Exception occurred", err);
    return null;
  }
}

// ✅ เพิ่มฟังก์ชันนี้เพื่อ set cookie
export async function updateTokens({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken: string;
}) {
  const cookieStore = await cookies();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 วัน

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires,
    path: "/",
  });

  cookieStore.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires,
    path: "/",
  });
}
