'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  FlaskConical,
  FolderCheck,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  X,
  Users,
  Wrench,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { useSidebar } from './sidebar-context';

const navGroups = [
  {
    label: 'PRINCIPAL',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'OPERAÇÃO',
    items: [
      { href: '/anp', label: 'ANP / RAQ', icon: FlaskConical },
      { href: '/inmetro', label: 'INMETRO', icon: Gauge },
      { href: '/manutencao', label: 'Manutenção', icon: Wrench },
      { href: '/drenagem', label: 'Drenagem', icon: Droplets },
    ],
  },
  {
    label: 'PESSOAS',
    items: [
      { href: '/colaboradores', label: 'Colaboradores', icon: Users },
      { href: '/treinamentos', label: 'Treinamentos', icon: GraduationCap },
      { href: '/entrevistas', label: 'Entrevistas', icon: ClipboardCheck },
    ],
  },
  {
    label: 'CONFORMIDADE',
    items: [
      { href: '/postos', label: 'Postos', icon: Building2 },
      { href: '/documentos', label: 'Documentos', icon: FolderCheck },
      { href: '/auditorias', label: 'Auditorias', icon: ClipboardList },
      { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
    ],
  },
] as const;

function SidebarContent({ pathname, onNavigate, mobile = false }: { pathname: string; onNavigate?: () => void; mobile?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col p-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-black text-white">F</div>
          <div>
            <p className="text-xl font-black tracking-tight text-white">FREE SAFE</p>
            <p className="text-xs text-zinc-400">Compliance Operacional</p>
          </div>
        </div>

        {mobile ? (
          <button
            type="button"
            onClick={onNavigate}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1">
        <nav className="h-full space-y-1 overflow-y-auto pr-1">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label}>
              <p className={cn(
                'mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500',
                groupIndex === 0 ? 'mt-0' : 'mt-6',
              )}
              >
                {group.label}
              </p>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={[
                      'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'text-zinc-300 hover:bg-white/10',
                    ].join(' ')}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-6 mt-auto flex-shrink-0 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">Rede Free</p>
        <p className="mt-1 text-xs text-zinc-400">Painel administrativo dos 19 postos</p>
      </div>
    </motion.div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-zinc-950 lg:flex lg:flex-col">
        <SidebarContent pathname={pathname} />
      </aside>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-zinc-950 lg:hidden"
            >
              <SidebarContent pathname={pathname} onNavigate={closeSidebar} mobile />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
