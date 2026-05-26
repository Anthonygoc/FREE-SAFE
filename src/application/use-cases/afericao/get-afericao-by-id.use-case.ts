import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';
import type { SituacaoAfericao } from '@/domain/entities/afericao.entity';
import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';

export interface GetAfericaoByIdInput {
  usuario: UsuarioAutenticado;
  afericaoId: string;
}

export interface GetAfericaoByIdOutput {
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

export class GetAfericaoByIdUseCase {
  constructor(private readonly afericaoRepo: AfericaoRepository) {}

  async execute(input: GetAfericaoByIdInput): Promise<GetAfericaoByIdOutput> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    const afericao = await this.afericaoRepo.buscarPorId(input.afericaoId);
    if (!afericao) {
      throw new DomainError('Aferição não encontrada');
    }

    if (input.usuario.perfil === 'GERENTE' && input.usuario.postoId !== afericao.postoId) {
      throw new UnauthorizedError('Gerente só pode visualizar aferições do próprio posto');
    }

    return {
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
    };
  }
}
