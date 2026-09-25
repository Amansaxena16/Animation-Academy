// Typed fetch wrapper for the Django API.
//
// - The access token lives only in memory (never localStorage).
// - The refresh token is an httpOnly cookie the browser sends to /auth/refresh/ by itself,
//   so every call uses credentials: "include".
// - A 401 on an authenticated call triggers one refresh (shared by concurrent calls), then a retry.

import type { components } from "@/types/api";

const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** Browsers use the public URL. The Next.js server may use a private one (API_INTERNAL_URL,
 *  e.g. http://backend:8000/api/v1 inside Docker) to skip the public internet. */
export const API_URL =
  (typeof window === "undefined" && process.env.API_INTERNAL_URL) ||
  PUBLIC_API_URL;

// Generated from the API schema by `npm run api-types` (src/types/api.ts).
export type Schemas = components["schemas"];
export type SessionUser = Schemas["User"];
export type Role = Schemas["RoleEnum"];
export type AuthPayload = Schemas["AccessToken"];

/** The API's single error shape: {"detail", "errors": {field: [messages]}, "code"?}. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public errors: Record<string, string[]> = {},
    public code?: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }

  /** First message for a field, for <Field error={...}>. */
  field(name: string): string | undefined {
    return this.errors[name]?.[0];
  }
}

let accessToken: string | null = null;
let refreshing: Promise<AuthPayload | null> | null = null;
const sessionEndedListeners = new Set<() => void>();

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Called when a refresh fails mid-session (e.g. logged out on another device). */
export function onSessionEnded(listener: () => void): () => void {
  sessionEndedListeners.add(listener);
  return () => {
    sessionEndedListeners.delete(listener);
  };
}

async function parse(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toError(status: number, data: unknown): ApiError {
  if (data && typeof data === "object" && "detail" in data) {
    const d = data as {
      detail: string;
      errors?: Record<string, string[]>;
      code?: string;
    };
    return new ApiError(status, d.detail, d.errors ?? {}, d.code);
  }
  return new ApiError(
    status,
    status >= 500
      ? "Something went wrong on our side. Please try again."
      : "Request failed.",
  );
}

/** Exchange the refresh cookie for a new access token. Concurrent callers share one request. */
export function refreshSession(): Promise<AuthPayload | null> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh/`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setAccessToken(null);
        return null;
      }
      const payload = (await res.json()) as AuthPayload;
      setAccessToken(payload.access);
      return payload;
    } catch {
      return null; // network error: leave the current token alone
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body, or FormData for uploads. */
  body?: unknown;
  /** Send the access token (default true). */
  auth?: boolean;
  signal?: AbortSignal;
  /** Next.js caching for server-side fetches of public data. */
  next?: { revalidate?: number | false; tags?: string[] };
}

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true, signal, next } = options;

  const send = () => {
    const headers: Record<string, string> = { Accept: "application/json" };
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined && !isForm)
      headers["Content-Type"] = "application/json";
    if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return fetch(`${API_URL}${path}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isForm
            ? (body as FormData)
            : JSON.stringify(body),
      credentials: "include",
      signal,
      next,
    });
  };

  let res = await send();

  if (res.status === 401 && auth && !path.startsWith("/auth/")) {
    const session = await refreshSession();
    if (session) {
      res = await send();
    } else {
      sessionEndedListeners.forEach((l) => l());
    }
  }

  const data = await parse(res);
  if (!res.ok) throw toError(res.status, data);
  return data as T;
}
