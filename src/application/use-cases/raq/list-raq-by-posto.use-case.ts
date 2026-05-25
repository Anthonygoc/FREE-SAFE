import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import type { ProdutoCombustivel, ResultadoAnalise } from '@/domain/entities/raq.entity';
import { UnauthorizedError } from '@/domain/errors/domain.errors';
import type { RAQRepository } from '@/domain/ports/raq.repository';

export interface ListRAQByPostoInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  produto?: ProdutoCombustivel;
  resultado?: ResultadoAnalise;
  dataInicio?: Date;
  dataFim?: Date;
}

export interface ListRAQByPostoOutputItem {
  id: string;
  postoId: string;
  responsavelId: string;
  produto: ProdutoCombustivel;
  temperaturaObservada: number;
  densidadeObservada: number;
  aspecto: 'LIQUIDO_E_ISENTO' | 'TURVO' | 'COM_IMPUREZAS';
  cor: 'CARACTERISTICA' | 'ALTERADA';
  faseAquosa?: number;
  teorAlcoolico?: number;
  distribuidora?: string;
  notaFiscal?: string;
  placaCaminhao?: string;
  tanqueDestino?: string;
  resultado: ResultadoAnalise;
  boletimUrl?: string;
  fotoProvetaUrl?: string;
  criadoEm: Date;
}

export class ListRAQByPostoUseCase {
  constructor(private readonly raqRepo: RAQRepository) {}

  async execute(input: ListRAQByPostoInput): Promise<ListRAQByPostoOutputItem[]> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    if (input.usuario.perfil === 'GERENTE' && input.usuario.postoId !== input.postoId) {
      throw new UnauthorizedError('Gerente só pode visualizar RAQs do próprio posto');
    }

    const raqs = await this.raqRepo.listar({
      postoId: input.postoId,
      produto: input.produto,
      resultado: input.resultado,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
    });

    return raqs.map((raq) => ({
      id: raq.id,
      postoId: raq.postoId,
      responsavelId: raq.responsavelId,
      produto: raq.produto,
      temperaturaObservada: raq.temperaturaObservada,
      densidadeObservada: raq.densidadeObservada,
      aspecto: raq.aspecto,
      cor: raq.cor,
      faseAquosa: raq.faseAquosa,
      teorAlcoolico: raq.teorAlcoolico,
      distribuidora: raq.distribuidora,
      notaFiscal: raq.notaFiscal,
      placaCaminhao: raq.placaCaminhao,
      tanqueDestino: raq.tanqueDestino,
      resultado: raq.resultado,
      boletimUrl: raq.boletimUrl,
      fotoProvetaUrl: raq.fotoProvetaUrl,
      criadoEm: raq.criadoEm,
    }));
  }
}
