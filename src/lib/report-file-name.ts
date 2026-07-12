const EMPTY_SLUG_FALLBACK = 'Relatorio';

export function slugifyReportPart(value: string): string {
  const normalized = value
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

export function buildReportFileName(
  prefix: 'Afericao' | 'RAQ',
  postoNome: string,
  dataReferencia: Date,
  extension: 'pdf' | 'xlsx',
): string {
  return `${prefix}_${slugifyReportPart(postoNome)}_${formatIsoDate(dataReferencia)}.${extension}`;
}
