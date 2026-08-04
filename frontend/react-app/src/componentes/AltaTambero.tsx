import { useState, useEffect, useCallback } from "react";
import { API_URL, fetchConToken } from "../api";

function AltaTambero() {
  const [vista, setVista] = useState<"listado" | "nuevo">("listado");

  const [tamberos, setTamberos] = useState<any[]>([]);
  const [cargandoListado, setCargandoListado] = useState(true);
  const [errorListado, setErrorListado] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    cuit: "",
    telefono: "",
    email: "",
  });

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

  async function handleSubmit() {
    try {
      const response = await fetchConToken(`${API_URL}/api/v1/tambero`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al crear el tambero");
        return;
      }

      setExito("Tambero creado correctamente");
      setForm({ nombre: "", cuit: "", telefono: "", email: "" });
      fetchTamberos();
      setVista("listado");
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Tamberos</h2>

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
            Nuevo tambero
          </button>
        </li>
      </ul>

      {vista === "listado" &&
        (cargandoListado ? (
          <p>Cargando tamberos...</p>
        ) : errorListado ? (
          <p className="text-danger">{errorListado}</p>
        ) : tamberos.length === 0 ? (
          <p className="text-muted">Todavía no hay tamberos cargados.</p>
        ) : (
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Nombre</th>
                <th>CUIT</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {tamberos.map((tambero: any) => (
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

            <button onClick={handleSubmit} className="btn btn-primary w-100">
              Crear tambero
            </button>

            {error && <p className="text-danger mt-2">{error}</p>}
            {exito && <p className="text-success mt-2">{exito}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default AltaTambero;
