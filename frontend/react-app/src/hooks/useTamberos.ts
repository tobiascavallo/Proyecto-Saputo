import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL, enviarJson, fetchJson } from "../api";

const CLAVE = ["tamberos"];
const RUTA = `${API_URL}/api/v1/tambero`;

export function useTamberos() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: () => fetchJson<any[]>(RUTA),
  });
}

export function useCrearTambero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => enviarJson(RUTA, "POST", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

// El backend actualiza tamberos con PATCH (ver main.go), no PUT.
export function useActualizarTambero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      enviarJson(`${RUTA}/${id}`, "PATCH", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useActivarTambero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enviarJson(`${RUTA}/${id}/activar`, "PATCH"),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useDesactivarTambero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enviarJson(`${RUTA}/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}
