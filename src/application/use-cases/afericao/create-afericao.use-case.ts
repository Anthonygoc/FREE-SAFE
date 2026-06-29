import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { processarUpload } from '@/application/shared/processar-upload';
import { Afericao, type SituacaoAfericao } from '@/domain/entities/afericao.entity';
import { NotFoundError } from '@/domain/errors/domain.errors';
import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';
import type { PostoRepository } from '@/domain/ports/posto.repository';

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
  private readonly toleranciaPorPosto = new Map<string, number>();

  constructor(
    private readonly afericaoRepo: AfericaoRepository,
    private readonly postoRepo: PostoRepository,
  ) {}

  async execute(input: CreateAfericaoInput): Promise<CreateAfericaoOutput> {
    autorizar(input.usuario, 'inmetro', 'criar', input.postoId);
    const toleranciaMl = await this.obterToleranciaDoPosto(input.postoId);

    const fotoUrlProcessada = await processarUpload({
      valor: input.fotoUrl,
      bucket: 'afericoes',
      path: `${input.postoId}/${input.bicoId ?? input.loteId ?? crypto.randomUUID()}-${Date.now()}-${crypto.randomUUID()}`,
    });

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
      fotoUrl: fotoUrlProcessada ?? input.fotoUrl,
      medidaPadrao: input.medidaPadrao,
      toleranciaMl,
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

  private async obterToleranciaDoPosto(postoId: string): Promise<number> {
    const toleranciaEmCache = this.toleranciaPorPosto.get(postoId);
    if (toleranciaEmCache !== undefined) {
      return toleranciaEmCache;
    }

    const posto = await this.postoRepo.buscarPorId(postoId);
    if (!posto) {
      throw new NotFoundError('Posto não encontrado');
    }

    const tolerancia = posto.toleranciaInmetroMl ?? 100;
    this.toleranciaPorPosto.set(postoId, tolerancia);

    return tolerancia;
  }
}
