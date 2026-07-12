import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { processarUpload } from '@/application/shared/processar-upload';
import { DomainError, NotFoundError } from '@/domain/errors/domain.errors';
import { ForbiddenError } from '@/domain/errors/forbidden.error';
import type { PostoRepository } from '@/domain/ports/posto.repository';
import { formatCnpj, isCnpjLengthValid, normalizeCnpj } from '@/lib/cnpj';

export interface UpdatePostoInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  nome?: string;
  cnpj?: string;
  razaoSocial?: string;
  inscricaoEstadual?: string | null;
  endereco?: string;
  cidade?: string;
  uf?: string;
  logoUrl?: string;
  maxGerentes?: number;
  maxAdministrativos?: number;
  toleranciaInmetroMl?: number;
}

export interface UpdatePostoOutput {
  id: string;
}

export class UpdatePostoUseCase {
  constructor(private readonly postoRepo: PostoRepository) {}

  async execute(input: UpdatePostoInput): Promise<UpdatePostoOutput> {
    autorizar(input.usuario, 'postos', 'editar', input.postoId);
    if (input.usuario.perfil !== 'ADMIN') {
      throw new ForbiddenError('Apenas ADMIN pode editar as configurações do posto');
    }

    const posto = await this.postoRepo.buscarPorId(input.postoId);
    if (!posto) {
      throw new NotFoundError('Posto não encontrado');
    }

    if (
      input.nome === undefined
      && input.cnpj === undefined
      && input.razaoSocial === undefined
      && input.inscricaoEstadual === undefined
      && input.endereco === undefined
      && input.cidade === undefined
      && input.uf === undefined
      && input.logoUrl === undefined
      && input.maxGerentes === undefined
      && input.maxAdministrativos === undefined
      && input.toleranciaInmetroMl === undefined
    ) {
      throw new DomainError('Nenhum dado informado para atualização');
    }

    if (
      input.toleranciaInmetroMl !== undefined
      && (!Number.isInteger(input.toleranciaInmetroMl) || input.toleranciaInmetroMl < 1 || input.toleranciaInmetroMl > 1000)
    ) {
      throw new DomainError('Tolerância INMETRO inválida. Informe um inteiro entre 1 e 1000 mL.');
    }

    const cnpjNormalizado = input.cnpj === undefined ? undefined : normalizeCnpj(input.cnpj);

    if (cnpjNormalizado !== undefined && !isCnpjLengthValid(cnpjNormalizado)) {
      throw new DomainError('Informe um CNPJ válido com 14 dígitos.');
    }

    const cnpjAtualizado = cnpjNormalizado === undefined
      ? posto.cnpj
      : formatCnpj(cnpjNormalizado);
    const alterouCnpj = normalizeCnpj(cnpjAtualizado) !== normalizeCnpj(posto.cnpj);

    const logoUrlProcessada = input.logoUrl === undefined
      ? undefined
      : await processarUpload({
          valor: input.logoUrl,
          bucket: 'postos',
          path: `${posto.id}/logo-${Date.now()}`,
        });

    const atualizado = {
      ...posto,
      nome: input.nome ?? posto.nome,
      cnpj: cnpjAtualizado,
      razaoSocial: input.razaoSocial ?? posto.razaoSocial,
      inscricaoEstadual: input.inscricaoEstadual === undefined
        ? posto.inscricaoEstadual
        : input.inscricaoEstadual,
      endereco: input.endereco ?? posto.endereco,
      cidade: input.cidade ?? posto.cidade,
      uf: input.uf ?? posto.uf,
      logoUrl: input.logoUrl === undefined
        ? posto.logoUrl
        : logoUrlProcessada ?? input.logoUrl,
      maxGerentes: input.maxGerentes ?? posto.maxGerentes,
      maxAdministrativos: input.maxAdministrativos ?? posto.maxAdministrativos,
      toleranciaInmetroMl: input.toleranciaInmetroMl ?? posto.toleranciaInmetroMl ?? 100,
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
        cnpj: atualizado.cnpj,
        alterouCnpj,
        alteracoesSensiveis: alterouCnpj ? ['Alterou CNPJ do posto'] : [],
        razaoSocial: atualizado.razaoSocial,
        inscricaoEstadual: atualizado.inscricaoEstadual,
        endereco: atualizado.endereco,
        cidade: atualizado.cidade,
        uf: atualizado.uf,
        logoUrl: atualizado.logoUrl,
        maxGerentes: atualizado.maxGerentes,
        maxAdministrativos: atualizado.maxAdministrativos,
        toleranciaInmetroMl: atualizado.toleranciaInmetroMl,
      },
    });

    return { id: atualizado.id };
  }
}
