import { useState, useEffect, useCallback } from "react";
import { API_URL, fetchConToken } from "../api";

function AltaTambo() {
  const [vista, setVista] = useState<"listado" | "nuevo">("listado");

  const [tamberos, setTamberos] = useState<any[]>([]);
  const [tambos, setTambos] = useState<any[]>([]);
  const [cargandoListado, setCargandoListado] = useState(true);
  const [errorListado, setErrorListado] = useState("");

  const [form, setForm] = useState({
    numero_tambo: "",
    tambero_id: "",
  });

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  // Traemos los tamberos apenas se abre la pantalla, para llenar el <select>
  useEffect(() => {
    async function fetchTamberos() {
      try {
        const response = await fetchConToken(`${API_URL}/api/v1/tambero`);
        const data = await response.json();
        setTamberos(data || []);
      } catch (error) {
        setError("Error al cargar los tamberos");
      }
    }

    fetchTamberos();
  }, []);

  const fetchTambos = useCallback(async () => {
    setCargandoListado(true);
    try {
      const response = await fetchConToken(`${API_URL}/api/v1/tambo`);
      if (!response.ok) {
        setErrorListado("Error al obtener los tambos");
        return;
      }
      const data = await response.json();
      setTambos(data || []);
    } catch (error) {
      setErrorListado("Error al conectar con el servidor");
    } finally {
      setCargandoListado(false);
    }
  }, []);

  useEffect(() => {
    fetchTambos();
  }, [fetchTambos]);

  async function handleSubmit() {
    try {
      const response = await fetchConToken(`${API_URL}/api/v1/tambo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero_tambo: Number(form.numero_tambo),
          tambero_id: form.tambero_id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al crear el tambo");
        return;
      }

      setExito("Tambo creado correctamente");
      setForm({ numero_tambo: "", tambero_id: "" });
      fetchTambos();
      setVista("listado");
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Tambos</h2>

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
            Nuevo tambo
          </button>
        </li>
      </ul>

      {vista === "listado" &&
        (cargandoListado ? (
          <p>Cargando tambos...</p>
        ) : errorListado ? (
          <p className="text-danger">{errorListado}</p>
        ) : tambos.length === 0 ? (
          <p className="text-muted">Todavía no hay tambos cargados.</p>
        ) : (
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>N° Tambo</th>
                <th>Tambero</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {tambos.map((tambo: any) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        ))}

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

            <button onClick={handleSubmit} className="btn btn-primary w-100">
              Crear tambo
            </button>

            {error && <p className="text-danger mt-2">{error}</p>}
            {exito && <p className="text-success mt-2">{exito}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default AltaTambo;
