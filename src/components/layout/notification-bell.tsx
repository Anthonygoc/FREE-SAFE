'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bell, CheckCheck, ChevronRight, CircleAlert } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useNotificacoes } from '@/hooks/use-notificacoes';
import { cn } from '@/lib/utils';

function formatarTempoRelativo(dataIso: string): string {
  const data = new Date(dataIso);
  const agora = new Date();
  const diffMs = data.getTime() - agora.getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const diffHoras = Math.round(diffMs / (1000 * 60 * 60));
  const diffMinutos = Math.round(diffMs / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

  if (Math.abs(diffDias) >= 1) {
    return formatter.format(diffDias, 'day');
  }

  if (Math.abs(diffHoras) >= 1) {
    return formatter.format(diffHoras, 'hour');
  }

  return formatter.format(diffMinutos, 'minute');
}

export function NotificationBell() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data, isLoading } = useNotificacoes();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isAdmin = session?.user?.perfil === 'ADMIN';
  const total = data?.total ?? 0;
  const criticos = data?.criticos ?? 0;
  const contador = total > 9 ? '9+' : String(total);
  const itens = data?.itens ?? [];

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
    };
  }, [isOpen]);

  const resumo = useMemo(() => {
    if (isLoading) {
      return 'Carregando pendências...';
    }

    if (total === 0) {
      return 'Nenhuma pendência no momento';
    }

    return `${total} ${total === 1 ? 'pendência' : 'pendências'}`;
  }, [isLoading, total]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-xl border border-zinc-200 bg-white p-2.5 text-zinc-600 transition-all hover:bg-zinc-100 active:scale-95"
        aria-label="Abrir notificações"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {total > 0 ? (
          <span
            className={cn(
              'absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm tabular-nums',
              criticos > 0 ? 'animate-pulse' : '',
            )}
          >
            {contador}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-transparent"
              aria-label="Fechar notificações"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 top-full z-50 mt-3 w-[min(360px,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_70px_-30px_rgba(24,24,27,0.45)] sm:w-[360px]"
            >
              <div className="border-b border-zinc-200 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">Notificações</p>
                    <p className="text-xs text-zinc-500">{resumo}</p>
                  </div>
                  <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 tabular-nums">
                    {total}
                  </span>
                </div>
              </div>

              <div className="max-h-[min(70vh,28rem)] overflow-y-auto">
                {itens.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <CheckCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Nenhuma pendência no momento</p>
                      <p className="mt-1 text-sm text-zinc-500">O posto está sem alertas nesta visão.</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    {itens.map((item, index) => {
                      const isCritico = item.severidade === 'critico';
                      const Icon = isCritico ? AlertTriangle : CircleAlert;

                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => {
                            setIsOpen(false);
                            router.push(item.link);
                          }}
                          className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-zinc-50"
                        >
                          <div
                            className={cn(
                              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                              isCritico ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600',
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-zinc-950">{item.titulo}</p>
                                <p className="mt-1 text-sm text-zinc-600">{item.descricao}</p>
                              </div>
                              <span
                                className={cn(
                                  'shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide',
                                  isCritico ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700',
                                )}
                              >
                                {isCritico ? 'Crítico' : 'Atenção'}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                              {isAdmin && item.postoNome ? <span className="truncate">{item.postoNome}</span> : null}
                              {isAdmin && item.postoNome ? <span>•</span> : null}
                              <span>{formatarTempoRelativo(item.data)}</span>
                            </div>
                          </div>

                          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-400" />
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/documentos');
                  }}
                  className="text-sm font-medium text-orange-600 transition hover:text-orange-700"
                >
                  Ver documentos
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
