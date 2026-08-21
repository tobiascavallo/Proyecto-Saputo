import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// REEMPLAZA "192.168.0.185" CON LA IP LOCAL DE LA MÁQUINA EN LA RED LOCAL
// Importante: No usaremos "localhost" para que Expo Go desde tu teléfono pueda alcanzar la API en Go.
const DEV_API_URL = "http://192.168.0.213:8080/api/v1";

export const api = axios.create({
  baseURL: DEV_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// AuthContext registra acá su logout al montar, para que este módulo (que no
// es un componente y no puede usar el contexto) pueda cerrar la sesión desde
// el interceptor cuando el refresh token también venció.
type AuthFailureHandler = () => void | Promise<void>;
let authFailureHandler: AuthFailureHandler | null = null;
export function setAuthFailureHandler(handler: AuthFailureHandler) {
  authFailureHandler = handler;
}

// Interceptor para inyectar el Token JWT almacenado
api.interceptors.request.use(
  async (config) => {
    try {
      if (Platform.OS !== "web") {
        const jwt = await SecureStore.getItemAsync("user_token");
        if (jwt) {
          config.headers.Authorization = `Bearer ${jwt}`;
        }
      }
    } catch (error) {
      console.error("Error al recuperar el token de SecureStore:", error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Mismo criterio que fetchConToken en frontend/react-app/src/api.ts: ante un
// 401, pedir un token nuevo con el refresh token y reintentar la petición
// original — así el camionero no se queda afuera en medio de un viaje solo
// porque el JWT (de vida corta) expiró.
//
// El backend rota el refresh token en cada uso (uno nuevo por cada refresh,
// el anterior queda inválido). Si dos 401 llegan en paralelo — típico acá,
// TanStack Query dispara varias queries a la vez — no podemos refrescar dos
// veces: el segundo refresh usaría un token ya rotado y fallaría. Por eso
// se encola todo lo que llega mientras hay un refresh en curso.
let refrescando = false;
let cola: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

function resolverCola(error: unknown, token: string | null) {
  cola.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token as string);
  });
  cola = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // Ya hay un refresh en curso — esperamos el token nuevo en vez de
    // disparar otro refresh en paralelo.
    if (refrescando) {
      return new Promise<string>((resolve, reject) => {
        cola.push({ resolve, reject });
      }).then((token) => {
        originalRequest._retry = true;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    refrescando = true;

    try {
      const refreshToken = await SecureStore.getItemAsync(
        "user_refresh_token",
      );
      if (!refreshToken) {
        throw new Error("No hay refresh token guardado");
      }

      // axios.post directo (no "api.post"): usar la instancia con
      // interceptores acá reentraría en este mismo interceptor si el
      // refresh también da 401.
      const { data } = await axios.post(`${DEV_API_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      await SecureStore.setItemAsync("user_token", data.token);
      await SecureStore.setItemAsync("user_refresh_token", data.refresh_token);

      resolverCola(null, data.token);

      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return api(originalRequest);
    } catch (refreshError) {
      resolverCola(refreshError, null);
      // El refresh token también venció (o no existía) — no hay forma de
      // renovar la sesión, hay que volver a loguearse.
      await authFailureHandler?.();
      return Promise.reject(refreshError);
    } finally {
      refrescando = false;
    }
  },
);
