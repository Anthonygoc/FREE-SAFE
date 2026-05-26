'use client';

import { motion } from 'framer-motion';
import { Bell, Search, Settings, UserRound } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex h-20 items-center justify-between gap-4 px-5 lg:px-8"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-lg font-black text-white">F</div>
            <span className="text-sm font-black tracking-tight text-zinc-900">FREE SAFE</span>
          </div>

          <div className="hidden items-center gap-3 rounded-2xl bg-zinc-100 px-4 py-2 text-zinc-500 lg:flex lg:min-w-[420px]">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar posto, colaborador, documento..."
              className="w-full bg-transparent text-sm text-zinc-700 placeholder:text-zinc-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-2xl border border-zinc-200 bg-white p-2.5 text-zinc-600 transition hover:bg-zinc-100">
            <Bell className="h-4 w-4" />
          </button>
          <button className="rounded-2xl border border-zinc-200 bg-white p-2.5 text-zinc-600 transition hover:bg-zinc-100">
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <UserRound className="h-4 w-4" />
            Admin
          </button>
        </div>
      </motion.div>
    </header>
  );
}
