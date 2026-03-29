import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { AccountStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensurePlatformDeveloperAccount } from "@/lib/platform-developers";
import { isAdmin } from "@/lib/is-admin";
import { verifyPassword } from "@/lib/password";
import { hasMeckanoAccess, meckanoManagedOrganizationId } from "@/lib/meckano-access";
import { isLoginBlockedEmail } from "@/lib/login-blocklist";
import { isLoginAllowedByAllowlist } from "@/lib/login-allowlist";
import { sendMeckanoOperatorLoginWelcomeEmail } from "@/lib/mail";

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
        if (isLoginBlockedEmail(email)) {
          return null;
        }
        if (!isLoginAllowedByAllowlist(email)) {
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
        if (isLoginBlockedEmail(email)) {
          return "/login?error=CredentialsSignin&reason=blocked";
        }
        if (!isLoginAllowedByAllowlist(email)) {
          return "/login?error=CredentialsSignin&reason=allowlist";
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

      if (isLoginBlockedEmail(email)) {
        token.id = "";
        token.role = "";
        token.organizationId = null;
        return token;
      }

      if (!isLoginAllowedByAllowlist(email)) {
        token.id = "";
        token.role = "";
        token.organizationId = null;
        return token;
      }

      // מקאנו לפני קידום מפתחי פלטפורמה — אם אותו מייל בטעות בשתי הרשימות, חוויית מנוי מקאנו קודמת
      if (hasMeckanoAccess(email)) {
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
        token.role = dbUser.role === "SUPER_ADMIN" ? "ORG_ADMIN" : dbUser.role;
        const managed = meckanoManagedOrganizationId();
        token.organizationId = managed ?? dbUser.organizationId;
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

      // SUPER_ADMIN ב-DB בלי רשימת בעלי פלטפורמה — לא מקבלים הרשאות מאסטר גלובלי בטוקן
      if (dbUser.role === "SUPER_ADMIN" && !isAdmin(email)) {
        token.role = "ORG_ADMIN";
      }

      return token;
    },
  },
  events: {
    async signIn({ user }) {
      try {
        const emailRaw = user?.email?.trim();
        if (emailRaw) {
          await prisma.user.updateMany({
            where: { email: { equals: emailRaw, mode: "insensitive" } },
            data: { lastLoginAt: new Date() },
          });
        }
        if (!emailRaw || !hasMeckanoAccess(emailRaw)) return;

        const dbUser = await prisma.user.findFirst({
          where: { email: { equals: emailRaw, mode: "insensitive" } },
          select: { id: true, meckanoAccessActivationEmailSentAt: true },
        });
        if (!dbUser || dbUser.meckanoAccessActivationEmailSentAt) return;

        await sendMeckanoOperatorLoginWelcomeEmail(emailRaw);

        await prisma.$transaction([
          prisma.user.update({
            where: { id: dbUser.id },
            data: { meckanoAccessActivationEmailSentAt: new Date() },
          }),
          prisma.inAppNotification.create({
            data: {
              userId: dbUser.id,
              title: "מקאנו",
              body: "הגישה למקאנו הופעלה עבורכם!",
            },
          }),
        ]);
      } catch (e) {
        console.error("signIn meckano welcome / notification", e);
      }
    },
  },
};
