import type { PrismaClient } from '@prisma/client';

export async function seedCursos(db: PrismaClient) {
  const cursos = [
    { nome: 'NR-01 — Integração e PGR', descricao: 'Treinamento de integração e PGR.', cargaHoraria: 8, validadeDias: 365, cargosObrigatorios: ['TODOS'], ativo: true },
    { nome: 'NR-06 — EPI', descricao: 'Uso correto de EPIs.', cargaHoraria: 4, validadeDias: 365, cargosObrigatorios: ['TODOS'], ativo: true },
    { nome: 'NR-09 — Agentes químicos', descricao: 'Exposição a agentes químicos, conforme PGR.', cargaHoraria: 8, validadeDias: null, cargosObrigatorios: ['FRENTISTA', 'GERENTE'], ativo: true },
    { nome: 'NR-09/Benzeno — Exposição ao Benzeno', descricao: 'Prevenção da exposição ocupacional ao benzeno em postos de combustíveis.', cargaHoraria: 4, validadeDias: 365, cargosObrigatorios: ['FRENTISTA', 'GERENTE', 'MANUTENCAO'], ativo: true },
    { nome: 'NR-17 — Ergonomia', descricao: 'Boas práticas ergonômicas.', cargaHoraria: 4, validadeDias: 365, cargosObrigatorios: ['TODOS'], ativo: true },
    { nome: 'NR-20 — Inflamáveis e combustíveis', descricao: 'Segurança com inflamáveis.', cargaHoraria: 16, validadeDias: 365, cargosObrigatorios: ['FRENTISTA', 'GERENTE', 'MANUTENCAO'], ativo: true },
    { nome: 'NR-23 — Prevenção e combate a incêndio', descricao: 'Combate a incêndios.', cargaHoraria: 8, validadeDias: 365, cargosObrigatorios: ['TODOS'], ativo: true },
    { nome: 'NR-26 — Sinalização de segurança', descricao: 'Sinalização de riscos.', cargaHoraria: 4, validadeDias: 365, cargosObrigatorios: ['TODOS'], ativo: true },
    { nome: 'NR-35 — Trabalho em Altura', descricao: 'Segurança para planejamento e execução de atividades em altura.', cargaHoraria: 8, validadeDias: 730, cargosObrigatorios: ['MANUTENCAO', 'GERENTE'], ativo: true },
    { nome: 'Educação financeira', descricao: 'Organização financeira pessoal.', cargaHoraria: 2, validadeDias: null, cargosObrigatorios: ['TODOS'], ativo: true },
    { nome: 'Atendimento ao cliente', descricao: 'Excelência no atendimento.', cargaHoraria: 4, validadeDias: null, cargosObrigatorios: ['TODOS'], ativo: true },
    { nome: 'Operação de caixa', descricao: 'Rotinas de caixa.', cargaHoraria: 4, validadeDias: null, cargosObrigatorios: ['CAIXA'], ativo: true },
    { nome: 'PROCON básico', descricao: 'Direitos do consumidor.', cargaHoraria: 4, validadeDias: 365, cargosObrigatorios: ['TODOS'], ativo: true },
    { nome: 'ANP básico', descricao: 'Regras da ANP.', cargaHoraria: 4, validadeDias: 365, cargosObrigatorios: ['FRENTISTA', 'GERENTE'], ativo: true },
    { nome: 'INMETRO/IPEM básico', descricao: 'Metrologia legal.', cargaHoraria: 4, validadeDias: 365, cargosObrigatorios: ['FRENTISTA', 'GERENTE'], ativo: true },
    { nome: 'Abastecimento seguro', descricao: 'Procedimentos de abastecimento.', cargaHoraria: 8, validadeDias: 365, cargosObrigatorios: ['FRENTISTA'], ativo: true },
    { nome: 'Gestão de equipe', descricao: 'Liderança e gestão.', cargaHoraria: 8, validadeDias: null, cargosObrigatorios: ['GERENTE'], ativo: true },
  ];

  for (const curso of cursos) {
    const existente = await db.curso.findFirst({
      where: { nome: curso.nome },
    });

    if (existente) {
      await db.curso.update({
        where: { id: existente.id },
        data: curso,
      });
      continue;
    }

    await db.curso.create({
      data: curso,
    });
  }

  console.log(`✅ ${cursos.length} cursos inseridos/atualizados`);
}
