/**
 * Shared API client.
 *
 * Centralizes the three things every call previously hand-rolled:
 *   1. the backend base URL (NEXT_PUBLIC_BACKEND_URL)
 *   2. Bearer-token injection from the auth store
 *   3. the `{ data, error }` response envelope + error handling
 *
 * Use the typed domain helpers in the sibling files (content.ts, skill.ts, …)
 * where they exist; fall back to the raw `api.get/post/...` for one-off calls.
 */
import { useAuthStore } from "@/lib/auth-store";

export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export class ApiError extends Error {
  status: number;
  /** Raw parsed body, when the server returned one. */
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface RequestOptions {
  /** Attach the Bearer token (default true). Set false for public endpoints. */
  auth?: boolean;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /** Return the full envelope instead of just `.data`. */
  raw?: boolean;
}

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  opts: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { ...opts.headers };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (opts.auth !== false) {
    const token = useAuthStore.getState().token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: opts.signal,
  });

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON response (e.g. 204) — leave json null
  }

  if (!res.ok) {
    const message =
      (json as { error?: string; message?: string } | null)?.error ||
      (json as { message?: string } | null)?.message ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, json);
  }

  if (opts.raw) return json as T;
  return ((json as { data?: T } | null)?.data ?? (json as T)) as T;
}

export const api = {
  get: <T = unknown>(path: string, opts?: RequestOptions) => request<T>("GET", path, undefined, opts),
  post: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("POST", path, body, opts),
  patch: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PATCH", path, body, opts),
  put: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PUT", path, body, opts),
  del: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("DELETE", path, body, opts),
};
