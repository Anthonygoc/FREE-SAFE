'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
  Users,
  Wrench,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/postos', label: 'Postos', icon: Building2 },
  { href: '/colaboradores', label: 'Colaboradores', icon: Users },
  { href: '/treinamentos', label: 'Treinamentos', icon: GraduationCap },
  { href: '/entrevistas', label: 'Entrevistas', icon: ClipboardCheck },
  { href: '/anp', label: 'ANP / RAQ', icon: FlaskConical },
  { href: '/inmetro', label: 'INMETRO', icon: Gauge },
  { href: '/manutencao', label: 'Manutenção', icon: Wrench },
  { href: '/drenagem', label: 'Drenagem', icon: Droplets },
  { href: '/documentos', label: 'Documentos', icon: FolderCheck },
  { href: '/auditorias', label: 'Auditorias', icon: ClipboardList },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-zinc-950 lg:flex lg:flex-col">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col p-6">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-black text-white">F</div>
          <div>
            <p className="text-xl font-black tracking-tight text-white">FREE SAFE</p>
            <p className="text-xs text-zinc-400">Compliance Operacional</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
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
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">Rede Free</p>
          <p className="mt-1 text-xs text-zinc-400">Painel administrativo dos 19 postos</p>
        </div>
      </motion.div>
    </aside>
  );
}
