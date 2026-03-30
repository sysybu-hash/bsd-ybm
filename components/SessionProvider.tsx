"use client";

import type { Session } from "next-auth";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function SessionProvider({
  children,
  session,
  sessionKey,
}: Readonly<{
  children: React.ReactNode;
  session: Session | null;
  /** מפתח יציב לפי משתמש — מונע הצגת אימייל/סשן של משתמש קודם אחרי התחברות */
  sessionKey?: string | null;
}>) {
  return (
    <NextAuthSessionProvider
      key={sessionKey ?? "no-session"}
      session={session}
      refetchOnWindowFocus
      refetchInterval={0}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
