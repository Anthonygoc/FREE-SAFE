import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
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
    const raq = await this.raqRepo.buscarPorId(input.raqId);
    if (!raq) {
      throw new DomainError('RAQ não encontrada');
    }

    autorizar(input.usuario, 'anp', 'ver', raq.postoId);

    const posto = await this.postoRepo.buscarPorId(raq.postoId);
    if (!posto) {
      throw new DomainError('Posto da RAQ não encontrado');
    }

    return this.pdfPort.gerarRAQ(raq, posto);
  }
}
