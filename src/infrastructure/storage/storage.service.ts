import { getSupabaseStorageClient } from './supabase-storage.client';

type UploadArquivoInput = {
  bucket: string;
  path: string;
  conteudo: Buffer;
  contentType: string;
};

export async function uploadArquivo({
  bucket,
  path,
  conteudo,
  contentType,
}: UploadArquivoInput): Promise<string | null> {
  const client = getSupabaseStorageClient();
  if (!client) {
    console.warn('[storage] upload ignorado (sem client):', bucket, path);
    return null;
  }

  try {
    const { error } = await client.storage.from(bucket).upload(path, conteudo, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.error('[storage] erro ao fazer upload:', { bucket, path, error });
      return null;
    }

    return obterUrlPublica(bucket, path);
  } catch (error) {
    console.error('[storage] exceção ao fazer upload:', { bucket, path, error });
    return null;
  }
}

export async function removerArquivo(bucket: string, path: string): Promise<boolean> {
  const client = getSupabaseStorageClient();
  if (!client) {
    console.warn('[storage] remoção ignorada (sem client):', bucket, path);
    return false;
  }

  try {
    const { error } = await client.storage.from(bucket).remove([path]);

    if (error) {
      console.error('[storage] erro ao remover arquivo:', { bucket, path, error });
      return false;
    }

    return true;
  } catch (error) {
    console.error('[storage] exceção ao remover arquivo:', { bucket, path, error });
    return false;
  }
}

export function obterUrlPublica(bucket: string, path: string): string | null {
  const client = getSupabaseStorageClient();
  if (!client) {
    console.warn('[storage] URL pública indisponível (sem client):', bucket, path);
    return null;
  }

  try {
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl ?? null;
  } catch (error) {
    console.error('[storage] exceção ao obter URL pública:', { bucket, path, error });
    return null;
  }
}
