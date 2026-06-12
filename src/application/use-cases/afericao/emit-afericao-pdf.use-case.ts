import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';
import type { AfericaoPdfPort } from '@/domain/ports/afericao-pdf.port';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';
import type { PostoRepository } from '@/domain/ports/posto.repository';

export interface EmitAfericaoPdfInput {
  usuario: UsuarioAutenticado;
  loteId: string;
}

export class EmitAfericaoPdfUseCase {
  constructor(
    private readonly afericaoRepo: AfericaoRepository,
    private readonly postoRepo: PostoRepository,
    private readonly pdfPort: AfericaoPdfPort,
  ) {}

  async execute(input: EmitAfericaoPdfInput): Promise<Buffer> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    const afericoes = await this.afericaoRepo.listarPorLote(input.loteId);
    if (afericoes.length === 0) {
      throw new DomainError('Lote de aferições não encontrado');
    }

    const postoId = afericoes[0].postoId;
    if (input.usuario.perfil === 'GERENTE' && input.usuario.postoId !== postoId) {
      throw new UnauthorizedError('Gerente só pode emitir PDF de aferições do próprio posto');
    }

    const posto = await this.postoRepo.buscarPorId(postoId);
    if (!posto) {
      throw new DomainError('Posto das aferições não encontrado');
    }

    return this.pdfPort.gerarRelatorioLote(afericoes, posto);
  }
}
