import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { AfericaoPdfPort } from '@/domain/ports/afericao-pdf.port';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';
import type { PostoRepository } from '@/domain/ports/posto.repository';

export interface EmitAfericaoPdfInput {
  usuario: UsuarioAutenticado;
  loteId: string;
}

export interface EmitAfericaoPdfOutput {
  buffer: Buffer;
  postoNome: string;
  dataReferencia: Date;
}

export class EmitAfericaoPdfUseCase {
  constructor(
    private readonly afericaoRepo: AfericaoRepository,
    private readonly postoRepo: PostoRepository,
    private readonly pdfPort: AfericaoPdfPort,
  ) {}

  async execute(input: EmitAfericaoPdfInput): Promise<EmitAfericaoPdfOutput> {
    const afericoes = await this.afericaoRepo.listarPorLote(input.loteId);
    if (afericoes.length === 0) {
      throw new DomainError('Lote de aferições não encontrado');
    }

    const postoId = afericoes[0].postoId;
    autorizar(input.usuario, 'inmetro', 'ver', postoId);

    const posto = await this.postoRepo.buscarPorId(postoId);
    if (!posto) {
      throw new DomainError('Posto das aferições não encontrado');
    }

    return {
      buffer: await this.pdfPort.gerarRelatorioLote(afericoes, posto),
      postoNome: posto.nome,
      dataReferencia: afericoes[0]?.criadoEm ?? new Date(),
    };
  }
}
