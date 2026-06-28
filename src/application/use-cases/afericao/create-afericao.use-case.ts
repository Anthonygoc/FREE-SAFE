import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { Afericao, type SituacaoAfericao } from '@/domain/entities/afericao.entity';
import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';

export interface CreateAfericaoInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  loteId?: string;
  bicoId?: string;
  registrarLog?: boolean;
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
    if (input.registrarLog !== false) {
      await registrarAuditoria({
        usuario: input.usuario,
        acao: 'CRIAR',
        recurso: 'AFERICAO',
        entidadeId: afericao.id,
        postoId: afericao.postoId,
        descricao: input.loteId
          ? `Registrou aferição em lote no bico ${afericao.bico} (bomba ${afericao.bomba})`
          : `Registrou aferição do bico ${afericao.bico} (bomba ${afericao.bomba})`,
        detalhes: {
          loteId: afericao.loteId ?? null,
          produto: afericao.produto,
          situacao: afericao.situacao,
          resultadoMl: afericao.resultadoMl,
        },
      });
    }

    return {
      afericaoId: afericao.id,
      situacao: afericao.situacao,
      dentro: afericao.situacao === 'DENTRO_DA_LEGISLACAO',
    };
  }
}
