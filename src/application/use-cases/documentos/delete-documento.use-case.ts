import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
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
    const documento = await this.documentoRepo.buscarPorId(input.documentoId);
    if (!documento) {
      throw new DomainError('Documento não encontrado');
    }

    autorizar(input.usuario, 'documentos', 'excluir', documento.postoId);

    await this.documentoRepo.deletar(input.documentoId);

    return { deletado: true };
  }
}
