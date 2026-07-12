import { subMilliseconds } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError } from '@/domain/errors/domain.errors';
import { ForbiddenError } from '@/domain/errors/forbidden.error';

export const TIME_ZONE = 'America/Cuiaba';

const DATA_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function resolverPostoId(
  usuario: UsuarioAutenticado,
  postoId?: string,
): string | undefined {
  if (usuario.perfil !== 'GERENTE') {
    return postoId;
  }

  if (!usuario.postoId) {
    throw new ForbiddenError('Você só pode acessar dados do seu posto');
  }

  return usuario.postoId;
}

function parseDataCivil(data: string): { ano: number; mes: number; dia: number } {
  const match = DATA_REGEX.exec(data);
  if (!match) {
    throw new DomainError('Data inválida.');
  }

  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  const dataUtc = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    dataUtc.getUTCFullYear() !== ano
    || dataUtc.getUTCMonth() !== mes - 1
    || dataUtc.getUTCDate() !== dia
  ) {
    throw new DomainError('Data inválida.');
  }

  return { ano, mes, dia };
}

export function calcularIntervaloAuditLogDoDia(data: string): { inicio: Date; fim: Date } {
  const { ano, mes, dia } = parseDataCivil(data);
  const inicio = fromZonedTime(`${ano}-${pad2(mes)}-${pad2(dia)}T00:00:00`, TIME_ZONE);
  const proximoDia = new Date(Date.UTC(ano, mes - 1, dia + 1));
  const inicioProximoDia = fromZonedTime(
    `${proximoDia.getUTCFullYear()}-${pad2(proximoDia.getUTCMonth() + 1)}-${pad2(proximoDia.getUTCDate())}T00:00:00`,
    TIME_ZONE,
  );

  return {
    inicio,
    fim: subMilliseconds(inicioProximoDia, 1),
  };
}

export function calcularIntervaloDocumentosDoDia(data: string): { inicio: Date; fim: Date } {
  const { ano, mes, dia } = parseDataCivil(data);
  const inicio = new Date(Date.UTC(ano, mes - 1, dia));
  const inicioProximoDia = new Date(Date.UTC(ano, mes - 1, dia + 1));

  return {
    inicio,
    fim: subMilliseconds(inicioProximoDia, 1),
  };
}
