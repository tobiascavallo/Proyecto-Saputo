import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL, enviarJson, fetchJson, HttpError } from "../api";

const CLAVE = ["camioneros"];
const RUTA = `${API_URL}/api/v1/camionero`;

export function useCamioneros() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: () => fetchJson<any[]>(RUTA),
  });
}

// GET /api/v1/camionero/usuario/:usuarioId — se pide bajo demanda desde el
// modal de NombreUsuario. Un 404 significa "el camionero todavía no completó
// sus datos": para la UI no es un error, se muestra "sin datos completados",
// así que lo mapeamos a null en vez de dejar que la query quede en isError.
export function useCamioneroPorUsuario(usuarioId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["camioneroPorUsuario", usuarioId],
    queryFn: async () => {
      try {
        return await fetchJson<any>(`${RUTA}/usuario/${usuarioId}`);
      } catch (e) {
        if (e instanceof HttpError && e.status === 404) return null;
        throw e;
      }
    },
    enabled: enabled && !!usuarioId,
  });
}

// Tras crear/editar/(des)activar un camionero hay que invalidar dos cosas: el
// listado, y el detalle por-usuario que usa el modal de NombreUsuario (antes
// era invalidarCamionero(usuarioId) del contexto).
function invalidarCamioneros(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: CLAVE });
  qc.invalidateQueries({ queryKey: ["camioneroPorUsuario"] });
}

export function useCrearCamionero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => enviarJson(RUTA, "POST", body),
    onSuccess: () => invalidarCamioneros(qc),
  });
}

export function useActualizarCamionero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      enviarJson(`${RUTA}/${id}`, "PUT", body),
    onSuccess: () => invalidarCamioneros(qc),
  });
}

export function useActivarCamionero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enviarJson(`${RUTA}/${id}/activar`, "PATCH"),
    onSuccess: () => invalidarCamioneros(qc),
  });
}

export function useDesactivarCamionero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enviarJson(`${RUTA}/${id}`, "DELETE"),
    onSuccess: () => invalidarCamioneros(qc),
  });
}
