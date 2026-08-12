import { useState, useEffect, useCallback } from "react";
import { API_URL, fetchConToken } from "../api";
import { useDatosReferencia } from "../contextos/DatosReferenciaContext";

const FORM_VACIO = {
  patente: "",
  habilitacion_senasa: "",
  tipo: "",
  empresa_transportista_id: "",
};

function AltaAcoplado() {
  const { empresas } = useDatosReferencia();
  const [vista, setVista] = useState<"listado" | "nuevo">("listado");

  const [acoplados, setAcoplados] = useState<any[]>([]);
  const [cargandoListado, setCargandoListado] = useState(true);
  const [errorListado, setErrorListado] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const fetchAcoplados = useCallback(async () => {
    setCargandoListado(true);
    try {
      const response = await fetchConToken(`${API_URL}/api/v1/acoplado`);
      if (!response.ok) {
        setErrorListado("Error al obtener los acoplados");
        return;
      }
      const data = await response.json();
      setAcoplados(data || []);
    } catch (error) {
      setErrorListado("Error al conectar con el servidor");
    } finally {
      setCargandoListado(false);
    }
  }, []);

  useEffect(() => {
    fetchAcoplados();
  }, [fetchAcoplados]);

  const acopladosFiltrados = acoplados.filter((a: any) => {
    if (filtroEstado === "activos") return a.activo;
    if (filtroEstado === "inactivos") return !a.activo;
    return true;
  });

  function nombreEmpresa(id: string) {
    const empresa = empresas.find((e: any) => e.id === id);
    return empresa ? empresa.nombre : id;
  }

  function nombreTipo(tipo: string) {
    if (tipo === "acoplado") return "Acoplado";
    if (tipo === "semiremolque") return "Semirremolque";
    return tipo;
  }

  function iniciarEdicion(acoplado: any) {
    setEditandoId(acoplado.id);
    setForm({
      patente: acoplado.patente,
      habilitacion_senasa: acoplado.habilitacion_senasa,
      tipo: acoplado.tipo,
      empresa_transportista_id: acoplado.empresa_transportista_id,
    });
    setError("");
    setExito("");
    setVista("nuevo");
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setVista("listado");
  }

  async function handleSubmit() {
    try {
      const url = editandoId
        ? `${API_URL}/api/v1/acoplado/${editandoId}`
        : `${API_URL}/api/v1/acoplado`;

      const response = await fetchConToken(url, {
        method: editandoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(
          data.error ||
            (editandoId
              ? "Error al actualizar el acoplado"
              : "Error al crear el acoplado"),
        );
        return;
      }

      setExito(
        editandoId
          ? "Acoplado actualizado correctamente"
          : "Acoplado creado correctamente",
      );
      setEditandoId(null);
      setForm(FORM_VACIO);
      fetchAcoplados();
      setVista("listado");
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  async function handleDesactivar(acoplado: any) {
    if (!window.confirm(`¿Desactivar el acoplado ${acoplado.patente}?`)) {
      return;
    }

    try {
      const response = await fetchConToken(
        `${API_URL}/api/v1/acoplado/${acoplado.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json();
        setErrorListado(data.error || "Error al desactivar el acoplado");
        return;
      }

      fetchAcoplados();
    } catch (error) {
      setErrorListado("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Acoplados</h2>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${vista === "listado" ? "active" : ""}`}
            onClick={() => {
              setEditandoId(null);
              setForm(FORM_VACIO);
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
              if (!editandoId) setForm(FORM_VACIO);
              setVista("nuevo");
            }}
          >
            {editandoId ? "Editar acoplado" : "Nuevo acoplado"}
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
            <p>Cargando acoplados...</p>
          ) : errorListado ? (
            <p className="text-danger">{errorListado}</p>
          ) : acopladosFiltrados.length === 0 ? (
            <p className="text-muted">No hay acoplados para mostrar.</p>
          ) : (
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Patente</th>
                  <th>Habilitación SENASA</th>
                  <th>Tipo</th>
                  <th>Empresa transportista</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {acopladosFiltrados.map((acoplado: any) => (
                  <tr key={acoplado.id}>
                    <td>{acoplado.patente}</td>
                    <td>{acoplado.habilitacion_senasa}</td>
                    <td>{nombreTipo(acoplado.tipo)}</td>
                    <td>{nombreEmpresa(acoplado.empresa_transportista_id)}</td>
                    <td>
                      {acoplado.activo ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => iniciarEdicion(acoplado)}
                        >
                          Editar
                        </button>
                        {acoplado.activo && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDesactivar(acoplado)}
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
            <input
              type="text"
              placeholder="Patente"
              value={form.patente}
              onChange={(e) => setForm({ ...form, patente: e.target.value })}
              className="form-control mb-3"
            />
            <input
              type="text"
              placeholder="Habilitación SENASA"
              value={form.habilitacion_senasa}
              onChange={(e) =>
                setForm({ ...form, habilitacion_senasa: e.target.value })
              }
              className="form-control mb-3"
            />
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="form-select mb-3"
            >
              <option value="">Seleccionar tipo</option>
              <option value="acoplado">Acoplado</option>
              <option value="semiremolque">Semirremolque</option>
            </select>

            <select
              value={form.empresa_transportista_id}
              onChange={(e) =>
                setForm({ ...form, empresa_transportista_id: e.target.value })
              }
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
                {editandoId ? "Guardar cambios" : "Crear acoplado"}
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

            {error && <p className="text-danger mt-2">{error}</p>}
            {exito && <p className="text-success mt-2">{exito}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default AltaAcoplado;
