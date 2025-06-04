import { getSession } from 'lib/session';
import { redirect } from 'next/navigation';
import ApproverClientLayout from './ApproverClientLayout'; // ✅ Import Client Layout
import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';

export default async function ApproverMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (
    !session ||
    !session.user ||
    (session.user.role !== 'APPROVER_IN' &&
      session.user.role !== 'APPROVER_OUT')
  ) {
    redirect('/');
  }
  return (
    <AuthProvider
      initialSession={session}
      initialAccessToken={session.accessToken}
    >
      <ApproverClientLayout
        role={session.user.role as 'APPROVER_IN' | 'APPROVER_OUT'}
      >
        {children}
      </ApproverClientLayout>
    </AuthProvider>
  );
}
