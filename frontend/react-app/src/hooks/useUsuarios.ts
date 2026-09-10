import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL, enviarJson, fetchJson, rolActual } from "../api";

const CLAVE = ["usuarios"];
const RUTA = `${API_URL}/api/v1/usuario`;

// GET /api/v1/usuario es solo-encargado (ver main.go). Para "empleado" el
// request siempre daría 403, así que la query no se dispara — data queda
// undefined y useNombreUsuario devuelve null (el que llama muestra un
// fallback).
export function useUsuarios() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: () => fetchJson<any[]>(RUTA),
    enabled: rolActual() === "encargado",
  });
}

// Resuelve "Nombre Apellido" a partir de un ID leyendo el listado cacheado —
// reemplaza a nombreUsuario() del DatosReferenciaContext. Mismo criterio que
// antes: si el listado no está disponible (empleado) devuelve null; si está
// pero el usuario no aparece, devuelve el ID crudo.
export function useNombreUsuario(id: string): string | null {
  const { data } = useUsuarios();
  if (!data) return null;
  const u = data.find((x: any) => x.id === id);
  return u ? `${u.nombre} ${u.apellido}` : id;
}

// GET /api/v1/usuario/:id/basico — accesible a empleado y encargado. Se pide
// bajo demanda (cuando se abre el modal de NombreUsuario), por eso `enabled`.
export function useUsuarioBasico(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["usuarioBasico", id],
    queryFn: () => fetchJson<any>(`${RUTA}/${id}/basico`),
    enabled: enabled && !!id,
  });
}

export function useCrearUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) =>
      enviarJson<{ id: string }>(RUTA, "POST", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useActualizarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      enviarJson(`${RUTA}/${id}`, "PUT", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useActivarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enviarJson(`${RUTA}/${id}/activar`, "PATCH"),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useDesactivarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enviarJson(`${RUTA}/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}
