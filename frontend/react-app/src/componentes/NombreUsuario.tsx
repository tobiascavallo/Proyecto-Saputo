import { useState } from "react";
import { useNombreUsuario, useUsuarioBasico } from "../hooks/useUsuarios";
import { useCamioneroPorUsuario } from "../hooks/useCamioneros";

// NombreUsuario.tsx - Muestra el nombre de un usuario (típicamente un
// camionero) a partir de su ID, con un botón "Ver detalle" que trae el resto
// de sus datos (DNI, teléfono, empresa transportista) bajo demanda.
//
// El nombre sale del listado cacheado de usuarios cuando el rol logueado
// tiene acceso (encargado); si no (empleado), se muestra "Camionero". El
// detalle se pide recién al abrir el modal (queries con `enabled`), y
// TanStack Query lo cachea por ID: reabrir el mismo modal es instantáneo.
function NombreUsuario({ id }: { id: string }) {
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const nombreResuelto = useNombreUsuario(id);
  const usuarioQuery = useUsuarioBasico(id, mostrarDetalle);
  const camioneroQuery = useCamioneroPorUsuario(id, mostrarDetalle);

  const detalle = usuarioQuery.data;
  const camionero = camioneroQuery.data;
  const cargandoDetalle = usuarioQuery.isLoading || camioneroQuery.isLoading;
  // El dato que importa es el básico del usuario; si ese falla, es error.
  const errorDetalle = usuarioQuery.isError;

  return (
    <>
      <span className="me-2">{nombreResuelto ?? "Camionero"}</span>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={() => setMostrarDetalle(true)}
      >
        Ver detalle
      </button>

      {mostrarDetalle && (
        <div
          className="modal d-block"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setMostrarDetalle(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Datos del camionero</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMostrarDetalle(false)}
                />
              </div>
              <div className="modal-body">
                {cargandoDetalle && <p className="mb-0">Cargando...</p>}
                {!cargandoDetalle && errorDetalle && (
                  <p className="text-danger mb-0">
                    No se pudo obtener el detalle del camionero.
                  </p>
                )}
                {!cargandoDetalle && detalle && (
                  <>
                    <p className="mb-1">
                      <strong>Nombre:</strong> {detalle.nombre}{" "}
                      {detalle.apellido}
                    </p>
                    <p className="mb-1">
                      <strong>DNI:</strong> {detalle.dni || "—"}
                    </p>
                    <p className="mb-1">
                      <strong>Teléfono:</strong> {detalle.telefono || "—"}
                    </p>
                    <p className="mb-1">
                      <strong>Email:</strong> {detalle.email}
                    </p>
                    <p className="mb-1">
                      <strong>Rol:</strong> {detalle.rol}
                    </p>
                    <p className="mb-0">
                      <strong>Empresa transportista:</strong>{" "}
                      {camionero
                        ? camionero.empresa_transportista_nombre
                        : "Sin datos completados"}
                    </p>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setMostrarDetalle(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NombreUsuario;
