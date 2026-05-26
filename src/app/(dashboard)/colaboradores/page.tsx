'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { BadgeStatus } from '@/components/ui/badge-status';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useCreateColaborador, useColaboradores } from '@/hooks/use-colaboradores';
import { usePostos } from '@/hooks/use-postos';

const animation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

const createColaboradorSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().min(11, 'CPF inválido'),
  cargo: z.string().min(1, 'Cargo é obrigatório'),
  dataAdmissao: z.string().min(1, 'Data de admissão é obrigatória'),
  turno: z.string().optional(),
  telefone: z.string().optional(),
  email: z.union([z.literal(''), z.string().email('E-mail inválido')]).optional(),
});

type CreateColaboradorForm = z.infer<typeof createColaboradorSchema>;

export default function ColaboradoresPage() {
  const { data: postos, isLoading: loadingPostos } = usePostos();
  const [postoSelecionado, setPostoSelecionado] = useState<string>('');
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    if (!postoSelecionado && postos && postos.length > 0) {
      setPostoSelecionado(postos[0].id);
    }
  }, [postos, postoSelecionado]);

  const postoAtual = useMemo(
    () => (postos ?? []).find((posto) => posto.id === postoSelecionado),
    [postos, postoSelecionado],
  );

  const { data: colaboradores, isLoading: loadingColaboradores } = useColaboradores(postoSelecionado);
  const { mutate: createColaborador, isPending } = useCreateColaborador();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateColaboradorForm>({
    resolver: zodResolver(createColaboradorSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      cargo: '',
      dataAdmissao: '',
      turno: '',
      telefone: '',
      email: '',
    },
  });

  function onSubmit(values: CreateColaboradorForm) {
    if (!postoSelecionado) return;

    createColaborador(
      {
        postoId: postoSelecionado,
        nome: values.nome,
        cpf: values.cpf,
        cargo: values.cargo,
        dataAdmissao: values.dataAdmissao,
        turno: values.turno || undefined,
        telefone: values.telefone || undefined,
        email: values.email || undefined,
      },
      {
        onSuccess: () => {
          reset();
          setModalAberto(false);
        },
      },
    );
  }

  if (loadingPostos || loadingColaboradores) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size={30} />
      </div>
    );
  }

  return (
    <motion.div {...animation} className="space-y-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Colaboradores</h1>
          <p className="mt-1 text-zinc-500">Acompanhe situação e progresso dos colaboradores por posto.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
        >
          Novo colaborador
        </button>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <label htmlFor="posto-select" className="mb-2 block text-sm font-medium text-zinc-600">
          Filtrar por posto
        </label>
        <select
          id="posto-select"
          value={postoSelecionado}
          onChange={(event) => setPostoSelecionado(event.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-orange-500"
        >
          {(postos ?? []).map((posto) => (
            <option key={posto.id} value={posto.id}>
              {posto.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr className="text-left text-zinc-600">
              <th className="px-4 py-3 font-semibold">Colaborador</th>
              <th className="px-4 py-3 font-semibold">Posto</th>
              <th className="px-4 py-3 font-semibold">Cargo</th>
              <th className="px-4 py-3 font-semibold">Progresso</th>
              <th className="px-4 py-3 font-semibold">Situação</th>
              <th className="px-4 py-3 font-semibold">Ação</th>
            </tr>
          </thead>
          <tbody>
            {(colaboradores ?? []).map((colaborador) => (
              <tr key={colaborador.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{colaborador.nome}</td>
                <td className="px-4 py-3 text-zinc-600">{postoAtual?.nome ?? '-'}</td>
                <td className="px-4 py-3 text-zinc-600">{colaborador.cargo}</td>
                <td className="px-4 py-3">
                  <div className="w-36">
                    <ProgressBar value={100} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <BadgeStatus
                    label={colaborador.status === 'ATIVO' ? 'Regular' : colaborador.status}
                    tone={colaborador.status === 'ATIVO' ? 'green' : 'yellow'}
                  />
                </td>
                <td className="px-4 py-3">
                  <button type="button" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                    Ver ficha
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-950">Novo colaborador</h2>
                <p className="text-sm text-zinc-500">Cadastro vinculado ao posto selecionado.</p>
              </div>
              <button type="button" onClick={() => setModalAberto(false)} className="text-zinc-500 hover:text-zinc-700">
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Nome</label>
                  <input {...register('nome')} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
                  {errors.nome ? <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">CPF</label>
                  <input {...register('cpf')} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
                  {errors.cpf ? <p className="mt-1 text-xs text-red-600">{errors.cpf.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Cargo</label>
                  <input {...register('cargo')} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
                  {errors.cargo ? <p className="mt-1 text-xs text-red-600">{errors.cargo.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Data de admissão</label>
                  <input type="date" {...register('dataAdmissao')} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
                  {errors.dataAdmissao ? <p className="mt-1 text-xs text-red-600">{errors.dataAdmissao.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Turno</label>
                  <input {...register('turno')} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Telefone</label>
                  <input {...register('telefone')} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-zinc-700">E-mail</label>
                  <input {...register('email')} className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500" />
                  {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Posto</label>
                  <input
                    value={postoAtual ? `${postoAtual.nome} (${postoAtual.cidade}/${postoAtual.uf})` : ''}
                    disabled
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  {isPending ? 'Salvando...' : 'Salvar colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
