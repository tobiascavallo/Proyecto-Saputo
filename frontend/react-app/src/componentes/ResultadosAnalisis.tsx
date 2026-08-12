import { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { API_URL, fetchConToken } from "../api";
import { useEventosSSE } from "../sse";

function rolLogueado(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return (jwtDecode(token) as any).rol ?? null;
  } catch {
    return null;
  }
}

function ResultadosAnalisis() {
  const [resultados, setResultados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const esEncargado = rolLogueado() === "encargado";

  const [editando, setEditando] = useState<any>(null);
  const [formResultado, setFormResultado] = useState("pendiente");
  const [formObservaciones, setFormObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState("");

  const fetchResultados = useCallback(async () => {
    try {
      const response = await fetchConToken(
        `${API_URL}/api/v1/resultadoAnalisis`,
      );

      if (!response.ok) {
        setError("Error al obtener los resultados");
        return;
      }

      const data = await response.json();
      setResultados(data || []);
    } catch (error) {
      setError("Error al conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    fetchResultados();
  }, [fetchResultados]);

  // Tiempo real: un resultado cargado o corregido en otra sesión refresca
  // la lista automáticamente.
  useEventosSSE({
    resultado_cargado: fetchResultados,
    resultado_actualizado: fetchResultados,
  });

  if (cargando) return <p className="p-4">Cargando...</p>;
  if (error) return <p className="p-4 text-danger">{error}</p>;

  function badgeResultado(resultado: string) {
    if (resultado === "apta")
      return <span className="badge bg-success">Apta</span>;
    if (resultado === "contaminada")
      return <span className="badge bg-danger">Contaminada</span>;
    return <span className="badge bg-warning">Pendiente</span>;
  }

  function abrirEdicion(resultado: any) {
    setEditando(resultado);
    setFormResultado(resultado.resultado);
    setFormObservaciones(resultado.observaciones || "");
    setErrorEdicion("");
  }

  function cerrarEdicion() {
    setEditando(null);
  }

  async function guardarEdicion() {
    if (!editando) return;

    setGuardando(true);
    setErrorEdicion("");
    try {
      const response = await fetchConToken(
        `${API_URL}/api/v1/resultadoAnalisis/${editando.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resultado: formResultado,
            observaciones: formObservaciones,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        setErrorEdicion(data.error || "Error al actualizar el resultado");
        return;
      }

      // Actualizamos solo la fila editada en el estado local — no hace
      // falta volver a pedir toda la lista (mismo criterio que
      // SolicitudesEdicion.tsx en tomarDecision).
      setResultados((actuales) =>
        actuales.map((r) =>
          r.id === editando.id
            ? { ...r, resultado: formResultado, observaciones: formObservaciones }
            : r,
        ),
      );
      setEditando(null);
    } catch (error) {
      setErrorEdicion("Error al conectar con el servidor");
    } finally {
      setGuardando(false);
    }
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
            {esEncargado && <th>Acciones</th>}
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
              {esEncargado && (
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => abrirEdicion(r)}
                  >
                    Editar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {editando && (
        <div
          className="modal d-block"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={cerrarEdicion}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar resultado de análisis</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={cerrarEdicion}
                />
              </div>
              <div className="modal-body">
                <label className="form-label">Resultado</label>
                <select
                  value={formResultado}
                  onChange={(e) => setFormResultado(e.target.value)}
                  className="form-select mb-3"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="apta">Apta</option>
                  <option value="contaminada">Contaminada</option>
                </select>

                <label className="form-label">Observaciones</label>
                <textarea
                  value={formObservaciones}
                  onChange={(e) => setFormObservaciones(e.target.value)}
                  className="form-control"
                  rows={3}
                />

                {errorEdicion && (
                  <p className="text-danger mt-2 mb-0">{errorEdicion}</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={cerrarEdicion}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={guardarEdicion}
                  disabled={guardando}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultadosAnalisis;
