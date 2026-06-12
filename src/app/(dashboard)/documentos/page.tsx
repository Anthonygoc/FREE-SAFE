'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Eye, FileText, FolderOpen, Plus, Trash2, Upload, X } from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

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

const statusTone = {
  VALIDO: 'green',
  VENCENDO: 'yellow',
  VENCIDO: 'red',
} as const;

const NOVA_CATEGORIA_VALUE = '__nova_categoria__';

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
  const [form, setForm] = useState(valorInicialFormulario);

  const { data: documentos, isLoading: loadingDocumentos } = useDocumentos(postoId);
  const { data: vencendo30, isLoading: loadingVencendo30 } = useDocumentos(postoId, 30);
  const createCategoria = useCreateCategoria();
  const createDocumento = useCreateDocumento();
  const deleteDocumento = useDeleteDocumento();

  useEffect(() => {
    if (!postoId && postos && postos.length > 0) {
      setPostoId(postos[0].id);
    }
  }, [postos, postoId]);

  const totalAtencao = useMemo(
    () => (vencendo30 ?? []).filter((doc) => doc.status === 'VENCENDO' || doc.status === 'VENCIDO').length,
    [vencendo30],
  );

  const documentosAgrupados = useMemo(() => {
    const grupos = new Map<string, Documento[]>();

    for (const documento of documentos ?? []) {
      const grupoAtual = grupos.get(documento.categoriaNome) ?? [];
      grupoAtual.push(documento);
      grupos.set(documento.categoriaNome, grupoAtual);
    }

    return Array.from(grupos.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
      .map(([categoriaNome, itens]) => ({ categoriaNome, itens }));
  }, [documentos]);

  const loading = loadingPostos || loadingCategorias || loadingDocumentos || loadingVencendo30;

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
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size={30} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 rounded-[28px] border border-zinc-200 bg-gradient-to-r from-white via-orange-50/60 to-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Documentos do Posto</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              Organize arquivos obrigatorios, acompanhe vencimentos e mantenha a documentacao de cada posto acessivel.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-[260px]">
              <label className="mb-2 block text-sm font-medium text-zinc-700">Posto</label>
              <select
                value={postoId}
                onChange={(e) => setPostoId(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-orange-500"
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Adicionar documento
            </button>
          </div>
        </motion.div>

        {totalAtencao > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 shadow-sm"
          >
            <p className="text-sm font-semibold">{totalAtencao} documento(s) precisam de atencao</p>
          </motion.div>
        ) : null}

        {(documentos ?? []).length === 0 ? (
          <CardBase>
            <EmptyState
              icon={FileText}
              title="Sem documentos"
              description="Nenhum documento cadastrado. Adicione o primeiro."
              action={(
                <button
                  type="button"
                  onClick={() => setModalAberto(true)}
                  className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar documento
                </button>
              )}
            />
          </CardBase>
        ) : (
          <div className="space-y-6">
            {documentosAgrupados.map((grupo, index) => (
              <motion.section
                key={grupo.categoriaNome}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3 px-1">
                  <div className="rounded-2xl bg-orange-100 p-2 text-orange-600">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-zinc-950">{grupo.categoriaNome}</h2>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {grupo.itens.map((documento) => (
                    <CardBase key={documento.id} className="rounded-2xl">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <p className="text-base font-bold text-zinc-950">{documento.titulo}</p>
                            {documento.numero ? (
                              <p className="text-sm text-zinc-500">Numero: {documento.numero}</p>
                            ) : null}
                            <p className="text-sm text-zinc-500">Vencimento: {formatarData(documento.dataVencimento)}</p>
                          </div>

                          <BadgeStatus label={documento.status} tone={statusTone[documento.status]} />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {documento.arquivoUrl ? (
                            <button
                              type="button"
                              onClick={() => abrirArquivo(documento.arquivoUrl!)}
                              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-orange-300 hover:text-orange-600"
                            >
                              <Eye className="h-4 w-4" />
                              Visualizar
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleExcluirDocumento(documento.id)}
                            disabled={deleteDocumento.isPending}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </CardBase>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalAberto ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl rounded-[28px] border border-zinc-200 bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-950">Adicionar documento</h2>
                  <p className="mt-1 text-sm text-zinc-500">Cadastre arquivo, vigencia e categoria para o posto selecionado.</p>
                </div>

                <button
                  type="button"
                  onClick={fecharModal}
                  className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSalvarDocumento} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">Categoria</label>
                    <select
                      value={form.categoriaId}
                      onChange={(e) => setForm((current) => ({ ...current, categoriaId: e.target.value }))}
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-orange-500"
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
                      className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-orange-500"
                      placeholder="Ex: Alvara 2026"
                    />
                  </div>

                  {form.categoriaId === NOVA_CATEGORIA_VALUE ? (
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-zinc-700">Nova categoria</label>
                      <input
                        value={form.novaCategoria}
                        onChange={(e) => setForm((current) => ({ ...current, novaCategoria: e.target.value }))}
                        className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-orange-500"
                        placeholder="Digite o nome da nova categoria"
                      />
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">Numero</label>
                    <input
                      value={form.numero}
                      onChange={(e) => setForm((current) => ({ ...current, numero: e.target.value }))}
                      className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-orange-500"
                      placeholder="Opcional"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">Data de emissao</label>
                    <input
                      type="date"
                      value={form.dataEmissao}
                      onChange={(e) => setForm((current) => ({ ...current, dataEmissao: e.target.value }))}
                      className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">Data de vencimento</label>
                    <input
                      type="date"
                      value={form.dataVencimento}
                      onChange={(e) => setForm((current) => ({ ...current, dataVencimento: e.target.value }))}
                      className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-orange-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-zinc-700">Arquivo</label>
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 transition hover:border-orange-300 hover:bg-orange-50">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-orange-100 p-2 text-orange-600">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-800">Selecionar PDF ou imagem</p>
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

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={fecharModal}
                    className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={createDocumento.isPending || createCategoria.isPending || salvandoArquivo}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createDocumento.isPending || createCategoria.isPending ? <LoadingSpinner size={18} /> : null}
                    Salvar documento
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
