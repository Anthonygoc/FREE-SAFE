import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { DomainError, NotFoundError } from '@/domain/errors/domain.errors';
import type { PostoRepository } from '@/domain/ports/posto.repository';

export interface UpdatePostoInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  nome?: string;
  razaoSocial?: string;
  inscricaoEstadual?: string | null;
  endereco?: string;
  cidade?: string;
  uf?: string;
  maxGerentes?: number;
  maxAdministrativos?: number;
}

export interface UpdatePostoOutput {
  id: string;
}

export class UpdatePostoUseCase {
  constructor(private readonly postoRepo: PostoRepository) {}

  async execute(input: UpdatePostoInput): Promise<UpdatePostoOutput> {
    const posto = await this.postoRepo.buscarPorId(input.postoId);
    if (!posto) {
      throw new NotFoundError('Posto não encontrado');
    }

    autorizar(input.usuario, 'postos', 'editar', posto.id);

    if (
      input.nome === undefined
      && input.razaoSocial === undefined
      && input.inscricaoEstadual === undefined
      && input.endereco === undefined
      && input.cidade === undefined
      && input.uf === undefined
      && input.maxGerentes === undefined
      && input.maxAdministrativos === undefined
    ) {
      throw new DomainError('Nenhum dado informado para atualização');
    }

    const atualizado = {
      ...posto,
      nome: input.nome ?? posto.nome,
      razaoSocial: input.razaoSocial ?? posto.razaoSocial,
      inscricaoEstadual: input.inscricaoEstadual === undefined
        ? posto.inscricaoEstadual
        : input.inscricaoEstadual,
      endereco: input.endereco ?? posto.endereco,
      cidade: input.cidade ?? posto.cidade,
      uf: input.uf ?? posto.uf,
      maxGerentes: input.maxGerentes ?? posto.maxGerentes,
      maxAdministrativos: input.maxAdministrativos ?? posto.maxAdministrativos,
      atualizadoEm: new Date(),
    };

    await this.postoRepo.salvar(atualizado);
    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'EDITAR',
      recurso: 'POSTO',
      entidadeId: atualizado.id,
      postoId: atualizado.id,
      descricao: `Editou configurações do posto ${atualizado.nome}`,
      detalhes: {
        nome: atualizado.nome,
        razaoSocial: atualizado.razaoSocial,
        inscricaoEstadual: atualizado.inscricaoEstadual,
        endereco: atualizado.endereco,
        cidade: atualizado.cidade,
        uf: atualizado.uf,
        maxGerentes: atualizado.maxGerentes,
        maxAdministrativos: atualizado.maxAdministrativos,
      },
    });

    return { id: atualizado.id };
  }
}
