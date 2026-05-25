import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { RAQ, type AspectoCombustivel, type ProdutoCombustivel } from '@/domain/entities/raq.entity';
import { UnauthorizedError } from '@/domain/errors/domain.errors';
import type { RAQRepository } from '@/domain/ports/raq.repository';

export interface CreateRAQInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  produto: ProdutoCombustivel;
  temperaturaObservada: number;
  densidadeObservada: number;
  aspecto: AspectoCombustivel;
  cor: 'CARACTERISTICA' | 'ALTERADA';
  faseAquosa?: number;
  teorAlcoolico?: number;
  distribuidora?: string;
  notaFiscal?: string;
  placaCaminhao?: string;
  tanqueDestino?: string;
}

export interface CreateRAQOutput {
  raqId: string;
  aprovado: boolean;
  resultado: 'APROVADO' | 'REPROVADO';
}

export class CreateRAQUseCase {
  constructor(private readonly raqRepo: RAQRepository) {}

  async execute(input: CreateRAQInput): Promise<CreateRAQOutput> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    if (input.usuario.perfil === 'GERENTE' && input.usuario.postoId !== input.postoId) {
      throw new UnauthorizedError('Gerente só pode registrar RAQ no próprio posto');
    }

    const raq = RAQ.criar({
      postoId: input.postoId,
      responsavelId: input.usuario.id,
      produto: input.produto,
      temperaturaObservada: input.temperaturaObservada,
      densidadeObservada: input.densidadeObservada,
      aspecto: input.aspecto,
      cor: input.cor,
      faseAquosa: input.faseAquosa,
      teorAlcoolico: input.teorAlcoolico,
      distribuidora: input.distribuidora,
      notaFiscal: input.notaFiscal,
      placaCaminhao: input.placaCaminhao,
      tanqueDestino: input.tanqueDestino,
    });

    await this.raqRepo.salvar(raq);

    return {
      raqId: raq.id,
      aprovado: raq.estaAprovado,
      resultado: raq.resultado,
    };
  }
}
