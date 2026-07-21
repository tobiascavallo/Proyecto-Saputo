import { useState, useEffect } from "react";

function SolicitudesEdicion() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSolicitudes() {
      try {
        const response = await fetch("http://localhost:8080/api/solicitudes", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

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

  async function handleAprobar(id: string) {
    try {
      await fetch(`http://localhost:8080/api/solicitudes/${id}/aprobar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setSolicitudSeleccionada(null);
    } catch (error) {
      setError("Error al aprobar la solicitud");
    }
  }

  async function handleRechazar(id: string) {
    try {
      await fetch(`http://localhost:8080/api/solicitudes/${id}/rechazar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setSolicitudSeleccionada(null);
    } catch (error) {
      setError("Error al rechazar la solicitud");
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
              <th>Camionero</th>
              <th>Tambo</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s: any) => (
              <tr key={s.id}>
                <td>{s.camionero}</td>
                <td>{s.tambo}</td>
                <td>{s.fecha}</td>
                <td>
                  <span className="badge bg-warning">Pendiente</span>
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
            <strong>Camionero:</strong> {solicitudSeleccionada.camionero}
          </p>
          <p>
            <strong>Tambo:</strong> {solicitudSeleccionada.tambo}
          </p>
          <p>
            <strong>Motivo:</strong> {solicitudSeleccionada.motivo}
          </p>
          <p>
            <strong>Valor actual:</strong> {solicitudSeleccionada.valor_actual}
          </p>
          <p>
            <strong>Valor propuesto:</strong>{" "}
            {solicitudSeleccionada.valor_propuesto}
          </p>

          <div className="d-flex gap-2 mt-3">
            <button
              className="btn btn-success"
              onClick={() => handleAprobar(solicitudSeleccionada.id)}
            >
              Aprobar
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleRechazar(solicitudSeleccionada.id)}
            >
              Rechazar
            </button>
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
