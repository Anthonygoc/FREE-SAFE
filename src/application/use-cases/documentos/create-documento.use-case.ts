import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { CategoriaDocumentoRepository } from '@/domain/ports/categoria-documento.repository';
import type { DocumentoRepository, StatusDocumento } from '@/domain/ports/documento.repository';

export interface CreateDocumentoInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  categoriaId: string;
  titulo: string;
  numero?: string;
  dataEmissao?: Date;
  dataVencimento?: Date;
  arquivoUrl?: string;
}

export interface CreateDocumentoOutput {
  id: string;
}

function calcularStatus(dataVencimento?: Date): StatusDocumento {
  if (!dataVencimento) return 'VALIDO';

  const hoje = new Date();
  const diasRestantes = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) return 'VENCIDO';
  if (diasRestantes <= 30) return 'VENCENDO';

  return 'VALIDO';
}

export class CreateDocumentoUseCase {
  constructor(
    private readonly documentoRepo: DocumentoRepository,
    private readonly categoriaDocumentoRepo: CategoriaDocumentoRepository,
  ) {}

  async execute(input: CreateDocumentoInput): Promise<CreateDocumentoOutput> {
    autorizar(input.usuario, 'documentos', 'criar', input.postoId);

    const categoria = await this.categoriaDocumentoRepo.buscarPorId(input.categoriaId);
    if (!categoria) {
      throw new DomainError('Categoria de documento não encontrada');
    }

    const id = crypto.randomUUID();
    const agora = new Date();

    await this.documentoRepo.salvar({
      id,
      postoId: input.postoId,
      categoriaId: categoria.id,
      titulo: input.titulo,
      numero: input.numero,
      dataEmissao: input.dataEmissao,
      dataVencimento: input.dataVencimento,
      arquivoUrl: input.arquivoUrl,
      status: calcularStatus(input.dataVencimento),
      criadoEm: agora,
      atualizadoEm: agora,
    });

    return { id };
  }
}
