import { useEffect, useRef } from "react";
import { API_URL, fetchConToken } from "./api";

// sse.ts - Hook reutilizable para suscribirse a los eventos de tiempo real
// del backend (ver RecoleccionLactea/handlers/eventos.go).
//
// Resuelve todo el flujo de conexión:
//   1. Pide un ticket de un solo uso con el JWT normal (fetchConToken).
//   2. Abre el EventSource contra /api/v1/eventos?ticket=...
//   3. Expone los eventos de negocio como callbacks por tipo.
//   4. Si la conexión se corta (red, heartbeat perdido, etc.), el ticket ya
//      consumido no sirve para reconectar — así que en vez de dejar que el
//      EventSource reintente solo con la misma URL (fallaría con 401 siempre),
//      pedimos un ticket nuevo y reabrimos.

export type TipoEventoSSE =
  | "conectado"
  | "heartbeat"
  | "remito_sincronizado"
  | "remito_finalizado"
  | "solicitud_creada"
  | "solicitud_resuelta"
  | "resultado_cargado"
  | "resultado_actualizado";

type ManejadoresSSE = Partial<Record<TipoEventoSSE, (datos: any) => void>>;

const TIPOS_EVENTO: TipoEventoSSE[] = [
  "conectado",
  "heartbeat",
  "remito_sincronizado",
  "remito_finalizado",
  "solicitud_creada",
  "solicitud_resuelta",
  "resultado_cargado",
  "resultado_actualizado",
];

const REINTENTO_MS = 3000;

// useEventosSSE recibe un mapa { tipoDeEvento: callback } y mantiene la
// conexión abierta mientras el componente esté montado. El mapa puede
// cambiar en cada render sin que eso reabra la conexión: se guarda en un
// ref y se lee al vuelo cuando llega un evento.
export function useEventosSSE(manejadores: ManejadoresSSE) {
  const manejadoresRef = useRef(manejadores);
  manejadoresRef.current = manejadores;

  useEffect(() => {
    let cerrada = false;
    let eventSource: EventSource | null = null;
    let timeoutReintento: ReturnType<typeof setTimeout> | null = null;

    async function conectar() {
      if (cerrada) return;

      try {
        const response = await fetchConToken(
          `${API_URL}/api/v1/eventos/ticket`,
          { method: "POST" },
        );

        if (!response.ok) {
          throw new Error("No se pudo obtener el ticket de conexión SSE");
        }

        const { ticket } = await response.json();
        if (cerrada) return;

        const es = new EventSource(
          `${API_URL}/api/v1/eventos?ticket=${ticket}`,
        );
        eventSource = es;

        TIPOS_EVENTO.forEach((tipo) => {
          es.addEventListener(tipo, (evento: MessageEvent) => {
            const manejador = manejadoresRef.current[tipo];
            if (!manejador) return;
            manejador(evento.data ? JSON.parse(evento.data) : null);
          });
        });

        es.onerror = () => {
          es.close();
          if (!cerrada) {
            timeoutReintento = setTimeout(conectar, REINTENTO_MS);
          }
        };
      } catch {
        if (!cerrada) {
          timeoutReintento = setTimeout(conectar, REINTENTO_MS);
        }
      }
    }

    conectar();

    return () => {
      cerrada = true;
      if (timeoutReintento) clearTimeout(timeoutReintento);
      eventSource?.close();
    };
    // Se conecta una sola vez por montaje — los callbacks se leen del ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
