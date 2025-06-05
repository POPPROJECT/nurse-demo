'use client';

import { Session } from 'lib/session';
import { Role } from 'lib/type';
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  studentProfile: {
    studentId: string;
    user: { name: string };
  };
  avatarUrl?: string;
}

interface AuthContextType {
  session: Session | null;
  accessToken: string | null;
  setSession: (session: Session | null) => void;
  updateUserInSession: (updatedUser: SessionUser) => void;
  // คุณอาจจะมีฟังก์ชัน login, logout ที่นี่ก็ได้ แต่ตอนนี้เราเน้นการส่ง session
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
  initialSession,
  initialAccessToken,
}: {
  children: ReactNode;
  initialSession: Session | null;
  initialAccessToken: string | null;
}) => {
  const [session, setSessionState] = useState<Session | null>(initialSession);
  const [accessToken, setAccessTokenState] = useState<string | null>(
    initialAccessToken
  );

  // ฟังก์ชันสำหรับอัปเดต Session ทั้งหมด
  const setSession = (newSession: Session | null) => {
    setSessionState(newSession);
    if (newSession) {
      setAccessTokenState(newSession.accessToken);
    } else {
      setAccessTokenState(null);
    }
  };

  // ฟังก์ชันสำหรับอัปเดตเฉพาะข้อมูล user ใน session
  const updateUserInSession = (updateUser: SessionUser) => {
    setSessionState((prevSession) => {
      if (!prevSession) return null;
      return {
        ...prevSession,
        user: {
          ...prevSession.user,
          ...updateUser,
        },
      };
    });
  };

  // ในอนาคตคุณอาจจะมี logic การ refresh token ที่นี่
  // หรือการ set user/token หลัง login ถ้าไม่ได้ทำ full page reload

  return (
    <AuthContext.Provider
      value={{ session, accessToken, setSession, updateUserInSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
