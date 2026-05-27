import type { PrismaClient, TipoConteudo } from '@prisma/client';

const nr01Conteudos: Array<{
  ordem: number;
  titulo: string;
  tipo: TipoConteudo;
  conteudo: string;
}> = [
  {
    ordem: 1,
    titulo: 'Introdução às Normas Regulamentadoras',
    tipo: 'TEXTO_RICO',
    conteudo: `# O que são as NRs?
As Normas Regulamentadoras (NRs) são disposições obrigatórias de segurança e saúde no trabalho publicadas pelo Ministério do Trabalho.

Elas definem deveres para empresas e trabalhadores, estabelecem medidas de prevenção e organizam a gestão dos riscos ocupacionais.

No contexto dos postos da Rede Free, as NRs orientam desde integração do colaborador até o uso de EPIs, sinalização, manipulação de inflamáveis e prevenção de acidentes.

## Por que a NR-01 é importante?
A NR-01 é a norma geral que apresenta os princípios de gerenciamento de riscos ocupacionais, treinamento, capacitação e deveres básicos de empregadores e empregados.`,
  },
  {
    ordem: 2,
    titulo: 'PGR — Programa de Gerenciamento de Riscos',
    tipo: 'TEXTO_RICO',
    conteudo: `# O que é o PGR?
O Programa de Gerenciamento de Riscos (PGR) é o documento que organiza a gestão de riscos ocupacionais da empresa.

Ele reúne o inventário de riscos e o plano de ação com as medidas de prevenção, correção e monitoramento.

## Etapas do PGR
1. Levantamento dos perigos e riscos presentes na atividade.
2. Avaliação e classificação dos riscos ocupacionais.
3. Definição das medidas de prevenção.
4. Registro no inventário de riscos.
5. Planejamento e acompanhamento das ações preventivas.

O PGR deve refletir a realidade operacional do posto e ser mantido atualizado sempre que houver mudanças relevantes.`,
  },
  {
    ordem: 3,
    titulo: 'Vídeo: NR-01 na prática',
    tipo: 'VIDEO_YOUTUBE',
    conteudo: 'https://www.youtube.com/embed/VIDEO_ID_NR01_PGR',
  },
  {
    ordem: 4,
    titulo: 'Resumo e pontos importantes',
    tipo: 'TEXTO_RICO',
    conteudo: `# Pontos-chave para a prova
- Perigo é a fonte com potencial de causar dano.
- Risco é a combinação entre probabilidade e severidade do dano.
- O PGR é responsabilidade do empregador, com apoio técnico quando necessário.
- O inventário de riscos também pode ser chamado de levantamento dos GHO e demais exposições ocupacionais.
- O PCMSO complementa o PGR com foco na saúde ocupacional.
- O trabalhador tem direito à informação, treinamento e condições seguras de trabalho.

## Revisão
O PGR deve ser revisto sempre que houver alterações nos riscos, nos processos, ocorrência de acidentes ou necessidade de atualização das medidas preventivas.`,
  },
];

const nr01Questoes = [
  {
    ordem: 1,
    enunciado: 'O que são as Normas Regulamentadoras (NRs)?',
    alternativas: {
      A: 'Normas internas criadas por cada empresa para organizar escalas de trabalho.',
      B: 'Regras obrigatórias de segurança e saúde no trabalho emitidas pelo Ministério do Trabalho.',
      C: 'Guias opcionais voltados apenas para empresas do setor público.',
      D: 'Procedimentos contábeis para fiscalização tributária.',
    },
    gabarito: 'B',
  },
  {
    ordem: 2,
    enunciado: 'O que é o PGR?',
    alternativas: {
      A: 'Programa de Gerenciamento de Riscos ocupacionais da empresa.',
      B: 'Plano Geral de Resultados financeiros do posto.',
      C: 'Procedimento para emissão de folha de pagamento.',
      D: 'Plano de manutenção predial sem relação com segurança.',
    },
    gabarito: 'A',
  },
  {
    ordem: 3,
    enunciado: 'Quem é o principal responsável pela implementação e manutenção do PGR na empresa?',
    alternativas: {
      A: 'Somente o sindicato da categoria.',
      B: 'Apenas o colaborador recém-admitido.',
      C: 'O empregador, com apoio técnico quando necessário.',
      D: 'Exclusivamente o cliente do posto.',
    },
    gabarito: 'C',
  },
  {
    ordem: 4,
    enunciado: 'Qual alternativa apresenta etapas coerentes do PGR?',
    alternativas: {
      A: 'Inventário de riscos, plano de ação e acompanhamento das medidas.',
      B: 'Folha de ponto, cálculo de comissão e pagamento de bônus.',
      C: 'Compra de combustíveis, fechamento de caixa e auditoria fiscal.',
      D: 'Treinamento comercial, campanha de vendas e marketing.',
    },
    gabarito: 'A',
  },
  {
    ordem: 5,
    enunciado: 'No contexto da NR-01, o que representa o inventário de riscos ou GHO?',
    alternativas: {
      A: 'Cadastro de hóspedes em viagens corporativas.',
      B: 'Registro dos perigos, exposições e riscos ocupacionais identificados.',
      C: 'Relatório de metas comerciais do trimestre.',
      D: 'Arquivo de notas fiscais canceladas.',
    },
    gabarito: 'B',
  },
  {
    ordem: 6,
    enunciado: 'Qual é a diferença correta entre perigo e risco?',
    alternativas: {
      A: 'Perigo é a chance do dano; risco é a fonte do dano.',
      B: 'Perigo e risco têm exatamente o mesmo significado.',
      C: 'Perigo é a fonte com potencial de dano; risco envolve a probabilidade e a gravidade desse dano.',
      D: 'Perigo só existe em escritório e risco só existe em área operacional.',
    },
    gabarito: 'C',
  },
  {
    ordem: 7,
    enunciado: 'Quando o PGR deve ser revisado?',
    alternativas: {
      A: 'Somente a cada dez anos, independentemente de mudanças.',
      B: 'Apenas quando a fiscalização solicitar formalmente.',
      C: 'Sempre que houver mudanças nos riscos, processos, acidentes ou necessidade de atualização.',
      D: 'Somente quando trocar o gerente do posto.',
    },
    gabarito: 'C',
  },
  {
    ordem: 8,
    enunciado: 'O que é o PCMSO?',
    alternativas: {
      A: 'Programa de Controle Médico de Saúde Ocupacional.',
      B: 'Plano Comercial de Marketing e Segurança Operacional.',
      C: 'Procedimento de Caixa para Movimentação de Saídas Operacionais.',
      D: 'Programa de Compras de Materiais e Serviços Operacionais.',
    },
    gabarito: 'A',
  },
  {
    ordem: 9,
    enunciado: 'Qual direito do trabalhador está alinhado com a NR-01?',
    alternativas: {
      A: 'Receber informação e treinamento sobre riscos e medidas de prevenção.',
      B: 'Recusar qualquer atividade sem justificar o motivo.',
      C: 'Definir sozinho o conteúdo do PGR sem participação da empresa.',
      D: 'Substituir exames ocupacionais por declaração verbal.',
    },
    gabarito: 'A',
  },
  {
    ordem: 10,
    enunciado: 'Qual pode ser uma consequência do descumprimento das NRs pela empresa?',
    alternativas: {
      A: 'Apenas advertência verbal sem qualquer outra medida.',
      B: 'Isenção automática de responsabilidade em acidentes.',
      C: 'Multas, autuações e outras penalidades administrativas, além de aumento do risco de acidentes.',
      D: 'Redução obrigatória da jornada de todos os empregados.',
    },
    gabarito: 'C',
  },
] as const;

export async function seedNR01(db: PrismaClient) {
  const cursoExistente = await db.curso.findFirst({
    where: { nome: 'NR-01 — Integração e PGR' },
  });

  const curso = cursoExistente
    ? await db.curso.update({
        where: { id: cursoExistente.id },
        data: {
          descricao: 'Treinamento de integração, NR-01 e Programa de Gerenciamento de Riscos.',
          cargaHoraria: 8,
          validadeDias: 365,
          cargosObrigatorios: ['TODOS'],
          ativo: true,
        },
      })
    : await db.curso.create({
        data: {
          nome: 'NR-01 — Integração e PGR',
          descricao: 'Treinamento de integração, NR-01 e Programa de Gerenciamento de Riscos.',
          cargaHoraria: 8,
          validadeDias: 365,
          cargosObrigatorios: ['TODOS'],
          ativo: true,
        },
      });

  const conteudosExistentes = await db.cursoConteudo.findMany({
    where: { cursoId: curso.id },
    orderBy: { ordem: 'asc' },
  });

  for (const conteudo of nr01Conteudos) {
    const existente = conteudosExistentes.find((item) => item.ordem === conteudo.ordem);

    if (existente) {
      await db.cursoConteudo.update({
        where: { id: existente.id },
        data: {
          titulo: conteudo.titulo,
          tipo: conteudo.tipo,
          conteudo: conteudo.conteudo,
        },
      });
      continue;
    }

    await db.cursoConteudo.create({
      data: {
        cursoId: curso.id,
        ordem: conteudo.ordem,
        titulo: conteudo.titulo,
        tipo: conteudo.tipo,
        conteudo: conteudo.conteudo,
      },
    });
  }

  const questoesExistentes = await db.cursoQuestao.findMany({
    where: { cursoId: curso.id },
    orderBy: { ordem: 'asc' },
  });

  for (const questao of nr01Questoes) {
    const existente = questoesExistentes.find((item) => item.ordem === questao.ordem);

    if (existente) {
      await db.cursoQuestao.update({
        where: { id: existente.id },
        data: {
          enunciado: questao.enunciado,
          alternativas: questao.alternativas,
          gabarito: questao.gabarito,
        },
      });
      continue;
    }

    await db.cursoQuestao.create({
      data: {
        cursoId: curso.id,
        ordem: questao.ordem,
        enunciado: questao.enunciado,
        alternativas: questao.alternativas,
        gabarito: questao.gabarito,
      },
    });
  }

  console.log('✅ Conteúdo e prova da NR-01 inseridos/atualizados');
}
