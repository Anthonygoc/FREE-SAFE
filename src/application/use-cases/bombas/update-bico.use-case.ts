import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { registrarAuditoria } from '@/application/shared/audit';
import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';
import { DomainError, NotFoundError } from '@/domain/errors/domain.errors';
import type { BicoRepository } from '@/domain/ports/bico.repository';
import type { BombaRepository } from '@/domain/ports/bomba.repository';

export interface UpdateBicoInput {
  usuario: UsuarioAutenticado;
  bicoId: string;
  numero: number;
  produto: ProdutoCombustivel;
  capacidade?: number;
}

export interface UpdateBicoOutput {
  id: string;
  bombaId: string;
  postoId: string;
}

export class UpdateBicoUseCase {
  constructor(
    private readonly bombaRepo: BombaRepository,
    private readonly bicoRepo: BicoRepository,
  ) {}

  async execute(input: UpdateBicoInput): Promise<UpdateBicoOutput> {
    if (!Number.isInteger(input.numero) || input.numero <= 0) {
      throw new DomainError('O número do bico deve ser um inteiro positivo.');
    }

    const bico = await this.bicoRepo.buscarPorId(input.bicoId);
    if (!bico) {
      throw new NotFoundError('Bico não encontrado');
    }

    const bomba = await this.bombaRepo.buscarPorId(bico.bombaId);
    if (!bomba) {
      throw new NotFoundError('Bomba não encontrada');
    }

    autorizar(input.usuario, 'bombas', 'editar', bomba.postoId);

    const bicoExistente = await this.bicoRepo.buscarPorNumeroDaBomba(bico.bombaId, input.numero);
    if (bicoExistente && bicoExistente.id !== bico.id) {
      throw new DomainError('Já existe um bico com este número nesta bomba');
    }

    await this.bicoRepo.salvar({
      ...bico,
      numero: input.numero,
      produto: input.produto,
      capacidade: input.capacidade,
    });
    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'EDITAR',
      recurso: 'BOMBA',
      entidadeId: bico.id,
      postoId: bomba.postoId,
      descricao: `Atualizou bico ${bico.numero} da bomba ${bomba.numero}`,
      detalhes: {
        bombaNumero: bomba.numero,
        numeroAnterior: bico.numero,
        numeroAtual: input.numero,
        produto: input.produto,
        capacidade: input.capacidade ?? null,
      },
    });

    return {
      id: bico.id,
      bombaId: bico.bombaId,
      postoId: bomba.postoId,
    };
  }
}
