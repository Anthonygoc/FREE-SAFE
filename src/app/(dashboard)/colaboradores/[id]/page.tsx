'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Edit, Save, User } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { RouteGuard } from '@/components/auth/route-guard';
import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useColaborador, useUpdateColaborador } from '@/hooks/use-colaboradores';

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result ?? ''));
  reader.onerror = () => reject(new Error('Falha ao carregar imagem'));
  reader.readAsDataURL(file);
});

const getIniciais = (nome: string) => nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

const statusTone = {
  ATIVO: 'green',
  AFASTADO: 'yellow',
  DESLIGADO: 'red',
} as const;

function formatarData(data?: string) {
  return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
}

export default function ColaboradorPerfilPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const colaboradorId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: colaborador, isLoading } = useColaborador(colaboradorId);
  const updateColaborador = useUpdateColaborador();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    cargo: '',
    telefone: '',
    email: '',
    endereco: '',
    turno: '',
    escala: '',
    status: 'ATIVO' as 'ATIVO' | 'AFASTADO' | 'DESLIGADO',
  });

  useEffect(() => {
    if (!colaborador) return;

    setForm({
      nome: colaborador.nome,
      cpf: colaborador.cpf,
      cargo: colaborador.cargo,
      telefone: colaborador.telefone ?? '',
      email: colaborador.email ?? '',
      endereco: colaborador.endereco ?? '',
      turno: colaborador.turno ?? '',
      escala: colaborador.escala ?? '',
      status: colaborador.status,
    });
  }, [colaborador]);

  const alteracoes = useMemo(() => {
    if (!colaborador) return {};

    return {
      ...(form.nome !== colaborador.nome ? { nome: form.nome } : {}),
      ...(form.cpf !== colaborador.cpf ? { cpf: form.cpf } : {}),
      ...(form.cargo !== colaborador.cargo ? { cargo: form.cargo } : {}),
      ...(form.telefone !== (colaborador.telefone ?? '') ? { telefone: form.telefone || undefined } : {}),
      ...(form.email !== (colaborador.email ?? '') ? { email: form.email || undefined } : {}),
      ...(form.endereco !== (colaborador.endereco ?? '') ? { endereco: form.endereco || undefined } : {}),
      ...(form.turno !== (colaborador.turno ?? '') ? { turno: form.turno || undefined } : {}),
      ...(form.escala !== (colaborador.escala ?? '') ? { escala: form.escala || undefined } : {}),
      ...(form.status !== colaborador.status ? { status: form.status } : {}),
    };
  }, [colaborador, form]);

  async function handleSalvar() {
    if (!colaborador) return;

    if (Object.keys(alteracoes).length === 0) {
      setEditando(false);
      return;
    }

    await updateColaborador.mutateAsync({
      id: colaborador.id,
      ...alteracoes,
    });

    setEditando(false);
  }

  async function handleTrocarFoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !colaborador) return;

    try {
      const fotoUrl = await toBase64(file);
      await updateColaborador.mutateAsync({
        id: colaborador.id,
        fotoUrl,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar imagem.');
    } finally {
      event.target.value = '';
    }
  }

  if (isLoading) {
    return (
      <RouteGuard recurso="colaboradores">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size={30} />
        </div>
      </RouteGuard>
    );
  }

  if (!colaborador) {
    return (
      <RouteGuard recurso="colaboradores">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => router.push('/colaboradores')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a lista
          </button>
          <CardBase>
            <p className="text-sm text-zinc-500">Colaborador não encontrado.</p>
          </CardBase>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard recurso="colaboradores">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
      <button
        type="button"
        onClick={() => router.push('/colaboradores')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para a lista
      </button>

      <CardBase className="rounded-2xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {colaborador.fotoUrl ? (
              <img src={colaborador.fotoUrl} alt={`Foto de ${colaborador.nome}`} className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-500 text-2xl font-bold text-white">
                {getIniciais(colaborador.nome)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950">{colaborador.nome}</h1>
                <BadgeStatus label={colaborador.status} tone={statusTone[colaborador.status]} />
              </div>
              <p className="mt-2 text-sm text-zinc-500">{colaborador.cargo}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-orange-300 hover:text-orange-600">
              <Camera className="h-4 w-4" />
              Trocar foto
              <input type="file" accept="image/*" className="hidden" onChange={handleTrocarFoto} />
            </label>

            {editando ? (
              <button
                type="button"
                onClick={handleSalvar}
                disabled={updateColaborador.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                Salvar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                <Edit className="h-4 w-4" />
                Editar
              </button>
            )}
          </div>
        </div>
      </CardBase>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <CardBase className="rounded-2xl">
          <div className="mb-5 flex items-center gap-2">
            <User className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-bold text-zinc-950">Dados pessoais</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Campo
              label="Nome"
              value={form.nome}
              editando={editando}
              onChange={(value) => setForm((current) => ({ ...current, nome: value }))}
            />
            <Campo
              label="Cargo"
              value={form.cargo}
              editando={editando}
              onChange={(value) => setForm((current) => ({ ...current, cargo: value }))}
            />
            <Campo
              label="CPF"
              value={form.cpf}
              editando={editando}
              onChange={(value) => setForm((current) => ({ ...current, cpf: value }))}
            />
            <Campo label="RG" value={colaborador.rg ?? '-'} />
            <Campo
              label="Telefone"
              value={form.telefone}
              editando={editando}
              onChange={(value) => setForm((current) => ({ ...current, telefone: value }))}
            />
            <Campo
              label="E-mail"
              value={form.email}
              editando={editando}
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
            />
            <Campo
              label="Endereço"
              value={form.endereco}
              editando={editando}
              onChange={(value) => setForm((current) => ({ ...current, endereco: value }))}
              className="md:col-span-2"
            />
            <Campo label="Data de admissão" value={formatarData(colaborador.dataAdmissao)} />
            <Campo
              label="Turno"
              value={form.turno}
              editando={editando}
              onChange={(value) => setForm((current) => ({ ...current, turno: value }))}
            />
            <Campo
              label="Escala"
              value={form.escala}
              editando={editando}
              onChange={(value) => setForm((current) => ({ ...current, escala: value }))}
            />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Status</p>
              {editando ? (
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as typeof form.status }))}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-orange-500"
                >
                  <option value="ATIVO">ATIVO</option>
                  <option value="AFASTADO">AFASTADO</option>
                  <option value="DESLIGADO">DESLIGADO</option>
                </select>
              ) : (
                <BadgeStatus label={colaborador.status} tone={statusTone[colaborador.status]} />
              )}
            </div>
          </div>
        </CardBase>

        <CardBase className="rounded-2xl">
          <h2 className="text-xl font-bold text-zinc-950">Treinamentos</h2>
          <p className="mt-3 text-sm text-zinc-500">Em breve</p>
        </CardBase>
      </div>
      </motion.div>
    </RouteGuard>
  );
}

function Campo({
  label,
  value,
  editando = false,
  onChange,
  className = '',
}: {
  label: string;
  value: string;
  editando?: boolean;
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      {editando && onChange ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-orange-500"
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
          {value || '-'}
        </div>
      )}
    </div>
  );
}
