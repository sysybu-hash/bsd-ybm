"use client";

import Link from "next/link";
import { ChevronLeft, Lock, Palette, User } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

export type UserProfileUIProps = {
  name: string;
  email: string;
  roleLabel: string;
};

export function UserProfileUI({ name, email, roleLabel }: UserProfileUIProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">הגדרות פרופיל</h1>
        <p className="mt-1 text-text-secondary">ניהול פרטים אישיים, אבטחה והעדפות תצוגה</p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DashboardCard title="פרטים אישיים" actionIcon={<User size={20} />}>
          <div className="mt-2 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">שם מלא</label>
              <input
                type="text"
                defaultValue={name}
                readOnly
                className="w-full cursor-default rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm text-text-primary outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">{"דוא\"ל"}</label>
              <input
                type="email"
                defaultValue={email}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm text-gray-500 outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">תפקיד במערכת</label>
              <div className="inline-block rounded-lg border border-brand/20 bg-brand/10 p-2.5 text-sm font-medium text-brand">
                {roleLabel}
              </div>
            </div>
            <p className="text-xs text-text-secondary">
              {"לשינוי שם או דוא\"ל פנו למנהל הארגון — עדכון מלא בפרופיל יתווסף בהמשך."}
            </p>
          </div>
        </DashboardCard>

        <div className="space-y-6">
          <DashboardCard title="אבטחה וסיסמה" actionIcon={<Lock size={20} />}>
            <div className="mt-2 space-y-4">
              <Link
                href="/login"
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-3 text-sm font-medium transition-colors hover:bg-gray-50"
              >
                <span>כניסה למסך ההתחברות (החלפת סיסמה)</span>
                <ChevronLeft size={16} className="text-gray-400" aria-hidden />
              </Link>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
              >
                <span>הפעלת אימות דו-שלבי (2FA)</span>
                <Lock size={16} aria-hidden />
              </button>
            </div>
          </DashboardCard>
          <DashboardCard title="העדפות תצוגה" actionIcon={<Palette size={20} />}>
            <div className="mt-2 flex gap-4">
              <button
                type="button"
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-brand bg-brand/5 p-4"
              >
                <div className="h-6 w-6 rounded-full bg-slate-900" />
                <span className="text-sm font-medium text-brand">מצב כהה</span>
              </button>
              <button
                type="button"
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 p-4 hover:bg-gray-50"
              >
                <div className="h-6 w-6 rounded-full border border-gray-300 bg-white" />
                <span className="text-sm font-medium text-text-secondary">מצב בהיר</span>
              </button>
            </div>
            <p className="mt-3 text-xs text-text-secondary">בחירת ערכת נושא מלאה תתווסף בהמשך.</p>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
