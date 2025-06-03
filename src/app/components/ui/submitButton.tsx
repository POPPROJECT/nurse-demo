'use client';

import React from 'react';
import { useFormStatus } from 'react-dom';

interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function SubmitButton({
  children,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button {...props} disabled={pending}>
      {pending ? 'Loading...' : children}
    </button>
  );
}
