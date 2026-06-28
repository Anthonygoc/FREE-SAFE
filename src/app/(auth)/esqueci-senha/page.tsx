'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsPending(true);

    try {
      const response = await fetch('/api/auth/esqueci-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error === 'dados_invalidos' ? 'Informe um e-mail válido.' : 'Não foi possível processar sua solicitação agora.');
        return;
      }

      setSuccess('Se o email existir, enviamos um link');
      setEmail('');
    } catch (requestError) {
      console.error('[auth] esqueci-senha error:', requestError);
      setError('Não foi possível processar sua solicitação agora.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-zinc-950 via-zinc-900 to-orange-950 p-12 lg:flex">
          <div>
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500 text-4xl font-black text-white">F</div>
            <h1 className="mt-8 text-5xl font-black text-white">FREE SAFE</h1>
            <p className="mt-3 max-w-md text-zinc-400">Recupere o acesso com segurança em poucos passos.</p>
          </div>

          <p className="text-sm text-zinc-600">Rede Free © 2026</p>
        </section>

        <section className="flex items-center justify-center bg-zinc-50 px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-md"
          >
            <div className="mb-8 lg:hidden">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-black text-white">F</div>
            </div>
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <Mail className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-950">Esqueci minha senha</h1>
            <p className="mt-2 text-zinc-500">Informe seu e-mail para enviarmos um link de recuperação.</p>

            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <form onSubmit={onSubmit} className="space-y-4">
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label htmlFor="email" className="text-sm font-semibold text-zinc-700">E-mail</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:ring-2 focus:ring-orange-500"
                  />
                </motion.div>

                <AnimatePresence>
                  {success ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{success}</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <AnimatePresence>
                  {error ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={isPending}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="btn-orange-gradient flex w-full items-center justify-center rounded-xl py-3 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    'Enviar link de recuperação'
                  )}
                </motion.button>
              </form>

              <Link
                href="/login"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao login
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
