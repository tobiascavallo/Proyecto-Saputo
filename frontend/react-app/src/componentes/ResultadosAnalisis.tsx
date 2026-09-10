import { useState } from "react";
import { rolActual } from "../api";
import { useResultados, useActualizarResultado } from "../hooks/useResultados";

function ResultadosAnalisis() {
  const resultadosQuery = useResultados();
  const resultados = resultadosQuery.data ?? [];
  const actualizarResultado = useActualizarResultado();

  const esEncargado = rolActual() === "encargado";

  const [editando, setEditando] = useState<any>(null);
  const [formResultado, setFormResultado] = useState("pendiente");
  const [formObservaciones, setFormObservaciones] = useState("");
  const [errorEdicion, setErrorEdicion] = useState("");

  // El refresco en tiempo real (resultado_cargado / resultado_actualizado)
  // lo maneja useSincronizacionSSE a nivel panel.

  if (resultadosQuery.isPending) return <p className="p-4">Cargando...</p>;
  if (resultadosQuery.isError)
    return <p className="p-4 text-danger">Error al obtener los resultados</p>;

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

  function guardarEdicion() {
    if (!editando) return;

    setErrorEdicion("");
    actualizarResultado.mutate(
      {
        id: editando.id,
        body: {
          resultado: formResultado,
          observaciones: formObservaciones,
        },
      },
      {
        onSuccess: () => setEditando(null),
        onError: (e: Error) =>
          setErrorEdicion(e.message || "Error al actualizar el resultado"),
      },
    );
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
                  disabled={actualizarResultado.isPending}
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
