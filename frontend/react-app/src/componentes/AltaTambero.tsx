import { useState, useEffect, useCallback } from "react";
import { API_URL, fetchConToken } from "../api";
import { useDatosReferencia } from "../contextos/DatosReferenciaContext";

const FORM_VACIO = {
  nombre: "",
  cuit: "",
  telefono: "",
  email: "",
};

function AltaTambero() {
  const { invalidarTamberos } = useDatosReferencia();
  const [vista, setVista] = useState<"listado" | "nuevo">("listado");

  const [tamberos, setTamberos] = useState<any[]>([]);
  const [cargandoListado, setCargandoListado] = useState(true);
  const [errorListado, setErrorListado] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const fetchTamberos = useCallback(async () => {
    setCargandoListado(true);
    try {
      const response = await fetchConToken(`${API_URL}/api/v1/tambero`);
      if (!response.ok) {
        setErrorListado("Error al obtener los tamberos");
        return;
      }
      const data = await response.json();
      setTamberos(data || []);
    } catch (error) {
      setErrorListado("Error al conectar con el servidor");
    } finally {
      setCargandoListado(false);
    }
  }, []);

  useEffect(() => {
    fetchTamberos();
  }, [fetchTamberos]);

  const tamberosFiltrados = tamberos.filter((t: any) => {
    if (filtroEstado === "activos") return t.activo;
    if (filtroEstado === "inactivos") return !t.activo;
    return true;
  });

  function iniciarEdicion(tambero: any) {
    setEditandoId(tambero.id);
    setForm({
      nombre: tambero.nombre,
      cuit: tambero.cuit,
      telefono: tambero.telefono,
      email: tambero.email,
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
        ? `${API_URL}/api/v1/tambero/${editandoId}`
        : `${API_URL}/api/v1/tambero`;

      const response = await fetchConToken(url, {
        method: editandoId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(
          data.error ||
            (editandoId
              ? "Error al actualizar el tambero"
              : "Error al crear el tambero"),
        );
        return;
      }

      setExito(
        editandoId
          ? "Tambero actualizado correctamente"
          : "Tambero creado correctamente",
      );
      setEditandoId(null);
      setForm(FORM_VACIO);
      fetchTamberos();

      // Solo en el alta: el <select> de AltaTambo.tsx lee el listado de
      // tamberos del contexto compartido, no de este fetch local.
      if (!editandoId) {
        invalidarTamberos();
      }

      setVista("listado");
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  async function handleDesactivar(tambero: any) {
    if (!window.confirm(`¿Desactivar a ${tambero.nombre}?`)) {
      return;
    }

    try {
      const response = await fetchConToken(
        `${API_URL}/api/v1/tambero/${tambero.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json();
        setErrorListado(data.error || "Error al desactivar el tambero");
        return;
      }

      setTamberos((actuales) =>
        actuales.map((t) =>
          t.id === tambero.id ? { ...t, activo: false } : t,
        ),
      );
    } catch (error) {
      setErrorListado("Error al conectar con el servidor");
    }
  }

  async function handleActivar(tambero: any) {
    if (!window.confirm(`¿Reactivar a ${tambero.nombre}?`)) {
      return;
    }

    try {
      const response = await fetchConToken(
        `${API_URL}/api/v1/tambero/${tambero.id}/activar`,
        { method: "PATCH" },
      );

      if (!response.ok) {
        const data = await response.json();
        setErrorListado(data.error || "Error al reactivar el tambero");
        return;
      }

      setTamberos((actuales) =>
        actuales.map((t) => (t.id === tambero.id ? { ...t, activo: true } : t)),
      );
    } catch (error) {
      setErrorListado("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Tamberos</h2>

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
            {editandoId ? "Editar tambero" : "Nuevo tambero"}
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
            <p>Cargando tamberos...</p>
          ) : errorListado ? (
            <p className="text-danger">{errorListado}</p>
          ) : tamberosFiltrados.length === 0 ? (
            <p className="text-muted">No hay tamberos para mostrar.</p>
          ) : (
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Nombre</th>
                  <th>CUIT</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tamberosFiltrados.map((tambero: any) => (
                  <tr key={tambero.id}>
                    <td>{tambero.nombre}</td>
                    <td>{tambero.cuit}</td>
                    <td>{tambero.telefono}</td>
                    <td>{tambero.email}</td>
                    <td>
                      {tambero.activo ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => iniciarEdicion(tambero)}
                        >
                          Editar
                        </button>
                        {tambero.activo ? (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDesactivar(tambero)}
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleActivar(tambero)}
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
              placeholder="CUIT"
              value={form.cuit}
              onChange={(e) => setForm({ ...form, cuit: e.target.value })}
              className="form-control mb-3"
            />
            <input
              type="text"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="form-control mb-3"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="form-control mb-3"
            />

            <div className="d-flex gap-2">
              <button
                onClick={handleSubmit}
                className="btn btn-primary flex-grow-1"
              >
                {editandoId ? "Guardar cambios" : "Crear tambero"}
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

export default AltaTambero;
