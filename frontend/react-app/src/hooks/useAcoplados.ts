import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL, enviarJson, fetchJson } from "../api";

const CLAVE = ["acoplados"];
const RUTA = `${API_URL}/api/v1/acoplado`;

export function useAcoplados() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: () => fetchJson<any[]>(RUTA),
  });
}

export function useCrearAcoplado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => enviarJson(RUTA, "POST", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useActualizarAcoplado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      enviarJson(`${RUTA}/${id}`, "PUT", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useActivarAcoplado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enviarJson(`${RUTA}/${id}/activar`, "PATCH"),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useDesactivarAcoplado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enviarJson(`${RUTA}/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}
