import { useState, useEffect, useCallback } from "react";
import { API_URL, fetchConToken } from "../api";

function AltaEmpresaTransportista() {
  const [vista, setVista] = useState<"listado" | "nuevo">("listado");

  const [empresas, setEmpresas] = useState<any[]>([]);
  const [cargandoListado, setCargandoListado] = useState(true);
  const [errorListado, setErrorListado] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    cuit: "",
    domicilio: "",
  });

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

  async function handleSubmit() {
    try {
      const response = await fetchConToken(
        `${API_URL}/api/v1/empresaTransportista`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al crear la empresa transportista");
        return;
      }

      setExito("Empresa transportista creada correctamente");
      setForm({ nombre: "", cuit: "", domicilio: "" });
      fetchEmpresas();
      setVista("listado");
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Empresas transportistas</h2>

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
            Nueva empresa
          </button>
        </li>
      </ul>

      {vista === "listado" &&
        (cargandoListado ? (
          <p>Cargando empresas transportistas...</p>
        ) : errorListado ? (
          <p className="text-danger">{errorListado}</p>
        ) : empresas.length === 0 ? (
          <p className="text-muted">Todavía no hay empresas cargadas.</p>
        ) : (
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Nombre</th>
                <th>CUIT</th>
                <th>Domicilio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((empresa: any) => (
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

            <button onClick={handleSubmit} className="btn btn-primary w-100">
              Crear empresa transportista
            </button>

            {error && <p className="text-danger mt-2">{error}</p>}
            {exito && <p className="text-success mt-2">{exito}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default AltaEmpresaTransportista;
