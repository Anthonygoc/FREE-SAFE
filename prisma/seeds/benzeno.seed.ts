import type { PrismaClient, TipoConteudo } from '@prisma/client';

const benzenoConteudos: Array<{
  ordem: number;
  titulo: string;
  tipo: TipoConteudo;
  conteudo: string;
}> = [
  {
    ordem: 1,
    titulo: 'O que é o benzeno e seus riscos à saúde',
    tipo: 'TEXTO_RICO',
    conteudo: `# O que é o benzeno?
O benzeno é um hidrocarboneto aromático presente em derivados de petróleo, incluindo a gasolina. Trata-se de uma substância tóxica e reconhecidamente cancerígena para humanos.

## Onde pode haver exposição?
Em postos de combustíveis, a exposição pode ocorrer durante abastecimento, descarga de combustíveis, medição de tanques, coleta de amostras, manutenção e contato com vapores em ambientes mal ventilados.

## Riscos à saúde
A exposição ao benzeno pode causar efeitos agudos, como tontura, dor de cabeça, sonolência, irritação da pele e das mucosas.

Em exposições repetidas ou prolongadas, pode afetar a medula óssea e aumentar o risco de doenças hematológicas graves, incluindo leucemia.

## Princípio preventivo
Por ser agente cancerígeno, a exposição deve ser reduzida ao menor nível possível, com prioridade para medidas de controle coletivo, organizacional e procedimentos seguros.`,
  },
  {
    ordem: 2,
    titulo: 'PPEOB e medidas de controle',
    tipo: 'TEXTO_RICO',
    conteudo: `# O que é o PPEOB?
O PPEOB é o Programa de Prevenção da Exposição Ocupacional ao Benzeno. Ele organiza ações para reconhecer fontes de exposição, avaliar riscos, definir controles e acompanhar a saúde dos trabalhadores expostos.

## Medidas de controle
- Priorizar sistemas fechados e redução da liberação de vapores.
- Manter bombas, mangueiras, conexões e respiros em boas condições.
- Evitar contato direto com combustíveis.
- Proibir práticas inseguras, como sifonagem com a boca e uso de panos encharcados junto ao corpo.
- Higienizar as mãos antes de comer, beber ou fumar.

## Conduta segura
Em caso de derramamento, o trabalhador deve seguir o procedimento da empresa, isolar a área e utilizar os equipamentos adequados.

O uso de EPI não substitui medidas de controle coletivo, mas complementa a proteção quando houver risco residual.`,
  },
  {
    ordem: 3,
    titulo: 'Benzeno na prática',
    tipo: 'VIDEO_YOUTUBE',
    conteudo: 'https://www.youtube.com/embed/PLACEHOLDER_BENZENO',
  },
  {
    ordem: 4,
    titulo: 'Resumo e boas práticas',
    tipo: 'TEXTO_RICO',
    conteudo: `# Resumo
- O benzeno está presente na gasolina e é agente cancerígeno.
- A exposição ocupacional deve ser mantida no menor nível possível.
- O PPEOB organiza prevenção, monitoramento e controle da exposição.
- Vapores, respingos e contato frequente com combustíveis representam risco.
- Nunca use a boca para sifonar combustíveis.
- Não utilize panos contaminados junto ao corpo ou nos bolsos.
- Lave as mãos antes das refeições e após atividades com combustíveis.
- Derramamentos devem ser tratados conforme procedimento e com isolamento da área.
- EPI complementa, mas não substitui, as medidas de proteção coletiva.

## Boas práticas
Manter equipamentos em bom estado, evitar inalação desnecessária de vapores, comunicar vazamentos rapidamente e seguir procedimentos operacionais são atitudes essenciais para reduzir a exposição ao benzeno.`,
  },
];

const benzenoQuestoes = [
  {
    ordem: 1,
    enunciado: 'O benzeno é uma substância presente em qual produto comum no posto de combustíveis?',
    alternativas: {
      A: 'Água potável.',
      B: 'Gasolina.',
      C: 'Lubrificante sólido.',
      D: 'Concreto.',
    },
    gabarito: 'B',
  },
  {
    ordem: 2,
    enunciado: 'Qual afirmação sobre o benzeno está correta?',
    alternativas: {
      A: 'É uma substância sem toxicidade conhecida.',
      B: 'Só oferece risco quando ingerido em grandes quantidades.',
      C: 'É um agente cancerígeno e sua exposição deve ser minimizada.',
      D: 'Pode ser manipulado livremente sem procedimentos preventivos.',
    },
    gabarito: 'C',
  },
  {
    ordem: 3,
    enunciado: 'O que significa PPEOB?',
    alternativas: {
      A: 'Plano Preventivo de Equipamentos e Operações de Bombeamento.',
      B: 'Programa de Prevenção da Exposição Ocupacional ao Benzeno.',
      C: 'Procedimento Padrão de Estoque Operacional de Borracha.',
      D: 'Programa de Proteção Elétrica de Operadores de Bombas.',
    },
    gabarito: 'B',
  },
  {
    ordem: 4,
    enunciado: 'Qual é uma via comum de exposição ocupacional ao benzeno em postos?',
    alternativas: {
      A: 'Contato com vapores e respingos de combustíveis.',
      B: 'Uso de cadeira ergonômica.',
      C: 'Assinatura de relatórios administrativos.',
      D: 'Iluminação do escritório.',
    },
    gabarito: 'A',
  },
  {
    ordem: 5,
    enunciado: 'Qual prática é proibida por representar risco grave de exposição ao benzeno?',
    alternativas: {
      A: 'Usar uniforme limpo.',
      B: 'Conferir o bico antes do abastecimento.',
      C: 'Sifonar combustível com a boca.',
      D: 'Higienizar as mãos após o trabalho.',
    },
    gabarito: 'C',
  },
  {
    ordem: 6,
    enunciado: 'Qual medida ajuda a reduzir a exposição ocupacional ao benzeno?',
    alternativas: {
      A: 'Ignorar pequenos vazamentos por pouco tempo.',
      B: 'Manter bombas e conexões em boas condições de funcionamento.',
      C: 'Guardar panos com combustível no bolso do uniforme.',
      D: 'Remover a sinalização para agilizar o serviço.',
    },
    gabarito: 'B',
  },
  {
    ordem: 7,
    enunciado: 'O EPI, no contexto da prevenção ao benzeno, deve ser entendido como:',
    alternativas: {
      A: 'Substituto completo das medidas coletivas.',
      B: 'Medida complementar às demais ações de controle.',
      C: 'Item opcional sem necessidade de treinamento.',
      D: 'Único controle exigido para qualquer atividade.',
    },
    gabarito: 'B',
  },
  {
    ordem: 8,
    enunciado: 'Qual problema de saúde pode estar associado à exposição crônica ao benzeno?',
    alternativas: {
      A: 'Melhora da capacidade respiratória.',
      B: 'Aumento da resistência física.',
      C: 'Doenças hematológicas, incluindo leucemia.',
      D: 'Fortalecimento da medula óssea.',
    },
    gabarito: 'C',
  },
  {
    ordem: 9,
    enunciado: 'Ao ocorrer derramamento de combustível, a conduta adequada é:',
    alternativas: {
      A: 'Ignorar se a quantidade for pequena.',
      B: 'Seguir o procedimento, isolar a área e adotar as medidas de controle.',
      C: 'Cobrir com papel e continuar o atendimento.',
      D: 'Lavar imediatamente sem avaliar o risco.',
    },
    gabarito: 'B',
  },
  {
    ordem: 10,
    enunciado: 'Qual hábito é recomendado após atividades com potencial contato com combustíveis?',
    alternativas: {
      A: 'Comer imediatamente na pista.',
      B: 'Lavar as mãos antes de comer, beber ou fumar.',
      C: 'Secar as mãos em pano contaminado.',
      D: 'Guardar luvas usadas dentro do bolso do uniforme.',
    },
    gabarito: 'B',
  },
] as const;

export async function seedBenzeno(db: PrismaClient) {
  const cursoExistente = await db.curso.findFirst({
    where: { nome: 'NR-09/Benzeno — Exposição ao Benzeno' },
  });

  const curso = cursoExistente
    ? await db.curso.update({
        where: { id: cursoExistente.id },
        data: {
          descricao: 'Treinamento sobre prevenção da exposição ocupacional ao benzeno em postos de combustíveis.',
          cargaHoraria: 4,
          validadeDias: 365,
          cargosObrigatorios: ['FRENTISTA', 'GERENTE', 'MANUTENCAO'],
          ativo: true,
        },
      })
    : await db.curso.create({
        data: {
          nome: 'NR-09/Benzeno — Exposição ao Benzeno',
          descricao: 'Treinamento sobre prevenção da exposição ocupacional ao benzeno em postos de combustíveis.',
          cargaHoraria: 4,
          validadeDias: 365,
          cargosObrigatorios: ['FRENTISTA', 'GERENTE', 'MANUTENCAO'],
          ativo: true,
        },
      });

  const conteudosExistentes = await db.cursoConteudo.findMany({
    where: { cursoId: curso.id },
    orderBy: { ordem: 'asc' },
  });

  for (const conteudo of benzenoConteudos) {
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

  for (const questao of benzenoQuestoes) {
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

  console.log('✅ Conteúdo e prova de Benzeno inseridos/atualizados');
}
