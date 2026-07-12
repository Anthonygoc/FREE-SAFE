'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Circle,
  FileText,
  FlaskConical,
  Fuel,
  Gauge,
  GraduationCap,
  UserCog,
  Users,
} from 'lucide-react';
import {
  addMonths,
  endOfMonth,
  format,
  getDay,
  getDaysInMonth,
  isSameMonth,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';

import { RouteGuard } from '@/components/auth/route-guard';
import { CardBase, EmptyState, SelectBase, Skeleton } from '@/components/ui';
import type { AuditRecurso } from '@/domain/entities/audit-log.entity';
import { type CalendarioMesDia, useCalendarioMes } from '@/hooks/use-calendario';
import { usePostos } from '@/hooks/use-postos';
import { cn } from '@/lib/utils';

const TIME_ZONE = 'America/Cuiaba';
const TODOS_OS_POSTOS_VALUE = '__todos__';
const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

const pageAnimation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
} as const;

type TipoMeta = {
  icon: typeof Circle;
  containerClassName: string;
  iconClassName: string;
};

const tipoMeta: Partial<Record<AuditRecurso, TipoMeta>> = {
  AFERICAO: {
    icon: Gauge,
    containerClassName: 'bg-orange-50 ring-1 ring-orange-100',
    iconClassName: 'text-orange-600',
  },
  RAQ: {
    icon: FlaskConical,
    containerClassName: 'bg-sky-50 ring-1 ring-sky-100',
    iconClassName: 'text-sky-600',
  },
  DOCUMENTO: {
    icon: FileText,
    containerClassName: 'bg-zinc-100 ring-1 ring-zinc-200',
    iconClassName: 'text-zinc-600',
  },
  COLABORADOR: {
    icon: Users,
    containerClassName: 'bg-violet-50 ring-1 ring-violet-100',
    iconClassName: 'text-violet-600',
  },
  BOMBA: {
    icon: Fuel,
    containerClassName: 'bg-orange-100 ring-1 ring-orange-200',
    iconClassName: 'text-orange-700',
  },
  POSTO: {
    icon: Building2,
    containerClassName: 'bg-teal-50 ring-1 ring-teal-100',
    iconClassName: 'text-teal-600',
  },
  CURSO: {
    icon: GraduationCap,
    containerClassName: 'bg-emerald-50 ring-1 ring-emerald-100',
    iconClassName: 'text-emerald-600',
  },
  CERTIFICADO: {
    icon: GraduationCap,
    containerClassName: 'bg-emerald-50 ring-1 ring-emerald-100',
    iconClassName: 'text-emerald-600',
  },
  USUARIO: {
    icon: UserCog,
    containerClassName: 'bg-zinc-100 ring-1 ring-zinc-200',
    iconClassName: 'text-zinc-600',
  },
};

function getHojeBase() {
  return toZonedTime(new Date(), TIME_ZONE);
}

function getHojeChave() {
  return formatInTimeZone(new Date(), TIME_ZONE, 'yyyy-MM-dd');
}

function getMetaTipo(tipo: AuditRecurso): TipoMeta {
  return tipoMeta[tipo] ?? {
    icon: Circle,
    containerClassName: 'bg-zinc-100 ring-1 ring-zinc-200',
    iconClassName: 'text-zinc-500',
  };
}

function formatarTituloMes(data: Date) {
  const titulo = format(data, "MMMM 'de' yyyy", { locale: ptBR });
  return titulo.charAt(0).toUpperCase() + titulo.slice(1);
}

function construirDiasDoMes(dataBase: Date) {
  const inicio = startOfMonth(dataBase);
  const totalDias = getDaysInMonth(dataBase);
  const espacosAntes = getDay(inicio);
  const totalSlots = Math.ceil((espacosAntes + totalDias) / 7) * 7;

  return Array.from({ length: totalSlots }, (_, index) => {
    const diaDoMes = index - espacosAntes + 1;

    if (diaDoMes < 1 || diaDoMes > totalDias) {
      return null;
    }

    return new Date(dataBase.getFullYear(), dataBase.getMonth(), diaDoMes, 12);
  });
}

function CalendarioSkeleton() {
  return (
    <div className="space-y-6">
      <CardBase className="p-0">
        <div className="flex flex-col gap-4 border-b border-zinc-200 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-72 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-[220px_132px]">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 p-6">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </CardBase>

      <CardBase className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/80 px-4 py-3">
              {DIAS_DA_SEMANA.map((dia) => (
                <div key={dia} className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {dia}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-zinc-200 p-px">
              {Array.from({ length: 35 }).map((_, index) => (
                <div key={index} className="min-h-[132px] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-5 w-10 rounded-full" />
                  </div>
                  <div className="mt-5 flex gap-2">
                    {Array.from({ length: 3 }).map((__, iconIndex) => (
                      <Skeleton key={iconIndex} className="h-8 w-8 rounded-2xl" />
                    ))}
                  </div>
                  <Skeleton className="mt-6 h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardBase>
    </div>
  );
}

function DiaCell({
  data,
  item,
  hojeKey,
  onAbrirDia,
}: {
  data: Date | null;
  item?: CalendarioMesDia;
  hojeKey: string;
  onAbrirDia: (data: string) => void;
}) {
  if (!data) {
    return <div className="min-h-[138px] bg-white/50" aria-hidden="true" />;
  }

  const chave = format(data, 'yyyy-MM-dd');
  const isHoje = chave === hojeKey;
  const temAtividade = Boolean(item);
  const tiposVisiveis = item?.tipos.slice(0, 4) ?? [];
  const tiposExcedentes = Math.max((item?.tipos.length ?? 0) - 4, 0);
  const documentsBadge = item?.documentosVencendo ?? 0;

  const baseClassName = cn(
    'flex min-h-[138px] flex-col justify-between rounded-[22px] border p-3 text-left transition-all',
    temAtividade
      ? 'border-zinc-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md'
      : 'border-transparent bg-white',
    isHoje && 'border-orange-400 ring-2 ring-orange-200',
    documentsBadge > 0 && 'border-amber-300 bg-gradient-to-b from-amber-50/80 to-white',
  );

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
            temAtividade ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-50 text-zinc-500',
            isHoje && 'bg-orange-500 text-white',
          )}
        >
          {format(data, 'd')}
        </span>

        <div className="flex items-center gap-2">
          {documentsBadge > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="tabular-nums">{documentsBadge}</span>
            </span>
          ) : null}

          {temAtividade ? (
            <span className="inline-flex rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-semibold tabular-nums text-zinc-700">
              {item?.totalEventos}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex min-h-[36px] items-center gap-2">
        {tiposVisiveis.map(({ tipo, quantidade }) => {
          const meta = getMetaTipo(tipo);
          const Icon = meta.icon;

          return (
            <span
              key={tipo}
              title={`${tipo}: ${quantidade}`}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-2xl',
                meta.containerClassName,
              )}
            >
              <Icon className={cn('h-4.5 w-4.5', meta.iconClassName)} />
            </span>
          );
        })}

        {tiposExcedentes > 0 ? (
          <span className="text-xs font-semibold tabular-nums text-zinc-500">+{tiposExcedentes}</span>
        ) : null}
      </div>

      <div className="mt-4">
        {temAtividade ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            {item?.tipos.length
              ? `${item?.tipos.length} tipo${item?.tipos.length === 1 ? '' : 's'} de atividade`
              : 'Documentos vencendo'}
          </p>
        ) : (
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-300">Sem atividade</p>
        )}
      </div>
    </>
  );

  if (!temAtividade) {
    return <div className={baseClassName}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onAbrirDia(chave)}
      className={cn(baseClassName, 'cursor-pointer')}
    >
      {content}
    </button>
  );
}

export default function CalendarioPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: postos, isLoading: loadingPostos } = usePostos(status === 'authenticated');

  const hojeBase = useMemo(() => getHojeBase(), []);
  const hojeKey = useMemo(() => getHojeChave(), []);
  const [mesBase, setMesBase] = useState(() => new Date(
    hojeBase.getFullYear(),
    hojeBase.getMonth(),
    1,
    12,
  ));
  const [postoSelecionado, setPostoSelecionado] = useState(TODOS_OS_POSTOS_VALUE);

  const perfil = session?.user?.perfil;
  const isGerente = perfil === 'GERENTE';
  const postoIdGerente = session?.user?.postoId ?? undefined;

  useEffect(() => {
    if (isGerente && postoIdGerente) {
      setPostoSelecionado(postoIdGerente);
    }
  }, [isGerente, postoIdGerente]);

  const ano = mesBase.getFullYear();
  const mes = mesBase.getMonth() + 1;
  const postoIdQuery = postoSelecionado === TODOS_OS_POSTOS_VALUE ? undefined : postoSelecionado;

  const {
    data: calendario,
    isLoading: loadingCalendario,
    isFetching: fetchingCalendario,
  } = useCalendarioMes(postoIdQuery, ano, mes);

  const mapaDias = useMemo(() => {
    return new Map((calendario?.dias ?? []).map((dia) => [dia.data, dia]));
  }, [calendario]);

  const diasDaGrade = useMemo(() => construirDiasDoMes(mesBase), [mesBase]);

  const postoAtual = useMemo(() => {
    if (!postos?.length) {
      return undefined;
    }

    return postos.find((posto) => posto.id === postoIdQuery);
  }, [postoIdQuery, postos]);

  const mesVazio = !loadingCalendario && (calendario?.dias.length ?? 0) === 0;
  const mesAtual = formatarTituloMes(mesBase);
  const ultimaDataDoMes = endOfMonth(mesBase);
  const totalDiasMes = useMemo(
    () => diasDaGrade.filter((dia): dia is Date => dia !== null && isSameMonth(dia, mesBase)).length,
    [diasDaGrade, mesBase],
  );

  function abrirDia(data: string) {
    const queryString = postoIdQuery ? `?postoId=${encodeURIComponent(postoIdQuery)}` : '';
    router.push(`/calendario/${data}${queryString}`);
  }

  if (loadingPostos) {
    return (
      <RouteGuard recurso="calendario">
        <CalendarioSkeleton />
      </RouteGuard>
    );
  }

  return (
    <RouteGuard recurso="calendario">
      <motion.div {...pageAnimation} className="space-y-6">
        <CardBase className="overflow-hidden p-0">
          <div className="flex flex-col gap-6 border-b border-zinc-200 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                <Calendar className="h-3.5 w-3.5" />
                Atividades por dia
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Calendário de Atividades</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Visão mensal do que aconteceu no posto, com destaque para dias com vencimentos.
                </p>
              </div>
            </div>

            {isGerente ? (
              <div className="min-w-[220px] rounded-2xl border border-orange-100 bg-orange-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Posto</p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {postoAtual?.nome ?? 'Seu posto'}
                </p>
              </div>
            ) : (
              <div className="w-full max-w-xs space-y-2">
                <label htmlFor="posto-calendario" className="text-sm font-medium text-zinc-600">
                  Posto
                </label>
                <SelectBase
                  id="posto-calendario"
                  value={postoSelecionado}
                  onChange={(event) => setPostoSelecionado(event.target.value)}
                >
                  <option value={TODOS_OS_POSTOS_VALUE}>Todos os postos</option>
                  {(postos ?? []).map((posto) => (
                    <option key={posto.id} value={posto.id}>
                      {posto.nome}
                    </option>
                  ))}
                </SelectBase>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setMesBase((current) => subMonths(current, 1))}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>

              <div className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900">
                {mesAtual}
              </div>

              <button
                type="button"
                onClick={() => setMesBase((current) => addMonths(current, 1))}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-600">
                <span className="font-medium text-zinc-800">{format(mesBase, 'd', { locale: ptBR })}</span>
                {' - '}
                <span className="font-medium text-zinc-800">{format(ultimaDataDoMes, 'd', { locale: ptBR })}</span>
                {' de '}
                <span className="font-semibold text-zinc-900">{format(ultimaDataDoMes, 'MMMM', { locale: ptBR })}</span>
              </div>

              <button
                type="button"
                onClick={() => setMesBase(new Date(
                  hojeBase.getFullYear(),
                  hojeBase.getMonth(),
                  1,
                  12,
                ))}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                Hoje
              </button>
            </div>
          </div>
        </CardBase>

        {mesVazio ? (
          <CardBase className="border-dashed border-zinc-300 bg-zinc-50/70">
            <EmptyState
              icon={Calendar}
              title="Nenhuma atividade neste mês"
              description="Os dias ficam neutros quando não há eventos. Tente outro mês ou ajuste o posto selecionado."
            />
          </CardBase>
        ) : null}

        <CardBase className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/80 px-4 py-3">
                {DIAS_DA_SEMANA.map((dia) => (
                  <div key={dia} className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {dia}
                  </div>
                ))}
              </div>

              {loadingCalendario ? (
                <div className="grid grid-cols-7 gap-px bg-zinc-200 p-px">
                  {Array.from({ length: 35 }).map((_, index) => (
                    <div key={index} className="min-h-[138px] bg-white p-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-5 w-10 rounded-full" />
                      </div>
                      <div className="mt-4 flex gap-2">
                        {Array.from({ length: 2 }).map((__, iconIndex) => (
                          <Skeleton key={iconIndex} className="h-8 w-8 rounded-2xl" />
                        ))}
                      </div>
                      <Skeleton className="mt-7 h-3 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${ano}-${mes}-${postoIdQuery ?? 'todos'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="grid grid-cols-7 gap-px bg-zinc-200 p-px"
                  >
                    {diasDaGrade.map((dia, index) => (
                      <DiaCell
                        key={dia ? format(dia, 'yyyy-MM-dd') : `vazio-${ano}-${mes}-${index}`}
                        data={dia}
                        item={dia ? mapaDias.get(format(dia, 'yyyy-MM-dd')) : undefined}
                        hojeKey={hojeKey}
                        onAbrirDia={abrirDia}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-zinc-200 bg-zinc-50/80 px-6 py-4 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
            <p>
              {postoIdQuery ? `Filtrando ${postoAtual?.nome ?? 'posto selecionado'}.` : 'Mostrando todos os postos.'}
            </p>
            <p className="tabular-nums">
              {calendario?.dias.length ?? 0} dia(s) com atividade em {totalDiasMes} dia(s) do mês
              {fetchingCalendario && !loadingCalendario ? ' • atualizando...' : ''}
            </p>
          </div>
        </CardBase>
      </motion.div>
    </RouteGuard>
  );
}
