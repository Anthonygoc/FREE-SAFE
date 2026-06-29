import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { NotFoundError } from '@/domain/errors/domain.errors';
import type { PostoRepository } from '@/domain/ports/posto.repository';

export interface GetPostoByIdInput {
  usuario: UsuarioAutenticado;
  postoId: string;
}

export interface GetPostoByIdOutput {
  id: string;
  nome: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual?: string | null;
  endereco: string;
  cidade: string;
  uf: string;
  gerenteId?: string | null;
  logoUrl?: string | null;
  maxGerentes: number;
  maxAdministrativos: number;
  toleranciaInmetroMl: number;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class GetPostoByIdUseCase {
  constructor(private readonly postoRepo: PostoRepository) {}

  async execute(input: GetPostoByIdInput): Promise<GetPostoByIdOutput> {
    const posto = await this.postoRepo.buscarPorId(input.postoId);
    if (!posto) {
      throw new NotFoundError('Posto não encontrado');
    }

    autorizar(input.usuario, 'postos', 'ver', posto.id);

    return {
      id: posto.id,
      nome: posto.nome,
      razaoSocial: posto.razaoSocial,
      cnpj: posto.cnpj,
      inscricaoEstadual: posto.inscricaoEstadual,
      endereco: posto.endereco,
      cidade: posto.cidade,
      uf: posto.uf,
      gerenteId: posto.gerenteId,
      logoUrl: posto.logoUrl,
      maxGerentes: posto.maxGerentes,
      maxAdministrativos: posto.maxAdministrativos,
      toleranciaInmetroMl: posto.toleranciaInmetroMl ?? 100,
      ativo: posto.ativo,
      criadoEm: posto.criadoEm,
      atualizadoEm: posto.atualizadoEm,
    };
  }
}
