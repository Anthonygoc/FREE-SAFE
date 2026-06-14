'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Edit, Power, Search, Shield, UserCog, UserPlus, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { RouteGuard } from '@/components/auth/route-guard';
import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePostos } from '@/hooks/use-postos';
import {
  type CreateUsuarioInput,
  type PerfilUsuarioOperacional,
  type UpdateUsuarioInput,
  type UsuarioResumo,
  useCreateUsuario,
  useToggleUsuarioAtivo,
  useUpdateUsuario,
  useUsuarios,
} from '@/hooks/use-usuarios';
import { cn } from '@/lib/utils';

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const perfilTone: Record<PerfilUsuarioOperacional, 'dark' | 'orange' | 'blue'> = {
  ADMIN: 'dark',
  GERENTE: 'orange',
  ADMINISTRATIVO: 'blue',
};

const perfilOptions: Array<{ value: 'GERENTE' | 'ADMINISTRATIVO'; label: string }> = [
  { value: 'GERENTE', label: 'Gerente' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
];

type FormState = {
  nome: string;
  email: string;
  senha: string;
  perfil: 'GERENTE' | 'ADMINISTRATIVO';
  postoId: string;
  novaSenha: string;
};

function valorInicialFormulario(): FormState {
  return {
    nome: '',
    email: '',
    senha: '',
    perfil: 'GERENTE',
    postoId: '',
    novaSenha: '',
  };
}

function formatarData(data: string) {
  return new Date(data).toLocaleDateString('pt-BR');
}

function getIniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
}

function emailValido(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export default function UsuariosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [postoFiltro, setPostoFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioResumo | null>(null);
  const [form, setForm] = useState<FormState>(valorInicialFormulario);

  const isAdmin = session?.user?.perfil === 'ADMIN';
  const { data: postos, isLoading: loadingPostos } = usePostos(status === 'authenticated' && isAdmin);
  const { data: usuarios, isLoading: loadingUsuarios } = useUsuarios(
    postoFiltro || undefined,
    status === 'authenticated' && isAdmin,
  );
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const toggleUsuarioAtivo = useToggleUsuarioAtivo();

  useEffect(() => {
    if (status === 'authenticated' && !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, router, status]);

  const postosPorId = useMemo(
    () => new Map((postos ?? []).map((posto) => [posto.id, posto.nome])),
    [postos],
  );

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');

    return (usuarios ?? []).filter((usuario) => {
      if (!termo) {
        return true;
      }

      const postoNome = usuario.postoId ? (postosPorId.get(usuario.postoId) ?? '') : '';
      return [usuario.nome, usuario.email, usuario.perfil, postoNome]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(termo);
    });
  }, [busca, postosPorId, usuarios]);

  const loading = status === 'loading' || (status === 'authenticated' && isAdmin && (loadingPostos || loadingUsuarios));

  function abrirNovoUsuario() {
    setUsuarioEditando(null);
    setForm({
      ...valorInicialFormulario(),
      postoId: postos?.[0]?.id ?? '',
    });
    setModalAberto(true);
  }

  function abrirEdicao(usuario: UsuarioResumo) {
    setUsuarioEditando(usuario);
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      perfil: usuario.perfil === 'ADMINISTRATIVO' ? 'ADMINISTRATIVO' : 'GERENTE',
      postoId: usuario.postoId ?? '',
      novaSenha: '',
    });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setUsuarioEditando(null);
    setForm(valorInicialFormulario());
  }

  async function handleSalvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.nome.trim()) {
      toast.error('Informe o nome do usuário.');
      return;
    }

    if (!form.postoId) {
      toast.error('Selecione um posto.');
      return;
    }

    if (usuarioEditando) {
      const input: UpdateUsuarioInput = {
        id: usuarioEditando.id,
        nome: form.nome.trim(),
        perfil: form.perfil,
        postoId: form.postoId,
      };

      if (form.novaSenha.trim()) {
        if (form.novaSenha.trim().length < 8) {
          toast.error('A nova senha deve ter pelo menos 8 caracteres.');
          return;
        }

        input.novaSenha = form.novaSenha.trim();
      }

      await updateUsuario.mutateAsync(input);
      fecharModal();
      return;
    }

    if (!emailValido(form.email.trim())) {
      toast.error('Informe um e-mail válido.');
      return;
    }

    if (form.senha.trim().length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    const input: CreateUsuarioInput = {
      nome: form.nome.trim(),
      email: form.email.trim(),
      senha: form.senha.trim(),
      perfil: form.perfil,
      postoId: form.postoId,
    };

    await createUsuario.mutateAsync(input);
    fecharModal();
  }

  async function handleToggleAtivo(usuario: UsuarioResumo) {
    const proximoStatus = !usuario.ativo;

    if (!proximoStatus) {
      const confirmou = window.confirm('Desativar este usuário? Ele não poderá mais fazer login.');
      if (!confirmou) {
        return;
      }
    }

    await toggleUsuarioAtivo.mutateAsync({
      id: usuario.id,
      ativo: proximoStatus,
    });
  }

  if (loading) {
    return (
      <RouteGuard recurso="usuarios">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size={30} />
        </div>
      </RouteGuard>
    );
  }

  if (status === 'authenticated' && !isAdmin) {
    return null;
  }

  return (
    <RouteGuard recurso="usuarios">
      <>
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="rounded-[28px] border border-zinc-200 bg-white shadow-sm"
        >
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between lg:p-7">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-50 p-2">
                  <UserCog className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-sm font-semibold text-orange-600">FREE SAFE</p>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Gestão de Usuários</h1>
                <p className="max-w-3xl text-sm text-zinc-500">
                  Controle os acessos operacionais da rede, distribua perfis e mantenha cada usuário vinculado ao posto correto.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={abrirNovoUsuario}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98]"
            >
              <UserPlus className="h-4 w-4" />
              Novo usuário
            </button>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <CardBase padding="lg">
            <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-zinc-900">Acessos cadastrados</h2>
                <p className="text-sm text-zinc-500">{usuariosFiltrados.length} usuário(s) encontrado(s)</p>
              </div>

              <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                <select
                  value={postoFiltro}
                  onChange={(e) => setPostoFiltro(e.target.value)}
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">Todos os postos</option>
                  {(postos ?? []).map((posto) => (
                    <option key={posto.id} value={posto.id}>
                      {posto.nome}
                    </option>
                  ))}
                </select>

                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por nome, e-mail ou posto"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </label>
              </div>
            </div>

            {usuariosFiltrados.length === 0 ? (
              <div className="py-6">
                <EmptyState
                  icon={UserCog}
                  title="Nenhum usuário encontrado"
                  description="Crie o primeiro acesso operacional ou ajuste os filtros atuais."
                  action={(
                    <button
                      type="button"
                      onClick={abrirNovoUsuario}
                      className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98]"
                    >
                      <UserPlus className="h-4 w-4" />
                      Novo usuário
                    </button>
                  )}
                />
              </div>
            ) : (
              <motion.div
                className="mt-6 space-y-3"
                initial="hidden"
                animate="show"
                variants={staggerContainer}
              >
                {usuariosFiltrados.map((usuario) => (
                  <motion.div key={usuario.id} variants={staggerItem}>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-sm font-bold text-orange-700">
                            {getIniciais(usuario.nome)}
                          </div>

                          <div className="min-w-0 space-y-3">
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold text-zinc-900">{usuario.nome}</p>
                              <p className="truncate text-sm text-zinc-500">{usuario.email}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <BadgeStatus label={usuario.perfil} tone={perfilTone[usuario.perfil]} size="sm" />
                              <BadgeStatus label={usuario.ativo ? 'Ativo' : 'Inativo'} tone={usuario.ativo ? 'green' : 'default'} size="sm" />
                              <span className="text-xs text-zinc-500">
                                Posto: <span className="font-medium text-zinc-700">{usuario.postoId ? (postosPorId.get(usuario.postoId) ?? 'Posto não encontrado') : 'Sem vínculo'}</span>
                              </span>
                              <span className="text-xs text-zinc-500">
                                Criado em <span className="font-medium text-zinc-700">{formatarData(usuario.criadoEm)}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEdicao(usuario)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleAtivo(usuario)}
                            disabled={toggleUsuarioAtivo.isPending}
                            className={cn(
                              'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
                              usuario.ativo
                                ? 'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                                : 'bg-orange-500 text-white shadow-sm hover:bg-orange-600 hover:shadow-md',
                            )}
                          >
                            <Power className="h-4 w-4" />
                            {usuario.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardBase>
        </motion.section>
      </div>

      <AnimatePresence>
        {modalAberto ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-zinc-950/70 p-4 backdrop-blur-sm"
          >
            <div className="flex min-h-full items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-xl"
              >
                <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-orange-50 p-2">
                        {usuarioEditando ? <Edit className="h-5 w-5 text-orange-600" /> : <UserPlus className="h-5 w-5 text-orange-600" />}
                      </div>
                      <h2 className="text-base font-semibold text-zinc-900">
                        {usuarioEditando ? 'Editar usuário' : 'Novo usuário'}
                      </h2>
                    </div>
                    <p className="text-sm text-zinc-500">
                      {usuarioEditando
                        ? 'Atualize o acesso operacional, o perfil e o posto vinculado.'
                        : 'Cadastre um novo usuário operacional para a equipe da rede.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fecharModal}
                    className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSalvar} className="space-y-5 p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-zinc-700">Nome</label>
                      <input
                        value={form.nome}
                        onChange={(e) => setForm((current) => ({ ...current, nome: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        placeholder="Nome completo do usuário"
                      />
                    </div>

                    {!usuarioEditando ? (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-zinc-700">E-mail</label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                            placeholder="usuario@empresa.com.br"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-zinc-700">Senha</label>
                          <input
                            type="password"
                            value={form.senha}
                            onChange={(e) => setForm((current) => ({ ...current, senha: e.target.value }))}
                            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                            placeholder="Mínimo 8 caracteres"
                          />
                          <p className="mt-2 text-xs text-zinc-500">A senha inicial precisa ter no mínimo 8 caracteres.</p>
                        </div>
                      </>
                    ) : (
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-zinc-700">Nova senha</label>
                        <input
                          type="password"
                          value={form.novaSenha}
                          onChange={(e) => setForm((current) => ({ ...current, novaSenha: e.target.value }))}
                          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                          placeholder="Deixe em branco para manter a senha atual"
                        />
                        <p className="mt-2 text-xs text-zinc-500">Se informado, a nova senha também deve ter no mínimo 8 caracteres.</p>
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">Perfil</label>
                      <select
                        value={form.perfil}
                        onChange={(e) => setForm((current) => ({ ...current, perfil: e.target.value as 'GERENTE' | 'ADMINISTRATIVO' }))}
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      >
                        {perfilOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">Posto</label>
                      <select
                        value={form.postoId}
                        onChange={(e) => setForm((current) => ({ ...current, postoId: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      >
                        <option value="">Selecione um posto</option>
                        {(postos ?? []).map((posto) => (
                          <option key={posto.id} value={posto.id}>
                            {posto.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-white p-2 shadow-sm">
                        <Shield className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">Controle administrativo</p>
                        <p className="mt-1 text-sm text-zinc-600">
                          Apenas administradores podem criar, editar ou desativar usuários operacionais.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-2 border-t border-zinc-100 pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={fecharModal}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-[0.98]"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={createUsuario.isPending || updateUsuario.isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
                    >
                      {createUsuario.isPending || updateUsuario.isPending ? <LoadingSpinner size={18} /> : null}
                      {usuarioEditando ? 'Salvar alterações' : 'Criar usuário'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      </>
    </RouteGuard>
  );
}
