import { useState } from "react";
import { useEmpresas } from "../hooks/useEmpresas";
import {
  useAcoplados,
  useCrearAcoplado,
  useActualizarAcoplado,
  useActivarAcoplado,
  useDesactivarAcoplado,
} from "../hooks/useAcoplados";

const FORM_VACIO = {
  patente: "",
  habilitacion_senasa: "",
  tipo: "",
  empresa_transportista_id: "",
};

function AltaAcoplado() {
  const { data: empresas = [] } = useEmpresas();
  const acopladosQuery = useAcoplados();
  const acoplados = acopladosQuery.data ?? [];

  const crearAcoplado = useCrearAcoplado();
  const actualizarAcoplado = useActualizarAcoplado();
  const activarAcoplado = useActivarAcoplado();
  const desactivarAcoplado = useDesactivarAcoplado();

  const [vista, setVista] = useState<"listado" | "nuevo">("listado");
  const [filtroEstado, setFiltroEstado] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [errorAccion, setErrorAccion] = useState("");

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

  function handleSubmit() {
    setError("");
    const alTerminar = {
      onSuccess: () => {
        setExito(
          editandoId
            ? "Acoplado actualizado correctamente"
            : "Acoplado creado correctamente",
        );
        setEditandoId(null);
        setForm(FORM_VACIO);
        setVista("listado");
      },
      onError: (e: Error) => setError(e.message),
    };

    if (editandoId) {
      actualizarAcoplado.mutate({ id: editandoId, body: form }, alTerminar);
    } else {
      crearAcoplado.mutate(form, alTerminar);
    }
  }

  function handleDesactivar(acoplado: any) {
    if (!window.confirm(`¿Desactivar el acoplado ${acoplado.patente}?`)) {
      return;
    }
    setErrorAccion("");
    desactivarAcoplado.mutate(acoplado.id, {
      onError: (e: Error) => setErrorAccion(e.message),
    });
  }

  function handleActivar(acoplado: any) {
    if (!window.confirm(`¿Reactivar el acoplado ${acoplado.patente}?`)) {
      return;
    }
    setErrorAccion("");
    activarAcoplado.mutate(acoplado.id, {
      onError: (e: Error) => setErrorAccion(e.message),
    });
  }

  const guardando = crearAcoplado.isPending || actualizarAcoplado.isPending;

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

          {errorAccion && <p className="text-danger">{errorAccion}</p>}

          {acopladosQuery.isPending ? (
            <p>Cargando acoplados...</p>
          ) : acopladosQuery.isError ? (
            <p className="text-danger">Error al obtener los acoplados.</p>
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
                        {acoplado.activo ? (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDesactivar(acoplado)}
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleActivar(acoplado)}
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
                disabled={guardando}
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
