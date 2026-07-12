import { subMilliseconds } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { AuditRecurso } from '@/domain/entities/audit-log.entity';
import { DomainError } from '@/domain/errors/domain.errors';
import type { AuditLogRepository } from '@/domain/ports/audit-log.repository';
import type { DocumentoRepository } from '@/domain/ports/documento.repository';
import { pad2, resolverPostoId, TIME_ZONE } from './calendario.shared';

export interface ListarCalendarioMesInput {
  usuario: UsuarioAutenticado;
  postoId?: string;
  ano: number;
  mes: number;
}

export interface ListarCalendarioMesTipoOutput {
  tipo: AuditRecurso;
  quantidade: number;
}

export interface ListarCalendarioMesDiaOutput {
  data: string;
  totalEventos: number;
  tipos: ListarCalendarioMesTipoOutput[];
  documentosVencendo: number;
}

export interface ListarCalendarioMesOutput {
  dias: ListarCalendarioMesDiaOutput[];
}

interface DiaAgrupado {
  data: string;
  totalEventos: number;
  tipos: Map<AuditRecurso, number>;
  documentosVencendo: number;
}

function validarCompetencia(ano: number, mes: number): void {
  if (!Number.isInteger(ano) || ano < 2000 || ano > 9999) {
    throw new DomainError('Ano inválido.');
  }

  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new DomainError('Mês inválido.');
  }
}

function calcularIntervaloAuditLogDoMes(
  ano: number,
  mes: number,
): { inicio: Date; fim: Date } {
  const inicio = fromZonedTime(`${ano}-${pad2(mes)}-01T00:00:00`, TIME_ZONE);
  const proximoAno = mes === 12 ? ano + 1 : ano;
  const proximoMes = mes === 12 ? 1 : mes + 1;
  const inicioMesSeguinte = fromZonedTime(
    `${proximoAno}-${pad2(proximoMes)}-01T00:00:00`,
    TIME_ZONE,
  );

  return {
    inicio,
    fim: subMilliseconds(inicioMesSeguinte, 1),
  };
}

function calcularIntervaloDocumentosDoMes(
  ano: number,
  mes: number,
): { inicio: Date; fim: Date } {
  const inicio = new Date(Date.UTC(ano, mes - 1, 1));
  const inicioMesSeguinte = new Date(Date.UTC(ano, mes, 1));

  return {
    inicio,
    fim: subMilliseconds(inicioMesSeguinte, 1),
  };
}

function formatarDataDocumento(data: Date): string {
  return `${data.getUTCFullYear()}-${pad2(data.getUTCMonth() + 1)}-${pad2(data.getUTCDate())}`;
}

function obterDia(
  dias: Map<string, DiaAgrupado>,
  data: string,
): DiaAgrupado {
  const existente = dias.get(data);
  if (existente) {
    return existente;
  }

  const novoDia: DiaAgrupado = {
    data,
    totalEventos: 0,
    tipos: new Map(),
    documentosVencendo: 0,
  };

  dias.set(data, novoDia);
  return novoDia;
}

export class ListarCalendarioMesUseCase {
  constructor(
    private readonly auditLogRepo: AuditLogRepository,
    private readonly documentoRepo: DocumentoRepository,
  ) {}

  async execute(input: ListarCalendarioMesInput): Promise<ListarCalendarioMesOutput> {
    validarCompetencia(input.ano, input.mes);

    const postoId = resolverPostoId(input.usuario, input.postoId);
    autorizar(input.usuario, 'calendario', 'ver', postoId);

    const intervaloAuditLog = calcularIntervaloAuditLogDoMes(input.ano, input.mes);
    const intervaloDocumentos = calcularIntervaloDocumentosDoMes(input.ano, input.mes);

    const [logs, documentos] = await Promise.all([
      this.auditLogRepo.listarPorIntervalo({
        postoId,
        inicio: intervaloAuditLog.inicio,
        fim: intervaloAuditLog.fim,
      }),
      this.documentoRepo.listarPorIntervaloVencimento({
        postoId,
        inicio: intervaloDocumentos.inicio,
        fim: intervaloDocumentos.fim,
      }),
    ]);

    const dias = new Map<string, DiaAgrupado>();

    for (const log of logs) {
      const data = formatInTimeZone(log.criadoEm, TIME_ZONE, 'yyyy-MM-dd');
      const dia = obterDia(dias, data);

      dia.totalEventos += 1;
      dia.tipos.set(log.recurso, (dia.tipos.get(log.recurso) ?? 0) + 1);
    }

    for (const documento of documentos) {
      if (!documento.dataVencimento) {
        continue;
      }

      // Documento.dataVencimento vem de @db.Date, então preservamos a data civil sem rezone.
      const data = formatarDataDocumento(documento.dataVencimento);
      const dia = obterDia(dias, data);

      dia.totalEventos += 1;
      dia.documentosVencendo += 1;
    }

    return {
      dias: Array.from(dias.values())
        .sort((a, b) => a.data.localeCompare(b.data))
        .map((dia) => ({
          data: dia.data,
          totalEventos: dia.totalEventos,
          tipos: Array.from(dia.tipos.entries())
            .sort(([tipoA], [tipoB]) => tipoA.localeCompare(tipoB))
            .map(([tipo, quantidade]) => ({ tipo, quantidade })),
          documentosVencendo: dia.documentosVencendo,
        })),
    };
  }
}
