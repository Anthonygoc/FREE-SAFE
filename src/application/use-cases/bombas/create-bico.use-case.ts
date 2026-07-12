import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';
import { DomainError, NotFoundError } from '@/domain/errors/domain.errors';
import type { BicoRepository } from '@/domain/ports/bico.repository';
import type { BombaRepository } from '@/domain/ports/bomba.repository';

export interface CreateBicoInput {
  usuario: UsuarioAutenticado;
  bombaId: string;
  numero: number;
  produto: ProdutoCombustivel;
  capacidade?: number;
}

export interface CreateBicoOutput {
  id: string;
  acao: 'criado' | 'reativado';
}

export class CreateBicoUseCase {
  constructor(
    private readonly bombaRepo: BombaRepository,
    private readonly bicoRepo: BicoRepository,
  ) {}

  async execute(input: CreateBicoInput): Promise<CreateBicoOutput> {
    if (!Number.isInteger(input.numero) || input.numero <= 0) {
      throw new DomainError('O número do bico deve ser um inteiro positivo.');
    }

    const bomba = await this.bombaRepo.buscarPorId(input.bombaId);
    if (!bomba) {
      throw new NotFoundError('Bomba não encontrada');
    }

    autorizar(input.usuario, 'bombas', 'criar', bomba.postoId);

    const bicoAtivo = (await this.bicoRepo.listarPorBomba(input.bombaId))
      .find((item) => item.numero === input.numero);
    if (bicoAtivo) {
      throw new DomainError('Já existe um bico com este número nesta bomba');
    }

    const bicoInativo = await this.bicoRepo.buscarInativoPorNumero(input.bombaId, input.numero);
    if (bicoInativo) {
      await this.bicoRepo.reativar(bicoInativo.id);
      await this.bicoRepo.salvar({
        ...bicoInativo,
        produto: input.produto,
        capacidade: input.capacidade,
        ativo: true,
      });

      await registrarAuditoria({
        usuario: input.usuario,
        acao: 'CRIAR',
        recurso: 'BOMBA',
        entidadeId: bicoInativo.id,
        postoId: bomba.postoId,
        descricao: `Reativou bico ${input.numero} da bomba ${bomba.numero}`,
        detalhes: {
          bombaNumero: bomba.numero,
          bicoNumero: input.numero,
          produto: input.produto,
          reativado: true,
        },
      });

      return { id: bicoInativo.id, acao: 'reativado' };
    }

    const id = crypto.randomUUID();

    await this.bicoRepo.salvar({
      id,
      bombaId: input.bombaId,
      numero: input.numero,
      produto: input.produto,
      capacidade: input.capacidade,
      ativo: true,
      criadoEm: new Date(),
    });
    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'CRIAR',
      recurso: 'BOMBA',
      entidadeId: id,
      postoId: bomba.postoId,
      descricao: `Adicionou bico ${input.numero} da bomba ${bomba.numero}`,
      detalhes: {
        bombaNumero: bomba.numero,
        bicoNumero: input.numero,
        produto: input.produto,
      },
    });

    return { id, acao: 'criado' };
  }
}
