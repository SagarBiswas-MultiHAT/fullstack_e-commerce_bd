import { apiGet, apiPost } from './api';

export async function login(email: string, password: string) {
  return apiPost<{ customer: Record<string, unknown> }>('/store/auth/login', {
    email,
    password,
  });
}

export async function logout() {
  return apiPost<{ success: boolean }>('/store/auth/logout', {});
}

export async function getUser() {
  try {
    const response = await apiGet<Record<string, unknown>>('/store/auth/me');
    return response;
  } catch {
    return null;
  }
}

export async function isAuthenticated() {
  const user = await getUser();
  return Boolean(user);
}

export async function refreshSession() {
  return apiPost<{ customer: Record<string, unknown> }>('/store/auth/refresh', {});
}
