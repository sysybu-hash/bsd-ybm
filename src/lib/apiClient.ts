const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const USE_AUTH = process.env.NEXT_PUBLIC_USE_API_AUTH === 'true';

export type ApiClientOptions = RequestInit & {
  token?: string | null;
};

export async function fetchApi<T = unknown>(
  path: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { token, ...init } = options;
  const url = path.startsWith('http') ? path : `${BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (USE_AUTH && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as { message?: string }).message || res.statusText || 'API error');
  }

  return data as T;
}

export function isApiConfigured(): boolean {
  return !!BASE_URL;
}

export function isApiAuthEnabled(): boolean {
  return USE_AUTH;
}
