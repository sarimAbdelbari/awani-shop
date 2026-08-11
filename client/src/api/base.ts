const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

function getToken(): string | null {
  return localStorage.getItem('aw_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg = (data as { message?: string })?.message ?? 'Request failed'
    throw new Error(msg)
  }
  return data as T
}

export const apiFetch = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
