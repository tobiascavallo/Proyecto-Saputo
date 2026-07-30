import { useState } from "react";
import { API_URL, fetchConToken } from "../api";

function AltaTambero() {
  const [form, setForm] = useState({
    nombre: "",
    cuit: "",
    telefono: "",
    email: "",
  });

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

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
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <h2 className="mb-4">Nuevo tambero</h2>

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
    </div>
  );
}

export default AltaTambero;
