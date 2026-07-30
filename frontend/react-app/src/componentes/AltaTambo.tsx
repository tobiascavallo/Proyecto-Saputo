import { useState, useEffect } from "react";
import { API_URL, fetchConToken } from "../api";

function AltaTambo() {
  const [tamberos, setTamberos] = useState<any[]>([]);

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
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <h2 className="mb-4">Nuevo tambo</h2>

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
    </div>
  );
}

export default AltaTambo;
