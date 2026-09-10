import { useQueryClient } from "@tanstack/react-query";
import { useEventosSSE } from "../sse";

// useSincronizacionSSE - Punto ÚNICO de suscripción a los eventos de tiempo
// real para los paneles web (Encargado / Empleado). Se llama una sola vez por
// panel, así hay una única conexión EventSource abierta.
//
// Antes cada pantalla (Remito, SolicitudesEdicion, ResultadosAnalisis) abría
// su propia conexión y refrescaba su propio estado con un fetch. Ahora cada
// evento invalida la query key que corresponde y TanStack se encarga:
// refetchea las queries activas y marca stale las que no lo están (se
// refrescan solas al volver a esa pantalla). Ventaja concreta: si llega
// `linea_creada` mientras el encargado está en la pestaña Solicitudes, el
// caché de remitos queda stale igual y se actualiza al volver.
//
// Los callbacks opcionales (onSolicitudCreada / onSolicitudResuelta) son para
// que el panel muestre un aviso al usuario — eso no lo puede hacer TanStack.
export function useSincronizacionSSE(opciones?: {
  onSolicitudCreada?: (datos: any) => void;
  onSolicitudResuelta?: (datos: any) => void;
}) {
  const qc = useQueryClient();

  useEventosSSE({
    // --- Remitos ---
    remito_creado: () => qc.invalidateQueries({ queryKey: ["remitos"] }),
    remito_sincronizado: () =>
      qc.invalidateQueries({ queryKey: ["remitos"] }),
    remito_finalizado: () => qc.invalidateQueries({ queryKey: ["remitos"] }),

    // --- Líneas de recolección ---
    // El evento trae { lineaId, remitoId }. Si viene el remito invalidamos
    // solo ese detalle; si no, todos. Una línea nueva arrastra su resultado
    // de análisis (pendiente), por eso también invalidamos ["resultados"].
    linea_creada: (datos: any) => {
      if (datos?.remitoId) {
        qc.invalidateQueries({
          queryKey: ["lineasDeRemito", datos.remitoId],
        });
      } else {
        qc.invalidateQueries({ queryKey: ["lineasDeRemito"] });
      }
      qc.invalidateQueries({ queryKey: ["resultados"] });
    },
    linea_actualizada: () => {
      qc.invalidateQueries({ queryKey: ["lineasDeRemito"] });
      qc.invalidateQueries({ queryKey: ["resultados"] });
    },

    // --- Solicitudes de edición ---
    solicitud_creada: (datos: any) => {
      qc.invalidateQueries({ queryKey: ["solicitudes"] });
      opciones?.onSolicitudCreada?.(datos);
    },
    solicitud_resuelta: (datos: any) => {
      qc.invalidateQueries({ queryKey: ["solicitudes"] });
      opciones?.onSolicitudResuelta?.(datos);
    },

    // --- Resultados de análisis ---
    resultado_cargado: () =>
      qc.invalidateQueries({ queryKey: ["resultados"] }),
    resultado_actualizado: () =>
      qc.invalidateQueries({ queryKey: ["resultados"] }),
  });
}
