import { useState } from "react";
import { useEmpresas } from "../hooks/useEmpresas";
import {
  useVehiculos,
  useCrearVehiculo,
  useActualizarVehiculo,
  useActivarVehiculo,
  useDesactivarVehiculo,
} from "../hooks/useVehiculos";

const FORM_VACIO = {
  patente: "",
  habilitacion_senasa: "",
  tipo: "",
  tiene_cisterna_propia: false,
  empresa_transportista_id: "",
};

function AltaVehiculo() {
  const { data: empresas = [] } = useEmpresas();
  const vehiculosQuery = useVehiculos();
  const vehiculos = vehiculosQuery.data ?? [];

  const crearVehiculo = useCrearVehiculo();
  const actualizarVehiculo = useActualizarVehiculo();
  const activarVehiculo = useActivarVehiculo();
  const desactivarVehiculo = useDesactivarVehiculo();

  const [vista, setVista] = useState<"listado" | "nuevo">("listado");
  const [filtroEstado, setFiltroEstado] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [errorAccion, setErrorAccion] = useState("");

  const vehiculosFiltrados = vehiculos.filter((v: any) => {
    if (filtroEstado === "activos") return v.activo;
    if (filtroEstado === "inactivos") return !v.activo;
    return true;
  });

  function nombreEmpresa(id: string) {
    const empresa = empresas.find((e: any) => e.id === id);
    return empresa ? empresa.nombre : id;
  }

  function nombreTipo(tipo: string) {
    if (tipo === "camion") return "Camión";
    if (tipo === "tractor_semirremolque") return "Tractor semirremolque";
    return tipo;
  }

  function iniciarEdicion(vehiculo: any) {
    setEditandoId(vehiculo.id);
    setForm({
      patente: vehiculo.patente,
      habilitacion_senasa: vehiculo.habilitacion_senasa,
      tipo: vehiculo.tipo,
      tiene_cisterna_propia: vehiculo.tiene_cisterna_propia,
      empresa_transportista_id: vehiculo.empresa_transportista_id,
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
            ? "Vehículo actualizado correctamente"
            : "Vehículo creado correctamente",
        );
        setEditandoId(null);
        setForm(FORM_VACIO);
        setVista("listado");
      },
      onError: (e: Error) => setError(e.message),
    };

    if (editandoId) {
      actualizarVehiculo.mutate({ id: editandoId, body: form }, alTerminar);
    } else {
      crearVehiculo.mutate(form, alTerminar);
    }
  }

  function handleDesactivar(vehiculo: any) {
    if (!window.confirm(`¿Desactivar el vehículo ${vehiculo.patente}?`)) {
      return;
    }
    setErrorAccion("");
    desactivarVehiculo.mutate(vehiculo.id, {
      onError: (e: Error) => setErrorAccion(e.message),
    });
  }

  function handleActivar(vehiculo: any) {
    if (!window.confirm(`¿Reactivar el vehículo ${vehiculo.patente}?`)) {
      return;
    }
    setErrorAccion("");
    activarVehiculo.mutate(vehiculo.id, {
      onError: (e: Error) => setErrorAccion(e.message),
    });
  }

  const guardando = crearVehiculo.isPending || actualizarVehiculo.isPending;

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Vehículos</h2>

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
            {editandoId ? "Editar vehículo" : "Nuevo vehículo"}
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

          {vehiculosQuery.isPending ? (
            <p>Cargando vehículos...</p>
          ) : vehiculosQuery.isError ? (
            <p className="text-danger">Error al obtener los vehículos.</p>
          ) : vehiculosFiltrados.length === 0 ? (
            <p className="text-muted">No hay vehículos para mostrar.</p>
          ) : (
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Patente</th>
                  <th>Habilitación SENASA</th>
                  <th>Tipo</th>
                  <th>Cisterna propia</th>
                  <th>Empresa transportista</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehiculosFiltrados.map((vehiculo: any) => (
                  <tr key={vehiculo.id}>
                    <td>{vehiculo.patente}</td>
                    <td>{vehiculo.habilitacion_senasa}</td>
                    <td>{nombreTipo(vehiculo.tipo)}</td>
                    <td>
                      {vehiculo.tiene_cisterna_propia ? (
                        <span className="badge bg-success">Sí</span>
                      ) : (
                        <span className="badge bg-secondary">No</span>
                      )}
                    </td>
                    <td>{nombreEmpresa(vehiculo.empresa_transportista_id)}</td>
                    <td>
                      {vehiculo.activo ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => iniciarEdicion(vehiculo)}
                        >
                          Editar
                        </button>
                        {vehiculo.activo ? (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDesactivar(vehiculo)}
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleActivar(vehiculo)}
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
              <option value="camion">Camión</option>
              <option value="tractor_semirremolque">Tractor semirremolque</option>
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

            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                checked={form.tiene_cisterna_propia}
                onChange={(e) =>
                  setForm({ ...form, tiene_cisterna_propia: e.target.checked })
                }
                id="cisternaPropia"
              />
              <label className="form-check-label" htmlFor="cisternaPropia">
                Tiene cisterna propia
              </label>
            </div>

            <div className="d-flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={guardando}
                className="btn btn-primary flex-grow-1"
              >
                {editandoId ? "Guardar cambios" : "Crear vehículo"}
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

export default AltaVehiculo;
