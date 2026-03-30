const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Primitive = string | number | boolean;
type QueryValue = Primitive | undefined | null;

interface ApiEnvelope<T> {
  data: T;
  meta: {
    timestamp: string;
    path: string;
  };
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  retryOnUnauthorized?: boolean;
}

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function isEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  return 'data' in payload;
}

function buildHeaders(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers);
  if (!nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json');
  }

  return nextHeaders;
}

function appendQuery(path: string, query?: Record<string, QueryValue>) {
  if (!query) {
    return path;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    params.set(key, String(value));
  }

  const queryString = params.toString();
  if (!queryString) {
    return path;
  }

  return `${path}${path.includes('?') ? '&' : '?'}${queryString}`;
}

async function parsePayload<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message: string }).message)
        : `Request failed with status ${response.status}`;

    throw new ApiError(response.status, message, payload);
  }

  if (isEnvelope<T>(payload)) {
    return payload.data;
  }

  return payload as T;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = fetch(`${API_BASE}/store/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(),
    body: JSON.stringify({}),
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    body,
    headers,
    retryOnUnauthorized = true,
    credentials = 'include',
    ...rest
  } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    credentials,
    headers: buildHeaders(headers),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (
    response.status === 401 &&
    retryOnUnauthorized &&
    typeof window !== 'undefined' &&
    !path.startsWith('/store/auth/refresh')
  ) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiRequest<T>(path, {
        ...options,
        retryOnUnauthorized: false,
      });
    }
  }

  return parsePayload<T>(response);
}

export async function apiGet<T>(path: string, query?: Record<string, QueryValue>) {
  return apiRequest<T>(appendQuery(path, query), {
    method: 'GET',
  });
}

export async function apiPost<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, {
    method: 'POST',
    body,
  });
}

export async function apiPut<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, {
    method: 'PUT',
    body,
  });
}

export async function apiDelete<T>(path: string) {
  return apiRequest<T>(path, {
    method: 'DELETE',
  });
}

export async function apiGetServer<T>(path: string, query?: Record<string, QueryValue>) {
  const response = await fetch(`${API_BASE}${appendQuery(path, query)}`, {
    method: 'GET',
    cache: 'no-store',
    headers: buildHeaders(),
  });

  return parsePayload<T>(response);
}
