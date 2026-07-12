'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronLeft,
  Circle,
  FileText,
  FlaskConical,
  Fuel,
  Gauge,
  GraduationCap,
  UserCog,
  Users,
} from 'lucide-react';
import { ptBR } from 'date-fns/locale';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';

import { RouteGuard } from '@/components/auth/route-guard';
import { BadgeStatus, CardBase, EmptyState, SelectBase, Skeleton } from '@/components/ui';
import { type AuditAcao, type AuditRecurso } from '@/domain/entities/audit-log.entity';
import { type ResumoDiaEvento, useResumoDia, useUsuariosCalendario } from '@/hooks/use-calendario';
import { usePostos } from '@/hooks/use-postos';
import { cn } from '@/lib/utils';

const TIME_ZONE = 'America/Cuiaba';
const TODOS_VALUE = '__todos__';

const pageAnimation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
} as const;

const actionTone: Record<AuditAcao, 'emerald' | 'yellow' | 'red' | 'blue' | 'dark'> = {
  CRIAR: 'emerald',
  EDITAR: 'yellow',
  EXCLUIR: 'red',
  EXPORTAR: 'blue',
  LOGIN: 'dark',
  LOGOUT: 'dark',
};

const actionLabels: Record<AuditAcao, string> = {
  CRIAR: 'Criar',
  EDITAR: 'Editar',
  EXCLUIR: 'Excluir',
  EXPORTAR: 'Exportar',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
};

type TipoMeta = {
  icon: typeof Circle;
  label: string;
  containerClassName: string;
  iconClassName: string;
};

const tipoMeta: Partial<Record<AuditRecurso, TipoMeta>> = {
  AFERICAO: {
    icon: Gauge,
    label: 'Aferição',
    containerClassName: 'bg-orange-50 ring-1 ring-orange-100',
    iconClassName: 'text-orange-600',
  },
  RAQ: {
    icon: FlaskConical,
    label: 'RAQ',
    containerClassName: 'bg-sky-50 ring-1 ring-sky-100',
    iconClassName: 'text-sky-600',
  },
  DOCUMENTO: {
    icon: FileText,
    label: 'Documento',
    containerClassName: 'bg-zinc-100 ring-1 ring-zinc-200',
    iconClassName: 'text-zinc-600',
  },
  COLABORADOR: {
    icon: Users,
    label: 'Colaborador',
    containerClassName: 'bg-violet-50 ring-1 ring-violet-100',
    iconClassName: 'text-violet-600',
  },
  BOMBA: {
    icon: Fuel,
    label: 'Bomba',
    containerClassName: 'bg-orange-100 ring-1 ring-orange-200',
    iconClassName: 'text-orange-700',
  },
  POSTO: {
    icon: Building2,
    label: 'Posto',
    containerClassName: 'bg-teal-50 ring-1 ring-teal-100',
    iconClassName: 'text-teal-600',
  },
  CURSO: {
    icon: GraduationCap,
    label: 'Curso',
    containerClassName: 'bg-emerald-50 ring-1 ring-emerald-100',
    iconClassName: 'text-emerald-600',
  },
  CERTIFICADO: {
    icon: GraduationCap,
    label: 'Certificado',
    containerClassName: 'bg-emerald-50 ring-1 ring-emerald-100',
    iconClassName: 'text-emerald-600',
  },
  USUARIO: {
    icon: UserCog,
    label: 'Usuário',
    containerClassName: 'bg-zinc-100 ring-1 ring-zinc-200',
    iconClassName: 'text-zinc-600',
  },
};

const recursoOptions: Array<{ value: string; label: string }> = [
  { value: TODOS_VALUE, label: 'Todos os tipos' },
  { value: 'AFERICAO', label: 'Aferição' },
  { value: 'RAQ', label: 'RAQ' },
  { value: 'DOCUMENTO', label: 'Documento' },
  { value: 'COLABORADOR', label: 'Colaborador' },
  { value: 'BOMBA', label: 'Bomba' },
  { value: 'POSTO', label: 'Posto' },
  { value: 'CURSO', label: 'Curso' },
  { value: 'CERTIFICADO', label: 'Certificado' },
  { value: 'USUARIO', label: 'Usuário' },
];

const acaoOptions: Array<{ value: string; label: string }> = [
  { value: TODOS_VALUE, label: 'Todas as ações' },
  { value: 'CRIAR', label: 'Criar' },
  { value: 'EDITAR', label: 'Editar' },
  { value: 'EXCLUIR', label: 'Excluir' },
  { value: 'EXPORTAR', label: 'Exportar' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
];

function getMetaTipo(tipo: AuditRecurso): TipoMeta {
  return tipoMeta[tipo] ?? {
    icon: Circle,
    label: tipo,
    containerClassName: 'bg-zinc-100 ring-1 ring-zinc-200',
    iconClassName: 'text-zinc-500',
  };
}

function formatarTituloData(data: string): string {
  try {
    const base = fromZonedTime(`${data}T12:00:00`, TIME_ZONE);
    const titulo = formatInTimeZone(base, TIME_ZONE, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    return titulo.charAt(0).toUpperCase() + titulo.slice(1);
  } catch {
    return data;
  }
}

function ResumoDiaSkeleton() {
  return (
    <div className="space-y-6">
      <CardBase className="space-y-4">
        <Skeleton className="h-10 w-44 rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-9 w-[28rem] max-w-full" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
      </CardBase>

      <CardBase className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </CardBase>

      <CardBase className="space-y-3">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-4 w-72 max-w-full" />
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-2xl" />
        ))}
      </CardBase>

      <CardBase className="space-y-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="grid gap-4 md:grid-cols-[72px_56px_minmax(0,1fr)]">
            <Skeleton className="h-5 w-12" />
            <div className="flex justify-center">
              <Skeleton className="h-12 w-12 rounded-2xl" />
            </div>
            <div className="space-y-3 rounded-2xl border border-zinc-200 p-4">
              <Skeleton className="h-5 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </CardBase>
    </div>
  );
}

function TimelineItem({
  evento,
  ultimo,
}: {
  evento: ResumoDiaEvento;
  ultimo: boolean;
}) {
  const meta = getMetaTipo(evento.recurso);
  const Icon = meta.icon;

  return (
    <div className="grid gap-4 md:grid-cols-[72px_56px_minmax(0,1fr)]">
      <div className="pt-3 text-sm font-semibold tabular-nums text-zinc-500">
        {evento.hora}
      </div>

      <div className="relative flex justify-center">
        {!ultimo ? (
          <span className="absolute left-1/2 top-12 h-[calc(100%+1.5rem)] w-px -translate-x-1/2 bg-zinc-200" aria-hidden="true" />
        ) : null}
        <div className={cn('relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl', meta.containerClassName)}>
          <Icon className={cn('h-5 w-5', meta.iconClassName)} />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-6 text-zinc-950">
              {evento.descricao}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {evento.usuarioNome}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <BadgeStatus label={meta.label} tone="default" size="sm" />
            <BadgeStatus label={actionLabels[evento.acao]} tone={actionTone[evento.acao]} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResumoDiaPage() {
  const params = useParams<{ data: string }>();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const postoId = searchParams.get('postoId') ?? undefined;
  const data = params.data;
  const gerentePostoId = session?.user?.perfil === 'GERENTE' ? session.user?.postoId ?? undefined : undefined;
  const postoIdEfetivo = gerentePostoId ?? postoId;
  const postoIdConsulta = postoIdEfetivo ?? postoId;
  const queriesEnabled = status === 'authenticated';
  const deveListarUsuarios = Boolean(postoIdEfetivo) && queriesEnabled;

  const [recursoSelecionado, setRecursoSelecionado] = useState<string>(TODOS_VALUE);
  const [acaoSelecionada, setAcaoSelecionada] = useState<string>(TODOS_VALUE);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string>(TODOS_VALUE);

  const filtros = useMemo(
    () => ({
      recurso: recursoSelecionado === TODOS_VALUE ? undefined : recursoSelecionado as AuditRecurso,
      acao: acaoSelecionada === TODOS_VALUE ? undefined : acaoSelecionada as AuditAcao,
      usuarioId: usuarioSelecionado === TODOS_VALUE ? undefined : usuarioSelecionado,
    }),
    [acaoSelecionada, recursoSelecionado, usuarioSelecionado],
  );

  const { data: resumo, isLoading: loadingResumo, error: resumoError } = useResumoDia(
    postoIdConsulta,
    data,
    filtros,
    queriesEnabled,
  );
  const { data: postos, isLoading: loadingPostos, error: postosError } = usePostos(queriesEnabled);
  const { data: usuarios, isLoading: loadingUsuarios, error: usuariosError } = useUsuariosCalendario(
    postoIdEfetivo,
    deveListarUsuarios,
  );

  const tituloData = useMemo(() => formatarTituloData(data), [data]);
  const voltarHref = postoIdConsulta ? `/calendario?postoId=${encodeURIComponent(postoIdConsulta)}` : '/calendario';
  const possuiFiltrosAtivos = Boolean(filtros.recurso || filtros.acao || filtros.usuarioId);

  const postoAtual = useMemo(
    () => postos?.find((item) => item.id === postoIdEfetivo),
    [postoIdEfetivo, postos],
  );

  const subtituloPosto = postoIdEfetivo
    ? postoAtual?.nome ?? 'Posto selecionado'
    : 'Todos os postos';

  if (
    status === 'loading'
    || loadingResumo
    || loadingPostos
    || (deveListarUsuarios && loadingUsuarios)
  ) {
    return (
      <RouteGuard recurso="calendario">
        <ResumoDiaSkeleton />
      </RouteGuard>
    );
  }

  const errorMessage = [resumoError, postosError, usuariosError]
    .find(Boolean);

  if (errorMessage) {
    return (
      <RouteGuard recurso="calendario">
        <CardBase>
          <EmptyState
            icon={AlertTriangle}
            title="Erro ao carregar o resumo do dia"
            description="Não foi possível buscar os eventos e documentos deste dia."
          />
        </CardBase>
      </RouteGuard>
    );
  }

  const eventos = resumo?.eventos ?? [];
  const documentosVencendo = resumo?.documentosVencendo ?? [];

  return (
    <RouteGuard recurso="calendario">
      <motion.div {...pageAnimation} className="space-y-6">
        <Link
          href={voltarHref}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao calendário
        </Link>

        <CardBase className="overflow-hidden p-0">
          <div className="space-y-2 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
              <Calendar className="h-4 w-4" />
              Resumo do dia
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
              {tituloData}
            </h1>
            <p className="text-sm text-zinc-500">
              {subtituloPosto}
              {documentosVencendo.length > 0 ? ` · ${documentosVencendo.length} documento(s) vencendo hoje` : ''}
            </p>
          </div>

          <div className="grid gap-4 border-t border-zinc-200 bg-zinc-50/70 p-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="resumo-recurso" className="text-sm font-medium text-zinc-700">
                Tipo de recurso
              </label>
              <SelectBase
                id="resumo-recurso"
                value={recursoSelecionado}
                onChange={(event) => setRecursoSelecionado(event.target.value)}
              >
                {recursoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectBase>
            </div>

            <div className="space-y-2">
              <label htmlFor="resumo-acao" className="text-sm font-medium text-zinc-700">
                Ação
              </label>
              <SelectBase
                id="resumo-acao"
                value={acaoSelecionada}
                onChange={(event) => setAcaoSelecionada(event.target.value)}
              >
                {acaoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectBase>
            </div>

            {deveListarUsuarios ? (
              <div className="space-y-2">
                <label htmlFor="resumo-usuario" className="text-sm font-medium text-zinc-700">
                  Usuário
                </label>
                <SelectBase
                  id="resumo-usuario"
                  value={usuarioSelecionado}
                  onChange={(event) => setUsuarioSelecionado(event.target.value)}
                >
                  <option value={TODOS_VALUE}>Todos os usuários</option>
                  {(usuarios ?? []).map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nome}
                    </option>
                  ))}
                </SelectBase>
              </div>
            ) : null}
          </div>
        </CardBase>

        {documentosVencendo.length > 0 ? (
          <CardBase className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-zinc-900">
                  Documentos vencendo hoje
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Documentos com vencimento em {data}.
                </p>
                <div className="mt-4 grid gap-3">
                  {documentosVencendo.map((documento) => (
                    <div
                      key={documento.id}
                      className="rounded-2xl border border-amber-200 bg-white/90 p-4"
                    >
                      <p className="text-sm font-semibold text-zinc-900">{documento.titulo}</p>
                      <p className="mt-1 text-sm text-zinc-500">{documento.categoriaNome}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardBase>
        ) : null}

        <CardBase>
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Linha do tempo</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {eventos.length} evento(s) encontrado(s) para este dia.
              </p>
            </div>
          </div>

          {eventos.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={possuiFiltrosAtivos ? 'Nenhum evento com os filtros atuais' : 'Nenhum evento neste dia'}
              description={
                possuiFiltrosAtivos
                  ? 'Ajuste os filtros para ampliar o resultado da linha do tempo.'
                  : 'Não há registros de auditoria para este dia no escopo selecionado.'
              }
            />
          ) : (
            <div className="space-y-6">
              {eventos.map((evento, index) => (
                <TimelineItem
                  key={evento.id}
                  evento={evento}
                  ultimo={index === eventos.length - 1}
                />
              ))}
            </div>
          )}
        </CardBase>
      </motion.div>
    </RouteGuard>
  );
}
