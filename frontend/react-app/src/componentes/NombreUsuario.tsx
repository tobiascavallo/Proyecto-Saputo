import { useState } from "react";
import { useDatosReferencia, type UsuarioBasico } from "../contextos/DatosReferenciaContext";

// NombreUsuario.tsx - Muestra el nombre de un usuario (típicamente un
// camionero) a partir de su ID.
//
// Si el rol logueado tiene acceso al listado completo de usuarios
// (encargado), el nombre sale directo del contexto, sin pedidos extra.
// Si no (empleado), no hay forma de resolver el nombre por adelantado —
// se muestra "Camionero" con un botón que trae el detalle puntual desde
// GET /api/v1/usuario/:id/basico, bajo demanda y cacheado.
function NombreUsuario({ id }: { id: string }) {
  const { nombreUsuario, obtenerUsuarioBasico } = useDatosReferencia();
  const [detalle, setDetalle] = useState<UsuarioBasico | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const nombre = nombreUsuario(id);

  if (nombre !== null) {
    return <>{nombre}</>;
  }

  async function abrirDetalle() {
    setMostrarDetalle(true);
    if (detalle) return;

    setCargandoDetalle(true);
    setErrorDetalle(false);
    const datos = await obtenerUsuarioBasico(id);
    if (datos) {
      setDetalle(datos);
    } else {
      setErrorDetalle(true);
    }
    setCargandoDetalle(false);
  }

  return (
    <>
      <span className="me-2 text-muted">Camionero</span>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={abrirDetalle}
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
                      <strong>Email:</strong> {detalle.email}
                    </p>
                    <p className="mb-0">
                      <strong>Rol:</strong> {detalle.rol}
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
