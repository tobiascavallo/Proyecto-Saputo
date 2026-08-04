import { useState, useEffect, useCallback } from "react";
import { API_URL, fetchConToken } from "../api";

function AltaAcoplado() {
  const [vista, setVista] = useState<"listado" | "nuevo">("listado");

  const [empresas, setEmpresas] = useState<any[]>([]);
  const [acoplados, setAcoplados] = useState<any[]>([]);
  const [cargandoListado, setCargandoListado] = useState(true);
  const [errorListado, setErrorListado] = useState("");

  const [form, setForm] = useState({
    patente: "",
    habilitacion_senasa: "",
    tipo: "",
    empresa_transportista_id: "",
  });

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

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

  function nombreEmpresa(id: string) {
    const empresa = empresas.find((e: any) => e.id === id);
    return empresa ? empresa.nombre : id;
  }

  function nombreTipo(tipo: string) {
    if (tipo === "acoplado") return "Acoplado";
    if (tipo === "semiremolque") return "Semirremolque";
    return tipo;
  }

  async function handleSubmit() {
    try {
      const response = await fetchConToken(`${API_URL}/api/v1/acoplado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al crear el acoplado");
        return;
      }

      setExito("Acoplado creado correctamente");
      setForm({
        patente: "",
        habilitacion_senasa: "",
        tipo: "",
        empresa_transportista_id: "",
      });
      fetchAcoplados();
      setVista("listado");
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Acoplados</h2>

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
            Nuevo acoplado
          </button>
        </li>
      </ul>

      {vista === "listado" &&
        (cargandoListado ? (
          <p>Cargando acoplados...</p>
        ) : errorListado ? (
          <p className="text-danger">{errorListado}</p>
        ) : acoplados.length === 0 ? (
          <p className="text-muted">Todavía no hay acoplados cargados.</p>
        ) : (
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Patente</th>
                <th>Habilitación SENASA</th>
                <th>Tipo</th>
                <th>Empresa transportista</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {acoplados.map((acoplado: any) => (
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

            <button onClick={handleSubmit} className="btn btn-primary w-100">
              Crear acoplado
            </button>

            {error && <p className="text-danger mt-2">{error}</p>}
            {exito && <p className="text-success mt-2">{exito}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default AltaAcoplado;
