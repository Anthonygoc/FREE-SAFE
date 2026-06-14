import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { DocumentoComCategoria, DocumentoRepository } from '@/domain/ports/documento.repository';

export interface ListDocumentosByPostoInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  vencendoEmDias?: number;
}

export type ListDocumentosByPostoOutputItem = DocumentoComCategoria;

export class ListDocumentosByPostoUseCase {
  constructor(private readonly documentoRepo: DocumentoRepository) {}

  async execute(input: ListDocumentosByPostoInput): Promise<ListDocumentosByPostoOutputItem[]> {
    autorizar(input.usuario, 'documentos', 'ver', input.postoId);

    if (input.vencendoEmDias !== undefined) {
      const documentos = await this.documentoRepo.listarVencendoEm(input.vencendoEmDias);
      return documentos.filter((documento) => documento.postoId === input.postoId);
    }

    return this.documentoRepo.listarPorPosto(input.postoId);
  }
}
