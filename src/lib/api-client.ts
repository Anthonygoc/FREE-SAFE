type RequestOptions = {
  headers?: HeadersInit;
  signal?: AbortSignal;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Erro HTTP ${response.status}`;

    try {
      const body = await response.json();
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // noop
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
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
