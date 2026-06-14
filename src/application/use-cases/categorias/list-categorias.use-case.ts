import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { CategoriaDocumento, CategoriaDocumentoRepository } from '@/domain/ports/categoria-documento.repository';

export interface ListCategoriasInput {
  usuario: UsuarioAutenticado;
}

export type ListCategoriasOutputItem = CategoriaDocumento;

export class ListCategoriasUseCase {
  constructor(private readonly categoriaDocumentoRepo: CategoriaDocumentoRepository) {}

  async execute(input: ListCategoriasInput): Promise<ListCategoriasOutputItem[]> {
    autorizar(input.usuario, 'documentos', 'ver');

    return this.categoriaDocumentoRepo.listarTodas();
  }
}
