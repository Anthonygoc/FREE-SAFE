import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { RAQ, type AspectoCombustivel, type ProdutoCombustivel } from '@/domain/entities/raq.entity';
import type { RAQRepository } from '@/domain/ports/raq.repository';

export interface CreateRAQInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  produto: ProdutoCombustivel;
  volumeRecebido?: number;
  temperaturaObservada: number;
  densidadeObservada: number;
  massa20c?: number;
  aspecto: AspectoCombustivel;
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
}

export interface CreateRAQOutput {
  raqId: string;
  aprovado: boolean;
  resultado: 'APROVADO' | 'REPROVADO';
}

export class CreateRAQUseCase {
  constructor(private readonly raqRepo: RAQRepository) {}

  async execute(input: CreateRAQInput): Promise<CreateRAQOutput> {
    autorizar(input.usuario, 'anp', 'criar', input.postoId);

    const raq = RAQ.criar({
      postoId: input.postoId,
      responsavelId: input.usuario.id,
      produto: input.produto,
      volumeRecebido: input.volumeRecebido,
      temperaturaObservada: input.temperaturaObservada,
      densidadeObservada: input.densidadeObservada,
      massa20c: input.massa20c,
      aspecto: input.aspecto,
      cor: input.cor,
      faseAquosa: input.faseAquosa,
      teorEtanol: input.teorEtanol,
      teorAlcoolico: input.teorAlcoolico,
      distribuidora: input.distribuidora,
      cnpjDistribuidora: input.cnpjDistribuidora,
      transportador: input.transportador,
      cnpjTransportador: input.cnpjTransportador,
      notaFiscal: input.notaFiscal,
      placaCaminhao: input.placaCaminhao,
      nomeMotorista: input.nomeMotorista,
      cpfMotorista: input.cpfMotorista,
      tanqueDestino: input.tanqueDestino,
      nomeAnalista: input.nomeAnalista,
    });

    await this.raqRepo.salvar(raq);

    return {
      raqId: raq.id,
      aprovado: raq.estaAprovado,
      resultado: raq.resultado,
    };
  }
}
