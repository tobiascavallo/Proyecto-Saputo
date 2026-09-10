import { useQuery } from "@tanstack/react-query";
import { API_URL, fetchJson } from "../api";

// Listado de remitos, filtrado en el backend por estado y (opcional) por
// camionero. La key incluye ambos filtros: cambiar cualquiera refetchea solo.
// "todos" es un valor solo del frontend — si se elige, no se manda ?estado=.
export function useRemitos(filtroEstado: string, camioneroId?: string) {
  return useQuery({
    queryKey: ["remitos", filtroEstado, camioneroId ?? null],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filtroEstado !== "todos") params.set("estado", filtroEstado);
      if (camioneroId) params.set("camionero_id", camioneroId);
      const q = params.toString();
      return fetchJson<any[]>(
        `${API_URL}/api/v1/remito${q ? `?${q}` : ""}`,
      );
    },
  });
}

// Líneas de recolección de un remito puntual — se pide cuando hay un remito
// seleccionado en el detalle (por eso `enabled`).
export function useLineasDeRemito(remitoId: string | undefined) {
  return useQuery({
    queryKey: ["lineasDeRemito", remitoId],
    queryFn: () =>
      fetchJson<any[]>(
        `${API_URL}/api/v1/lineaRecoleccion/remito/${remitoId}`,
      ),
    enabled: !!remitoId,
  });
}

// Lookups puntuales para la búsqueda por código de muestra. No son queries
// cacheadas: es un flujo imperativo (Enter en el input → buscar línea →
// buscar su remito → abrir el detalle).
export function buscarLineaPorCodigo(codigo: string) {
  return fetchJson<any>(
    `${API_URL}/api/v1/lineaRecoleccion/codigo?codigo=${encodeURIComponent(codigo)}`,
  );
}

export function obtenerRemitoPorId(id: string) {
  return fetchJson<any>(`${API_URL}/api/v1/remito/${id}`);
}
