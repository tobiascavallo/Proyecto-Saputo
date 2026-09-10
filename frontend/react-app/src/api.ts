import { jwtDecode } from "jwt-decode";

export const API_URL = "http://localhost:8080";

// HttpError lleva el status HTTP además del mensaje, para que queryClient.ts
// pueda decidir si reintentar (no tiene sentido reintentar un 4xx).
export class HttpError extends Error {
  status: number;
  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = "HttpError";
    this.status = status;
  }
}

// Rol del usuario logueado, sacado del JWT. Una sola copia para todo el
// frontend. Es solo para decidir qué mostrar/pedir en la UI; la
// autorización real está siempre en el backend.
export function rolActual(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return (jwtDecode(token) as { rol?: string }).rol ?? null;
  } catch {
    return null;
  }
}

// --- Refresh token: single-flight ---
// Si varias llamadas reciben 401 a la vez (típico al montar un panel, con
// varias queries en paralelo), todas esperan EL MISMO refresh en curso en vez
// de disparar uno cada una. El backend rota el refresh token en cada uso, así
// que dos refresh en paralelo con el mismo token harían que el segundo falle
// y deslogueara al usuario que recién había refrescado bien.
let refreshPromise: Promise<string> | null = null;

function refrescarToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem("refresh_token");
      const respuesta = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!respuesta.ok) {
        // El refresh token también venció — no hay forma de renovar la
        // sesión, hay que volver a loguearse.
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        throw new Error("Sesión expirada");
      }

      const data = await respuesta.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("refresh_token", data.refresh_token);
      return data.token as string;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// fetchConToken envuelve fetch: agrega el header Authorization, y si la
// respuesta es 401 renueva el token (una sola vez, compartido entre todas las
// llamadas concurrentes) y reintenta la llamada original con el token nuevo.
//
// Usarla en todas las llamadas autenticadas. Las únicas excepciones son login
// y logout (no hay token todavía, o se está cerrando sesión).
export async function fetchConToken(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("token");

  const respuesta = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });

  if (respuesta.status !== 401) {
    return respuesta;
  }

  const nuevoToken = await refrescarToken();

  return fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${nuevoToken}` },
  });
}

// fetchJson es lo que usan los queryFn/mutationFn de TanStack Query: chequea
// el status, tira HttpError con el mensaje del backend (data.error) y
// devuelve el JSON ya parseado y tipado por el que llama.
export async function fetchJson<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const respuesta = await fetchConToken(url, options);

  if (!respuesta.ok) {
    let mensaje = "Error en la solicitud";
    try {
      const data = await respuesta.json();
      mensaje = data.error || mensaje;
    } catch {
      // respuesta sin cuerpo JSON — se deja el mensaje genérico
    }
    throw new HttpError(respuesta.status, mensaje);
  }

  return respuesta.json();
}

// Atajo para mutaciones (POST/PUT/PATCH/DELETE): arma method + Content-Type +
// body JSON de una. Si no se pasa `body` (típico en DELETE o PATCH sin
// cuerpo), no manda headers ni body.
export function enviarJson<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  return fetchJson<T>(url, {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
}
