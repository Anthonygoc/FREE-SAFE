import { registrarAuditoria } from '@/application/shared/audit';
import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError, NotFoundError } from '@/domain/errors/domain.errors';
import type { UserRepository } from '@/domain/ports/user.repository';

export interface UpdateMeuPerfilInput {
  usuario: UsuarioAutenticado;
  nome?: string;
  email?: string;
}

export interface UpdateMeuPerfilOutput {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  postoId: string | null;
}

export class UpdateMeuPerfilUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: UpdateMeuPerfilInput): Promise<UpdateMeuPerfilOutput> {
    const alvo = await this.userRepo.buscarPorId(input.usuario.id);
    if (!alvo) {
      throw new NotFoundError('Usuário não encontrado');
    }

    const emailNormalizado = input.email?.trim();

    if (emailNormalizado !== undefined && !/\S+@\S+\.\S+/.test(emailNormalizado)) {
      throw new DomainError('Informe um e-mail válido.');
    }

    if (emailNormalizado !== undefined) {
      const existente = await this.userRepo.buscarPorEmail(emailNormalizado);
      if (existente && existente.id !== alvo.id) {
        throw new DomainError('Este e-mail já está cadastrado');
      }
    }

    const nomeFinal = input.nome ?? alvo.nome;
    const emailFinal = emailNormalizado ?? alvo.email;
    const emailAlterado = emailFinal !== alvo.email;

    const atualizado = {
      ...alvo,
      nome: nomeFinal,
      email: emailFinal,
      atualizadoEm: new Date(),
    };

    await this.userRepo.atualizar(atualizado);
    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'EDITAR',
      recurso: 'USUARIO',
      entidadeId: atualizado.id,
      postoId: atualizado.postoId,
      descricao: `Atualizou o próprio perfil (${atualizado.nome})`,
      detalhes: {
        emailAlterado,
        nomeAlterado: nomeFinal !== alvo.nome,
      },
    });

    return {
      id: atualizado.id,
      nome: atualizado.nome,
      email: atualizado.email,
      perfil: atualizado.perfil,
      postoId: atualizado.postoId,
    };
  }
}
