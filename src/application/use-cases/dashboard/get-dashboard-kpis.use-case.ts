import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { UnauthorizedError } from '@/domain/errors/domain.errors';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';
import type { ColaboradorRepository } from '@/domain/ports/colaborador.repository';
import type { PostoRepository } from '@/domain/ports/posto.repository';
import type { RAQRepository } from '@/domain/ports/raq.repository';

export interface DashboardAlerta {
  tipo: string;
  quantidade: number;
  nivel: 'critico' | 'atencao';
}

export interface GetDashboardKPIsOutput {
  totalPostos: number;
  totalColaboradores: number;
  mediaConformidade: number;
  totalPendencias: number;
  alertas: DashboardAlerta[];
}

export class GetDashboardKPIsUseCase {
  constructor(
    private readonly postoRepo: PostoRepository,
    private readonly colaboradorRepo: ColaboradorRepository,
    private readonly raqRepo: RAQRepository,
    private readonly afericaoRepo: AfericaoRepository,
  ) {}

  async execute(usuario: UsuarioAutenticado): Promise<GetDashboardKPIsOutput> {
    if (usuario.perfil !== 'ADMIN' && usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    if (usuario.perfil === 'GERENTE') {
      if (!usuario.postoId) {
        throw new UnauthorizedError('Gerente sem posto vinculado');
      }

      const [colaboradoresAtivos, raqsPosto, afericoesPosto] = await Promise.all([
        this.colaboradorRepo.listarPorPosto(usuario.postoId, { status: 'ATIVO' }),
        this.raqRepo.listar({ postoId: usuario.postoId }),
        this.afericaoRepo.listarPorPosto(usuario.postoId),
      ]);

      const raqsSemBoletim = raqsPosto.filter((raq) => !raq.boletimUrl || raq.boletimUrl.trim() === '').length;
      const afericoesFora = afericoesPosto.filter((afericao) => afericao.situacao === 'FORA_DA_TOLERANCIA').length;

      const totalRAQs = raqsPosto.length;
      const raqsAprovadas = raqsPosto.filter((raq) => raq.resultado === 'APROVADO').length;
      const mediaConformidade = totalRAQs === 0 ? 0 : Number(((raqsAprovadas / totalRAQs) * 100).toFixed(2));

      const alertas: DashboardAlerta[] = [];
      if (raqsSemBoletim > 0) {
        alertas.push({ tipo: 'RAQ sem boletim', quantidade: raqsSemBoletim, nivel: 'atencao' });
      }
      if (afericoesFora > 0) {
        alertas.push({ tipo: 'Aferições fora da tolerância', quantidade: afericoesFora, nivel: 'critico' });
      }

      return {
        totalPostos: 1,
        totalColaboradores: colaboradoresAtivos.length,
        mediaConformidade,
        totalPendencias: raqsSemBoletim + afericoesFora,
        alertas,
      };
    }

    const [
      totalPostos,
      totalColaboradores,
      totalRAQsSemBoletim,
      totalAfericoesFora,
      todasRAQs,
    ] = await Promise.all([
      this.postoRepo.contar(),
      this.colaboradorRepo.contarAtivos(),
      this.raqRepo.contarSemBoletim(),
      this.afericaoRepo.contarForaDaTolerancia(),
      this.raqRepo.listar({}),
    ]);

    const totalRAQs = todasRAQs.length;
    const raqsAprovadas = todasRAQs.filter((raq) => raq.resultado === 'APROVADO').length;
    const mediaConformidade = totalRAQs === 0 ? 0 : Number(((raqsAprovadas / totalRAQs) * 100).toFixed(2));

    const alertas: DashboardAlerta[] = [];
    if (totalRAQsSemBoletim > 0) {
      alertas.push({ tipo: 'RAQ sem boletim', quantidade: totalRAQsSemBoletim, nivel: 'atencao' });
    }
    if (totalAfericoesFora > 0) {
      alertas.push({ tipo: 'Aferições fora da tolerância', quantidade: totalAfericoesFora, nivel: 'critico' });
    }

    return {
      totalPostos,
      totalColaboradores,
      mediaConformidade,
      totalPendencias: totalRAQsSemBoletim + totalAfericoesFora,
      alertas,
    };
  }
}
