import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { ProdutoCombustivel, ResultadoAnalise } from '@/domain/entities/raq.entity';
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
  volumeRecebido?: number;
  temperaturaObservada: number;
  densidadeObservada: number;
  massa20c?: number;
  aspecto: 'LIQUIDO_E_ISENTO' | 'TURVO' | 'COM_IMPUREZAS';
  cor: 'CARACTERISTICA' | 'ALTERADA';
  faseAquosa?: number;
  teorEtanol?: number;
  teorAlcoolico?: number;
  distribuidora?: string;
  cnpjDistribuidora?: string;
  transportador?: string;
  cnpjTransportador?: string;
  notaFiscal?: string;
  placaCaminhao?: string;
  nomeMotorista?: string;
  cpfMotorista?: string;
  tanqueDestino?: string;
  nomeAnalista?: string;
  resultado: ResultadoAnalise;
  boletimUrl?: string;
  fotoProvetaUrl?: string;
  criadoEm: Date;
}

export class ListRAQByPostoUseCase {
  constructor(private readonly raqRepo: RAQRepository) {}

  async execute(input: ListRAQByPostoInput): Promise<ListRAQByPostoOutputItem[]> {
    autorizar(input.usuario, 'anp', 'ver', input.postoId);

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
      volumeRecebido: raq.volumeRecebido,
      temperaturaObservada: raq.temperaturaObservada,
      densidadeObservada: raq.densidadeObservada,
      massa20c: raq.massa20c,
      aspecto: raq.aspecto,
      cor: raq.cor,
      faseAquosa: raq.faseAquosa,
      teorEtanol: raq.teorEtanol,
      teorAlcoolico: raq.teorAlcoolico,
      distribuidora: raq.distribuidora,
      cnpjDistribuidora: raq.cnpjDistribuidora,
      transportador: raq.transportador,
      cnpjTransportador: raq.cnpjTransportador,
      notaFiscal: raq.notaFiscal,
      placaCaminhao: raq.placaCaminhao,
      nomeMotorista: raq.nomeMotorista,
      cpfMotorista: raq.cpfMotorista,
      tanqueDestino: raq.tanqueDestino,
      nomeAnalista: raq.nomeAnalista,
      resultado: raq.resultado,
      boletimUrl: raq.boletimUrl,
      fotoProvetaUrl: raq.fotoProvetaUrl,
      criadoEm: raq.criadoEm,
    }));
  }
}
