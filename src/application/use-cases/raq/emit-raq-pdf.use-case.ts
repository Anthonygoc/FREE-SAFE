import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';
import type { PDFPort } from '@/domain/ports/pdf.port';
import type { PostoRepository } from '@/domain/ports/posto.repository';
import type { RAQRepository } from '@/domain/ports/raq.repository';

export interface EmitRAQPdfInput {
  usuario: UsuarioAutenticado;
  raqId: string;
}

export class EmitRAQPdfUseCase {
  constructor(
    private readonly raqRepo: RAQRepository,
    private readonly postoRepo: PostoRepository,
    private readonly pdfPort: PDFPort,
  ) {}

  async execute(input: EmitRAQPdfInput): Promise<Buffer> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    const raq = await this.raqRepo.buscarPorId(input.raqId);
    if (!raq) {
      throw new DomainError('RAQ não encontrada');
    }

    if (input.usuario.perfil === 'GERENTE' && input.usuario.postoId !== raq.postoId) {
      throw new UnauthorizedError('Gerente só pode emitir PDF de RAQ do próprio posto');
    }

    const posto = await this.postoRepo.buscarPorId(raq.postoId);
    if (!posto) {
      throw new DomainError('Posto da RAQ não encontrado');
    }

    return this.pdfPort.gerarRAQ(raq, posto);
  }
}
