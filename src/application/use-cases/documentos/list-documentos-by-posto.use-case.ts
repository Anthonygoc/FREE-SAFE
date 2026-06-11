import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { UnauthorizedError } from '@/domain/errors/domain.errors';
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
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    if (input.usuario.perfil === 'GERENTE') {
      if (!input.usuario.postoId) {
        throw new UnauthorizedError('Gerente sem posto vinculado');
      }

      if (input.usuario.postoId !== input.postoId) {
        throw new UnauthorizedError('Gerente só pode visualizar documentos do próprio posto');
      }
    }

    if (input.vencendoEmDias !== undefined) {
      const documentos = await this.documentoRepo.listarVencendoEm(input.vencendoEmDias);
      return documentos.filter((documento) => documento.postoId === input.postoId);
    }

    return this.documentoRepo.listarPorPosto(input.postoId);
  }
}
