import { useState } from "react";
import Remitos from "./Remito";
import { useUsuarios } from "../hooks/useUsuarios";
import { useEmpresas } from "../hooks/useEmpresas";
import {
  useCamioneros,
  useCrearCamionero,
  useActualizarCamionero,
  useActivarCamionero,
  useDesactivarCamionero,
} from "../hooks/useCamioneros";

function AltaCamionero() {
  const [vista, setVista] = useState<"listado" | "nuevo">("listado");

  // Cuando está seteado, se reemplaza toda la vista de Camioneros por los
  // remitos de ese camionero puntual (ver Remito.tsx, prop camioneroId).
  const [camioneroSeleccionado, setCamioneroSeleccionado] = useState<{
    usuarioId: string;
    nombre: string;
  } | null>(null);

  const camionerosQuery = useCamioneros();
  const camioneros = camionerosQuery.data ?? [];
  const { data: usuarios = [] } = useUsuarios();
  const { data: empresas = [] } = useEmpresas();

  const crearCamionero = useCrearCamionero();
  const actualizarCamionero = useActualizarCamionero();
  const activarCamionero = useActivarCamionero();
  const desactivarCamionero = useDesactivarCamionero();

  const [filtroEstado, setFiltroEstado] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");

  // En alta, se elige el usuario de un <select>. En edición, el usuario
  // queda fijo (solo se muestra su nombre) — lo único editable es la empresa.
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoUsuarioNombre, setEditandoUsuarioNombre] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [errorAccion, setErrorAccion] = useState("");

  const camionerosFiltrados = camioneros.filter((c: any) => {
    if (filtroEstado === "activos") return c.activo;
    if (filtroEstado === "inactivos") return !c.activo;
    return true;
  });

  const usuariosConDatos = new Set(
    camioneros.filter((c: any) => c.activo).map((c: any) => c.usuario_id),
  );
  const usuariosSinDatos = usuarios.filter(
    (u: any) => u.rol === "camionero" && !usuariosConDatos.has(u.id),
  );

  function iniciarEdicion(camionero: any) {
    setEditandoId(camionero.id);
    setEditandoUsuarioNombre(camionero.usuario_nombre);
    setEmpresaId(camionero.empresa_transportista_id);
    setError("");
    setExito("");
    setVista("nuevo");
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setEditandoUsuarioNombre("");
    setUsuarioId("");
    setEmpresaId("");
    setVista("listado");
  }

  function handleSubmit() {
    if (!editandoId && !usuarioId) {
      setError("Seleccioná un camionero");
      return;
    }
    if (!empresaId) {
      setError("Seleccioná una empresa transportista");
      return;
    }
    setError("");

    const alTerminar = {
      onSuccess: () => {
        setExito(
          editandoId
            ? "Datos del camionero actualizados correctamente"
            : "Datos del camionero guardados correctamente",
        );
        setEditandoId(null);
        setEditandoUsuarioNombre("");
        setUsuarioId("");
        setEmpresaId("");
        setVista("listado");
      },
      onError: (e: Error) => setError(e.message),
    };

    if (editandoId) {
      actualizarCamionero.mutate(
        { id: editandoId, body: { empresa_transportista_id: empresaId } },
        alTerminar,
      );
    } else {
      crearCamionero.mutate(
        { usuario_id: usuarioId, empresa_transportista_id: empresaId },
        alTerminar,
      );
    }
  }

  function handleDesactivar(camionero: any) {
    if (
      !window.confirm(
        `¿Desactivar los datos de camionero de ${camionero.usuario_nombre}?`,
      )
    ) {
      return;
    }
    setErrorAccion("");
    desactivarCamionero.mutate(camionero.id, {
      onError: (e: Error) => setErrorAccion(e.message),
    });
  }

  function handleActivar(camionero: any) {
    if (
      !window.confirm(
        `¿Reactivar los datos de camionero de ${camionero.usuario_nombre}?`,
      )
    ) {
      return;
    }
    setErrorAccion("");
    activarCamionero.mutate(camionero.id, {
      onError: (e: Error) => setErrorAccion(e.message),
    });
  }

  const guardando = crearCamionero.isPending || actualizarCamionero.isPending;

  if (camioneroSeleccionado) {
    return (
      <Remitos
        camioneroId={camioneroSeleccionado.usuarioId}
        nombreCamionero={camioneroSeleccionado.nombre}
        onVolver={() => setCamioneroSeleccionado(null)}
      />
    );
  }

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Camioneros</h2>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${vista === "listado" ? "active" : ""}`}
            onClick={() => {
              cancelarEdicion();
              setVista("listado");
            }}
          >
            Listado
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${vista === "nuevo" ? "active" : ""}`}
            onClick={() => {
              if (!editandoId) {
                setUsuarioId("");
                setEmpresaId("");
              }
              setVista("nuevo");
            }}
          >
            {editandoId ? "Editar camionero" : "Nuevo camionero"}
          </button>
        </li>
      </ul>

      {vista === "listado" && (
        <>
          <div className="btn-group mb-3">
            <button
              className={`btn btn-sm ${filtroEstado === "activos" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setFiltroEstado("activos")}
            >
              Activos
            </button>
            <button
              className={`btn btn-sm ${filtroEstado === "inactivos" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setFiltroEstado("inactivos")}
            >
              Inactivos
            </button>
            <button
              className={`btn btn-sm ${filtroEstado === "todos" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setFiltroEstado("todos")}
            >
              Todos
            </button>
          </div>

          {errorAccion && <p className="text-danger">{errorAccion}</p>}

          {camionerosQuery.isPending ? (
            <p>Cargando camioneros...</p>
          ) : camionerosQuery.isError ? (
            <p className="text-danger">Error al obtener los camioneros.</p>
          ) : camionerosFiltrados.length === 0 ? (
            <p className="text-muted">No hay camioneros para mostrar.</p>
          ) : (
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Teléfono</th>
                  <th>Empresa transportista</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {camionerosFiltrados.map((camionero: any) => (
                  <tr key={camionero.id}>
                    <td>{camionero.usuario_nombre}</td>
                    <td>{camionero.usuario_dni || "—"}</td>
                    <td>{camionero.usuario_telefono || "—"}</td>
                    <td>{camionero.empresa_transportista_nombre}</td>
                    <td>
                      {camionero.activo ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => iniciarEdicion(camionero)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() =>
                            setCamioneroSeleccionado({
                              usuarioId: camionero.usuario_id,
                              nombre: camionero.usuario_nombre,
                            })
                          }
                        >
                          Ver remitos
                        </button>
                        {camionero.activo ? (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDesactivar(camionero)}
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleActivar(camionero)}
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {vista === "nuevo" && (
        <div className="row justify-content-center">
          <div className="col-md-5">
            {editandoId ? (
              <p className="text-muted">
                Editando la empresa transportista de{" "}
                <strong>{editandoUsuarioNombre}</strong>. El camionero
                asociado no se puede cambiar acá.
              </p>
            ) : usuariosSinDatos.length === 0 ? (
              <p className="text-muted">
                No hay camioneros pendientes de completar datos — todos los
                usuarios con rol camionero ya tienen una empresa transportista
                asignada.
              </p>
            ) : null}

            {(editandoId || usuariosSinDatos.length > 0) && (
              <>
                {!editandoId && (
                  <select
                    value={usuarioId}
                    onChange={(e) => setUsuarioId(e.target.value)}
                    className="form-select mb-3"
                  >
                    <option value="">Seleccionar camionero</option>
                    {usuariosSinDatos.map((usuario: any) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombre} {usuario.apellido}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={empresaId}
                  onChange={(e) => setEmpresaId(e.target.value)}
                  className="form-select mb-3"
                >
                  <option value="">Seleccionar empresa transportista</option>
                  {empresas.map((empresa: any) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </option>
                  ))}
                </select>

                <div className="d-flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={guardando}
                    className="btn btn-primary flex-grow-1"
                  >
                    {editandoId ? "Guardar cambios" : "Guardar datos del camionero"}
                  </button>
                  {editandoId && (
                    <button
                      className="btn btn-outline-secondary"
                      onClick={cancelarEdicion}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </>
            )}

            {error && <p className="text-danger mt-2">{error}</p>}
            {exito && <p className="text-success mt-2">{exito}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default AltaCamionero;
