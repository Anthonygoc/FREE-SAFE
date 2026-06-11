import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { UnauthorizedError } from '@/domain/errors/domain.errors';
import type { CategoriaDocumento, CategoriaDocumentoRepository } from '@/domain/ports/categoria-documento.repository';

export interface CreateCategoriaInput {
  usuario: UsuarioAutenticado;
  nome: string;
  descricao?: string;
}

export type CreateCategoriaOutput = CategoriaDocumento;

export class CreateCategoriaUseCase {
  constructor(private readonly categoriaDocumentoRepo: CategoriaDocumentoRepository) {}

  async execute(input: CreateCategoriaInput): Promise<CreateCategoriaOutput> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    const existente = await this.categoriaDocumentoRepo.buscarPorNome(input.nome);
    if (existente) {
      return existente;
    }

    const categoria: CategoriaDocumento = {
      id: crypto.randomUUID(),
      nome: input.nome,
      descricao: input.descricao,
      criadoEm: new Date(),
    };

    await this.categoriaDocumentoRepo.salvar(categoria);

    return categoria;
  }
}
