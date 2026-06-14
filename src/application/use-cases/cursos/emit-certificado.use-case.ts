import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';
import type { CertificadoPort } from '@/domain/ports/certificado.port';
import type { ColaboradorRepository } from '@/domain/ports/colaborador.repository';
import type { CursoRepository } from '@/domain/ports/curso.repository';
import type { PostoRepository } from '@/domain/ports/posto.repository';
import type { ProvaAttemptRepository } from '@/domain/ports/prova-attempt.repository';

export interface EmitCertificadoInput {
  usuario: UsuarioAutenticado;
  attemptId: string;
}

export class EmitCertificadoUseCase {
  constructor(
    private readonly attemptRepo: ProvaAttemptRepository,
    private readonly colaboradorRepo: ColaboradorRepository,
    private readonly cursoRepo: CursoRepository,
    private readonly postoRepo: PostoRepository,
    private readonly certificadoPort: CertificadoPort,
  ) {}

  async execute(input: EmitCertificadoInput): Promise<Buffer> {
    autorizar(input.usuario, 'cursos', 'ver');

    const attempt = await this.attemptRepo.buscarPorId(input.attemptId);
    if (!attempt) {
      throw new DomainError('Tentativa de prova não encontrada');
    }

    if (!attempt.aprovado) {
      throw new DomainError('Certificado disponível apenas para aprovados');
    }

    const colaborador = await this.colaboradorRepo.buscarPorId(attempt.colaboradorId);
    if (!colaborador) {
      throw new DomainError('Colaborador da tentativa não encontrado');
    }

    await this.validarAcesso(input.usuario, colaborador.id, colaborador.postoId);

    const curso = await this.cursoRepo.buscarPorId(attempt.cursoId);
    if (!curso) {
      throw new DomainError('Curso não encontrado');
    }

    const posto = await this.postoRepo.buscarPorId(colaborador.postoId);
    if (!posto) {
      throw new DomainError('Posto do colaborador não encontrado');
    }

    return this.certificadoPort.gerar({
      colaboradorNome: colaborador.nome,
      cargo: colaborador.cargo,
      postoNome: posto.nome,
      postoCidade: posto.cidade,
      postoUf: posto.uf,
      cursoNome: curso.nome,
      nota: attempt.nota,
      dataConclusao: attempt.criadoEm,
      codigoVerificacao: attempt.id.slice(0, 8),
    });
  }

  private async validarAcesso(
    usuario: UsuarioAutenticado,
    colaboradorId: string,
    postoId: string,
  ): Promise<void> {
    if (usuario.perfil === 'ADMIN') {
      return;
    }

    if (usuario.perfil === 'GERENTE') {
      if (!usuario.postoId) {
        throw new UnauthorizedError('Gerente sem posto vinculado');
      }

      if (usuario.postoId !== postoId) {
        throw new UnauthorizedError('Gerente só pode emitir certificado do próprio posto');
      }

      return;
    }

    const colaboradorUsuario = await this.colaboradorRepo.buscarPorUserId(usuario.id);
    if (!colaboradorUsuario) {
      throw new UnauthorizedError('Usuário não está vinculado a um colaborador');
    }

    if (colaboradorUsuario.id !== colaboradorId) {
      throw new UnauthorizedError('Usuário só pode emitir o próprio certificado');
    }
  }
}
