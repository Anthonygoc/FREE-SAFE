import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';
import type { DocumentoRepository } from '@/domain/ports/documento.repository';

export interface DeleteDocumentoInput {
  usuario: UsuarioAutenticado;
  documentoId: string;
}

export interface DeleteDocumentoOutput {
  deletado: true;
}

export class DeleteDocumentoUseCase {
  constructor(private readonly documentoRepo: DocumentoRepository) {}

  async execute(input: DeleteDocumentoInput): Promise<DeleteDocumentoOutput> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    const documento = await this.documentoRepo.buscarPorId(input.documentoId);
    if (!documento) {
      throw new DomainError('Documento não encontrado');
    }

    if (input.usuario.perfil === 'GERENTE') {
      if (!input.usuario.postoId) {
        throw new UnauthorizedError('Gerente sem posto vinculado');
      }

      if (input.usuario.postoId !== documento.postoId) {
        throw new UnauthorizedError('Gerente só pode excluir documentos do próprio posto');
      }
    }

    await this.documentoRepo.deletar(input.documentoId);

    return { deletado: true };
  }
}
