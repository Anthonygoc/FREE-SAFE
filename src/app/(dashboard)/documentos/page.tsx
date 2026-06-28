'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Eye, FileText, FolderOpen, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { RouteGuard } from '@/components/auth/route-guard';
import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  type Documento,
  useCategorias,
  useCreateCategoria,
  useCreateDocumento,
  useDeleteDocumento,
  useDocumentos,
} from '@/hooks/use-documentos';
import { usePostos } from '@/hooks/use-postos';
import { cn } from '@/lib/utils';

const statusTone = {
  VALIDO: 'green',
  VENCENDO: 'yellow',
  VENCIDO: 'red',
} as const;

const statusFilterOptions = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'VALIDO', label: 'Validos' },
  { value: 'VENCENDO', label: 'Vencendo' },
  { value: 'VENCIDO', label: 'Vencidos' },
] as const;

const NOVA_CATEGORIA_VALUE = '__nova_categoria__';

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

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result ?? ''));
  reader.onerror = () => reject(new Error('Falha ao carregar arquivo'));
  reader.readAsDataURL(file);
});

function abrirArquivo(dataUrl: string) {
  try {
    const [header, base64] = dataUrl.split(',');
    const mimeMatch = header.match(/data:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    const bytes = atob(base64);
    const array = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      array[i] = bytes.charCodeAt(i);
    }

    const blob = new Blob([array], { type: mime });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');

    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (error) {
    console.error('Erro ao abrir arquivo:', error);
  }
}

function formatarData(data?: string) {
  return data ? new Date(data).toLocaleDateString('pt-BR') : '-';
}

function valorInicialFormulario() {
  return {
    categoriaId: '',
    novaCategoria: '',
    titulo: '',
    numero: '',
    dataEmissao: '',
    dataVencimento: '',
    arquivoUrl: '',
    arquivoNome: '',
  };
}

export default function DocumentosPage() {
  const { data: postos, isLoading: loadingPostos } = usePostos();
  const { data: categorias, isLoading: loadingCategorias } = useCategorias();
  const [postoId, setPostoId] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [salvandoArquivo, setSalvandoArquivo] = useState(false);
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('TODOS');
  const [statusAtivo, setStatusAtivo] = useState<'TODOS' | Documento['status']>('TODOS');
  const [form, setForm] = useState(valorInicialFormulario);

  const { data: documentos, isLoading: loadingDocumentos } = useDocumentos(postoId);
  const createCategoria = useCreateCategoria();
  const createDocumento = useCreateDocumento();
  const deleteDocumento = useDeleteDocumento();

  useEffect(() => {
    if (!postoId && postos && postos.length > 0) {
      setPostoId(postos[0].id);
    }
  }, [postos, postoId]);

  const categoriasComContagem = useMemo(() => {
    const contagem = new Map<string, number>();

    for (const documento of documentos ?? []) {
      contagem.set(documento.categoriaId, (contagem.get(documento.categoriaId) ?? 0) + 1);
    }

    return (categorias ?? []).map((categoria) => ({
      ...categoria,
      total: contagem.get(categoria.id) ?? 0,
    }));
  }, [categorias, documentos]);

  const documentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');

    return (documentos ?? []).filter((documento) => {
      const matchCategoria = categoriaAtiva === 'TODOS' || documento.categoriaId === categoriaAtiva;
      const matchStatus = statusAtivo === 'TODOS' || documento.status === statusAtivo;
      const matchBusca = !termo || [documento.titulo, documento.categoriaNome, documento.numero ?? '']
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(termo);

      return matchCategoria && matchStatus && matchBusca;
    });
  }, [busca, categoriaAtiva, documentos, statusAtivo]);

  const categoriaSelecionada = useMemo(
    () => categoriasComContagem.find((categoria) => categoria.id === categoriaAtiva),
    [categoriaAtiva, categoriasComContagem],
  );

  const postoSelecionado = useMemo(
    () => (postos ?? []).find((posto) => posto.id === postoId),
    [postoId, postos],
  );

  const loading = loadingPostos || loadingCategorias || loadingDocumentos;

  function fecharModal() {
    setModalAberto(false);
    setSalvandoArquivo(false);
    setForm(valorInicialFormulario());
  }

  async function handleArquivoSelecionado(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setForm((current) => ({ ...current, arquivoUrl: '', arquivoNome: '' }));
      return;
    }

    try {
      setSalvandoArquivo(true);
      const arquivoUrl = await toBase64(file);
      setForm((current) => ({
        ...current,
        arquivoUrl,
        arquivoNome: file.name,
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar arquivo.');
    } finally {
      setSalvandoArquivo(false);
      event.target.value = '';
    }
  }

  async function handleSalvarDocumento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!postoId) {
      toast.error('Selecione um posto.');
      return;
    }

    if (!form.titulo.trim()) {
      toast.error('Informe o titulo do documento.');
      return;
    }

    let categoriaId = form.categoriaId;

    if (categoriaId === NOVA_CATEGORIA_VALUE) {
      if (!form.novaCategoria.trim()) {
        toast.error('Informe o nome da nova categoria.');
        return;
      }

      const categoria = await createCategoria.mutateAsync({
        nome: form.novaCategoria.trim(),
      });

      categoriaId = categoria.id;
    }

    if (!categoriaId) {
      toast.error('Selecione uma categoria.');
      return;
    }

    await createDocumento.mutateAsync({
      postoId,
      categoriaId,
      titulo: form.titulo.trim(),
      numero: form.numero.trim() || undefined,
      dataEmissao: form.dataEmissao || undefined,
      dataVencimento: form.dataVencimento || undefined,
      arquivoUrl: form.arquivoUrl || undefined,
    });

    fecharModal();
  }

  async function handleExcluirDocumento(id: string) {
    if (!window.confirm('Deseja excluir este documento?')) {
      return;
    }

    await deleteDocumento.mutateAsync(id);
  }

  if (loading) {
    return (
      <RouteGuard recurso="documentos">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size={30} />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard recurso="documentos">
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
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-sm font-semibold text-orange-600">FREE SAFE</p>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Documentos do Posto</h1>
                <p className="max-w-3xl text-sm text-zinc-500">
                  Centralize licencas, certificados e arquivos obrigatorios do posto em uma visualizacao limpa e operacional.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-[260px]">
                <label className="mb-2 block text-sm font-medium text-zinc-700">Posto</label>
                <select
                  value={postoId}
                  onChange={(e) => setPostoId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                >
                  {(postos ?? []).map((posto) => (
                    <option key={posto.id} value={posto.id}>
                      {posto.nome}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setModalAberto(true)}
                disabled={!postoId}
                className="btn-orange-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                Adicionar documento
              </button>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <CardBase className="h-full" padding="lg">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-50 p-2">
                  <FolderOpen className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">Categorias</h2>
                  <p className="text-xs text-zinc-500">Filtro por tipo de documento</p>
                </div>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1 xl:block xl:space-y-2">
                <button
                  type="button"
                  onClick={() => setCategoriaAtiva('TODOS')}
                  className={cn(
                    'flex min-w-fit items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all xl:w-full',
                    categoriaAtiva === 'TODOS'
                      ? 'border-orange-200 bg-orange-50 text-orange-700'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50',
                  )}
                >
                  <span>Todos</span>
                  <span className="text-xs tabular-nums text-zinc-500">{(documentos ?? []).length}</span>
                </button>

                {categoriasComContagem.map((categoria) => (
                  <button
                    key={categoria.id}
                    type="button"
                    onClick={() => setCategoriaAtiva(categoria.id)}
                    className={cn(
                      'flex min-w-fit items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all xl:w-full',
                      categoriaAtiva === categoria.id
                        ? 'border-orange-200 bg-orange-50 text-orange-700'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50',
                    )}
                  >
                    <span className="truncate">{categoria.nome}</span>
                    <span className="text-xs tabular-nums text-zinc-500">{categoria.total}</span>
                  </button>
                ))}
              </div>
            </CardBase>
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="min-w-0"
          >
            <CardBase padding="lg">
              <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-zinc-900">Arquivos cadastrados</h2>
                  <p className="text-sm text-zinc-500">
                    {documentosFiltrados.length} resultado(s)
                    {postoSelecionado ? ` em ${postoSelecionado.nome}` : ''}
                    {categoriaSelecionada ? ` · ${categoriaSelecionada.nome}` : ''}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                    <input
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Buscar por titulo ou numero"
                      className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </label>

                  <select
                    value={statusAtivo}
                    onChange={(e) => setStatusAtivo(e.target.value as 'TODOS' | Documento['status'])}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  >
                    {statusFilterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {documentosFiltrados.length === 0 ? (
                <div className="py-6">
                  <EmptyState
                    icon={FileText}
                    title="Nenhum documento encontrado"
                    description="Ajuste os filtros atuais ou adicione um novo documento para este posto."
                    action={(
                      <button
                        type="button"
                        onClick={() => setModalAberto(true)}
                        className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98]"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar documento
                      </button>
                    )}
                  />
                </div>
              ) : (
                <motion.div
                  className="mt-6 grid gap-4 xl:grid-cols-2"
                  initial="hidden"
                  animate="show"
                  variants={staggerContainer}
                >
                  {documentosFiltrados.map((documento) => (
                    <motion.div
                      key={documento.id}
                      variants={staggerItem}
                      whileHover={{ y: -2 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="doc-card rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md">
                        <div className="flex h-full flex-col gap-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="rounded-xl bg-orange-50 p-2">
                                  <FileText className="h-5 w-5 text-orange-600" />
                                </div>
                                <p className="truncate text-base font-semibold text-zinc-900">{documento.titulo}</p>
                              </div>
                              <div className="space-y-1 pl-11">
                                <p className="text-sm text-zinc-500">{documento.categoriaNome}</p>
                                <p className="text-sm text-zinc-500">
                                  Numero: <span className="font-medium text-zinc-700">{documento.numero || '-'}</span>
                                </p>
                              </div>
                            </div>

                            <BadgeStatus label={documento.status} tone={statusTone[documento.status]} size="sm" />
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-zinc-500" />
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Emissao</p>
                              </div>
                              <p className="mt-3 text-sm font-semibold tabular-nums text-zinc-900">
                                {formatarData(documento.dataEmissao)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-zinc-500" />
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Vencimento</p>
                              </div>
                              <p className="mt-3 text-sm font-semibold tabular-nums text-zinc-900">
                                {formatarData(documento.dataVencimento)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {documento.arquivoUrl ? (
                              <button
                                type="button"
                                onClick={() => abrirArquivo(documento.arquivoUrl!)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
                              >
                                <Eye className="h-4 w-4" />
                                Visualizar
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleExcluirDocumento(documento.id)}
                              disabled={deleteDocumento.isPending}
                              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
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
                className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white shadow-xl"
              >
                <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-orange-50 p-2">
                        <Upload className="h-5 w-5 text-orange-600" />
                      </div>
                      <h2 className="text-base font-semibold text-zinc-900">Adicionar documento</h2>
                    </div>
                    <p className="text-sm text-zinc-500">
                      Preencha os dados do arquivo e vincule o documento ao posto selecionado.
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

                <form onSubmit={handleSalvarDocumento} className="space-y-5 p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">Categoria</label>
                      <select
                        value={form.categoriaId}
                        onChange={(e) => setForm((current) => ({ ...current, categoriaId: e.target.value }))}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      >
                        <option value="">Selecione uma categoria</option>
                        {(categorias ?? []).map((categoria) => (
                          <option key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                          </option>
                        ))}
                        <option value={NOVA_CATEGORIA_VALUE}>+ Nova categoria</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">Titulo do documento</label>
                      <input
                        value={form.titulo}
                        onChange={(e) => setForm((current) => ({ ...current, titulo: e.target.value }))}
                        placeholder="Ex: Alvara 2026"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>

                    {form.categoriaId === NOVA_CATEGORIA_VALUE ? (
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-zinc-700">Nova categoria</label>
                        <input
                          value={form.novaCategoria}
                          onChange={(e) => setForm((current) => ({ ...current, novaCategoria: e.target.value }))}
                          placeholder="Digite o nome da nova categoria"
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>
                    ) : null}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">Numero</label>
                      <input
                        value={form.numero}
                        onChange={(e) => setForm((current) => ({ ...current, numero: e.target.value }))}
                        placeholder="Opcional"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">Data de emissao</label>
                      <input
                        type="date"
                        value={form.dataEmissao}
                        onChange={(e) => setForm((current) => ({ ...current, dataEmissao: e.target.value }))}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">Data de vencimento</label>
                      <input
                        type="date"
                        value={form.dataVencimento}
                        onChange={(e) => setForm((current) => ({ ...current, dataVencimento: e.target.value }))}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-zinc-700">Arquivo</label>
                      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 transition-colors hover:border-orange-300 hover:bg-orange-50">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-orange-50 p-2">
                            <Upload className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">Selecionar PDF ou imagem</p>
                            <p className="text-xs text-zinc-500">
                              {form.arquivoNome || 'Nenhum arquivo selecionado'}
                            </p>
                          </div>
                        </div>

                        {salvandoArquivo ? <LoadingSpinner size={18} /> : null}

                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={handleArquivoSelecionado}
                        />
                      </label>
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
                      disabled={createDocumento.isPending || createCategoria.isPending || salvandoArquivo}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
                    >
                      {createDocumento.isPending || createCategoria.isPending ? <LoadingSpinner size={18} /> : null}
                      Salvar documento
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
