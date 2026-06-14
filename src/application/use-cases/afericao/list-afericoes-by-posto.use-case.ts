import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { SituacaoAfericao } from '@/domain/entities/afericao.entity';
import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';

export interface ListAfericoesByPostoInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  bomba?: number;
}

export interface ListAfericoesByPostoOutputItem {
  id: string;
  postoId: string;
  responsavelId: string;
  responsavelNome?: string;
  loteId?: string;
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

export class ListAfericoesByPostoUseCase {
  constructor(private readonly afericaoRepo: AfericaoRepository) {}

  async execute(input: ListAfericoesByPostoInput): Promise<ListAfericoesByPostoOutputItem[]> {
    autorizar(input.usuario, 'inmetro', 'ver', input.postoId);

    const afericoes = input.bomba === undefined
      ? await this.afericaoRepo.listarPorPosto(input.postoId)
      : await this.afericaoRepo.listarPorBomba(input.postoId, input.bomba);

    return afericoes.map((afericao) => ({
      id: afericao.id,
      postoId: afericao.postoId,
      responsavelId: afericao.responsavelId,
      responsavelNome: afericao.responsavelNome,
      loteId: afericao.loteId,
      produto: afericao.produto,
      bomba: afericao.bomba,
      bico: afericao.bico,
      medidaPadrao: afericao.medidaPadrao,
      resultadoMl: afericao.resultadoMl,
      situacao: afericao.situacao,
      observacoes: afericao.observacoes,
      fotoUrl: afericao.fotoUrl,
      criadoEm: afericao.criadoEm,
    }));
  }
}
