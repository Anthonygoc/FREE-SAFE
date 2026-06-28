'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

type PaginationControlProps = {
  pagina: number;
  totalPaginas: number;
  total: number;
  onMudarPagina: (novaPagina: number) => void;
};

function gerarPaginas(paginaAtual: number, totalPaginas: number): number[] {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, index) => index + 1);
  }

  const inicio = Math.max(1, paginaAtual - 1);
  const fim = Math.min(totalPaginas, inicio + 2);
  const paginas = new Set<number>([1, totalPaginas, paginaAtual]);

  for (let pagina = inicio; pagina <= fim; pagina += 1) {
    paginas.add(pagina);
  }

  return [...paginas].sort((a, b) => a - b);
}

export function PaginationControl({
  pagina,
  totalPaginas,
  total,
  onMudarPagina,
}: PaginationControlProps) {
  if (totalPaginas <= 1) {
    return null;
  }

  const paginas = gerarPaginas(pagina, totalPaginas);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-zinc-500">
        <span className="font-medium text-zinc-700">
          Página <span className="tabular-nums">{pagina}</span> de <span className="tabular-nums">{totalPaginas}</span>
        </span>
        <span className="ml-2 tabular-nums">{total} registros</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onMudarPagina(pagina - 1)}
          disabled={pagina <= 1}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          {paginas.map((item, index) => {
            const paginaAnterior = paginas[index - 1];
            const mostrarSeparador = paginaAnterior !== undefined && item - paginaAnterior > 1;

            return (
              <div key={item} className="flex items-center gap-2">
                {mostrarSeparador ? <span className="px-1 text-sm text-zinc-400">…</span> : null}
                <button
                  type="button"
                  onClick={() => onMudarPagina(item)}
                  className={cn(
                    'inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold tabular-nums transition',
                    item === pagina
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
                  )}
                >
                  {item}
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onMudarPagina(pagina + 1)}
          disabled={pagina >= totalPaginas}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
