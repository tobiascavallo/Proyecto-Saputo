import { useState, useEffect } from "react";
import { API_URL, fetchConToken } from "../api";

function SolicitudesEdicion() {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSolicitudes() {
      try {
        const response = await fetchConToken(
          `${API_URL}/api/v1/solicitudEdicion`,
        );

        if (!response.ok) {
          setError("Error al obtener las solicitudes");
          return;
        }

        const data = await response.json();
        setSolicitudes(data);
      } catch (error) {
        setError("Error al conectar con el servidor");
      } finally {
        setCargando(false);
      }
    }

    fetchSolicitudes();
  }, []);

  async function tomarDecision(id: string, decision: "aprobada" | "rechazada") {
    try {
      const response = await fetchConToken(
        `${API_URL}/api/v1/solicitudEdicion/${id}/decision`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );

      if (!response.ok) {
        setError(
          "El servidor rechazó la decisión — la solicitud puede haber cambiado de estado",
        );
        return;
      }

      // Solo actualizamos el frontend si el backend confirmó el cambio
      setSolicitudes((solicitudesActuales) =>
        solicitudesActuales.map((s) =>
          s.id === id ? { ...s, estado: decision } : s,
        ),
      );

      // También actualizamos la solicitud seleccionada, así el detalle
      // refleja el nuevo estado sin tener que volver a la lista
      setSolicitudSeleccionada((actual: any) =>
        actual ? { ...actual, estado: decision } : actual,
      );
    } catch (error) {
      setError("Error al procesar la decisión");
    }
  }

  if (cargando) return <p className="p-4">Cargando...</p>;
  if (error) return <p className="p-4 text-danger">{error}</p>;

  return (
    <div className="p-4">
      <h2 className="mb-4">Solicitudes de edición</h2>

      {/* Lista de solicitudes */}
      {!solicitudSeleccionada && (
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Camionero ID</th>
              <th>Línea de recolección</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s: any) => (
              <tr key={s.id}>
                <td>{s.camionero_id}</td>
                <td>{s.linea_recoleccion_id}</td>
                <td>{s.motivo}</td>
                <td>
                  {s.estado === "pendiente" && (
                    <span className="badge bg-warning">Pendiente</span>
                  )}
                  {s.estado === "aprobada" && (
                    <span className="badge bg-success">Aprobada</span>
                  )}
                  {s.estado === "rechazada" && (
                    <span className="badge bg-danger">Rechazada</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setSolicitudSeleccionada(s)}
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Detalle de solicitud seleccionada */}
      {solicitudSeleccionada && (
        <div className="card p-4">
          <h5 className="mb-3">Detalle de solicitud</h5>
          <p>
            <strong>Camionero ID:</strong> {solicitudSeleccionada.camionero_id}
          </p>
          <p>
            <strong>Motivo:</strong> {solicitudSeleccionada.motivo}
          </p>

          <div className="row mt-3">
            <div className="col-md-6">
              <h6>Valor actual</h6>
              <p>
                Litros: {solicitudSeleccionada.valor_actual.litros_recibidos}
              </p>
              <p>
                Temperatura:{" "}
                {solicitudSeleccionada.valor_actual.temperatura_celcius}°C
              </p>
              <p>
                Cisterna: {solicitudSeleccionada.valor_actual.numero_cisterna}
              </p>
              <p>Hora: {solicitudSeleccionada.valor_actual.hora_recoleccion}</p>
            </div>
            <div className="col-md-6">
              <h6>Valor propuesto</h6>
              <p>
                Litros: {solicitudSeleccionada.valor_propuesto.litros_recibidos}
              </p>
              <p>
                Temperatura:{" "}
                {solicitudSeleccionada.valor_propuesto.temperatura_celcius}°C
              </p>
              <p>
                Cisterna:{" "}
                {solicitudSeleccionada.valor_propuesto.numero_cisterna}
              </p>
              <p>
                Hora: {solicitudSeleccionada.valor_propuesto.hora_recoleccion}
              </p>
            </div>
          </div>

          <div className="d-flex gap-2 mt-3">
            {solicitudSeleccionada.estado === "pendiente" ? (
              <>
                <button
                  className="btn btn-success"
                  onClick={() =>
                    tomarDecision(solicitudSeleccionada.id, "aprobada")
                  }
                >
                  Aprobar
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() =>
                    tomarDecision(solicitudSeleccionada.id, "rechazada")
                  }
                >
                  Rechazar
                </button>
              </>
            ) : (
              <p className="text-muted mb-0 align-self-center">
                Esta solicitud ya fue{" "}
                {solicitudSeleccionada.estado === "aprobada"
                  ? "aprobada"
                  : "rechazada"}
                .
              </p>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => setSolicitudSeleccionada(null)}
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SolicitudesEdicion;
