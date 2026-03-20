'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  Settings,
  Users,
  X,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'דאשבורד' },
  { icon: FolderOpen, label: 'פרויקטים' },
  { icon: ClipboardList, label: 'משימות' },
  { icon: Users, label: 'צוות' },
  { icon: BarChart3, label: 'דוחות' },
  { icon: Settings, label: 'הגדרות' },
] as const;

export default function MauhedetShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="mauhedet-btn shadow-2xl"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'סגירת תפריט' : 'פתיחת תפריט'}
      >
        <div className="mauhedet-hamburger">
          {isOpen ? (
            <X className="-mt-1 -ml-1 text-white" size={32} />
          ) : (
            <>
              <span />
              <span />
              <span />
            </>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed left-0 top-0 z-[90] flex h-full w-72 flex-col border-r border-zinc-800 bg-zinc-900/90 p-8 pt-24 backdrop-blur-3xl"
          >
            <nav className="flex flex-col gap-6">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="group flex items-center gap-4 rounded-4xl p-4 text-right transition-all hover:bg-white/10"
                >
                  <item.icon className="text-zinc-400 group-hover:text-orange-400" size={24} />
                  <span className="text-lg font-medium text-white">{item.label}</span>
                </button>
              ))}
            </nav>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="site-container">{children}</div>
      </main>
    </>
  );
}
