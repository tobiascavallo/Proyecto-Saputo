import { useState } from "react";
import { API_URL, fetchConToken } from "../api";

function AltaEmpresaTransportista() {
  const [form, setForm] = useState({
    nombre: "",
    cuit: "",
    domicilio: "",
  });

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

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
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <h2 className="mb-4">Nueva empresa transportista</h2>

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
    </div>
  );
}

export default AltaEmpresaTransportista;
