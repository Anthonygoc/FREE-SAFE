import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { UnauthorizedError } from '@/domain/errors/domain.errors';
import type { CategoriaDocumento, CategoriaDocumentoRepository } from '@/domain/ports/categoria-documento.repository';

export interface ListCategoriasInput {
  usuario: UsuarioAutenticado;
}

export type ListCategoriasOutputItem = CategoriaDocumento;

export class ListCategoriasUseCase {
  constructor(private readonly categoriaDocumentoRepo: CategoriaDocumentoRepository) {}

  async execute(input: ListCategoriasInput): Promise<ListCategoriasOutputItem[]> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    return this.categoriaDocumentoRepo.listarTodas();
  }
}
