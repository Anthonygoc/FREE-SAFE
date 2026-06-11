'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Download, Droplets, Fuel, Gauge } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePostos } from '@/hooks/use-postos';
import { useCreateRAQ, useRAQsByPosto, type RAQFiltros } from '@/hooks/use-raq';

const inputClassName =
  'w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-orange-500';
const readOnlyInputClassName =
  'w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-500';
const filterInputClassName =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-orange-500';

const animation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

const produtoSchema = z.enum(['GASOLINA_COMUM', 'ETANOL_HIDRATADO', 'DIESEL_S10']);

const raqFormSchema = z.object({
  postoId: z.string().uuid('Selecione um posto válido'),
  produto: produtoSchema,
  volumeRecebido: z.string().optional(),
  temperaturaObservada: z.string().min(1, 'Informe a temperatura'),
  densidadeObservada: z.string().min(1, 'Informe a densidade observada'),
  massa20c: z.string().optional(),
  faseAquosa: z.string().optional(),
  teorAlcoolico: z.string().optional(),
  aspecto: z.enum(['LIQUIDO_E_ISENTO', 'TURVO', 'COM_IMPUREZAS']),
  cor: z.enum(['CARACTERISTICA', 'ALTERADA']),
  distribuidora: z.string().max(100, 'Máximo de 100 caracteres').optional(),
  cnpjDistribuidora: z.string().max(18, 'Máximo de 18 caracteres').optional(),
  transportador: z.string().max(150, 'Máximo de 150 caracteres').optional(),
  cnpjTransportador: z.string().max(18, 'Máximo de 18 caracteres').optional(),
  notaFiscal: z.string().max(50, 'Máximo de 50 caracteres').optional(),
  placaCaminhao: z.string().max(10, 'Máximo de 10 caracteres').optional(),
  nomeMotorista: z.string().max(150, 'Máximo de 150 caracteres').optional(),
  cpfMotorista: z.string().max(14, 'Máximo de 14 caracteres').optional(),
  nomeAnalista: z.string().max(150, 'Máximo de 150 caracteres').optional(),
});

type RAQFormValues = z.infer<typeof raqFormSchema>;

const produtoOptions: Array<{
  value: z.infer<typeof produtoSchema>;
  label: string;
  icon: typeof Fuel;
}> = [
  { value: 'GASOLINA_COMUM', label: 'Gasolina', icon: Fuel },
  { value: 'ETANOL_HIDRATADO', label: 'Etanol', icon: Droplets },
  { value: 'DIESEL_S10', label: 'Diesel', icon: Gauge },
];

export default function AnpPage() {
  const { data: postos, isLoading: loadingPostos } = usePostos();
  const { mutate: createRAQ, data: createOutput, isPending } = useCreateRAQ();
  const [raqIdCriado, setRaqIdCriado] = useState<string | null>(null);
  const [filtroDataInicio, setFiltroDataInicio] = useState(() => getTodayDateInputValue());
  const [filtroDataFim, setFiltroDataFim] = useState(() => getTodayDateInputValue());
  const [filtroProduto, setFiltroProduto] = useState<'' | 'GASOLINA_COMUM' | 'ETANOL_HIDRATADO' | 'DIESEL_S10'>('');
  const [filtroResultado, setFiltroResultado] = useState<'' | 'APROVADO' | 'REPROVADO'>('');

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<RAQFormValues>({
    resolver: zodResolver(raqFormSchema),
    defaultValues: {
      postoId: '',
      produto: 'GASOLINA_COMUM',
      volumeRecebido: '',
      temperaturaObservada: '20',
      densidadeObservada: '0.74',
      massa20c: '',
      faseAquosa: '50',
      teorAlcoolico: '93',
      aspecto: 'LIQUIDO_E_ISENTO',
      cor: 'CARACTERISTICA',
      distribuidora: '',
      cnpjDistribuidora: '',
      transportador: '',
      cnpjTransportador: '',
      notaFiscal: '',
      placaCaminhao: '',
      nomeMotorista: '',
      cpfMotorista: '',
      nomeAnalista: '',
    },
  });

  const postoId = watch('postoId');
  const produto = watch('produto');
  const densidade = watch('densidadeObservada');
  const faseAquosa = watch('faseAquosa');
  const teorAlcoolico = watch('teorAlcoolico');
  const aspecto = watch('aspecto');
  const cor = watch('cor');

  useEffect(() => {
    if (!postoId && postos && postos.length > 0) {
      setValue('postoId', postos[0].id);
    }
  }, [postoId, postos, setValue]);

  const filtrosHistorico = useMemo<RAQFiltros>(
    () => ({
      dataInicio: filtroDataInicio || undefined,
      dataFim: filtroDataFim || undefined,
      produto: filtroProduto || undefined,
      resultado: filtroResultado || undefined,
    }),
    [filtroDataFim, filtroDataInicio, filtroProduto, filtroResultado],
  );

  const {
    data: historico,
    isLoading: loadingHistorico,
    isFetching: fetchingHistorico,
  } = useRAQsByPosto(postoId, filtrosHistorico);

  const postoSelecionado = useMemo(
    () => (postos ?? []).find((posto) => posto.id === postoId),
    [postoId, postos],
  );
  const dataColeta = useMemo(() => new Date().toLocaleDateString('pt-BR'), []);

  const faseAquosaNumero = parseOptionalNumber(faseAquosa);
  const teorEtanolGasolina =
    produto === 'GASOLINA_COMUM' && faseAquosaNumero !== undefined
      ? (faseAquosaNumero - 50) * 2 + 1
      : undefined;

  const statusAprovado = useMemo(() => {
    const densidadeNumero = parseOptionalNumber(densidade) ?? 0;
    const teorAlcoolicoNumero = parseOptionalNumber(teorAlcoolico) ?? 0;

    if (aspecto !== 'LIQUIDO_E_ISENTO' || cor !== 'CARACTERISTICA') {
      return false;
    }

    if (produto === 'GASOLINA_COMUM') {
      return (
        teorEtanolGasolina !== undefined &&
        teorEtanolGasolina >= 27 &&
        teorEtanolGasolina <= 35
      );
    }

    if (produto === 'ETANOL_HIDRATADO') {
      return (
        teorAlcoolicoNumero >= 92.5 &&
        teorAlcoolicoNumero <= 95.4 &&
        densidadeNumero >= 0.79 &&
        densidadeNumero <= 0.82
      );
    }

    return densidadeNumero >= 0.82 && densidadeNumero <= 0.9;
  }, [aspecto, cor, densidade, produto, teorAlcoolico, teorEtanolGasolina]);

  function onSubmit(values: RAQFormValues) {
    createRAQ(
      {
        postoId: values.postoId,
        produto: values.produto,
        volumeRecebido: parseOptionalNumber(values.volumeRecebido),
        temperaturaObservada: Number(values.temperaturaObservada),
        densidadeObservada: Number(values.densidadeObservada),
        massa20c: parseOptionalNumber(values.massa20c),
        aspecto: values.aspecto,
        cor: values.cor,
        faseAquosa: values.produto === 'GASOLINA_COMUM' ? parseOptionalNumber(values.faseAquosa) : undefined,
        teorEtanol: values.produto === 'GASOLINA_COMUM' ? teorEtanolGasolina : undefined,
        teorAlcoolico:
          values.produto === 'ETANOL_HIDRATADO'
            ? parseOptionalNumber(values.teorAlcoolico)
            : undefined,
        distribuidora: normalizeOptionalText(values.distribuidora),
        cnpjDistribuidora: normalizeOptionalText(values.cnpjDistribuidora),
        transportador: normalizeOptionalText(values.transportador),
        cnpjTransportador: normalizeOptionalText(values.cnpjTransportador),
        notaFiscal: normalizeOptionalText(values.notaFiscal),
        placaCaminhao: normalizeOptionalText(values.placaCaminhao),
        nomeMotorista: normalizeOptionalText(values.nomeMotorista),
        cpfMotorista: normalizeOptionalText(values.cpfMotorista),
        nomeAnalista: normalizeOptionalText(values.nomeAnalista),
      },
      {
        onSuccess: (output) => {
          setRaqIdCriado(output.raqId);
        },
      },
    );
  }

  if (loadingPostos || (loadingHistorico && !historico)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size={30} />
      </div>
    );
  }

  return (
    <motion.div {...animation} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">ANP / RAQ</h1>
        <p className="mt-1 text-zinc-500">Registro oficial de análise de qualidade por produto.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 xl:col-span-2">
          <CardBase>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-zinc-900">Dados do Posto</h2>
              <div className="w-full max-w-sm">
                <label className="mb-1 block text-sm font-medium text-zinc-700">Posto selecionado</label>
                <select
                  {...register('postoId')}
                  className={inputClassName}
                >
                  {(postos ?? []).map((posto) => (
                    <option key={posto.id} value={posto.id}>
                      {posto.nome}
                    </option>
                  ))}
                </select>
                {errors.postoId ? <p className="mt-1 text-xs text-red-600">{errors.postoId.message}</p> : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-zinc-700">Razão Social</label>
                <input
                  readOnly
                  value={postoSelecionado?.razaoSocial ?? ''}
                  className={readOnlyInputClassName}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">CNPJ</label>
                <input readOnly value={postoSelecionado?.cnpj ?? ''} className={readOnlyInputClassName} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Endereço</label>
                <input
                  readOnly
                  value={postoSelecionado?.endereco ?? ''}
                  className={readOnlyInputClassName}
                />
              </div>
            </div>
          </CardBase>

          <CardBase>
            <h2 className="mb-4 text-lg font-bold text-zinc-900">Dados do Recebimento</h2>
            <p className="mb-3 text-sm font-semibold text-zinc-700">Produto</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {produtoOptions.map((option) => {
                const Icon = option.icon;
                const selected = produto === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('produto', option.value)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                      selected
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Volume Recebido em litros</label>
                <input type="number" step="0.01" {...register('volumeRecebido')} className={inputClassName} />
                {errors.volumeRecebido ? <p className="mt-1 text-xs text-red-600">{errors.volumeRecebido.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Data da coleta</label>
                <div className="relative">
                  <input readOnly value={dataColeta} className={readOnlyInputClassName} />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Distribuidor</label>
                <input {...register('distribuidora')} className={inputClassName} />
                {errors.distribuidora ? <p className="mt-1 text-xs text-red-600">{errors.distribuidora.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">CNPJ do Distribuidor</label>
                <input {...register('cnpjDistribuidora')} className={inputClassName} />
                {errors.cnpjDistribuidora ? <p className="mt-1 text-xs text-red-600">{errors.cnpjDistribuidora.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Transportador</label>
                <input {...register('transportador')} className={inputClassName} />
                {errors.transportador ? <p className="mt-1 text-xs text-red-600">{errors.transportador.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">CNPJ do Transportador</label>
                <input {...register('cnpjTransportador')} className={inputClassName} />
                {errors.cnpjTransportador ? <p className="mt-1 text-xs text-red-600">{errors.cnpjTransportador.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Nota Fiscal</label>
                <input {...register('notaFiscal')} className={inputClassName} />
                {errors.notaFiscal ? <p className="mt-1 text-xs text-red-600">{errors.notaFiscal.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Placa do Caminhão</label>
                <input {...register('placaCaminhao')} className={inputClassName} />
                {errors.placaCaminhao ? <p className="mt-1 text-xs text-red-600">{errors.placaCaminhao.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Nome do Motorista</label>
                <input {...register('nomeMotorista')} className={inputClassName} />
                {errors.nomeMotorista ? <p className="mt-1 text-xs text-red-600">{errors.nomeMotorista.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">CPF do Motorista</label>
                <input {...register('cpfMotorista')} className={inputClassName} />
                {errors.cpfMotorista ? <p className="mt-1 text-xs text-red-600">{errors.cpfMotorista.message}</p> : null}
              </div>
            </div>
          </CardBase>

          <CardBase>
            <h2 className="mb-4 text-lg font-bold text-zinc-900">Resultado da Análise</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Aspecto</label>
                <select {...register('aspecto')} className={inputClassName}>
                  <option value="LIQUIDO_E_ISENTO">Líquido e isento</option>
                  <option value="TURVO">Turvo</option>
                  <option value="COM_IMPUREZAS">Com impurezas</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Cor</label>
                <select {...register('cor')} className={inputClassName}>
                  <option value="CARACTERISTICA">Característica</option>
                  <option value="ALTERADA">Alterada</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Densidade relativa / observada</label>
                <input type="number" step="0.001" {...register('densidadeObservada')} className={inputClassName} />
                {errors.densidadeObservada ? <p className="mt-1 text-xs text-red-600">{errors.densidadeObservada.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Temperatura</label>
                <input type="number" step="0.1" {...register('temperaturaObservada')} className={inputClassName} />
                {errors.temperaturaObservada ? <p className="mt-1 text-xs text-red-600">{errors.temperaturaObservada.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Massa específica a 20°C</label>
                <input type="number" step="0.001" {...register('massa20c')} className={inputClassName} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Teor de etanol na gasolina</label>
                <input
                  readOnly
                  value={
                    produto === 'GASOLINA_COMUM' && teorEtanolGasolina !== undefined
                      ? `${teorEtanolGasolina.toFixed(2)}%`
                      : 'Não aplicável'
                  }
                  className={readOnlyInputClassName}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Fase aquosa (ml)</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={produto !== 'GASOLINA_COMUM'}
                  {...register('faseAquosa')}
                  className={produto === 'GASOLINA_COMUM' ? inputClassName : readOnlyInputClassName}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Teor alcoólico no AEHC</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={produto !== 'ETANOL_HIDRATADO'}
                  {...register('teorAlcoolico')}
                  className={produto === 'ETANOL_HIDRATADO' ? inputClassName : readOnlyInputClassName}
                />
              </div>
            </div>
          </CardBase>

          <CardBase>
            <h2 className="mb-4 text-lg font-bold text-zinc-900">Responsável</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Nome do Analista</label>
                <input {...register('nomeAnalista')} className={inputClassName} />
                {errors.nomeAnalista ? <p className="mt-1 text-xs text-red-600">{errors.nomeAnalista.message}</p> : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {isPending ? 'Salvando...' : 'Registrar análise'}
              </button>
              {raqIdCriado ? (
                <>
                  <button
                    type="button"
                    onClick={() => window.open(`/api/raq/${raqIdCriado}/pdf`, '_blank')}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    <Download className="h-4 w-4 text-orange-500" />
                    Baixar PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(`/api/raq/${raqIdCriado}/xlsx`, '_blank')}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    <Download className="h-4 w-4 text-orange-500" />
                    Baixar Planilha
                  </button>
                </>
              ) : null}
            </div>
          </CardBase>
        </form>

        <div>
          <div className="rounded-2xl bg-zinc-950 p-5 text-white shadow-sm">
            <p className="text-sm text-zinc-400">Resultado automático</p>
            <div className="mt-3">
              <BadgeStatus
                label={statusAprovado ? 'Aprovado' : 'Reprovado'}
                tone={statusAprovado ? 'green' : 'red'}
              />
            </div>
            <p className="mt-3 text-sm text-zinc-300">
              Preview em tempo real com base nos campos preenchidos.
            </p>
            {createOutput ? (
              <p className="mt-2 text-xs text-zinc-400">Último resultado salvo: {createOutput.resultado}</p>
            ) : null}
          </div>
        </div>
      </div>

      <CardBase>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Histórico de RAQs</h2>
              <p className="text-sm text-zinc-500">{(historico ?? []).length} análises no período</p>
            </div>
            {fetchingHistorico ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <LoadingSpinner size={16} />
                Atualizando histórico...
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">De</label>
                <input
                  type="date"
                  value={filtroDataInicio}
                  onChange={(event) => setFiltroDataInicio(event.target.value)}
                  className={filterInputClassName}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Até</label>
                <input
                  type="date"
                  value={filtroDataFim}
                  onChange={(event) => setFiltroDataFim(event.target.value)}
                  className={filterInputClassName}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Produto</label>
                <select
                  value={filtroProduto}
                  onChange={(event) => setFiltroProduto(event.target.value as typeof filtroProduto)}
                  className={filterInputClassName}
                >
                  <option value="">Todos</option>
                  <option value="GASOLINA_COMUM">Gasolina</option>
                  <option value="ETANOL_HIDRATADO">Etanol</option>
                  <option value="DIESEL_S10">Diesel</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Resultado</label>
                <select
                  value={filtroResultado}
                  onChange={(event) => setFiltroResultado(event.target.value as typeof filtroResultado)}
                  className={filterInputClassName}
                >
                  <option value="">Todos</option>
                  <option value="APROVADO">Aprovado</option>
                  <option value="REPROVADO">Reprovado</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleLimparFiltros}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </div>

        </div>
        <div className="mt-4 space-y-3">
          {(historico ?? []).map((item) => (
            <div key={item.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-zinc-900">{formatProdutoLabel(item.produto)}</p>
                    <BadgeStatus
                      label={item.resultado === 'APROVADO' ? 'Aprovado' : 'Reprovado'}
                      tone={item.resultado === 'APROVADO' ? 'green' : 'red'}
                    />
                  </div>
                  <p className="text-sm text-zinc-500">{formatDateTime(item.criadoEm)}</p>
                  <p className="text-sm text-zinc-600">
                    Analista: <span className="font-medium text-zinc-800">{formatNomeAnalista(item.nomeAnalista)}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(`/api/raq/${item.id}/pdf`, '_blank')}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    <Download className="h-3.5 w-3.5 text-orange-500" />
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(`/api/raq/${item.id}/xlsx`, '_blank')}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    <Download className="h-3.5 w-3.5 text-orange-500" />
                    Excel
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(historico ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum RAQ para o posto e filtros selecionados.</p>
          ) : null}
        </div>
      </CardBase>
    </motion.div>
  );

  function handleLimparFiltros() {
    const hoje = getTodayDateInputValue();

    setFiltroDataInicio(hoje);
    setFiltroDataFim(hoje);
    setFiltroProduto('');
    setFiltroResultado('');
  }
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  const data = date.toLocaleDateString('pt-BR');
  const hora = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${data} às ${hora}`;
}

function formatNomeAnalista(nomeAnalista?: string) {
  return nomeAnalista?.trim() || 'Não informado';
}

function formatProdutoLabel(produto: 'GASOLINA_COMUM' | 'GASOLINA_ADITIVADA' | 'GASOLINA_PREMIUM' | 'ETANOL_HIDRATADO' | 'DIESEL_S10' | 'DIESEL_S500') {
  const produtoLabels = {
    GASOLINA_COMUM: 'Gasolina',
    GASOLINA_ADITIVADA: 'Gasolina Aditivada',
    GASOLINA_PREMIUM: 'Gasolina Premium',
    ETANOL_HIDRATADO: 'Etanol',
    DIESEL_S10: 'Diesel S10',
    DIESEL_S500: 'Diesel S500',
  };

  return produtoLabels[produto];
}
