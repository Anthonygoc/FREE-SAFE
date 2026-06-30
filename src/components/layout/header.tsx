'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, Search, Settings, UserRound } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

import { NotificationBell } from './notification-bell';
import { useSidebar } from './sidebar-context';

export function Header() {
  const { openSidebar } = useSidebar();
  const { data: session } = useSession();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    }

    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const nomeUsuario = session?.user?.name?.trim() || session?.user?.email || 'Usuário';

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex h-20 items-center justify-between gap-4 px-5 lg:px-8"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={openSidebar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-all hover:bg-zinc-100 active:scale-95 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-lg font-black text-white">F</div>
            <span className="text-sm font-black tracking-tight text-zinc-900">FREE SAFE</span>
          </div>

          <div className="hidden items-center gap-3 rounded-2xl border border-transparent bg-zinc-100 px-4 py-2.5 text-zinc-500 transition-all duration-200 focus-within:border-orange-500/30 focus-within:bg-white focus-within:shadow-sm focus-within:ring-2 focus-within:ring-orange-500/20 lg:flex lg:min-w-[420px]">
            <Search className="h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar posto, colaborador, documento..."
              className="w-full bg-transparent text-sm text-zinc-700 placeholder:text-zinc-500 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <button className="rounded-xl border border-zinc-200 bg-white p-2.5 text-zinc-600 transition-all hover:bg-zinc-100 active:scale-95">
            <Settings className="h-5 w-5" />
          </button>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuAberto((current) => !current)}
              className="flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-95"
            >
              <UserRound className="h-5 w-5" />
              <span className="max-w-[160px] truncate">{nomeUsuario}</span>
            </button>

            {menuAberto ? (
              <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
                <div className="border-b border-zinc-100 px-3 py-2">
                  <p className="truncate text-sm font-semibold text-zinc-900">{nomeUsuario}</p>
                  <p className="truncate text-xs text-zinc-500">{session?.user?.email}</p>
                </div>

                <div className="space-y-1 pt-2">
                  <Link
                    href="/perfil"
                    onClick={() => setMenuAberto(false)}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    Meu perfil
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAberto(false);
                      void signOut({ callbackUrl: '/login' });
                    }}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </header>
  );
}
