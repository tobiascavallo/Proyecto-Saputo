import { useState } from "react";
import {
  useDatosReferencia,
  type UsuarioBasico,
  type CamioneroBasico,
} from "../contextos/DatosReferenciaContext";

// NombreUsuario.tsx - Muestra el nombre de un usuario (típicamente un
// camionero) a partir de su ID, con un botón "Ver detalle" que trae el resto
// de sus datos (DNI, teléfono, empresa transportista) bajo demanda.
//
// El nombre sale directo del contexto cuando el rol logueado tiene acceso al
// listado completo de usuarios (encargado); si no (empleado), se muestra
// "Camionero" en su lugar. En ambos casos el botón funciona igual: pide el
// detalle puntual a GET /api/v1/usuario/:id/basico y GET
// /api/v1/camionero/usuario/:id, cacheado en el contexto.
function NombreUsuario({ id }: { id: string }) {
  const { nombreUsuario, obtenerUsuarioBasico, obtenerCamioneroPorUsuario } =
    useDatosReferencia();
  const [detalle, setDetalle] = useState<UsuarioBasico | null>(null);
  const [camionero, setCamionero] = useState<CamioneroBasico | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const nombreResuelto = nombreUsuario(id);

  async function abrirDetalle() {
    setMostrarDetalle(true);
    if (detalle) return; // ya se pidió antes, se reusa

    setCargandoDetalle(true);
    setErrorDetalle(false);
    const [datosUsuario, datosCamionero] = await Promise.all([
      obtenerUsuarioBasico(id),
      obtenerCamioneroPorUsuario(id),
    ]);
    if (datosUsuario) {
      setDetalle(datosUsuario);
      setCamionero(datosCamionero);
    } else {
      setErrorDetalle(true);
    }
    setCargandoDetalle(false);
  }

  return (
    <>
      <span className="me-2">{nombreResuelto ?? "Camionero"}</span>
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
