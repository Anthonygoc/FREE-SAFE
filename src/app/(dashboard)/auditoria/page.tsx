'use client';

import { motion } from 'framer-motion';
import { ClipboardList, FilterX, ListFilter } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { type ReactNode, useState } from 'react';

import { RouteGuard } from '@/components/auth/route-guard';
import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { EmptyState } from '@/components/ui/empty-state';
import { FieldLabel, InputBase } from '@/components/ui/input-base';
import { SelectBase } from '@/components/ui/select-base';
import { Skeleton } from '@/components/ui/skeleton';
import { AUDIT_ACOES, AUDIT_RECURSOS, type AuditAcao, type AuditRecurso } from '@/domain/entities/audit-log.entity';
import { type AuditoriaItem, useAuditoria } from '@/hooks/use-auditoria';
import { usePostos } from '@/hooks/use-postos';
import { cn } from '@/lib/utils';

const pageTransition = { duration: 0.35, ease: 'easeOut' } as const;

const actionTone: Record<AuditAcao, 'emerald' | 'yellow' | 'red' | 'blue' | 'dark'> = {
  CRIAR: 'emerald',
  EDITAR: 'yellow',
  EXCLUIR: 'red',
  EXPORTAR: 'blue',
  LOGIN: 'dark',
  LOGOUT: 'dark',
};

const perfilTone: Record<string, 'dark' | 'orange' | 'blue' | 'default'> = {
  ADMIN: 'dark',
  GERENTE: 'orange',
  ADMINISTRATIVO: 'blue',
};

const recursoLabels: Record<AuditRecurso, string> = {
  AFERICAO: 'Aferição',
  BOMBA: 'Bomba',
  RAQ: 'RAQ',
  DOCUMENTO: 'Documento',
  COLABORADOR: 'Colaborador',
  USUARIO: 'Usuário',
  CURSO: 'Curso',
  CERTIFICADO: 'Certificado',
  CATEGORIA: 'Categoria',
  POSTO: 'Posto',
};

const acaoLabels: Record<AuditAcao, string> = {
  CRIAR: 'Criar',
  EDITAR: 'Editar',
  EXCLUIR: 'Excluir',
  EXPORTAR: 'Exportar',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
};

function formatarDataHora(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data));
}

function AuditoriaPageSkeleton() {
  return (
    <div className="space-y-6">
      <CardBase className="overflow-hidden p-0">
        <div className="space-y-4 p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid gap-4 border-t border-orange-100 bg-orange-50/60 p-6 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </CardBase>

      <CardBase className="hidden p-0 md:block">
        <div className="grid grid-cols-[160px_200px_120px_120px_minmax(320px,1fr)_180px] gap-4 border-b border-zinc-200 px-6 py-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-4/5" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid grid-cols-[160px_200px_120px_120px_minmax(320px,1fr)_180px] gap-4 border-b border-zinc-100 px-6 py-5 last:border-b-0">
            {Array.from({ length: 6 }).map((_, innerIndex) => (
              <Skeleton key={innerIndex} className={cn('h-4', innerIndex === 4 ? 'w-full' : 'w-4/5')} />
            ))}
          </div>
        ))}
      </CardBase>

      <div className="grid gap-4 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardBase key={index}>
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </CardBase>
        ))}
      </div>
    </div>
  );
}

function PerfilBadge({ perfil }: { perfil: string }) {
  return <BadgeStatus label={perfil} tone={perfilTone[perfil] ?? 'default'} size="sm" />;
}

function LinhaMobile({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-[92px_minmax(0,1fr)] gap-3 text-sm', className)}>
      <span className="text-zinc-500">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ListaAuditoria({
  itens,
  postoNomePorId,
}: {
  itens: AuditoriaItem[];
  postoNomePorId: Map<string, string>;
}) {
  return (
    <>
      <CardBase className="hidden overflow-hidden p-0 md:block">
        <div className="grid grid-cols-[160px_220px_120px_120px_minmax(320px,1fr)_180px] gap-4 border-b border-zinc-200 bg-zinc-50/80 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Data e hora</span>
          <span>Usuário</span>
          <span>Ação</span>
          <span>Recurso</span>
          <span>Descrição</span>
          <span>Posto</span>
        </div>

        {itens.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: index * 0.02 }}
            className="grid grid-cols-[160px_220px_120px_120px_minmax(320px,1fr)_180px] gap-4 border-b border-zinc-100 px-6 py-5 last:border-b-0"
          >
            <div className="text-sm font-medium tabular-nums text-zinc-700">
              {formatarDataHora(item.criadoEm)}
            </div>

            <div className="min-w-0 space-y-2">
              <p className="truncate font-semibold text-zinc-950">{item.usuarioNome}</p>
              <PerfilBadge perfil={item.perfil} />
            </div>

            <div>
              <BadgeStatus label={acaoLabels[item.acao]} tone={actionTone[item.acao]} size="sm" />
            </div>

            <div>
              <BadgeStatus label={recursoLabels[item.recurso]} tone="default" size="sm" />
            </div>

            <p className="text-sm leading-6 text-zinc-700">{item.descricao}</p>

            <p className="text-sm text-zinc-600">
              {item.postoId ? (postoNomePorId.get(item.postoId) ?? 'Posto não encontrado') : 'Sistema'}
            </p>
          </motion.div>
        ))}
      </CardBase>

      <div className="grid gap-4 md:hidden">
        {itens.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: index * 0.02 }}
          >
            <CardBase className="space-y-4">
              <LinhaMobile label="Data">
                <span className="font-medium tabular-nums text-zinc-700">{formatarDataHora(item.criadoEm)}</span>
              </LinhaMobile>

              <LinhaMobile label="Usuário">
                <div className="space-y-2">
                  <p className="font-semibold text-zinc-950">{item.usuarioNome}</p>
                  <PerfilBadge perfil={item.perfil} />
                </div>
              </LinhaMobile>

              <LinhaMobile label="Ação">
                <BadgeStatus label={acaoLabels[item.acao]} tone={actionTone[item.acao]} size="sm" />
              </LinhaMobile>

              <LinhaMobile label="Recurso">
                <BadgeStatus label={recursoLabels[item.recurso]} tone="default" size="sm" />
              </LinhaMobile>

              <LinhaMobile label="Descrição" className="items-start">
                <p className="leading-6 text-zinc-700">{item.descricao}</p>
              </LinhaMobile>

              <LinhaMobile label="Posto">
                <span className="text-zinc-600">
                  {item.postoId ? (postoNomePorId.get(item.postoId) ?? 'Posto não encontrado') : 'Sistema'}
                </span>
              </LinhaMobile>
            </CardBase>
          </motion.div>
        ))}
      </div>
    </>
  );
}

export default function AuditoriaPage() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.perfil === 'ADMIN';
  const queriesEnabled = status === 'authenticated' && isAdmin;

  const [postoId, setPostoId] = useState('');
  const [recurso, setRecurso] = useState<AuditRecurso | ''>('');
  const [acao, setAcao] = useState<AuditAcao | ''>('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pagina, setPagina] = useState(1);

  const { data: postos, isLoading: loadingPostos, error: postosError } = usePostos(queriesEnabled);
  const {
    data: auditoria,
    isLoading: loadingAuditoria,
    error: auditoriaError,
  } = useAuditoria(
    {
      postoId: postoId || undefined,
      recurso: recurso || undefined,
      acao: acao || undefined,
      dataInicio: dataInicio || undefined,
      dataFim: dataFim || undefined,
      pagina,
    },
    queriesEnabled,
  );

  const postoNomePorId = new Map((postos ?? []).map((posto) => [posto.id, posto.nome]));
  const loading = queriesEnabled && (loadingPostos || loadingAuditoria);
  const erro = postosError ?? auditoriaError;

  function handleLimparFiltros() {
    setPostoId('');
    setRecurso('');
    setAcao('');
    setDataInicio('');
    setDataFim('');
    setPagina(1);
  }

  return (
    <RouteGuard recurso="auditorias">
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={pageTransition}
        >
          <CardBase className="overflow-hidden p-0">
            <div className="space-y-3 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                <ClipboardList className="h-4 w-4" />
                FREE SAFE
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Auditoria</h1>
                <p className="mt-1 text-zinc-500">Histórico de ações no sistema</p>
              </div>
            </div>

            <div className="border-t border-orange-100 bg-orange-50/60 p-6">
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-orange-700">
                <ListFilter className="h-4 w-4" />
                Filtros
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <FieldLabel htmlFor="postoId">Posto</FieldLabel>
                  <SelectBase
                    id="postoId"
                    value={postoId}
                    onChange={(event) => {
                      setPostoId(event.target.value);
                      setPagina(1);
                    }}
                  >
                    <option value="">Todos</option>
                    {(postos ?? []).map((posto) => (
                      <option key={posto.id} value={posto.id}>
                        {posto.nome}
                      </option>
                    ))}
                  </SelectBase>
                </div>

                <div>
                  <FieldLabel htmlFor="recurso">Recurso</FieldLabel>
                  <SelectBase
                    id="recurso"
                    value={recurso}
                    onChange={(event) => {
                      setRecurso(event.target.value as AuditRecurso | '');
                      setPagina(1);
                    }}
                  >
                    <option value="">Todos</option>
                    {AUDIT_RECURSOS.map((item) => (
                      <option key={item} value={item}>
                        {recursoLabels[item]}
                      </option>
                    ))}
                  </SelectBase>
                </div>

                <div>
                  <FieldLabel htmlFor="acao">Ação</FieldLabel>
                  <SelectBase
                    id="acao"
                    value={acao}
                    onChange={(event) => {
                      setAcao(event.target.value as AuditAcao | '');
                      setPagina(1);
                    }}
                  >
                    <option value="">Todos</option>
                    {AUDIT_ACOES.map((item) => (
                      <option key={item} value={item}>
                        {acaoLabels[item]}
                      </option>
                    ))}
                  </SelectBase>
                </div>

                <div>
                  <FieldLabel htmlFor="dataInicio">Data início</FieldLabel>
                  <InputBase
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(event) => {
                      setDataInicio(event.target.value);
                      setPagina(1);
                    }}
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <FieldLabel htmlFor="dataFim">Data fim</FieldLabel>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <InputBase
                      id="dataFim"
                      type="date"
                      value={dataFim}
                      onChange={(event) => {
                        setDataFim(event.target.value);
                        setPagina(1);
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleLimparFiltros}
                      className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-50"
                    >
                      <FilterX className="h-4 w-4" />
                      Limpar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CardBase>
        </motion.section>

        {loading ? <AuditoriaPageSkeleton /> : null}

        {!loading && erro ? (
          <CardBase className="border-red-200 bg-red-50/70">
            <p className="font-semibold text-red-700">Erro ao carregar auditoria.</p>
            <p className="mt-1 text-sm text-red-600">
              {erro instanceof Error ? erro.message : 'Tente novamente em instantes.'}
            </p>
          </CardBase>
        ) : null}

        {!loading && !erro && (auditoria?.itens.length ?? 0) === 0 ? (
          <CardBase>
            <EmptyState
              icon={ClipboardList}
              title="Nenhum log encontrado"
              description="Ajuste os filtros para localizar ações registradas no sistema."
            />
          </CardBase>
        ) : null}

        {!loading && !erro && auditoria && auditoria.itens.length > 0 ? (
          <>
            <ListaAuditoria itens={auditoria.itens} postoNomePorId={postoNomePorId} />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={pageTransition}
            >
              <CardBase className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-500">
                  <span className="font-semibold tabular-nums text-zinc-900">{auditoria.total}</span>
                  {' '}registros encontrados
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <span className="text-sm text-zinc-500">
                    página <span className="font-semibold tabular-nums text-zinc-900">{auditoria.pagina}</span> de{' '}
                    <span className="font-semibold tabular-nums text-zinc-900">{auditoria.totalPaginas}</span>
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPagina((current) => Math.max(1, current - 1))}
                      disabled={auditoria.pagina <= 1}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setPagina((current) => Math.min(auditoria.totalPaginas, current + 1))}
                      disabled={auditoria.pagina >= auditoria.totalPaginas}
                      className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </CardBase>
            </motion.div>
          </>
        ) : null}
      </div>
    </RouteGuard>
  );
}
