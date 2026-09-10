import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL, enviarJson, fetchJson } from "../api";

const CLAVE = ["solicitudes"];
const RUTA = `${API_URL}/api/v1/solicitudEdicion`;

export function useSolicitudes() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: () => fetchJson<any[]>(RUTA),
  });
}

export function useTomarDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string;
      decision: "aprobada" | "rechazada";
    }) => enviarJson(`${RUTA}/${id}/decision`, "PATCH", { decision }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}
