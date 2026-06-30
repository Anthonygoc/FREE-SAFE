'use client';

import { motion } from 'framer-motion';
import { Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { CardBase, FieldError, FieldLabel, IconBadge, LoadingSpinner } from '@/components/ui';
import { useMeuPerfil, useUpdateMeuPerfil } from '@/hooks/use-perfil';

type FormErrors = {
  nome?: string;
  email?: string;
};

function emailValido(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export default function PerfilPage() {
  const { data, isLoading } = useMeuPerfil();
  const updateMeuPerfil = useUpdateMeuPerfil();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [erros, setErros] = useState<FormErrors>({});

  useEffect(() => {
    if (!data) {
      return;
    }

    setNome(data.nome);
    setEmail(data.email);
    setErros({});
  }, [data]);

  function validar() {
    const proximosErros: FormErrors = {};

    if (!nome.trim()) {
      proximosErros.nome = 'Informe seu nome.';
    }

    if (!emailValido(email.trim())) {
      proximosErros.email = 'Informe um e-mail válido.';
    }

    setErros(proximosErros);
    return Object.keys(proximosErros).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validar()) {
      return;
    }

    await updateMeuPerfil.mutateAsync({
      nome: nome.trim(),
      email: email.trim(),
    });
  }

  if (isLoading && !data) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <LoadingSpinner size={30} />
      </div>
    );
  }

  if (!data) {
    return (
      <CardBase>
        <p className="text-sm text-zinc-500">Não foi possível carregar seu perfil.</p>
      </CardBase>
    );
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="rounded-[28px] border border-zinc-200 bg-white shadow-sm"
      >
        <div className="space-y-5 p-6 lg:p-7">
          <div className="flex items-start gap-4">
            <IconBadge icon={UserRound} tone="orange" size="lg" />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Meu perfil</h1>
              <p className="text-sm text-zinc-500">Atualize seu nome e seu e-mail.</p>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <CardBase padding="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FieldLabel>Nome</FieldLabel>
                  <input
                    value={nome}
                    onChange={(event) => {
                      setNome(event.target.value);
                      setErros((current) => ({ ...current, nome: undefined }));
                    }}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="Seu nome"
                  />
                  <FieldError>{erros.nome}</FieldError>
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>E-mail</FieldLabel>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setErros((current) => ({ ...current, email: undefined }));
                    }}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="seu-email@empresa.com.br"
                  />
                  <FieldError>{erros.email}</FieldError>
                </div>
              </div>

              <div className="flex justify-end border-t border-zinc-100 pt-5">
                <button
                  type="submit"
                  disabled={updateMeuPerfil.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
                >
                  {updateMeuPerfil.isPending ? <LoadingSpinner size={18} /> : null}
                  Salvar alterações
                </button>
              </div>
            </form>
          </CardBase>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <CardBase className="space-y-5" padding="lg">
            <div className="flex items-start gap-3">
              <IconBadge icon={ShieldCheck} tone="zinc" size="md" />
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Dados de acesso</h2>
                <p className="text-sm text-zinc-500">Informações vinculadas ao seu login.</p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-zinc-600">Perfil</span>
                <span className="text-sm font-semibold text-zinc-950">{data.perfil}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-zinc-600">Posto</span>
                <span className="text-right text-sm font-semibold text-zinc-950">
                  {data.postoNome ?? 'Sem vínculo'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-2 shadow-sm">
                  <Mail className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Troca de e-mail</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    O novo endereço passa a valer no seu acesso assim que a atualização for salva.
                  </p>
                </div>
              </div>
            </div>
          </CardBase>
        </motion.aside>
      </div>
    </div>
  );
}
