import { useState, useEffect } from "react";
import { API_URL, fetchConToken } from "../api";

function ResultadosAnalisis() {
  const [resultados, setResultados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchResultados() {
      try {
        const response = await fetchConToken(
          `${API_URL}/api/v1/resultadoAnalisis`,
        );

        if (!response.ok) {
          setError("Error al obtener los resultados");
          return;
        }

        const data = await response.json();
        setResultados(data);
      } catch (error) {
        setError("Error al conectar con el servidor");
      } finally {
        setCargando(false);
      }
    }

    fetchResultados();
  }, []);

  if (cargando) return <p className="p-4">Cargando...</p>;
  if (error) return <p className="p-4 text-danger">{error}</p>;

  function badgeResultado(resultado: string) {
    if (resultado === "apta")
      return <span className="badge bg-success">Apta</span>;
    if (resultado === "contaminada")
      return <span className="badge bg-danger">Contaminada</span>;
    return <span className="badge bg-warning">Pendiente</span>;
  }

  return (
    <div className="p-4">
      <h2 className="mb-4">Resultados de análisis</h2>
      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr>
            <th>Línea de recolección</th>
            <th>Tipo de muestra</th>
            <th>Resultado</th>
            <th>Observaciones</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {resultados.map((r: any) => (
            <tr key={r.id}>
              <td>{r.linea_recoleccion_id}</td>
              <td>{r.tipo_muestra === "diaria" ? "Diaria" : "UFC"}</td>
              <td>{badgeResultado(r.resultado)}</td>
              <td>{r.observaciones || "—"}</td>
              <td>{r.fecha_carga}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ResultadosAnalisis;
