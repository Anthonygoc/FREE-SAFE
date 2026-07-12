import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { BombaRepository } from '@/domain/ports/bomba.repository';

export interface CreateBombaInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  numero: number;
  modelo?: string;
}

export interface CreateBombaOutput {
  id: string;
  acao: 'criada' | 'reativada';
}

export class CreateBombaUseCase {
  constructor(private readonly bombaRepo: BombaRepository) {}

  async execute(input: CreateBombaInput): Promise<CreateBombaOutput> {
    autorizar(input.usuario, 'bombas', 'criar', input.postoId);

    const bombaAtiva = (await this.bombaRepo.listarPorPosto(input.postoId))
      .find((item) => item.numero === input.numero);
    if (bombaAtiva) {
      throw new DomainError('Já existe uma bomba com este número neste posto');
    }

    const bombaInativa = await this.bombaRepo.buscarInativaPorNumero(input.postoId, input.numero);
    if (bombaInativa) {
      await this.bombaRepo.reativar(bombaInativa.id);

      if (input.modelo !== undefined) {
        await this.bombaRepo.atualizar(bombaInativa.id, {
          modelo: input.modelo,
        });
      }

      await registrarAuditoria({
        usuario: input.usuario,
        acao: 'CRIAR',
        recurso: 'BOMBA',
        entidadeId: bombaInativa.id,
        postoId: input.postoId,
        descricao: `Reativou bomba ${input.numero}`,
        detalhes: {
          numero: input.numero,
          modelo: input.modelo ?? bombaInativa.modelo ?? null,
          reativada: true,
        },
      });

      return { id: bombaInativa.id, acao: 'reativada' };
    }

    const id = crypto.randomUUID();

    await this.bombaRepo.salvar({
      id,
      postoId: input.postoId,
      numero: input.numero,
      modelo: input.modelo,
      ativo: true,
      criadoEm: new Date(),
    });
    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'CRIAR',
      recurso: 'BOMBA',
      entidadeId: id,
      postoId: input.postoId,
      descricao: `Adicionou bomba ${input.numero}`,
      detalhes: {
        numero: input.numero,
        modelo: input.modelo ?? null,
      },
    });

    return { id, acao: 'criada' };
  }
}
