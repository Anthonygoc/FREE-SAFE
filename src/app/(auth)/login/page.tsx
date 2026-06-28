'use client';
import { Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, BarChart3, BadgeCheck, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';
  const sessionExpired = searchParams.get('erro') === 'sessao-expirada';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsPending(true);
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setIsPending(false);
    if (!result || result.error) {
      setError('Credenciais inválidas. Verifique e-mail e senha.');
      return;
    }
    router.push(result.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <form onSubmit={onSubmit} className="space-y-4">
        <motion.div className="space-y-2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <label htmlFor="email" className="text-sm font-semibold text-zinc-700">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:ring-2 focus:ring-orange-500"
          />
        </motion.div>
        <motion.div className="space-y-2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <label htmlFor="password" className="text-sm font-semibold text-zinc-700">Senha</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-12 text-zinc-900 outline-none transition focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </motion.div>

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

        <AnimatePresence>
          {!error && sessionExpired ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
            >
              Sua sessão expirou. Faça login novamente.
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex justify-end">
          <Link
            href="/esqueci-senha"
            className="text-sm font-medium text-orange-600 transition hover:text-orange-700"
          >
            Esqueci minha senha
          </Link>
        </div>

        <motion.button
          type="submit"
          disabled={isPending}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          transition={{ delay: 0.3 }}
          className="btn-orange-gradient flex w-full items-center justify-center rounded-xl py-3 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            'Entrar'
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-zinc-950 via-zinc-900 to-orange-950 p-12 lg:flex">
          <div>
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500 text-4xl font-black text-white">F</div>
            <h1 className="mt-8 text-5xl font-black text-white">FREE SAFE</h1>
            <p className="mt-3 max-w-md text-zinc-400">Plataforma de Treinamento, Qualidade e Conformidade</p>

            <div className="mt-10 space-y-5">
              <div className="flex items-center gap-3 text-zinc-200">
                <ShieldCheck className="h-5 w-5 text-orange-500" />
                <span>Conformidade garantida</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-200">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                <span>Dashboard em tempo real</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-200">
                <BadgeCheck className="h-5 w-5 text-orange-500" />
                <span>19 postos monitorados</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-zinc-600">Rede Free © 2026</p>
        </section>

        <section className="flex items-center justify-center bg-zinc-50 px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-black text-white">F</div>
            </div>
            <h2 className="text-3xl font-bold text-zinc-950">Bem-vindo de volta</h2>
            <p className="mt-2 text-zinc-500">Entre com suas credenciais para acessar o painel</p>

            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <Suspense fallback={<div className="text-sm text-zinc-500">Carregando...</div>}>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
