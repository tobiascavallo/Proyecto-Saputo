import { useState, useEffect } from "react";
import { API_URL, fetchConToken } from "../api";

function Remitos() {
  const [remitos, setRemitos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Filtro de estado — arranca en "en_curso" para que el aterrizaje sea limpio
  const [filtroEstado, setFiltroEstado] = useState("en_curso");

  const [remitoSeleccionado, setRemitoSeleccionado] = useState<any>(null);
  const [lineasDelRemito, setLineasDelRemito] = useState<any[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Trae los remitos según el filtro activo. Se vuelve a ejecutar
  // automáticamente cada vez que "filtroEstado" cambia, gracias
  // al array de dependencias [filtroEstado].
  useEffect(() => {
    async function fetchRemitos() {
      setCargando(true);
      try {
        // "todos" es un valor solo del frontend — si se elige, no mandamos
        // el query param "estado" y el backend devuelve todo sin filtrar.
        const query = filtroEstado === "todos" ? "" : `?estado=${filtroEstado}`;
        const response = await fetchConToken(
          `${API_URL}/api/v1/remito${query}`,
        );

        if (!response.ok) {
          setError("Error al obtener los remitos");
          return;
        }

        const data = await response.json();
        setRemitos(data || []);
      } catch (error) {
        setError("Error al conectar con el servidor");
      } finally {
        setCargando(false);
      }
    }

    fetchRemitos();
  }, [filtroEstado]);

  // Se ejecuta recién cuando el usuario clickea "Ver detalle" de un remito
  async function verDetalleRemito(remito: any) {
    setRemitoSeleccionado(remito);
    setCargandoDetalle(true);

    try {
      const responseLineas = await fetchConToken(
        `${API_URL}/api/v1/lineaRecoleccion/remito/${remito.id}`,
      );
      const dataLineas = await responseLineas.json();
      setLineasDelRemito(dataLineas || []);

      const responseResultados = await fetchConToken(
        `${API_URL}/api/v1/resultadoAnalisis`,
      );
      const dataResultados = await responseResultados.json();
      setResultados(dataResultados || []);
    } catch (error) {
      setError("Error al obtener el detalle del remito");
    } finally {
      setCargandoDetalle(false);
    }
  }

  function volverALista() {
    setRemitoSeleccionado(null);
    setLineasDelRemito([]);
    setResultados([]);
  }

  function resultadoDeLinea(lineaId: string) {
    return resultados.find((r: any) => r.linea_recoleccion_id === lineaId);
  }

  function badgeResultado(resultado: string | undefined) {
    if (resultado === "apta")
      return <span className="badge bg-success">Apta</span>;
    if (resultado === "contaminada")
      return <span className="badge bg-danger">Contaminada</span>;
    return <span className="badge bg-warning">Pendiente</span>;
  }

  if (error) return <p className="p-4 text-danger">{error}</p>;

  return (
    <div className="p-4">
      {!remitoSeleccionado && (
        <>
          <h2 className="mb-4">Remitos</h2>

          {/* Selector de estado — un solo valor a la vez, mapea 1 a 1
              con el query param "estado" que espera el backend */}
          <div className="btn-group mb-3">
            <button
              className={`btn btn-sm ${filtroEstado === "en_curso" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setFiltroEstado("en_curso")}
            >
              En curso
            </button>
            <button
              className={`btn btn-sm ${filtroEstado === "finalizado" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setFiltroEstado("finalizado")}
            >
              Finalizado
            </button>
            <button
              className={`btn btn-sm ${filtroEstado === "todos" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setFiltroEstado("todos")}
            >
              Todos
            </button>
          </div>

          {cargando ? (
            <p>Cargando remitos...</p>
          ) : (
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>N° Remito</th>
                  <th>Fecha</th>
                  <th>Camionero</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {remitos.map((remito: any) => (
                  <tr key={remito.id}>
                    <td>{remito.numero_remito}</td>
                    <td>{remito.fecha}</td>
                    <td>{remito.camionero_id}</td>
                    <td>
                      {remito.estado_remito === "finalizado" ? (
                        <span className="badge bg-secondary">Finalizado</span>
                      ) : (
                        <span className="badge bg-info">En curso</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => verDetalleRemito(remito)}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {remitoSeleccionado && (
        <div>
          <button className="btn btn-secondary mb-3" onClick={volverALista}>
            ← Volver a remitos
          </button>

          <h2 className="mb-4">Remito {remitoSeleccionado.numero_remito}</h2>

          {cargandoDetalle ? (
            <p>Cargando líneas de recolección...</p>
          ) : lineasDelRemito.length === 0 ? (
            <p className="text-muted">
              Este remito todavía no tiene líneas de recolección cargadas.
            </p>
          ) : (
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Tambo</th>
                  <th>Litros</th>
                  <th>Temperatura</th>
                  <th>Cisterna</th>
                  <th>Hora</th>
                  <th>Resultado análisis</th>
                </tr>
              </thead>
              <tbody>
                {lineasDelRemito.map((linea: any) => (
                  <tr key={linea.id}>
                    <td>{linea.tambo_id}</td>
                    <td>{linea.litros_recibidos}</td>
                    <td>{linea.temperatura_celcius}°C</td>
                    <td>{linea.numero_cisterna}</td>
                    <td>{linea.hora_recoleccion}</td>
                    <td>
                      {badgeResultado(resultadoDeLinea(linea.id)?.resultado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default Remitos;
