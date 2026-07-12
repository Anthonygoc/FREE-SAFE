'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Calendar,
  ClipboardList,
  FlaskConical,
  FolderCheck,
  Gauge,
  GraduationCap,
  Info,
  LayoutDashboard,
  UserCog,
  X,
  Users,
} from 'lucide-react';

import type { Recurso } from '@/domain/permissions/permissions';
import { podeVer } from '@/lib/can-access';
import { cn } from '@/lib/utils';
import { APP_NAME, APP_VERSION } from '@/lib/version';

import { useSidebar } from './sidebar-context';

const navGroups = [
  {
    label: 'PRINCIPAL',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard, recurso: 'dashboard' as Recurso },
      { href: '/postos', label: 'Postos', icon: Building2, recurso: 'postos' as Recurso },
    ],
  },
  {
    label: 'OPERAÇÃO',
    items: [
      { href: '/anp', label: 'ANP / RAQ', icon: FlaskConical, recurso: 'anp' as Recurso },
      { href: '/inmetro', label: 'INMETRO', icon: Gauge, recurso: 'inmetro' as Recurso },
      { href: '/calendario', label: 'Calendário', icon: Calendar, recurso: 'calendario' as Recurso },
      { href: '/documentos', label: 'Documentos', icon: FolderCheck, recurso: 'documentos' as Recurso },
    ],
  },
  {
    label: 'PESSOAS',
    items: [
      { href: '/colaboradores', label: 'Colaboradores', icon: Users, recurso: 'colaboradores' as Recurso },
      { href: '/treinamentos', label: 'Treinamentos', icon: GraduationCap, recurso: 'cursos' as Recurso },
    ],
  },
] as const;

function SidebarContent({
  pathname,
  onNavigate,
  mobile = false,
  isAdmin,
  perfil,
}: {
  pathname: string;
  onNavigate?: () => void;
  mobile?: boolean;
  isAdmin: boolean;
  perfil?: string;
}) {
  const groups = isAdmin
    ? [
        ...navGroups,
        {
          label: 'ADMINISTRAÇÃO',
          items: [
            { href: '/usuarios', label: 'Usuários', icon: UserCog, recurso: 'usuarios' as Recurso },
            { href: '/auditoria', label: 'Auditoria', icon: ClipboardList, recurso: 'auditorias' as Recurso },
          ],
        },
      ]
    : navGroups;

  const filteredGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => podeVer(perfil, item.recurso)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col p-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-black text-white">F</div>
          <div>
            <p className="text-xl font-black tracking-tight text-white">{APP_NAME}</p>
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
          {filteredGroups.map((group, groupIndex) => (
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
                const isActive = item.href === '/'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

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
        <Link
          href="/sobre"
          onClick={onNavigate}
          className={[
            'mt-4 flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-medium transition',
            pathname === '/sobre'
              ? 'bg-orange-500 text-white'
              : 'text-zinc-300 hover:bg-white/10 hover:text-white',
          ].join(' ')}
        >
          <Info className="h-4 w-4" />
          <span>Sobre</span>
        </Link>
        <Link
          href="/privacidade"
          onClick={onNavigate}
          className="mt-2 inline-flex text-xs font-medium text-orange-400 transition hover:text-orange-300"
        >
          Política de Privacidade
        </Link>
        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          {APP_NAME} v{APP_VERSION}
        </p>
      </div>
    </motion.div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();
  const { data: session } = useSession();
  const perfil = session?.user?.perfil;
  const isAdmin = perfil === 'ADMIN';

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-zinc-950 lg:flex lg:flex-col">
        <SidebarContent pathname={pathname} isAdmin={isAdmin} perfil={perfil} />
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
              <SidebarContent pathname={pathname} onNavigate={closeSidebar} mobile isAdmin={isAdmin} perfil={perfil} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
