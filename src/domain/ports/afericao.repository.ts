import type { Afericao } from '@/domain/entities/afericao.entity';

export interface ListarLotesAfericaoPorPostoOptions {
  limite: number;
  offset: number;
  bomba?: number;
}

export interface LoteAfericao {
  loteId: string;
  criadoEm: Date;
  responsavelId: string;
  responsavelNome?: string;
  afericoes: Afericao[];
}

export interface ListarLotesAfericaoPorPostoResult {
  itens: LoteAfericao[];
  total: number;
}

export interface AfericaoRepository {
  salvar(afericao: Afericao): Promise<void>;
  buscarPorId(id: string): Promise<Afericao | null>;
  listarPorPosto(postoId: string): Promise<Afericao[]>;
  listarPorBomba(postoId: string, bomba: number): Promise<Afericao[]>;
  listarLotesPorPosto(
    postoId: string,
    opcoes: ListarLotesAfericaoPorPostoOptions,
  ): Promise<ListarLotesAfericaoPorPostoResult>;
  listarPorLote(loteId: string): Promise<Afericao[]>;
  deletar(id: string): Promise<void>;
  deletarLote(loteId: string): Promise<void>;
  contarForaDaTolerancia(): Promise<number>;
}
