// src/contexts/AuthContext.tsx
'use client';

import { Session } from 'lib/session';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  user: Session | null;
  accessToken: string | null;
  // คุณอาจจะมีฟังก์ชัน login, logout ที่นี่ก็ได้ แต่ตอนนี้เราเน้นการส่ง session
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
  initialUser,
  initialAccessToken,
}: {
  children: ReactNode;
  initialUser: Session | null;
  initialAccessToken: string | null;
}) => {
  const [user, setUser] = useState<Session | null>(initialUser);
  const [accessToken, setAccessToken] = useState<string | null>(
    initialAccessToken
  );

  // ในอนาคตคุณอาจจะมี logic การ refresh token ที่นี่
  // หรือการ set user/token หลัง login ถ้าไม่ได้ทำ full page reload

  return (
    <AuthContext.Provider value={{ user, accessToken }}>
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
