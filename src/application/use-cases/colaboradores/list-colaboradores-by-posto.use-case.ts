import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { ColaboradorRepository } from '@/domain/ports/colaborador.repository';
import type { StatusColaborador } from '@/domain/entities/colaborador.entity';

const LIMITE_POR_PAGINA = 20;

export interface ListColaboradoresByPostoInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  cargo?: string;
  status?: StatusColaborador;
  pagina?: number;
  semPaginacao?: boolean;
}

export interface ListColaboradoresByPostoOutputItem {
  id: string;
  postoId: string;
  userId?: string;
  nome: string;
  cpf: string;
  fotoUrl?: string;
  cargo: string;
  dataAdmissao: Date;
  status: StatusColaborador;
  turno?: string;
  escala?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  criadoEm: Date;
}

export interface ListColaboradoresByPostoOutput {
  itens: ListColaboradoresByPostoOutputItem[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export class ListColaboradoresByPostoUseCase {
  constructor(private readonly colaboradorRepo: ColaboradorRepository) {}

  async execute(input: ListColaboradoresByPostoInput): Promise<ListColaboradoresByPostoOutput> {
    autorizar(input.usuario, 'colaboradores', 'ver', input.postoId);
    const pagina = input.semPaginacao ? 1 : input.pagina && input.pagina > 0 ? Math.floor(input.pagina) : 1;
    const offset = (pagina - 1) * LIMITE_POR_PAGINA;

    const { itens, total } = await this.colaboradorRepo.listarPorPosto(input.postoId, input.semPaginacao
      ? {
          cargo: input.cargo,
          status: input.status,
        }
      : {
          cargo: input.cargo,
          status: input.status,
          limite: LIMITE_POR_PAGINA,
          offset,
        });

    return {
      itens: itens.map((colaborador) => ({
        id: colaborador.id,
        postoId: colaborador.postoId,
        userId: colaborador.userId,
        nome: colaborador.nome,
        cpf: colaborador.cpf,
        fotoUrl: colaborador.fotoUrl,
        cargo: colaborador.cargo,
        dataAdmissao: colaborador.dataAdmissao,
        status: colaborador.status,
        turno: colaborador.turno,
        escala: colaborador.escala,
        telefone: colaborador.telefone,
        email: colaborador.email,
        endereco: colaborador.endereco,
        criadoEm: colaborador.criadoEm,
      })),
      total,
      pagina,
      totalPaginas: input.semPaginacao ? 1 : Math.max(1, Math.ceil(total / LIMITE_POR_PAGINA)),
    };
  }
}
