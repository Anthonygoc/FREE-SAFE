import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import type { BombaRepository } from '@/domain/ports/bomba.repository';

export interface CreateBombaInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  numero: number;
  modelo?: string;
}

export interface CreateBombaOutput {
  id: string;
}

export class CreateBombaUseCase {
  constructor(private readonly bombaRepo: BombaRepository) {}

  async execute(input: CreateBombaInput): Promise<CreateBombaOutput> {
    autorizar(input.usuario, 'bombas', 'criar', input.postoId);

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

    return { id };
  }
}
