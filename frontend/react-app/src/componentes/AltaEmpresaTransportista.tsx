import { useState } from "react";
import {
  useEmpresas,
  useCrearEmpresa,
  useActualizarEmpresa,
  useActivarEmpresa,
  useDesactivarEmpresa,
} from "../hooks/useEmpresas";

const FORM_VACIO = {
  nombre: "",
  cuit: "",
  domicilio: "",
};

function AltaEmpresaTransportista() {
  const empresasQuery = useEmpresas();
  const empresas = empresasQuery.data ?? [];

  const crearEmpresa = useCrearEmpresa();
  const actualizarEmpresa = useActualizarEmpresa();
  const activarEmpresa = useActivarEmpresa();
  const desactivarEmpresa = useDesactivarEmpresa();

  const [vista, setVista] = useState<"listado" | "nuevo">("listado");
  const [filtroEstado, setFiltroEstado] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [errorAccion, setErrorAccion] = useState("");

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

  function handleSubmit() {
    setError("");
    const alTerminar = {
      onSuccess: () => {
        setExito(
          editandoId
            ? "Empresa transportista actualizada correctamente"
            : "Empresa transportista creada correctamente",
        );
        setEditandoId(null);
        setForm(FORM_VACIO);
        setVista("listado");
      },
      onError: (e: Error) => setError(e.message),
    };

    if (editandoId) {
      actualizarEmpresa.mutate({ id: editandoId, body: form }, alTerminar);
    } else {
      crearEmpresa.mutate(form, alTerminar);
    }
  }

  function handleDesactivar(empresa: any) {
    if (!window.confirm(`¿Desactivar la empresa "${empresa.nombre}"?`)) {
      return;
    }
    setErrorAccion("");
    desactivarEmpresa.mutate(empresa.id, {
      onError: (e: Error) => setErrorAccion(e.message),
    });
  }

  function handleActivar(empresa: any) {
    if (!window.confirm(`¿Reactivar la empresa "${empresa.nombre}"?`)) {
      return;
    }
    setErrorAccion("");
    activarEmpresa.mutate(empresa.id, {
      onError: (e: Error) => setErrorAccion(e.message),
    });
  }

  const guardando = crearEmpresa.isPending || actualizarEmpresa.isPending;

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

          {errorAccion && <p className="text-danger">{errorAccion}</p>}

          {empresasQuery.isPending ? (
            <p>Cargando empresas transportistas...</p>
          ) : empresasQuery.isError ? (
            <p className="text-danger">
              Error al obtener las empresas transportistas.
            </p>
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
                disabled={guardando}
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
