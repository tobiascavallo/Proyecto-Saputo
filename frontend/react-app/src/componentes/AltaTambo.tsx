import { useState } from "react";
import { useTamberos } from "../hooks/useTamberos";
import {
  useTambos,
  useCrearTambo,
  useActualizarTambo,
  useActivarTambo,
  useDesactivarTambo,
} from "../hooks/useTambos";

const FORM_VACIO = {
  numero_tambo: "",
  tambero_id: "",
};

function AltaTambo() {
  const { data: tamberos = [] } = useTamberos();
  const tambosQuery = useTambos();
  const tambos = tambosQuery.data ?? [];

  const crearTambo = useCrearTambo();
  const actualizarTambo = useActualizarTambo();
  const activarTambo = useActivarTambo();
  const desactivarTambo = useDesactivarTambo();

  const [vista, setVista] = useState<"listado" | "nuevo">("listado");
  const [filtroEstado, setFiltroEstado] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [errorAccion, setErrorAccion] = useState("");

  const tambosFiltrados = tambos.filter((t: any) => {
    if (filtroEstado === "activos") return t.activo;
    if (filtroEstado === "inactivos") return !t.activo;
    return true;
  });

  function iniciarEdicion(tambo: any) {
    setEditandoId(tambo.id);
    setForm({
      numero_tambo: String(tambo.numero_tambo),
      tambero_id: tambo.tambero_id,
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
    const body = {
      numero_tambo: Number(form.numero_tambo),
      tambero_id: form.tambero_id,
    };
    const alTerminar = {
      onSuccess: () => {
        setExito(
          editandoId
            ? "Tambo actualizado correctamente"
            : "Tambo creado correctamente",
        );
        setEditandoId(null);
        setForm(FORM_VACIO);
        setVista("listado");
      },
      onError: (e: Error) => setError(e.message),
    };

    if (editandoId) {
      actualizarTambo.mutate({ id: editandoId, body }, alTerminar);
    } else {
      crearTambo.mutate(body, alTerminar);
    }
  }

  function handleDesactivar(tambo: any) {
    if (!window.confirm(`¿Desactivar el tambo N° ${tambo.numero_tambo}?`)) {
      return;
    }
    setErrorAccion("");
    desactivarTambo.mutate(tambo.id, {
      onError: (e: Error) => setErrorAccion(e.message),
    });
  }

  function handleActivar(tambo: any) {
    if (!window.confirm(`¿Reactivar el tambo N° ${tambo.numero_tambo}?`)) {
      return;
    }
    setErrorAccion("");
    activarTambo.mutate(tambo.id, {
      onError: (e: Error) => setErrorAccion(e.message),
    });
  }

  const guardando = crearTambo.isPending || actualizarTambo.isPending;

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Tambos</h2>

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
            {editandoId ? "Editar tambo" : "Nuevo tambo"}
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

          {tambosQuery.isPending ? (
            <p>Cargando tambos...</p>
          ) : tambosQuery.isError ? (
            <p className="text-danger">Error al obtener los tambos.</p>
          ) : tambosFiltrados.length === 0 ? (
            <p className="text-muted">No hay tambos para mostrar.</p>
          ) : (
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>N° Tambo</th>
                  <th>Tambero</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tambosFiltrados.map((tambo: any) => (
                  <tr key={tambo.id}>
                    <td>{tambo.numero_tambo}</td>
                    <td>{tambo.tambero_nombre}</td>
                    <td>
                      {tambo.activo ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => iniciarEdicion(tambo)}
                        >
                          Editar
                        </button>
                        {tambo.activo ? (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDesactivar(tambo)}
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleActivar(tambo)}
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
              type="number"
              placeholder="Número de tambo"
              value={form.numero_tambo}
              onChange={(e) => setForm({ ...form, numero_tambo: e.target.value })}
              className="form-control mb-3"
            />

            <select
              value={form.tambero_id}
              onChange={(e) => setForm({ ...form, tambero_id: e.target.value })}
              className="form-select mb-3"
            >
              <option value="">Seleccionar tambero</option>
              {tamberos.map((tambero: any) => (
                <option key={tambero.id} value={tambero.id}>
                  {tambero.nombre}
                </option>
              ))}
            </select>

            <div className="d-flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={guardando}
                className="btn btn-primary flex-grow-1"
              >
                {editandoId ? "Guardar cambios" : "Crear tambo"}
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

export default AltaTambo;
