import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { DomainError, NotFoundError } from '@/domain/errors/domain.errors';
import type { UserRepository } from '@/domain/ports/user.repository';

export interface ToggleUsuarioAtivoInput {
  usuario: UsuarioAutenticado;
  usuarioId: string;
  ativo: boolean;
}

export interface ToggleUsuarioAtivoOutput {
  id: string;
}

export class ToggleUsuarioAtivoUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: ToggleUsuarioAtivoInput): Promise<ToggleUsuarioAtivoOutput> {
    autorizar(input.usuario, 'usuarios', 'editar');

    const alvo = await this.userRepo.buscarPorId(input.usuarioId);
    if (!alvo) {
      throw new NotFoundError('Usuário não encontrado');
    }

    if (alvo.id === input.usuario.id && input.ativo === false) {
      throw new DomainError('Você não pode desativar o próprio usuário.');
    }

    const atualizado = {
      ...alvo,
      ativo: input.ativo,
      atualizadoEm: new Date(),
    };

    await this.userRepo.atualizar(atualizado);
    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'EDITAR',
      recurso: 'USUARIO',
      entidadeId: atualizado.id,
      postoId: atualizado.postoId,
      descricao: `${input.ativo ? 'Ativou' : 'Desativou'} usuário ${atualizado.nome}`,
      detalhes: {
        ativo: atualizado.ativo,
      },
    });

    return { id: alvo.id };
  }
}
