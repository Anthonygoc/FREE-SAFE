import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { SituacaoAfericao } from '@/domain/entities/afericao.entity';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';
import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';

const LIMITE_POR_PAGINA = 10;

export interface ListHistoricoAfericoesByPostoInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  bomba?: number;
  pagina?: number;
}

export interface ListHistoricoAfericoesByPostoOutputItemAfericao {
  id: string;
  postoId: string;
  responsavelId: string;
  responsavelNome?: string;
  loteId?: string;
  bicoId?: string;
  produto: ProdutoCombustivel;
  bomba: number;
  bico: number;
  medidaPadrao: number;
  resultadoMl: number;
  situacao: SituacaoAfericao;
  observacoes?: string;
  fotoUrl?: string;
  criadoEm: Date;
}

export interface ListHistoricoAfericoesByPostoOutputItem {
  loteId: string;
  criadoEm: Date;
  responsavelId: string;
  responsavelNome?: string;
  afericoes: ListHistoricoAfericoesByPostoOutputItemAfericao[];
}

export interface ListHistoricoAfericoesByPostoOutput {
  itens: ListHistoricoAfericoesByPostoOutputItem[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export class ListHistoricoAfericoesByPostoUseCase {
  constructor(private readonly afericaoRepo: AfericaoRepository) {}

  async execute(input: ListHistoricoAfericoesByPostoInput): Promise<ListHistoricoAfericoesByPostoOutput> {
    autorizar(input.usuario, 'inmetro', 'ver', input.postoId);

    const pagina = input.pagina && input.pagina > 0 ? Math.floor(input.pagina) : 1;
    const offset = (pagina - 1) * LIMITE_POR_PAGINA;
    const { itens, total } = await this.afericaoRepo.listarLotesPorPosto(input.postoId, {
      limite: LIMITE_POR_PAGINA,
      offset,
      bomba: input.bomba,
    });

    return {
      itens: itens.map((lote) => ({
        loteId: lote.loteId,
        criadoEm: lote.criadoEm,
        responsavelId: lote.responsavelId,
        responsavelNome: lote.responsavelNome,
        afericoes: lote.afericoes.map((afericao) => ({
          id: afericao.id,
          postoId: afericao.postoId,
          responsavelId: afericao.responsavelId,
          responsavelNome: afericao.responsavelNome,
          loteId: afericao.loteId,
          bicoId: afericao.bicoId,
          produto: afericao.produto,
          bomba: afericao.bomba,
          bico: afericao.bico,
          medidaPadrao: afericao.medidaPadrao,
          resultadoMl: afericao.resultadoMl,
          situacao: afericao.situacao,
          observacoes: afericao.observacoes,
          fotoUrl: afericao.fotoUrl,
          criadoEm: afericao.criadoEm,
        })),
      })),
      total,
      pagina,
      totalPaginas: Math.max(1, Math.ceil(total / LIMITE_POR_PAGINA)),
    };
  }
}
