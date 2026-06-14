import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { RAQRepository } from '@/domain/ports/raq.repository';

export interface GetRAQByIdInput {
  usuario: UsuarioAutenticado;
  raqId: string;
}

export interface GetRAQByIdOutput {
  id: string;
  postoId: string;
  responsavelId: string;
  produto: string;
  volumeRecebido?: number;
  temperaturaObservada: number;
  densidadeObservada: number;
  massa20c?: number;
  aspecto: string;
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
  resultado: 'APROVADO' | 'REPROVADO';
  criadoEm: Date;
}

export class GetRAQByIdUseCase {
  constructor(private readonly raqRepo: RAQRepository) {}

  async execute(input: GetRAQByIdInput): Promise<GetRAQByIdOutput> {
    const raq = await this.raqRepo.buscarPorId(input.raqId);
    if (!raq) {
      throw new DomainError('RAQ não encontrada');
    }

    autorizar(input.usuario, 'anp', 'ver', raq.postoId);

    return {
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
      criadoEm: raq.criadoEm,
    };
  }
}
