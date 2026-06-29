import type { PrismaClient } from '@prisma/client';

import type { Afericao } from '@/domain/entities/afericao.entity';
import type {
  AfericaoRepository,
  ListarLotesAfericaoPorPostoOptions,
  ListarLotesAfericaoPorPostoResult,
  LoteAfericao,
} from '@/domain/ports/afericao.repository';
import { AfericaoMapper } from '@/infrastructure/database/mappers/afericao.mapper';
import { prisma } from '@/lib/prisma';

type AfericaoRow = {
  id: string;
  postoId: string;
  responsavelId: string;
  loteId: string | null;
  bicoId: string | null;
  produto: Afericao['produto'];
  bomba: number;
  numeroBico: number;
  medidaPadrao: number;
  resultadoMl: number;
  situacao: Afericao['situacao'];
  observacoes: string | null;
  fotoUrl: string | null;
  criadoEm: Date;
  responsavelNome?: string | null;
};

function mapAfericaoRows(rows: Array<AfericaoRow>, nomesPorResponsavel: Map<string, string>): Afericao[] {
  return rows.map((raw) => AfericaoMapper.toDomain({
    ...raw,
    responsavelNome: raw.responsavelNome ?? nomesPorResponsavel.get(raw.responsavelId) ?? null,
  }));
}

function agruparLotes(
  loteIds: string[],
  afericoes: Afericao[],
  createdAtPorLote: Map<string, Date>,
): LoteAfericao[] {
  const agrupadas = new Map<string, Afericao[]>();

  for (const afericao of afericoes) {
    if (!afericao.loteId) {
      continue;
    }

    const loteAtual = agrupadas.get(afericao.loteId) ?? [];
    loteAtual.push(afericao);
    agrupadas.set(afericao.loteId, loteAtual);
  }

  return loteIds.flatMap((loteId) => {
    const afericoesDoLote = agrupadas.get(loteId);

    if (!afericoesDoLote || afericoesDoLote.length === 0) {
      return [];
    }

    const [afericaoMaisRecente] = afericoesDoLote;

    return [{
      loteId,
      criadoEm: createdAtPorLote.get(loteId) ?? afericaoMaisRecente.criadoEm,
      responsavelId: afericaoMaisRecente.responsavelId,
      responsavelNome: afericaoMaisRecente.responsavelNome,
      afericoes: afericoesDoLote,
    }];
  });
}

export class AfericaoPrismaRepository implements AfericaoRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async salvar(afericao: Afericao): Promise<void> {
    await this.db.afericao.upsert({
      where: { id: afericao.id },
      create: AfericaoMapper.toPrismaCreate(afericao),
      update: AfericaoMapper.toPrismaUpdate(afericao),
    });
  }

  async buscarPorId(id: string): Promise<Afericao | null> {
    const raw = await this.db.afericao.findUnique({
      where: { id },
      select: {
        id: true,
        postoId: true,
        responsavelId: true,
        loteId: true,
        bicoId: true,
        produto: true,
        bomba: true,
        numeroBico: true,
        medidaPadrao: true,
        resultadoMl: true,
        situacao: true,
        observacoes: true,
        fotoUrl: true,
        criadoEm: true,
      },
    });
    if (!raw) return null;

    const responsavel = await this.db.user.findUnique({
      where: { id: raw.responsavelId },
      select: { nome: true },
    });

    return AfericaoMapper.toDomain({
      ...raw,
      responsavelNome: responsavel?.nome ?? null,
    });
  }

  async listarPorPosto(postoId: string): Promise<Afericao[]> {
    const raws = await this.db.afericao.findMany({
      where: { postoId },
      select: {
        id: true,
        postoId: true,
        responsavelId: true,
        loteId: true,
        bicoId: true,
        produto: true,
        bomba: true,
        numeroBico: true,
        medidaPadrao: true,
        resultadoMl: true,
        situacao: true,
        observacoes: true,
        fotoUrl: true,
        criadoEm: true,
      },
      orderBy: { criadoEm: 'desc' },
    });

    const nomesPorResponsavel = await this.buscarNomesResponsaveis(raws);
    return mapAfericaoRows(raws, nomesPorResponsavel);
  }

  async listarPorBomba(postoId: string, bomba: number): Promise<Afericao[]> {
    const raws = await this.db.afericao.findMany({
      where: { postoId, bomba },
      select: {
        id: true,
        postoId: true,
        responsavelId: true,
        loteId: true,
        bicoId: true,
        produto: true,
        bomba: true,
        numeroBico: true,
        medidaPadrao: true,
        resultadoMl: true,
        situacao: true,
        observacoes: true,
        fotoUrl: true,
        criadoEm: true,
      },
      orderBy: { criadoEm: 'desc' },
    });

    const nomesPorResponsavel = await this.buscarNomesResponsaveis(raws);
    return mapAfericaoRows(raws, nomesPorResponsavel);
  }

  async listarLotesPorPosto(
    postoId: string,
    opcoes: ListarLotesAfericaoPorPostoOptions,
  ): Promise<ListarLotesAfericaoPorPostoResult> {
    const where = {
      postoId,
      loteId: { not: null },
      ...(opcoes.bomba !== undefined ? { bomba: opcoes.bomba } : {}),
    };

    const gruposPaginados = await this.db.afericao.groupBy({
      by: ['loteId'],
      where,
      _max: { criadoEm: true },
      orderBy: { _max: { criadoEm: 'desc' } },
      skip: opcoes.offset,
      take: opcoes.limite,
    });

    const totalGrupos = await this.db.afericao.groupBy({
      by: ['loteId'],
      where,
    });

    const loteIds = gruposPaginados
      .map((grupo) => grupo.loteId)
      .filter((loteId): loteId is string => loteId !== null);

    if (loteIds.length === 0) {
      return {
        itens: [],
        total: totalGrupos.length,
      };
    }

    const raws = await this.db.afericao.findMany({
      where: {
        postoId,
        loteId: { in: loteIds },
        ...(opcoes.bomba !== undefined ? { bomba: opcoes.bomba } : {}),
      },
      select: {
        id: true,
        postoId: true,
        responsavelId: true,
        loteId: true,
        bicoId: true,
        produto: true,
        bomba: true,
        numeroBico: true,
        medidaPadrao: true,
        resultadoMl: true,
        situacao: true,
        observacoes: true,
        fotoUrl: true,
        criadoEm: true,
      },
      orderBy: [
        { criadoEm: 'desc' },
        { bomba: 'asc' },
        { numeroBico: 'asc' },
      ],
    });

    const nomesPorResponsavel = await this.buscarNomesResponsaveis(raws);
    const afericoes = mapAfericaoRows(raws, nomesPorResponsavel);
    const createdAtPorLote = new Map(
      gruposPaginados.flatMap((grupo) => grupo.loteId && grupo._max.criadoEm
        ? [[grupo.loteId, grupo._max.criadoEm] as const]
        : []),
    );

    return {
      itens: agruparLotes(loteIds, afericoes, createdAtPorLote),
      total: totalGrupos.length,
    };
  }

  async listarPorLote(loteId: string): Promise<Afericao[]> {
    const raws = await this.db.afericao.findMany({
      where: { loteId },
      select: {
        id: true,
        postoId: true,
        responsavelId: true,
        loteId: true,
        bicoId: true,
        produto: true,
        bomba: true,
        numeroBico: true,
        medidaPadrao: true,
        resultadoMl: true,
        situacao: true,
        observacoes: true,
        fotoUrl: true,
        criadoEm: true,
      },
      orderBy: [
        { bomba: 'asc' },
        { numeroBico: 'asc' },
        { criadoEm: 'asc' },
      ],
    });

    const nomesPorResponsavel = await this.buscarNomesResponsaveis(raws);
    return mapAfericaoRows(raws, nomesPorResponsavel);
  }

  async deletar(id: string): Promise<void> {
    await this.db.afericao.delete({
      where: { id },
    });
  }

  async deletarLote(loteId: string): Promise<void> {
    await this.db.afericao.deleteMany({
      where: { loteId },
    });
  }

  async contarForaDaTolerancia(): Promise<number> {
    return this.db.afericao.count({
      where: { situacao: 'FORA_DA_TOLERANCIA' },
    });
  }

  private async buscarNomesResponsaveis(rows: Array<{ responsavelId: string }>): Promise<Map<string, string>> {
    const responsavelIds = [...new Set(rows.map((row) => row.responsavelId))];
    if (responsavelIds.length === 0) {
      return new Map<string, string>();
    }

    const responsaveis = await this.db.user.findMany({
      where: { id: { in: responsavelIds } },
      select: { id: true, nome: true },
    });

    return new Map(responsaveis.map((user) => [user.id, user.nome]));
  }
}
