import { useState, useEffect, useCallback } from "react";
import { API_URL, fetchConToken } from "../api";

function AltaVehiculo() {
  const [vista, setVista] = useState<"listado" | "nuevo">("listado");

  const [empresas, setEmpresas] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [cargandoListado, setCargandoListado] = useState(true);
  const [errorListado, setErrorListado] = useState("");

  const [form, setForm] = useState({
    patente: "",
    habilitacion_senasa: "",
    tipo: "",
    tiene_cisterna_propia: false,
    empresa_transportista_id: "",
  });

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  // Traemos las empresas apenas se abre la pantalla, para llenar el <select>
  // y también para poder mostrar el nombre de la empresa en el listado.
  useEffect(() => {
    async function fetchEmpresas() {
      try {
        const response = await fetchConToken(
          `${API_URL}/api/v1/empresaTransportista`,
        );
        const data = await response.json();
        setEmpresas(data || []);
      } catch (error) {
        setError("Error al cargar las empresas transportistas");
      }
    }

    fetchEmpresas();
  }, []);

  const fetchVehiculos = useCallback(async () => {
    setCargandoListado(true);
    try {
      const response = await fetchConToken(`${API_URL}/api/v1/vehiculo`);
      if (!response.ok) {
        setErrorListado("Error al obtener los vehículos");
        return;
      }
      const data = await response.json();
      setVehiculos(data || []);
    } catch (error) {
      setErrorListado("Error al conectar con el servidor");
    } finally {
      setCargandoListado(false);
    }
  }, []);

  useEffect(() => {
    fetchVehiculos();
  }, [fetchVehiculos]);

  function nombreEmpresa(id: string) {
    const empresa = empresas.find((e: any) => e.id === id);
    return empresa ? empresa.nombre : id;
  }

  function nombreTipo(tipo: string) {
    if (tipo === "camion") return "Camión";
    if (tipo === "tractor_semirremolque") return "Tractor semirremolque";
    return tipo;
  }

  async function handleSubmit() {
    try {
      const response = await fetchConToken(`${API_URL}/api/v1/vehiculo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al crear el vehículo");
        return;
      }

      setExito("Vehículo creado correctamente");
      setForm({
        patente: "",
        habilitacion_senasa: "",
        tipo: "",
        tiene_cisterna_propia: false,
        empresa_transportista_id: "",
      });
      fetchVehiculos();
      setVista("listado");
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Vehículos</h2>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${vista === "listado" ? "active" : ""}`}
            onClick={() => setVista("listado")}
          >
            Listado
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${vista === "nuevo" ? "active" : ""}`}
            onClick={() => setVista("nuevo")}
          >
            Nuevo vehículo
          </button>
        </li>
      </ul>

      {vista === "listado" &&
        (cargandoListado ? (
          <p>Cargando vehículos...</p>
        ) : errorListado ? (
          <p className="text-danger">{errorListado}</p>
        ) : vehiculos.length === 0 ? (
          <p className="text-muted">Todavía no hay vehículos cargados.</p>
        ) : (
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Patente</th>
                <th>Habilitación SENASA</th>
                <th>Tipo</th>
                <th>Cisterna propia</th>
                <th>Empresa transportista</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((vehiculo: any) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        ))}

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

            <button onClick={handleSubmit} className="btn btn-primary w-100">
              Crear vehículo
            </button>

            {error && <p className="text-danger mt-2">{error}</p>}
            {exito && <p className="text-success mt-2">{exito}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default AltaVehiculo;
