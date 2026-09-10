import { useState } from "react";
import { useSolicitudes, useTomarDecision } from "../hooks/useSolicitudes";
import NombreUsuario from "./NombreUsuario";

function SolicitudesEdicion() {
  const solicitudesQuery = useSolicitudes();
  const solicitudes = solicitudesQuery.data ?? [];
  const decidir = useTomarDecision();

  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);
  const [error, setError] = useState("");

  // El refresco en tiempo real de esta lista y el toast de "llegó una
  // solicitud nueva" los maneja useSincronizacionSSE en Encargado.tsx.

  const pendientes = solicitudes.filter(
    (s: any) => s.estado === "pendiente",
  ).length;

  function tomarDecision(id: string, decision: "aprobada" | "rechazada") {
    setError("");
    decidir.mutate(
      { id, decision },
      {
        onSuccess: () => {
          // La lista se refresca sola por la invalidación del hook. Acá solo
          // sincronizamos la solicitud seleccionada para que el detalle
          // muestre el nuevo estado sin volver a la lista.
          setSolicitudSeleccionada((actual: any) =>
            actual && actual.id === id
              ? { ...actual, estado: decision }
              : actual,
          );
        },
        onError: (e: Error) =>
          setError(
            e.message ||
              "El servidor rechazó la decisión — la solicitud puede haber cambiado de estado",
          ),
      },
    );
  }

  if (solicitudesQuery.isPending) return <p className="p-4">Cargando...</p>;
  if (solicitudesQuery.isError)
    return <p className="p-4 text-danger">Error al obtener las solicitudes</p>;

  return (
    <div className="p-4">
      {error && <p className="text-danger">{error}</p>}

      <h2 className="mb-4">
        Solicitudes de edición
        {pendientes > 0 && (
          <span className="badge bg-warning ms-2 align-middle">
            {pendientes} pendiente{pendientes > 1 ? "s" : ""}
          </span>
        )}
      </h2>

      {/* Lista de solicitudes */}
      {!solicitudSeleccionada && (
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Camionero</th>
              <th>Línea de recolección</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s: any) => (
              <tr key={s.id}>
                <td>
                  <NombreUsuario key={s.camionero_id} id={s.camionero_id} />
                </td>
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
            <strong>Camionero:</strong>{" "}
            <NombreUsuario
              key={solicitudSeleccionada.camionero_id}
              id={solicitudSeleccionada.camionero_id}
            />
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
                  disabled={decidir.isPending}
                  onClick={() =>
                    tomarDecision(solicitudSeleccionada.id, "aprobada")
                  }
                >
                  Aprobar
                </button>
                <button
                  className="btn btn-danger"
                  disabled={decidir.isPending}
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
