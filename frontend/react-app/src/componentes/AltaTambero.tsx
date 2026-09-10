import { useState } from "react";
import {
  useTamberos,
  useCrearTambero,
  useActualizarTambero,
  useActivarTambero,
  useDesactivarTambero,
} from "../hooks/useTamberos";

const FORM_VACIO = {
  nombre: "",
  cuit: "",
  telefono: "",
  email: "",
};

function AltaTambero() {
  const tamberosQuery = useTamberos();
  const tamberos = tamberosQuery.data ?? [];

  const crearTambero = useCrearTambero();
  const actualizarTambero = useActualizarTambero();
  const activarTambero = useActivarTambero();
  const desactivarTambero = useDesactivarTambero();

  const [vista, setVista] = useState<"listado" | "nuevo">("listado");
  const [filtroEstado, setFiltroEstado] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [errorAccion, setErrorAccion] = useState("");

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

  function handleSubmit() {
    setError("");
    const alTerminar = {
      onSuccess: () => {
        setExito(
          editandoId
            ? "Tambero actualizado correctamente"
            : "Tambero creado correctamente",
        );
        setEditandoId(null);
        setForm(FORM_VACIO);
        setVista("listado");
      },
      onError: (e: Error) => setError(e.message),
    };

    if (editandoId) {
      actualizarTambero.mutate({ id: editandoId, body: form }, alTerminar);
    } else {
      crearTambero.mutate(form, alTerminar);
    }
  }

  function handleDesactivar(tambero: any) {
    if (!window.confirm(`¿Desactivar a ${tambero.nombre}?`)) {
      return;
    }
    setErrorAccion("");
    desactivarTambero.mutate(tambero.id, {
      onError: (e: Error) => setErrorAccion(e.message),
    });
  }

  function handleActivar(tambero: any) {
    if (!window.confirm(`¿Reactivar a ${tambero.nombre}?`)) {
      return;
    }
    setErrorAccion("");
    activarTambero.mutate(tambero.id, {
      onError: (e: Error) => setErrorAccion(e.message),
    });
  }

  const guardando = crearTambero.isPending || actualizarTambero.isPending;

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

          {errorAccion && <p className="text-danger">{errorAccion}</p>}

          {tamberosQuery.isPending ? (
            <p>Cargando tamberos...</p>
          ) : tamberosQuery.isError ? (
            <p className="text-danger">Error al obtener los tamberos.</p>
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
                disabled={guardando}
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
