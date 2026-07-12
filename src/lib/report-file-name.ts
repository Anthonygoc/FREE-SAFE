const EMPTY_SLUG_FALLBACK = 'Relatorio';

export function slugifyReportPart(value: string | null | undefined): string {
  const normalized = (value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || EMPTY_SLUG_FALLBACK;
}

export function formatIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function resolveDateReference(value: Date | string | null | undefined): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

export function buildReportFileName(
  prefix: 'Afericao' | 'RAQ',
  postoNome: string | null | undefined,
  dataReferencia: Date | string | null | undefined,
  extension: 'pdf' | 'xlsx',
): string {
  return `${prefix}_${slugifyReportPart(postoNome)}_${formatIsoDate(resolveDateReference(dataReferencia))}.${extension}`;
}
