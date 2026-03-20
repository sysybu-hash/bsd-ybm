'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogIn, LogOut } from 'lucide-react';

const BRAND = '#004694';

export function AuthButton() {
  const { user, loading, signInWithGoogle, signOut, isConfigured } = useAuth();

  if (!isConfigured) return null;
  if (loading) return <span className="text-gray-400 text-sm">טוען...</span>;

  if (user) {
    return (
      <button
        type="button"
        onClick={() => signOut()}
        className="flex min-h-11 items-center gap-2 rounded-[40px] border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004694]"
      >
        <LogOut size={16} />
        <span className="max-w-[120px] truncate">{user.email}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signInWithGoogle()}
      className="flex min-h-11 items-center gap-2 rounded-[40px] px-4 py-2 text-sm font-medium text-white transition-opacity active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      style={{ backgroundColor: BRAND }}
    >
      <LogIn size={16} />
      התחבר עם Google
    </button>
  );
}
