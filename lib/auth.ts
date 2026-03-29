import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { AccountStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensurePlatformDeveloperAccount } from "@/lib/platform-developers";
import { verifyPassword } from "@/lib/password";

/** Vercel / Auth.js מגדירים לעיתים רק AUTH_URL — NextAuth v4 מצפה ל-NEXTAUTH_URL */
if (!process.env.NEXTAUTH_URL && process.env.AUTH_URL) {
  process.env.NEXTAUTH_URL = process.env.AUTH_URL;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "אימייל וסיסמה",
      credentials: {
        email: { label: "אימייל", type: "email" },
        password: { label: "סיסמה", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) {
          return null;
        }
        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });
        if (!user?.passwordHash) {
          return null;
        }
        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) {
          return null;
        }
        if (user.accountStatus !== AccountStatus.ACTIVE) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return true;
      }
      if (account?.provider === "google") {
        const email = user.email?.trim().toLowerCase();
        if (!email) {
          return false;
        }
        const dbUser = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          select: { accountStatus: true },
        });
        if (!dbUser) {
          return "/login?error=CredentialsSignin&reason=no_account";
        }
        if (dbUser.accountStatus !== AccountStatus.ACTIVE) {
          return "/login?error=CredentialsSignin&reason=pending";
        }
        return true;
      }
      return true;
    },
    async session({ token, session }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string | null;
        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email.trim().toLowerCase();
      }
      if (user && "id" in user && typeof (user as { id?: string }).id === "string") {
        token.id = (user as { id: string }).id;
      }
      const email = typeof token.email === "string" ? token.email.trim().toLowerCase() : null;
      if (!email) {
        return token;
      }

      const dev = await ensurePlatformDeveloperAccount(email);
      if (dev) {
        token.id = dev.id;
        token.role = dev.role;
        token.organizationId = dev.organizationId;
        return token;
      }

      const dbUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: {
          id: true,
          role: true,
          organizationId: true,
          accountStatus: true,
        },
      });

      if (!dbUser || dbUser.accountStatus !== AccountStatus.ACTIVE) {
        token.id = "";
        token.role = "";
        token.organizationId = null;
        return token;
      }

      token.id = dbUser.id;
      token.role = dbUser.role;
      token.organizationId = dbUser.organizationId;
      return token;
    },
  },
};
