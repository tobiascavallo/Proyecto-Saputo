import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL, enviarJson, fetchJson } from "../api";

const CLAVE = ["vehiculos"];
const RUTA = `${API_URL}/api/v1/vehiculo`;

export function useVehiculos() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: () => fetchJson<any[]>(RUTA),
  });
}

export function useCrearVehiculo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => enviarJson(RUTA, "POST", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useActualizarVehiculo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      enviarJson(`${RUTA}/${id}`, "PUT", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useActivarVehiculo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enviarJson(`${RUTA}/${id}/activar`, "PATCH"),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useDesactivarVehiculo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enviarJson(`${RUTA}/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}
