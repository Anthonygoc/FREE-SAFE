'use client';

import Link from 'next/link';
import { BookOpenText, Info, FolderCheck, Fuel, GraduationCap, ShieldCheck, Users } from 'lucide-react';

import { CardBase } from '@/components/ui/card-base';
import { IconBadge } from '@/components/ui/icon-badge';
import { APP_NAME, APP_VERSION } from '@/lib/version';

const recursos = [
  {
    titulo: 'INMETRO e conformidade',
    descricao: 'Acompanhamento de aferições, conformidade operacional e rotinas de inspeção.',
    icon: ShieldCheck,
  },
  {
    titulo: 'ANP e operação',
    descricao: 'Gestão de análises, controles operacionais e registros ligados à rotina dos postos.',
    icon: Fuel,
  },
  {
    titulo: 'Documentos',
    descricao: 'Centralização de documentos, vencimentos e evidências para auditoria e acompanhamento.',
    icon: FolderCheck,
  },
  {
    titulo: 'Colaboradores e treinamentos',
    descricao: 'Cadastro de equipes, histórico funcional e acompanhamento de treinamentos obrigatórios.',
    icon: Users,
  },
];

export default function SobrePage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-w-0 space-y-6">
      <section className="rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <div className="space-y-5 p-6 lg:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-500 text-3xl font-black text-white">
              F
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Sobre o sistema</p>
              <h1 className="text-3xl font-black tracking-tight text-zinc-950">{APP_NAME}</h1>
              <p className="text-sm font-medium text-zinc-500">Compliance Operacional</p>
              <p className="max-w-3xl text-sm leading-6 text-zinc-600">
                Plataforma de compliance para gestão de postos de combustíveis, reunindo rotinas de INMETRO, ANP,
                documentos, colaboradores e treinamentos em um único ambiente administrativo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <CardBase padding="lg">
          <div className="flex items-start gap-3">
            <IconBadge icon={Info} tone="orange" size="md" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Versão do sistema</p>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Versão {APP_VERSION}</h2>
            </div>
          </div>
        </CardBase>

        <CardBase padding="lg">
          <div className="flex items-start gap-3">
            <IconBadge icon={BookOpenText} tone="zinc" size="md" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Resumo</p>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-950">O que o sistema cobre</h2>
              <p className="text-sm leading-6 text-zinc-600">
                O FREE SAFE apoia a organização operacional e o acompanhamento de compliance da Rede Free de forma
                centralizada e rastreável.
              </p>
            </div>
          </div>
        </CardBase>
      </div>

      <CardBase padding="lg">
        <div className="flex items-start gap-3">
          <IconBadge icon={GraduationCap} tone="orange" size="md" />
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Recursos</p>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Módulos principais</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {recursos.map((recurso) => {
            const Icon = recurso.icon;

            return (
              <div key={recurso.titulo} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start gap-3">
                  <IconBadge icon={Icon} tone="orange" size="sm" />
                  <div>
                    <h3 className="font-semibold text-zinc-900">{recurso.titulo}</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">{recurso.descricao}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardBase>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <CardBase padding="lg">
          <div className="flex items-start gap-3">
            <IconBadge icon={Info} tone="zinc" size="md" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Informações úteis</p>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Contexto da plataforma</h2>
            </div>
          </div>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <dt className="font-semibold text-zinc-900">Desenvolvido para</dt>
              <dd className="mt-1 text-zinc-600">Rede Free</dd>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <dt className="font-semibold text-zinc-900">Ano de referência</dt>
              <dd className="mt-1 text-zinc-600">{currentYear}</dd>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <dt className="font-semibold text-zinc-900">Privacidade</dt>
              <dd className="mt-1">
                <Link href="/privacidade" className="font-medium text-orange-600 transition hover:text-orange-700">
                  Ver Política de Privacidade
                </Link>
              </dd>
            </div>
          </dl>
        </CardBase>

        <CardBase padding="lg">
          <div className="flex items-start gap-3">
            <IconBadge icon={ShieldCheck} tone="orange" size="md" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Descrição</p>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Uso objetivo e honesto</h2>
              <p className="text-sm leading-6 text-zinc-600">
                Esta tela apresenta apenas informações institucionais básicas da aplicação, sem promessas técnicas
                que dependam de validação externa ou de infraestrutura não exibida aqui.
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 text-sm leading-6 text-orange-950">
            O sistema foi estruturado para concentrar processos de compliance e operação dos postos de combustíveis
            em uma interface única, facilitando acompanhamento, rastreabilidade e organização da rotina administrativa.
          </div>
        </CardBase>
      </div>

      <footer className="px-1 pb-2 text-center text-xs text-zinc-500">
        {APP_NAME} © {currentYear} • Versão {APP_VERSION}
      </footer>
    </div>
  );
}
