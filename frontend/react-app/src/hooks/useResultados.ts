import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL, enviarJson, fetchJson } from "../api";

const CLAVE = ["resultados"];
const RUTA = `${API_URL}/api/v1/resultadoAnalisis`;

// Listado completo de resultados de análisis. Lo consumen dos pantallas:
// ResultadosAnalisis.tsx (tabla + edición) y Remito.tsx (badge por línea en
// el detalle del remito) — misma key, mismo caché.
export function useResultados() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: () => fetchJson<any[]>(RUTA),
  });
}

// El Encargado corrige un resultado cargado erróneamente.
export function useActualizarResultado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      enviarJson(`${RUTA}/${id}`, "PUT", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}
