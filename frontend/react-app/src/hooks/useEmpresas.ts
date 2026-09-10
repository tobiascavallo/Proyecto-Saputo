import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL, enviarJson, fetchJson } from "../api";

// La query key va definida una sola vez acá — cualquier componente que llame
// useEmpresas() comparte el mismo caché. Escribirla mal en otro lado sería un
// cache miss silencioso, por eso vive en un solo lugar.
const CLAVE = ["empresas"];
const RUTA = `${API_URL}/api/v1/empresaTransportista`;

export function useEmpresas() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: () => fetchJson<any[]>(RUTA),
  });
}

export function useCrearEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => enviarJson(RUTA, "POST", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useActualizarEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      enviarJson(`${RUTA}/${id}`, "PUT", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useActivarEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enviarJson(`${RUTA}/${id}/activar`, "PATCH"),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useDesactivarEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enviarJson(`${RUTA}/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}
