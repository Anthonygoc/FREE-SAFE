'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  severidade?: 'destrutivo' | 'normal';
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ConfirmDialog({
  aberto,
  titulo,
  descricao,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  severidade = 'destrutivo',
  carregando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  const confirmarRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !carregando) {
        onCancelar();
      }
    };

    window.addEventListener('keydown', handleEscape);
    const timeoutId = window.setTimeout(() => confirmarRef.current?.focus(), 30);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.clearTimeout(timeoutId);
    };
  }, [aberto, carregando, onCancelar]);

  const isDestrutivo = severidade === 'destrutivo';
  const Icone = isDestrutivo ? AlertTriangle : Info;

  return (
    <AnimatePresence>
      {aberto ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (!carregando) {
              onCancelar();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby={descricao ? 'confirm-dialog-description' : undefined}
          >
            <div className="space-y-5">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full',
                  isDestrutivo ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600',
                )}
              >
                <Icone className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <h2 id="confirm-dialog-title" className="text-xl font-bold tracking-tight text-zinc-950">
                  {titulo}
                </h2>
                {descricao ? (
                  <p id="confirm-dialog-description" className="text-sm leading-6 text-zinc-500">
                    {descricao}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onCancelar}
                  disabled={carregando}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {textoCancelar}
                </button>
                <button
                  ref={confirmarRef}
                  type="button"
                  onClick={onConfirmar}
                  disabled={carregando}
                  className={cn(
                    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60',
                    isDestrutivo ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600',
                  )}
                >
                  {carregando ? <LoadingSpinner size={16} /> : null}
                  {textoConfirmar}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
