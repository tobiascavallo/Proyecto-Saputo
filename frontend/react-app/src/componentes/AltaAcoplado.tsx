import { useState, useEffect } from "react";
import { API_URL, fetchConToken } from "../api";

function AltaAcoplado() {
  const [empresas, setEmpresas] = useState<any[]>([]);

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
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <h2 className="mb-4">Nuevo acoplado</h2>

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
    </div>
  );
}

export default AltaAcoplado;
