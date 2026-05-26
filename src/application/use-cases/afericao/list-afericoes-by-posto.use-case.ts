import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import type { SituacaoAfericao } from '@/domain/entities/afericao.entity';
import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';
import { UnauthorizedError } from '@/domain/errors/domain.errors';
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
  produto: ProdutoCombustivel;
  bomba: number;
  bico: number;
  medidaPadrao: number;
  resultadoMl: number;
  situacao: SituacaoAfericao;
  observacoes?: string;
  criadoEm: Date;
}

export class ListAfericoesByPostoUseCase {
  constructor(private readonly afericaoRepo: AfericaoRepository) {}

  async execute(input: ListAfericoesByPostoInput): Promise<ListAfericoesByPostoOutputItem[]> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    if (input.usuario.perfil === 'GERENTE' && input.usuario.postoId !== input.postoId) {
      throw new UnauthorizedError('Gerente só pode visualizar aferições do próprio posto');
    }

    const afericoes = input.bomba === undefined
      ? await this.afericaoRepo.listarPorPosto(input.postoId)
      : await this.afericaoRepo.listarPorBomba(input.postoId, input.bomba);

    return afericoes.map((afericao) => ({
      id: afericao.id,
      postoId: afericao.postoId,
      responsavelId: afericao.responsavelId,
      produto: afericao.produto,
      bomba: afericao.bomba,
      bico: afericao.bico,
      medidaPadrao: afericao.medidaPadrao,
      resultadoMl: afericao.resultadoMl,
      situacao: afericao.situacao,
      observacoes: afericao.observacoes,
      criadoEm: afericao.criadoEm,
    }));
  }
}
