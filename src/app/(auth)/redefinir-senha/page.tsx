'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const hasToken = token.trim().length > 0;
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!hasToken) {
      setError('Link inválido ou expirado.');
      return;
    }

    if (novaSenha.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError('As senhas informadas não conferem.');
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch('/api/auth/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          payload?.error === 'dados_invalidos'
            ? 'Verifique o link e a senha informada.'
            : payload?.error ?? 'Não foi possível redefinir sua senha.',
        );
        return;
      }

      setSuccess('Senha redefinida com sucesso.');
      setNovaSenha('');
      setConfirmarSenha('');
      window.setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (requestError) {
      console.error('[auth] redefinir-senha error:', requestError);
      setError('Não foi possível redefinir sua senha.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
        <KeyRound className="h-6 w-6" />
      </div>
      <h1 className="text-3xl font-bold text-zinc-950">Redefinir senha</h1>
      <p className="mt-2 text-zinc-500">Escolha uma nova senha para voltar ao painel com segurança.</p>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        {!hasToken ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Link inválido ou expirado.</span>
            </div>
            <Link
              href="/esqueci-senha"
              className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 transition hover:text-orange-700"
            >
              Solicitar novo link
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label htmlFor="novaSenha" className="text-sm font-semibold text-zinc-700">Nova senha</label>
              <input
                id="novaSenha"
                type="password"
                minLength={8}
                value={novaSenha}
                onChange={(event) => setNovaSenha(event.target.value)}
                required
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:ring-2 focus:ring-orange-500"
              />
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label htmlFor="confirmarSenha" className="text-sm font-semibold text-zinc-700">Confirmar senha</label>
              <input
                id="confirmarSenha"
                type="password"
                minLength={8}
                value={confirmarSenha}
                onChange={(event) => setConfirmarSenha(event.target.value)}
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
                'Salvar nova senha'
              )}
            </motion.button>
          </form>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Link>
          {success ? (
            <Link
              href="/login"
              className="text-sm font-medium text-orange-600 transition hover:text-orange-700"
            >
              Ir para login
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-zinc-950 via-zinc-900 to-orange-950 p-12 lg:flex">
          <div>
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500 text-4xl font-black text-white">F</div>
            <h1 className="mt-8 text-5xl font-black text-white">FREE SAFE</h1>
            <p className="mt-3 max-w-md text-zinc-400">Atualize sua senha com um link temporário e seguro.</p>
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

            <Suspense fallback={<div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">Carregando...</div>}>
              <RedefinirSenhaForm />
            </Suspense>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
