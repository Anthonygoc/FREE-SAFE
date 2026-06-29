import { uploadArquivo } from '@/infrastructure/storage/storage.service';

type ProcessarUploadInput = {
  valor?: string | null;
  bucket: string;
  path: string;
};

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};

export async function processarUpload({
  valor,
  bucket,
  path,
}: ProcessarUploadInput): Promise<string | null> {
  if (valor == null) {
    return null;
  }

  if (isHttpUrl(valor)) {
    return valor;
  }

  if (!isDataUri(valor)) {
    console.warn('[upload] valor em formato não suportado para upload; mantendo como está');
    return valor;
  }

  try {
    const { buffer, contentType, extension } = parseDataUri(valor);
    const finalPath = hasExtension(path) ? path : `${path}.${extension}`;

    return await uploadArquivo({
      bucket,
      path: finalPath,
      conteudo: buffer,
      contentType,
    });
  } catch (error) {
    console.error('[upload] falha ao processar data-uri:', { bucket, path, error });
    return null;
  }
}

function isHttpUrl(valor: string): boolean {
  return /^https?:\/\//i.test(valor);
}

function isDataUri(valor: string): boolean {
  return /^data:[^;]+;base64,/i.test(valor);
}

function hasExtension(path: string): boolean {
  return /\.[a-z0-9]+$/i.test(path);
}

function parseDataUri(valor: string): { buffer: Buffer; contentType: string; extension: string } {
  const match = valor.match(/^data:([^;]+);base64,(.+)$/i);
  if (!match) {
    throw new Error('Data URI inválida');
  }

  const [, contentType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  const extension = CONTENT_TYPE_EXTENSIONS[contentType.toLowerCase()] ?? 'bin';

  return {
    buffer,
    contentType,
    extension,
  };
}
