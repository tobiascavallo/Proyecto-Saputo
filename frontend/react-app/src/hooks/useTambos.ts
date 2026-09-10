import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL, enviarJson, fetchJson } from "../api";

const CLAVE = ["tambos"];
const RUTA = `${API_URL}/api/v1/tambo`;

export function useTambos() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: () => fetchJson<any[]>(RUTA),
  });
}

// Resuelve el tambo a partir de su ID leyendo el listado ya cacheado —
// reemplaza a nombreTambo() del DatosReferenciaContext. Devuelve el ID crudo
// si todavía no cargó o el tambo no está.
export function useNombreTambo(): (id: string) => string {
  const { data } = useTambos();
  return (id: string) => {
    const tambo = data?.find((t: any) => t.id === id);
    if (!tambo) return id;
    return `N° ${tambo.numero_tambo} — ${tambo.tambero_nombre}`;
  };
}

export function useCrearTambo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => enviarJson(RUTA, "POST", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useActualizarTambo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      enviarJson(`${RUTA}/${id}`, "PATCH", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useActivarTambo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enviarJson(`${RUTA}/${id}/activar`, "PATCH"),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useDesactivarTambo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enviarJson(`${RUTA}/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}
