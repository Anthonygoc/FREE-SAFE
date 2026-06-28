import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { NotFoundError } from '@/domain/errors/domain.errors';
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
      throw new NotFoundError('Documento não encontrado');
    }

    autorizar(input.usuario, 'documentos', 'excluir', documento.postoId);

    await this.documentoRepo.deletar(input.documentoId);
    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'EXCLUIR',
      recurso: 'DOCUMENTO',
      entidadeId: input.documentoId,
      postoId: documento.postoId,
      descricao: `Excluiu documento '${documento.titulo}'`,
      detalhes: {
        categoriaId: documento.categoriaId,
        status: documento.status,
      },
    });

    return { deletado: true };
  }
}
