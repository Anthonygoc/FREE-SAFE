'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, FileText, GraduationCap, PlayCircle } from 'lucide-react';

import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useCursoConteudo, type CursoConteudo } from '@/hooks/use-cursos';

const tipoIconMap = {
  TEXTO_RICO: FileText,
  VIDEO_YOUTUBE: PlayCircle,
  PDF_TEXTO: FileText,
} satisfies Record<CursoConteudo['tipo'], typeof FileText>;

const tipoLabelMap: Record<CursoConteudo['tipo'], string> = {
  TEXTO_RICO: 'Texto',
  VIDEO_YOUTUBE: 'Vídeo',
  PDF_TEXTO: 'PDF / Texto',
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatInlineMarkdown(value: string) {
  return value
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-zinc-100 px-1 py-0.5 text-sm">$1</code>');
}

function markdownToHtml(markdown: string) {
  const lines = escapeHtml(markdown).split('\n');
  const blocks: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push(`<ul>${listItems.join('')}</ul>`);
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(`<li>${formatInlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    flushList();

    if (line.startsWith('### ')) {
      blocks.push(`<h3>${formatInlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push(`<h2>${formatInlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith('# ')) {
      blocks.push(`<h1>${formatInlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }

    blocks.push(`<p>${formatInlineMarkdown(line)}</p>`);
  }

  flushList();

  return blocks.join('');
}

function renderConteudo(secao: CursoConteudo) {
  if (secao.tipo === 'VIDEO_YOUTUBE') {
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950">
        <div className="relative aspect-video w-full">
          <iframe
            title={secao.titulo}
            src={secao.conteudo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>
    );
  }

  if (secao.tipo === 'PDF_TEXTO') {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm leading-7 text-zinc-700 whitespace-pre-wrap">
        {secao.conteudo}
      </div>
    );
  }

  return (
    <div
      className="prose prose-zinc max-w-none [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-zinc-950 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-zinc-950 [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-zinc-900 [&_li]:mb-2 [&_li]:text-zinc-700 [&_p]:mb-4 [&_p]:leading-7 [&_p]:text-zinc-700 [&_strong]:font-semibold [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-6"
      dangerouslySetInnerHTML={{ __html: markdownToHtml(secao.conteudo) }}
    />
  );
}

export default function CursoDetalhePage() {
  const params = useParams<{ id: string }>();
  const cursoId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data, isLoading } = useCursoConteudo(cursoId);
  const [secaoAtual, setSecaoAtual] = useState(0);

  const conteudos = [...(data?.conteudos ?? [])].sort((a, b) => a.ordem - b.ordem);
  const secao = conteudos[secaoAtual];

  useEffect(() => {
    if (conteudos.length === 0) {
      setSecaoAtual(0);
      return;
    }

    if (secaoAtual > conteudos.length - 1) {
      setSecaoAtual(conteudos.length - 1);
    }
  }, [conteudos.length, secaoAtual]);

  if (isLoading || !cursoId) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <LoadingSpinner size={30} />
      </div>
    );
  }

  if (!data || !secao) {
    return (
      <div className="space-y-6">
        <Link href="/treinamentos" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600">
          <ArrowLeft className="h-4 w-4" />
          Voltar para treinamentos
        </Link>
        <CardBase>
          <p className="text-sm text-zinc-500">Conteúdo do curso indisponível.</p>
        </CardBase>
      </div>
    );
  }

  const Icon = tipoIconMap[secao.tipo];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <Link href="/treinamentos" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" />
          Voltar para treinamentos
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-600">
              <GraduationCap className="h-4 w-4" />
              FREE SAFE
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">{data.curso.nome}</h1>
            <p className="mt-2 max-w-3xl text-zinc-500">
              {data.curso.descricao ?? 'Curso sem descrição cadastrada.'}
            </p>
          </div>
          <BadgeStatus label={`${conteudos.length} seções`} tone="dark" />
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <CardBase className="h-fit p-4">
          <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Índice do curso
          </p>
          <div className="space-y-2">
            {conteudos.map((item, index) => {
              const ItemIcon = tipoIconMap[item.tipo];
              const selected = index === secaoAtual;
              const itemClasses = selected
                ? 'border-orange-200 bg-orange-50 text-orange-700'
                : 'border-transparent bg-white text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSecaoAtual(index)}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${itemClasses}`}
                >
                  <ItemIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]">
                      {item.ordem}. {tipoLabelMap[item.tipo]}
                    </p>
                    <p className="mt-1 text-sm font-semibold">{item.titulo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardBase>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <CardBase className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
                <Icon className="h-4 w-4" />
                {tipoLabelMap[secao.tipo]}
              </div>
              <BadgeStatus label={`Seção ${secaoAtual + 1} de ${conteudos.length}`} tone="default" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-zinc-950">{secao.titulo}</h2>
            </div>

            {renderConteudo(secao)}

            <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-lg shadow-zinc-200/60 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSecaoAtual((current) => Math.max(0, current - 1))}
                  disabled={secaoAtual === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setSecaoAtual((current) => Math.min(conteudos.length - 1, current + 1))}
                  disabled={secaoAtual === conteudos.length - 1}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <Link
                href={`/treinamentos/${cursoId}/prova`}
                className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Fazer a prova
              </Link>
            </div>
          </CardBase>
        </motion.div>
      </div>
    </div>
  );
}
