import { useState, useEffect } from "react";
import { API_URL, fetchConToken } from "../api";

function AltaVehiculo() {
  const [empresas, setEmpresas] = useState<any[]>([]);

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
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <h2 className="mb-4">Nuevo vehículo</h2>

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
    </div>
  );
}

export default AltaVehiculo;
