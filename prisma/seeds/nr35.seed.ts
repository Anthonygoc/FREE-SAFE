import type { PrismaClient, TipoConteudo } from '@prisma/client';

const nr35Conteudos: Array<{
  ordem: number;
  titulo: string;
  tipo: TipoConteudo;
  conteudo: string;
}> = [
  {
    ordem: 1,
    titulo: 'O que é a NR-35 e quando se aplica',
    tipo: 'TEXTO_RICO',
    conteudo: `# O que é a NR-35?
A NR-35 estabelece os requisitos mínimos e as medidas de proteção para o trabalho em altura, envolvendo planejamento, organização e execução segura das atividades.

## Quando ela se aplica?
A norma se aplica sempre que houver atividade executada acima de 2 metros do nível inferior, com risco de queda.

Isso inclui manutenção em telhados, acesso a estruturas elevadas, limpeza de caixas d'água, inspeções em coberturas, troca de luminárias e serviços em plataformas ou escadas quando houver risco real de queda.

## Responsabilidades
O empregador deve garantir análise de risco, procedimentos operacionais, supervisão, capacitação, equipamentos adequados e condições seguras de trabalho.

O trabalhador deve cumprir as orientações recebidas, usar corretamente os EPIs, interromper a atividade em caso de risco grave e comunicar situações inseguras.

## Análise de risco e permissão de trabalho
Antes da execução, a atividade deve ser planejada com análise de risco, identificando perigos como queda, choque elétrico, ruptura de cobertura, intempéries, objetos que possam cair e falhas de ancoragem.

Em situações não rotineiras ou críticas, pode ser exigida Permissão de Trabalho, formalizando condições, responsáveis, medidas de controle e período de validade da tarefa.`,
  },
  {
    ordem: 2,
    titulo: 'Equipamentos de Proteção e Sistemas de Ancoragem',
    tipo: 'TEXTO_RICO',
    conteudo: `# Proteção individual e coletiva
No trabalho em altura, a proteção deve priorizar medidas coletivas e, quando necessário, ser complementada com Equipamentos de Proteção Individual.

## EPIs mais comuns
- Cinturão de segurança tipo paraquedista.
- Talabarte simples ou em Y, com absorvedor de energia quando aplicável.
- Trava-quedas para deslocamento vertical ou horizontal.
- Capacete com jugular.
- Calçado de segurança adequado à atividade.

## Sistemas de ancoragem
Os pontos de ancoragem devem ser resistentes, compatíveis com o sistema utilizado e inspecionados antes do uso.

Não se deve improvisar ancoragens em estruturas sem avaliação técnica. O sistema precisa considerar resistência, posição, fator de queda e possibilidade de efeito pêndulo.

## Inspeção e conservação
Antes de cada uso, o trabalhador deve verificar costuras, mosquetões, conectores, fitas, absorvedores e sinais de desgaste. Equipamentos danificados, vencidos ou sem identificação não devem ser utilizados.`,
  },
  {
    ordem: 3,
    titulo: 'NR-35 na prática',
    tipo: 'VIDEO_YOUTUBE',
    conteudo: 'https://www.youtube.com/embed/PLACEHOLDER_NR35',
  },
  {
    ordem: 4,
    titulo: 'Resumo e pontos-chave para a prova',
    tipo: 'TEXTO_RICO',
    conteudo: `# Resumo
- A NR-35 se aplica a trabalho em altura acima de 2 metros com risco de queda.
- Toda atividade deve ser planejada, organizada e executada por trabalhador capacitado e autorizado.
- A análise de risco deve considerar ambiente, tarefa, sistemas de acesso, ancoragem, clima e interferências.
- A Permissão de Trabalho é usada quando a atividade exigir controle formal adicional.
- O cinturão tipo paraquedista é o EPI básico para retenção de queda.
- Talabarte e trava-quedas precisam ser compatíveis com o sistema de ancoragem.
- Pontos de ancoragem não podem ser improvisados sem avaliação técnica.
- Equipamentos devem ser inspecionados antes do uso.
- Em risco grave e iminente, a atividade deve ser interrompida.

## Boas práticas
Nunca execute trabalho em altura sem planejamento, sem isolamento da área abaixo e sem verificar se o sistema de proteção está completo e em condições adequadas.`,
  },
];

const nr35Questoes = [
  {
    ordem: 1,
    enunciado: 'Quando a NR-35 se aplica?',
    alternativas: {
      A: 'Somente em atividades realizadas em andaimes acima de 5 metros.',
      B: 'Sempre que houver atividade acima de 2 metros do nível inferior com risco de queda.',
      C: 'Apenas em construções civis de grande porte.',
      D: 'Somente em serviços com uso de guindaste.',
    },
    gabarito: 'B',
  },
  {
    ordem: 2,
    enunciado: 'Qual é um dos objetivos centrais da NR-35?',
    alternativas: {
      A: 'Regular a venda de equipamentos de segurança.',
      B: 'Definir metas comerciais para serviços externos.',
      C: 'Estabelecer requisitos mínimos para trabalho em altura com segurança.',
      D: 'Substituir o uso de EPIs por treinamento verbal.',
    },
    gabarito: 'C',
  },
  {
    ordem: 3,
    enunciado: 'Antes da execução de um trabalho em altura, o que deve ser realizado?',
    alternativas: {
      A: 'Somente a entrega do uniforme.',
      B: 'Análise de risco e planejamento da atividade.',
      C: 'Apenas assinatura do colaborador em folha de presença.',
      D: 'Somente comunicação verbal entre colegas.',
    },
    gabarito: 'B',
  },
  {
    ordem: 4,
    enunciado: 'Qual equipamento é indicado para retenção de queda no trabalho em altura?',
    alternativas: {
      A: 'Cinturão abdominal simples.',
      B: 'Colete refletivo.',
      C: 'Cinturão de segurança tipo paraquedista.',
      D: 'Avental impermeável.',
    },
    gabarito: 'C',
  },
  {
    ordem: 5,
    enunciado: 'O que deve ser observado em um ponto de ancoragem?',
    alternativas: {
      A: 'Apenas se está próximo do trabalhador.',
      B: 'Se foi pintado recentemente.',
      C: 'Se suporta adequadamente a carga e é compatível com o sistema adotado.',
      D: 'Somente se permite prender dois talabartes ao mesmo tempo.',
    },
    gabarito: 'C',
  },
  {
    ordem: 6,
    enunciado: 'Qual é a conduta correta diante de um equipamento com desgaste ou dano?',
    alternativas: {
      A: 'Continuar usando até a próxima inspeção formal.',
      B: 'Improvisar um reparo e seguir a atividade.',
      C: 'Separar o equipamento e impedir seu uso.',
      D: 'Usar apenas em tarefas rápidas.',
    },
    gabarito: 'C',
  },
  {
    ordem: 7,
    enunciado: 'A Permissão de Trabalho no contexto da NR-35 serve para:',
    alternativas: {
      A: 'Autorizar férias do trabalhador após serviço em altura.',
      B: 'Formalizar controles e condições para atividades não rotineiras ou críticas.',
      C: 'Substituir a análise de risco.',
      D: 'Registrar apenas o horário de início do serviço.',
    },
    gabarito: 'B',
  },
  {
    ordem: 8,
    enunciado: 'Quem pode executar trabalho em altura?',
    alternativas: {
      A: 'Qualquer trabalhador, mesmo sem orientação, desde que aceite o risco.',
      B: 'Somente o gerente do posto.',
      C: 'Trabalhador capacitado, autorizado e em condições de saúde compatíveis.',
      D: 'Apenas prestadores de serviço externos.',
    },
    gabarito: 'C',
  },
  {
    ordem: 9,
    enunciado: 'Qual situação representa risco adicional que deve ser considerada no planejamento?',
    alternativas: {
      A: 'Clima adverso, como chuva e vento forte.',
      B: 'Somente a cor do uniforme da equipe.',
      C: 'A quantidade de clientes no caixa.',
      D: 'A marca do veículo estacionado próximo.',
    },
    gabarito: 'A',
  },
  {
    ordem: 10,
    enunciado: 'Se o trabalhador identificar risco grave e iminente durante a atividade em altura, ele deve:',
    alternativas: {
      A: 'Prosseguir e informar depois.',
      B: 'Interromper a atividade e comunicar a situação.',
      C: 'Remover o talabarte para ganhar mobilidade.',
      D: 'Continuar somente se estiver acompanhado.',
    },
    gabarito: 'B',
  },
] as const;

export async function seedNR35(db: PrismaClient) {
  const cursoExistente = await db.curso.findFirst({
    where: { nome: 'NR-35 — Trabalho em Altura' },
  });

  const curso = cursoExistente
    ? await db.curso.update({
        where: { id: cursoExistente.id },
        data: {
          descricao: 'Treinamento de segurança para planejamento e execução de trabalho em altura.',
          cargaHoraria: 8,
          validadeDias: 730,
          cargosObrigatorios: ['MANUTENCAO', 'GERENTE'],
          ativo: true,
        },
      })
    : await db.curso.create({
        data: {
          nome: 'NR-35 — Trabalho em Altura',
          descricao: 'Treinamento de segurança para planejamento e execução de trabalho em altura.',
          cargaHoraria: 8,
          validadeDias: 730,
          cargosObrigatorios: ['MANUTENCAO', 'GERENTE'],
          ativo: true,
        },
      });

  const conteudosExistentes = await db.cursoConteudo.findMany({
    where: { cursoId: curso.id },
    orderBy: { ordem: 'asc' },
  });

  for (const conteudo of nr35Conteudos) {
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

  for (const questao of nr35Questoes) {
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

  console.log('✅ Conteúdo e prova da NR-35 inseridos/atualizados');
}
