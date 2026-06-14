import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { Afericao, type SituacaoAfericao } from '@/domain/entities/afericao.entity';
import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';

export interface CreateAfericaoInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  loteId?: string;
  bicoId?: string;
  produto: ProdutoCombustivel;
  bomba: number;
  bico: number;
  resultadoMl: number;
  observacoes?: string;
  fotoUrl?: string;
  medidaPadrao?: number;
}

export interface CreateAfericaoOutput {
  afericaoId: string;
  situacao: SituacaoAfericao;
  dentro: boolean;
}

export class CreateAfericaoUseCase {
  constructor(private readonly afericaoRepo: AfericaoRepository) {}

  async execute(input: CreateAfericaoInput): Promise<CreateAfericaoOutput> {
    autorizar(input.usuario, 'inmetro', 'criar', input.postoId);

    const afericao = Afericao.criar({
      postoId: input.postoId,
      responsavelId: input.usuario.id,
      loteId: input.loteId,
      bicoId: input.bicoId,
      produto: input.produto,
      bomba: input.bomba,
      bico: input.bico,
      resultadoMl: input.resultadoMl,
      observacoes: input.observacoes,
      fotoUrl: input.fotoUrl,
      medidaPadrao: input.medidaPadrao,
    });

    await this.afericaoRepo.salvar(afericao);

    return {
      afericaoId: afericao.id,
      situacao: afericao.situacao,
      dentro: afericao.situacao === 'DENTRO_DA_LEGISLACAO',
    };
  }
}
