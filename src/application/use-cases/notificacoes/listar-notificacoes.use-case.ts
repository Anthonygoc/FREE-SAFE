import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { UnauthorizedError } from '@/domain/errors/domain.errors';
import type { DocumentoRepository } from '@/domain/ports/documento.repository';
import type { PostoRepository } from '@/domain/ports/posto.repository';
import { podeAcessar } from '@/domain/permissions/permissions';

export type NotificacaoSeveridade = 'critico' | 'atencao';

export interface NotificacaoItem {
  id: string;
  tipo: 'documento';
  severidade: NotificacaoSeveridade;
  titulo: string;
  descricao: string;
  postoNome?: string;
  link: string;
  data: Date;
}

export interface ListarNotificacoesOutput {
  itens: NotificacaoItem[];
  total: number;
  criticos: number;
}

function calcularDiasRestantes(dataVencimento: Date): number {
  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dataBase = new Date(
    dataVencimento.getFullYear(),
    dataVencimento.getMonth(),
    dataVencimento.getDate(),
  );

  return Math.ceil((dataBase.getTime() - inicioHoje.getTime()) / (1000 * 60 * 60 * 24));
}

function compararItens(a: NotificacaoItem, b: NotificacaoItem): number {
  if (a.severidade !== b.severidade) {
    return a.severidade === 'critico' ? -1 : 1;
  }

  return a.data.getTime() - b.data.getTime();
}

export class ListarNotificacoesUseCase {
  constructor(
    private readonly documentoRepo: DocumentoRepository,
    private readonly postoRepo: PostoRepository,
  ) {}

  async execute(usuario: UsuarioAutenticado): Promise<ListarNotificacoesOutput> {
    autorizar(usuario, 'dashboard', 'ver');

    if (!podeAcessar(usuario.perfil, 'documentos', 'ver')) {
      return { itens: [], total: 0, criticos: 0 };
    }

    if ((usuario.perfil === 'GERENTE' || usuario.perfil === 'ADMINISTRATIVO') && !usuario.postoId) {
      throw new UnauthorizedError('Você só pode acessar dados do seu posto');
    }

    const documentos = await this.documentoRepo.listarVencendoEm(30);
    const documentosEscopo = usuario.perfil === 'ADMIN'
      ? documentos
      : documentos.filter((documento) => documento.postoId === usuario.postoId);

    const postoIds = [...new Set(documentosEscopo.map((documento) => documento.postoId))];
    const postos = await Promise.all(postoIds.map((postoId) => this.postoRepo.buscarPorId(postoId)));
    const postoNomePorId = new Map(
      postos
        .filter((posto): posto is NonNullable<typeof posto> => posto !== null)
        .map((posto) => [posto.id, posto.nome]),
    );

    const itens = documentosEscopo
      .filter((documento) => documento.dataVencimento)
      .map((documento) => {
        const dataVencimento = documento.dataVencimento as Date;
        const diasRestantes = calcularDiasRestantes(dataVencimento);
        const vencido = diasRestantes < 0;

        const descricao = vencido
          ? `Documento vencido em ${new Intl.DateTimeFormat('pt-BR').format(dataVencimento)}.`
          : diasRestantes === 0
            ? 'Documento vence hoje.'
            : `Documento vence em ${diasRestantes} dias.`;

        return {
          id: `documento:${documento.id}`,
          tipo: 'documento' as const,
          severidade: (vencido ? 'critico' : 'atencao') as NotificacaoSeveridade,
          titulo: documento.titulo,
          descricao,
          postoNome: usuario.perfil === 'ADMIN' ? postoNomePorId.get(documento.postoId) : undefined,
          link: '/documentos',
          data: dataVencimento,
        };
      })
      .sort(compararItens);

    return {
      criticos: itens.filter((item) => item.severidade === 'critico').length,
      total: itens.length,
      itens,
    };
  }
}
