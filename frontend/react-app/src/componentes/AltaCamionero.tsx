import { useState, useEffect, useCallback } from "react";
import { API_URL, fetchConToken } from "../api";
import { useDatosReferencia } from "../contextos/DatosReferenciaContext";
import Remitos from "./Remito";

function AltaCamionero() {
  const { invalidarCamionero } = useDatosReferencia();
  const [vista, setVista] = useState<"listado" | "nuevo">("listado");

  // Cuando está seteado, se reemplaza toda la vista de Camioneros por los
  // remitos de ese camionero puntual (ver Remito.tsx, prop camioneroId).
  const [camioneroSeleccionado, setCamioneroSeleccionado] = useState<{
    usuarioId: string;
    nombre: string;
  } | null>(null);

  const [camioneros, setCamioneros] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [cargandoListado, setCargandoListado] = useState(true);
  const [errorListado, setErrorListado] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");

  // En alta, se elige el usuario de un <select>. En edición, el usuario
  // queda fijo (solo se muestra su nombre) — lo único editable es la
  // empresa transportista.
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoUsuarioId, setEditandoUsuarioId] = useState("");
  const [editandoUsuarioNombre, setEditandoUsuarioNombre] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const fetchCamioneros = useCallback(async () => {
    setCargandoListado(true);
    try {
      const response = await fetchConToken(`${API_URL}/api/v1/camionero`);
      if (!response.ok) {
        setErrorListado("Error al obtener los camioneros");
        return;
      }
      const data = await response.json();
      setCamioneros(data || []);
    } catch (error) {
      setErrorListado("Error al conectar con el servidor");
    } finally {
      setCargandoListado(false);
    }
  }, []);

  useEffect(() => {
    fetchCamioneros();
  }, [fetchCamioneros]);

  // Traemos usuarios y empresas para armar los <select> del formulario
  // "Nuevo" — el listado de usuarios con rol camionero que todavía no
  // tienen datos cargados sale de cruzar ambas listas (ver usuariosSinDatos).
  useEffect(() => {
    async function fetchDatosReferencia() {
      try {
        const [responseUsuarios, responseEmpresas] = await Promise.all([
          fetchConToken(`${API_URL}/api/v1/usuario`),
          fetchConToken(`${API_URL}/api/v1/empresaTransportista`),
        ]);
        const dataUsuarios = await responseUsuarios.json();
        const dataEmpresas = await responseEmpresas.json();
        setUsuarios(dataUsuarios || []);
        setEmpresas(dataEmpresas || []);
      } catch (error) {
        setError("Error al cargar usuarios y empresas transportistas");
      }
    }

    fetchDatosReferencia();
  }, []);

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
    setEditandoUsuarioId(camionero.usuario_id);
    setEditandoUsuarioNombre(camionero.usuario_nombre);
    setEmpresaId(camionero.empresa_transportista_id);
    setError("");
    setExito("");
    setVista("nuevo");
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setEditandoUsuarioId("");
    setEditandoUsuarioNombre("");
    setUsuarioId("");
    setEmpresaId("");
    setVista("listado");
  }

  async function handleSubmit() {
    if (!editandoId && !usuarioId) {
      setError("Seleccioná un camionero");
      return;
    }
    if (!empresaId) {
      setError("Seleccioná una empresa transportista");
      return;
    }

    try {
      const url = editandoId
        ? `${API_URL}/api/v1/camionero/${editandoId}`
        : `${API_URL}/api/v1/camionero`;

      const body = editandoId
        ? { empresa_transportista_id: empresaId }
        : { usuario_id: usuarioId, empresa_transportista_id: empresaId };

      const response = await fetchConToken(url, {
        method: editandoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(
          data.error ||
            (editandoId
              ? "Error al actualizar los datos del camionero"
              : "Error al crear los datos del camionero"),
        );
        return;
      }

      invalidarCamionero(editandoId ? editandoUsuarioId : usuarioId);
      setExito(
        editandoId
          ? "Datos del camionero actualizados correctamente"
          : "Datos del camionero guardados correctamente",
      );
      setEditandoId(null);
      setEditandoUsuarioId("");
      setEditandoUsuarioNombre("");
      setUsuarioId("");
      setEmpresaId("");
      fetchCamioneros();
      setVista("listado");
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  async function handleDesactivar(camionero: any) {
    if (
      !window.confirm(
        `¿Desactivar los datos de camionero de ${camionero.usuario_nombre}?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetchConToken(
        `${API_URL}/api/v1/camionero/${camionero.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json();
        setErrorListado(data.error || "Error al desactivar el camionero");
        return;
      }

      invalidarCamionero(camionero.usuario_id);
      fetchCamioneros();
    } catch (error) {
      setErrorListado("Error al conectar con el servidor");
    }
  }

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

          {cargandoListado ? (
            <p>Cargando camioneros...</p>
          ) : errorListado ? (
            <p className="text-danger">{errorListado}</p>
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
                        {camionero.activo && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDesactivar(camionero)}
                          >
                            Desactivar
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
