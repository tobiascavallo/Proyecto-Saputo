import { useState, useRef } from "react";
import { API_URL, fetchConToken } from "../api";

function BuscarPorCodigo() {
  const [codigo, setCodigo] = useState("");
  const [linea, setLinea] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");

  // Referencia al input, para poder devolverle el foco después de cada búsqueda
  const inputRef = useRef<HTMLInputElement>(null);

  async function buscarLinea() {
    if (!codigo.trim()) return;

    setBuscando(true);
    setError("");
    setLinea(null);

    try {
      const response = await fetchConToken(
        `${API_URL}/api/v1/lineaRecoleccion/codigo?codigo=${codigo}`,
      );

      if (!response.ok) {
        setError("No se encontró ninguna línea con ese código");
        return;
      }

      const data = await response.json();
      setLinea(data);
    } catch (error) {
      setError("Error al conectar con el servidor");
    } finally {
      setBuscando(false);
      setCodigo(""); // limpiamos el input para el próximo escaneo
      inputRef.current?.focus(); // devolvemos el foco automáticamente
    }
  }

  // Se dispara con cada tecla — nos interesa detectar específicamente "Enter"
  function manejarTecla(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      buscarLinea();
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h2 className="mb-4">Buscar por código de muestra</h2>

          <div className="input-group mb-3">
            <input
              ref={inputRef}
              type="text"
              placeholder="Escaneá o escribí el código..."
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={manejarTecla}
              className="form-control"
              autoFocus
            />
            <button className="btn btn-primary" onClick={buscarLinea}>
              🔍 Buscar
            </button>
          </div>

          {buscando && <p>Buscando...</p>}
          {error && <p className="text-danger">{error}</p>}

          {linea && (
            <div className="card p-4 mt-3">
              <h5 className="mb-3">Línea de recolección encontrada</h5>
              <p>
                <strong>Tambo:</strong> {linea.tambo_id}
              </p>
              <p>
                <strong>Litros:</strong> {linea.litros_recibidos}
              </p>
              <p>
                <strong>Temperatura:</strong> {linea.temperatura_celcius}°C
              </p>
              <p>
                <strong>Cisterna:</strong> {linea.numero_cisterna}
              </p>
              <p>
                <strong>Hora:</strong> {linea.hora_recoleccion}
              </p>
              <p>
                <strong>Código diaria:</strong>{" "}
                {linea.codigo_muestra_diaria || "—"}
              </p>
              <p>
                <strong>Código UFC:</strong> {linea.codigo_muestra_ufc || "—"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BuscarPorCodigo;
