import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidade | FREE SAFE',
  description: 'Política de Privacidade do FREE SAFE em conformidade com diretrizes gerais da LGPD.',
};

const secoes = [
  {
    id: 'introducao',
    titulo: 'Introdução',
    conteudo: [
      'O FREE SAFE é uma plataforma voltada à gestão de compliance, qualidade, treinamentos e rotinas operacionais de postos da Rede Free. Esta Política de Privacidade descreve, de forma objetiva, como tratamos dados pessoais e registros operacionais utilizados no sistema.',
      'Nosso compromisso é tratar essas informações com finalidade legítima, acesso restrito e medidas compatíveis com a natureza dos dados processados.',
    ],
  },
  {
    id: 'dados-coletados',
    titulo: 'Dados que coletamos',
    conteudo: [
      'Podemos tratar dados de usuários do sistema, como nome, e-mail, perfil de acesso e vínculo com o posto, para autenticação, autorização e operação da plataforma.',
      'Também podemos tratar dados de colaboradores, como nome, CPF, RG, foto, contatos, cargo, status, informações funcionais, treinamentos, entrevistas e demais dados necessários à gestão interna.',
      'Além disso, o sistema pode armazenar documentos, registros operacionais dos postos, relatórios, certificados, anexos e evidências relacionadas às rotinas de compliance e fiscalização.',
    ],
  },
  {
    id: 'finalidade',
    titulo: 'Finalidade do tratamento',
    conteudo: [
      'Utilizamos os dados para gestão de compliance, controle operacional, organização de documentos, acompanhamento de treinamentos, emissão de relatórios, certificados e registros exigidos pelas operações dos postos.',
      'As informações também podem ser usadas para controle de acesso, rastreabilidade de ações no sistema e suporte à tomada de decisão administrativa.',
    ],
  },
  {
    id: 'base-legal',
    titulo: 'Base legal',
    conteudo: [
      'O tratamento de dados no FREE SAFE pode se apoiar, conforme o caso, no cumprimento de obrigações legais e regulatórias aplicáveis às operações dos postos e no legítimo interesse para organização, segurança e continuidade das atividades empresariais.',
    ],
  },
  {
    id: 'compartilhamento',
    titulo: 'Compartilhamento',
    conteudo: [
      'Os dados tratados no FREE SAFE não são vendidos. O acesso e eventual compartilhamento são restritos ao necessário para a operação da plataforma, administração interna, cumprimento de obrigações e suporte tecnológico relacionado ao serviço.',
    ],
  },
  {
    id: 'seguranca',
    titulo: 'Segurança',
    conteudo: [
      'Adotamos medidas técnicas e organizacionais para reduzir riscos, incluindo armazenamento de senhas com hash, controle de acesso por perfil, registro de auditoria e limitação de acesso conforme a função de cada usuário.',
      'Nenhum ambiente é absolutamente imune a incidentes, mas buscamos manter controles proporcionais à sensibilidade dos dados tratados pelo sistema.',
    ],
  },
  {
    id: 'direitos',
    titulo: 'Direitos do titular',
    conteudo: [
      'Nos termos da LGPD, o titular pode solicitar acesso aos seus dados pessoais, correção de informações incompletas ou desatualizadas e, quando cabível, anonimização, bloqueio ou exclusão.',
      'O titular também pode solicitar a anonimização dos seus dados pessoais, observadas as limitações legais, regulatórias e operacionais aplicáveis à retenção das informações.',
    ],
  },
  {
    id: 'retencao',
    titulo: 'Retenção',
    conteudo: [
      'Os dados são mantidos pelo tempo necessário para cumprir as finalidades descritas nesta política e para atender obrigações legais, regulatórias, contratuais e de auditoria, com revisão periódica da necessidade de retenção.',
    ],
  },
  {
    id: 'contato',
    titulo: 'Contato do encarregado (DPO)',
    conteudo: [
      'Solicitações relacionadas à privacidade e proteção de dados podem ser encaminhadas para o encarregado pelo tratamento de dados no endereço: [email de contato].',
    ],
  },
];

export default function PoliticaPrivacidadePage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-800">
      <div className="border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-lg font-black text-white">
              F
            </div>
            <div>
              <p className="text-sm font-black tracking-[0.24em] text-zinc-950">FREE SAFE</p>
              <p className="text-xs text-zinc-500">Política de Privacidade</p>
            </div>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-orange-200 hover:text-orange-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Acessar plataforma
          </Link>
        </div>
      </div>

      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <div className="rounded-3xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-950 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
            <p className="font-medium">
              Este documento é um modelo base e deve ser revisado por um profissional jurídico antes do uso em
              produção com dados reais.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="border-b border-zinc-200 pb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                LGPD
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
                Política de Privacidade
              </h1>
              <p className="mt-4 text-base leading-8 text-zinc-600">
                Esta política resume como o FREE SAFE trata dados pessoais e informações operacionais dentro do
                contexto de gestão da Rede Free.
              </p>
            </div>

            <div className="space-y-10 pt-8">
              {secoes.map((secao) => (
                <section key={secao.id} aria-labelledby={secao.id} className="space-y-4">
                  <h2 id={secao.id} className="text-2xl font-bold tracking-tight text-zinc-950">
                    {secao.titulo}
                  </h2>
                  <div className="space-y-4 text-base leading-8 text-zinc-700">
                    {secao.conteudo.map((paragrafo) => (
                      <p key={paragrafo}>{paragrafo}</p>
                    ))}
                  </div>
                </section>
              ))}

              <section aria-labelledby="ultima-atualizacao" className="space-y-4 border-t border-zinc-200 pt-8">
                <h2 id="ultima-atualizacao" className="text-2xl font-bold tracking-tight text-zinc-950">
                  Data de última atualização
                </h2>
                <p className="text-base leading-8 text-zinc-700">28 de junho de 2026.</p>
              </section>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>FREE SAFE © 2026</p>
          <p className="font-medium text-orange-700">
            Este documento é um modelo base e deve ser revisado por um profissional jurídico antes do uso em
            produção com dados reais.
          </p>
        </div>
      </footer>
    </main>
  );
}
