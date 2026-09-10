import { QueryClient } from "@tanstack/react-query";
import { HttpError } from "./api";

// Instancia única de TanStack Query para toda la app (la provee main.tsx).
// Equivale al QueryClient.ts de frontend/mobile-app, pero sin la parte de
// NetInfo/onlineManager ni networkMode "offlineFirst" — eso es solo del
// cliente móvil, que es offline-first. El web es online-first.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Los datos maestros (usuarios, empresas, tambos...) cambian poco.
      // 5 min sin marcar como "stale" = moverse entre secciones de Gestión
      // no dispara refetch.
      staleTime: 1000 * 60 * 5,
      // Cuánto se mantiene en memoria una query que ya nadie usa.
      gcTime: 1000 * 60 * 30,
      retry: (fallos, error) => {
        // No reintentar errores del cliente (400/401/403/404): el request no
        // va a andar mejor por repetirlo. Un 401 que llega hasta acá ya pasó
        // por el refresh de api.ts y falló, así que la sesión está vencida.
        if (
          error instanceof HttpError &&
          error.status >= 400 &&
          error.status < 500
        ) {
          return false;
        }
        // Red caída o 5xx: un reintento.
        return fallos < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
