type RequestOptions = {
  headers?: HeadersInit;
  signal?: AbortSignal;
};

function getDefaultErrorMessage() {
  return 'Ocorreu um erro. Tente novamente.';
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = getDefaultErrorMessage();

    try {
      const body = await response.json() as { mensagem?: string; error?: string };
      if (body?.mensagem) {
        message = body.mensagem;
      } else if (typeof body?.error === 'string' && body.error.trim()) {
        message = body.error;
      }
    } catch {
      // noop
    }

    if (response.status === 401 && typeof window !== 'undefined') {
      const callbackUrl = `${window.location.pathname}${window.location.search}`;
      const redirectUrl = `/login?erro=sessao-expirada&callbackUrl=${encodeURIComponent(callbackUrl)}`;
      window.location.assign(redirectUrl);
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = (await response.json()) as { data?: T };
  return (json.data ?? (json as T)) as T;
}

export const apiClient = {
  get<T>(url: string, options?: RequestOptions) {
    return request<T>(url, { method: 'GET', ...options });
  },
  post<T>(url: string, body?: unknown, options?: RequestOptions) {
    return request<T>(url, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
      ...options,
    });
  },
  patch<T>(url: string, body?: unknown, options?: RequestOptions) {
    return request<T>(url, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
      ...options,
    });
  },
  delete<T>(url: string, options?: RequestOptions) {
    return request<T>(url, { method: 'DELETE', ...options });
  },
};
