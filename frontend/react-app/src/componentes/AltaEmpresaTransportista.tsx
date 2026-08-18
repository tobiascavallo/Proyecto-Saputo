import { useState, useEffect, useCallback } from "react";
import { API_URL, fetchConToken } from "../api";
import { useDatosReferencia } from "../contextos/DatosReferenciaContext";

const FORM_VACIO = {
  nombre: "",
  cuit: "",
  domicilio: "",
};

function AltaEmpresaTransportista() {
  const { invalidarEmpresas } = useDatosReferencia();
  const [vista, setVista] = useState<"listado" | "nuevo">("listado");

  const [empresas, setEmpresas] = useState<any[]>([]);
  const [cargandoListado, setCargandoListado] = useState(true);
  const [errorListado, setErrorListado] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const fetchEmpresas = useCallback(async () => {
    setCargandoListado(true);
    try {
      const response = await fetchConToken(
        `${API_URL}/api/v1/empresaTransportista`,
      );
      if (!response.ok) {
        setErrorListado("Error al obtener las empresas transportistas");
        return;
      }
      const data = await response.json();
      setEmpresas(data || []);
    } catch (error) {
      setErrorListado("Error al conectar con el servidor");
    } finally {
      setCargandoListado(false);
    }
  }, []);

  useEffect(() => {
    fetchEmpresas();
  }, [fetchEmpresas]);

  const empresasFiltradas = empresas.filter((e: any) => {
    if (filtroEstado === "activos") return e.activo;
    if (filtroEstado === "inactivos") return !e.activo;
    return true;
  });

  function iniciarEdicion(empresa: any) {
    setEditandoId(empresa.id);
    setForm({
      nombre: empresa.nombre,
      cuit: empresa.cuit,
      domicilio: empresa.domicilio,
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
        ? `${API_URL}/api/v1/empresaTransportista/${editandoId}`
        : `${API_URL}/api/v1/empresaTransportista`;

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
              ? "Error al actualizar la empresa transportista"
              : "Error al crear la empresa transportista"),
        );
        return;
      }

      setExito(
        editandoId
          ? "Empresa transportista actualizada correctamente"
          : "Empresa transportista creada correctamente",
      );
      setEditandoId(null);
      setForm(FORM_VACIO);
      fetchEmpresas();

      // Solo en el alta: los <select> de AltaVehiculo.tsx/AltaAcoplado.tsx
      // leen el listado de empresas del contexto compartido, no de acá.
      if (!editandoId) {
        invalidarEmpresas();
      }

      setVista("listado");
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  async function handleDesactivar(empresa: any) {
    if (!window.confirm(`¿Desactivar la empresa "${empresa.nombre}"?`)) {
      return;
    }

    try {
      const response = await fetchConToken(
        `${API_URL}/api/v1/empresaTransportista/${empresa.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json();
        setErrorListado(data.error || "Error al desactivar la empresa");
        return;
      }

      setEmpresas((actuales) =>
        actuales.map((e) =>
          e.id === empresa.id ? { ...e, activo: false } : e,
        ),
      );
    } catch (error) {
      setErrorListado("Error al conectar con el servidor");
    }
  }

  async function handleActivar(empresa: any) {
    if (!window.confirm(`¿Reactivar la empresa "${empresa.nombre}"?`)) {
      return;
    }

    try {
      const response = await fetchConToken(
        `${API_URL}/api/v1/empresaTransportista/${empresa.id}/activar`,
        { method: "PATCH" },
      );

      if (!response.ok) {
        const data = await response.json();
        setErrorListado(data.error || "Error al reactivar la empresa");
        return;
      }

      setEmpresas((actuales) =>
        actuales.map((e) => (e.id === empresa.id ? { ...e, activo: true } : e)),
      );
    } catch (error) {
      setErrorListado("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Empresas transportistas</h2>

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
            {editandoId ? "Editar empresa" : "Nueva empresa"}
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
            <p>Cargando empresas transportistas...</p>
          ) : errorListado ? (
            <p className="text-danger">{errorListado}</p>
          ) : empresasFiltradas.length === 0 ? (
            <p className="text-muted">No hay empresas para mostrar.</p>
          ) : (
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Nombre</th>
                  <th>CUIT</th>
                  <th>Domicilio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empresasFiltradas.map((empresa: any) => (
                  <tr key={empresa.id}>
                    <td>{empresa.nombre}</td>
                    <td>{empresa.cuit}</td>
                    <td>{empresa.domicilio}</td>
                    <td>
                      {empresa.activo ? (
                        <span className="badge bg-success">Activa</span>
                      ) : (
                        <span className="badge bg-secondary">Inactiva</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => iniciarEdicion(empresa)}
                        >
                          Editar
                        </button>
                        {empresa.activo ? (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDesactivar(empresa)}
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleActivar(empresa)}
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
            <input
              type="text"
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="form-control mb-3"
            />
            <input
              type="text"
              placeholder="CUIT (ej: 30712345678)"
              value={form.cuit}
              onChange={(e) => setForm({ ...form, cuit: e.target.value })}
              className="form-control mb-3"
            />
            <input
              type="text"
              placeholder="Domicilio"
              value={form.domicilio}
              onChange={(e) => setForm({ ...form, domicilio: e.target.value })}
              className="form-control mb-3"
            />

            <div className="d-flex gap-2">
              <button
                onClick={handleSubmit}
                className="btn btn-primary flex-grow-1"
              >
                {editandoId ? "Guardar cambios" : "Crear empresa transportista"}
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

export default AltaEmpresaTransportista;
