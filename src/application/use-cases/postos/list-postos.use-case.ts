import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { UnauthorizedError } from '@/domain/errors/domain.errors';
import type { PostoRepository } from '@/domain/ports/posto.repository';

export interface ListPostosOutputItem {
  id: string;
  nome: string;
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  uf: string;
  conformidade: number;
  logoUrl?: string | null;
  toleranciaInmetroMl: number;
}

export class ListPostosUseCase {
  constructor(private readonly postoRepo: PostoRepository) {}

  async execute(usuario: UsuarioAutenticado): Promise<ListPostosOutputItem[]> {
    autorizar(usuario, 'postos', 'ver');

    if (usuario.perfil === 'ADMIN') {
      const postos = await this.postoRepo.listar();
      return postos.map((posto) => ({
        id: posto.id,
        nome: posto.nome,
        razaoSocial: posto.razaoSocial,
        cnpj: posto.cnpj,
        endereco: posto.endereco,
        cidade: posto.cidade,
        uf: posto.uf,
        conformidade: this.calcularConformidade(posto.ativo),
        logoUrl: posto.logoUrl,
        toleranciaInmetroMl: posto.toleranciaInmetroMl ?? 100,
      }));
    }

    if (usuario.perfil === 'GERENTE' || usuario.perfil === 'ADMINISTRATIVO') {
      if (!usuario.postoId) {
        throw new UnauthorizedError('Você só pode acessar dados do seu posto');
      }

      const posto = await this.postoRepo.buscarPorId(usuario.postoId);
      if (!posto) {
        return [];
      }

      return [
        {
          id: posto.id,
          nome: posto.nome,
          razaoSocial: posto.razaoSocial,
          cnpj: posto.cnpj,
          endereco: posto.endereco,
          cidade: posto.cidade,
          uf: posto.uf,
          conformidade: this.calcularConformidade(posto.ativo),
          logoUrl: posto.logoUrl,
          toleranciaInmetroMl: posto.toleranciaInmetroMl ?? 100,
        },
      ];
    }

    throw new UnauthorizedError('Você não tem permissão para acessar este recurso');
  }

  private calcularConformidade(ativo: boolean): number {
    return ativo ? 100 : 0;
  }
}
