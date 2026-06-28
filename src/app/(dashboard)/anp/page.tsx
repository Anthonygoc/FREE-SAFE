'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Calendar, CheckCircle2, Download, Droplets, Factory, FlaskConical, Fuel, Gauge, History, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { RouteGuard } from '@/components/auth/route-guard';
import { BadgeStatus, CardBase, IconBadge, InputBase, LoadingSpinner, SelectBase } from '@/components/ui';
import { usePostos } from '@/hooks/use-postos';
import { useCreateRAQ, useRAQsByPosto, type RAQFiltros } from '@/hooks/use-raq';

const readOnlyInputClassName =
  'bg-zinc-100 text-zinc-500';

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
      <RouteGuard recurso="anp">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size={30} />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard recurso="anp">
      <motion.div {...animation} className="space-y-6">
      <section className="rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <div className="space-y-5 p-6 lg:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <IconBadge icon={FlaskConical} tone="orange" size="lg" />
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950">ANP / RAQ</h1>
                <p className="text-sm text-zinc-500">Registro oficial de analise de qualidade</p>
                <p className="max-w-3xl text-sm leading-6 text-zinc-600">
                  Consolide o recebimento, registre os parametros tecnicos e acompanhe o resultado oficial da analise em um fluxo unico.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!raqIdCriado}
                onClick={() => {
                  if (raqIdCriado) {
                    window.open(`/api/raq/${raqIdCriado}/pdf`, '_blank');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4 text-orange-500" />
                Baixar PDF
              </button>
              <button
                type="button"
                disabled={!raqIdCriado}
                onClick={() => {
                  if (raqIdCriado) {
                    window.open(`/api/raq/${raqIdCriado}/xlsx`, '_blank');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4 text-orange-500" />
                Baixar Excel
              </button>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1 xl:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">Posto</p>
              <SelectBase {...register('postoId')} className="h-10 border-zinc-300">
                {(postos ?? []).map((posto) => (
                  <option key={posto.id} value={posto.id}>
                    {posto.nome}
                  </option>
                ))}
              </SelectBase>
              {errors.postoId ? <p className="text-xs text-red-600">{errors.postoId.message}</p> : null}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">Razao social</p>
              <InputBase readOnly value={postoSelecionado?.razaoSocial ?? ''} className={`h-10 border-zinc-300 ${readOnlyInputClassName}`} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">CNPJ</p>
              <InputBase readOnly value={postoSelecionado?.cnpj ?? ''} className={`h-10 border-zinc-300 ${readOnlyInputClassName}`} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">Endereco</p>
              <InputBase readOnly value={postoSelecionado?.endereco ?? ''} className={`h-10 border-zinc-300 ${readOnlyInputClassName}`} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="rounded-[28px] border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <IconBadge icon={Factory} tone="orange" size="md" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Identificacao</p>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-950">Dados do posto</h2>
                </div>
              </div>
            </div>
            <div className="space-y-5 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Data da coleta</label>
                  <div className="relative">
                    <InputBase readOnly value={dataColeta} className={`h-10 border-zinc-300 ${readOnlyInputClassName}`} />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Razão Social</label>
                  <InputBase readOnly value={postoSelecionado?.razaoSocial ?? ''} className={`h-10 border-zinc-300 ${readOnlyInputClassName}`} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">CNPJ</label>
                  <InputBase readOnly value={postoSelecionado?.cnpj ?? ''} className={`h-10 border-zinc-300 ${readOnlyInputClassName}`} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Endereço</label>
                  <InputBase readOnly value={postoSelecionado?.endereco ?? ''} className={`h-10 border-zinc-300 ${readOnlyInputClassName}`} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <IconBadge icon={Fuel} tone="amber" size="md" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Recebimento</p>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-950">Recebimento e origem</h2>
                </div>
              </div>
            </div>
            <div className="space-y-6 px-6 py-6">
              <div>
                <p className="mb-3 text-sm font-semibold text-zinc-700">Produto analisado</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {produtoOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = produto === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValue('produto', option.value)}
                        className={`group rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                          selected
                            ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className={`rounded-xl p-2 ${selected ? 'bg-orange-100 text-orange-600' : 'bg-zinc-100 text-zinc-500'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${selected ? 'text-orange-600' : 'text-zinc-400'}`}>
                            {selected ? 'Ativo' : 'Selecionar'}
                          </span>
                        </div>
                        <p className="mt-4 text-sm font-semibold">{option.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Volume Recebido em litros</label>
                  <InputBase type="number" step="0.01" {...register('volumeRecebido')} className="h-10 border-zinc-300" />
                  {errors.volumeRecebido ? <p className="mt-1 text-xs text-red-600">{errors.volumeRecebido.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Data da coleta</label>
                  <div className="relative">
                    <InputBase readOnly value={dataColeta} className={`h-10 border-zinc-300 ${readOnlyInputClassName}`} />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Distribuidor</label>
                  <InputBase {...register('distribuidora')} className="h-10 border-zinc-300" />
                  {errors.distribuidora ? <p className="mt-1 text-xs text-red-600">{errors.distribuidora.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">CNPJ do Distribuidor</label>
                  <InputBase {...register('cnpjDistribuidora')} className="h-10 border-zinc-300" />
                  {errors.cnpjDistribuidora ? <p className="mt-1 text-xs text-red-600">{errors.cnpjDistribuidora.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Transportador</label>
                  <InputBase {...register('transportador')} className="h-10 border-zinc-300" />
                  {errors.transportador ? <p className="mt-1 text-xs text-red-600">{errors.transportador.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">CNPJ do Transportador</label>
                  <InputBase {...register('cnpjTransportador')} className="h-10 border-zinc-300" />
                  {errors.cnpjTransportador ? <p className="mt-1 text-xs text-red-600">{errors.cnpjTransportador.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Nota Fiscal</label>
                  <InputBase {...register('notaFiscal')} className="h-10 border-zinc-300" />
                  {errors.notaFiscal ? <p className="mt-1 text-xs text-red-600">{errors.notaFiscal.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Placa do Caminhão</label>
                  <InputBase {...register('placaCaminhao')} className="h-10 border-zinc-300" />
                  {errors.placaCaminhao ? <p className="mt-1 text-xs text-red-600">{errors.placaCaminhao.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Nome do Motorista</label>
                  <InputBase {...register('nomeMotorista')} className="h-10 border-zinc-300" />
                  {errors.nomeMotorista ? <p className="mt-1 text-xs text-red-600">{errors.nomeMotorista.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">CPF do Motorista</label>
                  <InputBase {...register('cpfMotorista')} className="h-10 border-zinc-300" />
                  {errors.cpfMotorista ? <p className="mt-1 text-xs text-red-600">{errors.cpfMotorista.message}</p> : null}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <IconBadge icon={Gauge} tone="orange" size="md" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Analise</p>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-950">Parametros tecnicos</h2>
                </div>
              </div>
            </div>
            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Aspecto</label>
                  <SelectBase {...register('aspecto')} className="h-10 border-zinc-300">
                    <option value="LIQUIDO_E_ISENTO">Líquido e isento</option>
                    <option value="TURVO">Turvo</option>
                    <option value="COM_IMPUREZAS">Com impurezas</option>
                  </SelectBase>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Cor</label>
                  <SelectBase {...register('cor')} className="h-10 border-zinc-300">
                    <option value="CARACTERISTICA">Característica</option>
                    <option value="ALTERADA">Alterada</option>
                  </SelectBase>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Densidade relativa / observada</label>
                  <InputBase type="number" step="0.001" {...register('densidadeObservada')} className="h-10 border-zinc-300" />
                  {errors.densidadeObservada ? <p className="mt-1 text-xs text-red-600">{errors.densidadeObservada.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Temperatura</label>
                  <InputBase type="number" step="0.1" {...register('temperaturaObservada')} className="h-10 border-zinc-300" />
                  {errors.temperaturaObservada ? <p className="mt-1 text-xs text-red-600">{errors.temperaturaObservada.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Massa específica a 20°C</label>
                  <InputBase type="number" step="0.001" {...register('massa20c')} className="h-10 border-zinc-300" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Teor de etanol na gasolina</label>
                  <InputBase
                    readOnly
                    value={
                      produto === 'GASOLINA_COMUM' && teorEtanolGasolina !== undefined
                        ? `${teorEtanolGasolina.toFixed(2)}%`
                        : 'Não aplicável'
                    }
                    className={`h-10 border-zinc-300 ${readOnlyInputClassName}`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Fase aquosa (ml)</label>
                  <InputBase
                    type="number"
                    step="0.1"
                    disabled={produto !== 'GASOLINA_COMUM'}
                    {...register('faseAquosa')}
                    className={`h-10 border-zinc-300 ${produto === 'GASOLINA_COMUM' ? '' : readOnlyInputClassName}`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Teor alcoólico no AEHC</label>
                  <InputBase
                    type="number"
                    step="0.1"
                    disabled={produto !== 'ETANOL_HIDRATADO'}
                    {...register('teorAlcoolico')}
                    className={`h-10 border-zinc-300 ${produto === 'ETANOL_HIDRATADO' ? '' : readOnlyInputClassName}`}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-4 flex items-center gap-3">
                  <IconBadge icon={UserRound} tone="zinc" size="sm" />
                  <h3 className="text-sm font-semibold text-zinc-900">Responsável técnico</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Nome do Analista</label>
                    <InputBase {...register('nomeAnalista')} className="h-10 border-zinc-300" />
                    {errors.nomeAnalista ? <p className="mt-1 text-xs text-red-600">{errors.nomeAnalista.message}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="btn-orange-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                    >
                      {isPending ? 'Salvando...' : 'Registrar análise'}
                    </button>
                    {raqIdCriado ? (
                      <>
                        <button
                          type="button"
                          onClick={() => window.open(`/api/raq/${raqIdCriado}/pdf`, '_blank')}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-all hover:bg-zinc-50 active:scale-[0.98]"
                        >
                          <Download className="h-4 w-4 text-orange-500" />
                          Baixar PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(`/api/raq/${raqIdCriado}/xlsx`, '_blank')}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition-all hover:bg-zinc-50 active:scale-[0.98]"
                        >
                          <Download className="h-4 w-4 text-orange-500" />
                          Baixar Planilha
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </form>

        <div className="space-y-6">
          <CardBase className="sticky top-24" padding="lg">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <IconBadge icon={statusAprovado ? CheckCircle2 : AlertTriangle} tone={statusAprovado ? 'emerald' : 'red'} size="md" />
                <div>
                  <p className="text-base font-semibold text-zinc-950">Resumo / Resultado</p>
                  <p className="text-sm text-zinc-500">
                    {statusAprovado ? 'Amostra aprovada pelos parametros atuais.' : 'Amostra reprovada pelos parametros atuais.'}
                  </p>
                </div>
              </div>

              <div>
                <BadgeStatus
                  label={statusAprovado ? 'Aprovado' : 'Reprovado'}
                  tone={statusAprovado ? 'green' : 'red'}
                  icon={statusAprovado ? CheckCircle2 : AlertTriangle}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Produto</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-950">
                    {produto === 'GASOLINA_COMUM' ? 'Gasolina' : produto === 'ETANOL_HIDRATADO' ? 'Etanol' : 'Diesel'}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Teor calculado</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-950">
                    {produto === 'GASOLINA_COMUM' && teorEtanolGasolina !== undefined
                      ? `${teorEtanolGasolina.toFixed(2)}%`
                      : 'Não aplicável'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-600">Densidade</span>
                  <span className="text-sm font-semibold tabular-nums text-zinc-950">{densidade || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-600">Temperatura base</span>
                  <span className="text-sm font-semibold tabular-nums text-zinc-950">{watch('temperaturaObservada') || '0'} °C</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-zinc-600">Fase aquosa / teor</span>
                  <span className="text-sm font-semibold tabular-nums text-zinc-950">
                    {produto === 'GASOLINA_COMUM'
                      ? `${watch('faseAquosa') || '0'} mL`
                      : produto === 'ETANOL_HIDRATADO'
                        ? `${watch('teorAlcoolico') || '0'}%`
                        : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                <p className="text-sm font-semibold text-zinc-900">Observação operacional</p>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  O painel reflete em tempo real os parametros preenchidos e respeita a logica oficial de aprovacao da analise.
                </p>
              </div>

              {createOutput ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Ultimo resultado salvo</p>
                  <p className="mt-2 text-sm font-semibold text-emerald-700">{createOutput.resultado}</p>
                </div>
              ) : null}
            </div>
          </CardBase>
        </div>
      </div>

      <section className="rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <IconBadge icon={History} tone="zinc" size="md" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Arquivo recente</p>
                <h2 className="text-xl font-bold tracking-tight text-zinc-950">Histórico de RAQs</h2>
                <p className="text-sm text-zinc-500">{(historico ?? []).length} análises no período</p>
              </div>
            </div>
            {fetchingHistorico ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <LoadingSpinner size={16} />
                Atualizando histórico...
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-2xl border border-zinc-200 bg-orange-50/50 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">De</label>
                <InputBase
                  type="date"
                  value={filtroDataInicio}
                  onChange={(event) => setFiltroDataInicio(event.target.value)}
                  className="h-10 border-zinc-300"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Até</label>
                <InputBase
                  type="date"
                  value={filtroDataFim}
                  onChange={(event) => setFiltroDataFim(event.target.value)}
                  className="h-10 border-zinc-300"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Produto</label>
                <SelectBase
                  value={filtroProduto}
                  onChange={(event) => setFiltroProduto(event.target.value as typeof filtroProduto)}
                  className="h-10 border-zinc-300"
                >
                  <option value="">Todos</option>
                  <option value="GASOLINA_COMUM">Gasolina</option>
                  <option value="ETANOL_HIDRATADO">Etanol</option>
                  <option value="DIESEL_S10">Diesel</option>
                </SelectBase>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Resultado</label>
                <SelectBase
                  value={filtroResultado}
                  onChange={(event) => setFiltroResultado(event.target.value as typeof filtroResultado)}
                  className="h-10 border-zinc-300"
                >
                  <option value="">Todos</option>
                  <option value="APROVADO">Aprovado</option>
                  <option value="REPROVADO">Reprovado</option>
                </SelectBase>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleLimparFiltros}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-100 active:scale-[0.98]"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {(historico ?? []).map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-zinc-900">{formatProdutoLabel(item.produto)}</p>
                      <BadgeStatus
                        label={item.resultado === 'APROVADO' ? 'Aprovado' : 'Reprovado'}
                        tone={item.resultado === 'APROVADO' ? 'green' : 'red'}
                        icon={item.resultado === 'APROVADO' ? CheckCircle2 : AlertTriangle}
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
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 transition-all hover:bg-zinc-50 active:scale-[0.98]"
                    >
                      <Download className="h-3.5 w-3.5 text-orange-500" />
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(`/api/raq/${item.id}/xlsx`, '_blank')}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 transition-all hover:bg-zinc-50 active:scale-[0.98]"
                    >
                      <Download className="h-3.5 w-3.5 text-orange-500" />
                      Excel
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {(historico ?? []).length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhum RAQ para o posto e filtros selecionados.</p>
            ) : null}
          </div>
        </div>
      </section>
      </motion.div>
    </RouteGuard>
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
