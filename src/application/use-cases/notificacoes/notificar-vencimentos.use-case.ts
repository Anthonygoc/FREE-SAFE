import type { PerfilUsuario } from '@/application/dtos/auth.dto';
import type { DocumentoRepository } from '@/domain/ports/documento.repository';
import type { PostoRepository } from '@/domain/ports/posto.repository';
import type { UserRepository } from '@/domain/ports/user.repository';
import {
  enviarEmailVencimentoDocumentos,
  type DocumentoVencimentoEmail,
} from '@/infrastructure/email/email-service';

type DocumentoAgrupado = DocumentoVencimentoEmail & {
  postoId: string;
};

export interface NotificarVencimentosOutput {
  postosNotificados: number;
  emailsEnviados: number;
  documentosTotal: number;
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

function isPerfilDestino(perfil: PerfilUsuario): boolean {
  return perfil === 'ADMIN' || perfil === 'GERENTE';
}

export class NotificarVencimentosUseCase {
  constructor(
    private readonly documentoRepo: DocumentoRepository,
    private readonly userRepo: UserRepository,
    private readonly postoRepo: PostoRepository,
  ) {}

  async execute(): Promise<NotificarVencimentosOutput> {
    const documentos = await this.documentoRepo.listarVencendoEm(30);
    const documentosProcessados = documentos
      .filter((doc) => doc.dataVencimento)
      .map((doc) => {
        const diasRestantes = calcularDiasRestantes(doc.dataVencimento as Date);

        return {
          postoId: doc.postoId,
          titulo: doc.titulo,
          categoria: doc.categoriaNome,
          dataVencimento: doc.dataVencimento as Date,
          diasRestantes,
          status: diasRestantes < 0 ? 'VENCIDO' : 'VENCENDO',
        } satisfies DocumentoAgrupado;
      })
      .filter((doc) => doc.diasRestantes <= 30)
      .sort((a, b) => a.diasRestantes - b.diasRestantes);

    const documentosPorPosto = new Map<string, DocumentoAgrupado[]>();

    for (const documento of documentosProcessados) {
      const docs = documentosPorPosto.get(documento.postoId) ?? [];
      docs.push(documento);
      documentosPorPosto.set(documento.postoId, docs);
    }

    let postosNotificados = 0;
    let emailsEnviados = 0;

    for (const [postoId, docs] of documentosPorPosto.entries()) {
      const usuarios = await this.userRepo.listarPorPosto(postoId);
      const emails = [...new Set(
        usuarios
          .filter((usuario) => usuario.ativo && isPerfilDestino(usuario.perfil))
          .map((usuario) => usuario.email),
      )];

      if (emails.length === 0) {
        console.warn(`[notificacoes] posto ${postoId} sem destinatários para vencimentos`);
        continue;
      }

      const posto = await this.postoRepo.buscarPorId(postoId);
      if (!posto) {
        console.warn(`[notificacoes] posto ${postoId} não encontrado para vencimentos`);
        continue;
      }

      const enviado = await enviarEmailVencimentoDocumentos(
        emails,
        posto.nome,
        docs.map((doc) => ({
          titulo: doc.titulo,
          categoria: doc.categoria,
          dataVencimento: doc.dataVencimento,
          status: doc.status,
          diasRestantes: doc.diasRestantes,
        })),
      );

      if (!enviado) {
        console.error(`[notificacoes] falha ao enviar vencimentos do posto ${posto.nome}`);
        continue;
      }

      postosNotificados += 1;
      emailsEnviados += emails.length;
    }

    return {
      postosNotificados,
      emailsEnviados,
      documentosTotal: documentosProcessados.length,
    };
  }
}
