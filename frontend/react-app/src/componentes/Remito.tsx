import { useState, useEffect } from "react";
import { fetchConToken } from "../api";

function Remitos() {
  const [remitos, setRemitos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [remitoSeleccionado, setRemitoSeleccionado] = useState<any>(null);
  const [lineasDelRemito, setLineasDelRemito] = useState<any[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Carga inicial — trae la lista de remitos apenas se abre la pantalla
  useEffect(() => {
    async function fetchRemitos() {
      try {
        const response = await fetchConToken(
          "http://localhost:8080/api/v1/remito",
        );

        if (!response.ok) {
          setError("Error al obtener los remitos");
          return;
        }

        const data = await response.json();
        setRemitos(data);
      } catch (error) {
        setError("Error al conectar con el servidor");
      } finally {
        setCargando(false);
      }
    }

    fetchRemitos();
  }, []);

  // Se ejecuta recién cuando el usuario clickea "Ver detalle" de un remito
  async function verDetalleRemito(remito: any) {
    setRemitoSeleccionado(remito);
    setCargandoDetalle(true);

    try {
      // Trae las líneas de recolección de ese remito
      const responseLineas = await fetchConToken(
        `http://localhost:8080/api/v1/lineaRecoleccion/remito/${remito.id}`,
      );
      const dataLineas = await responseLineas.json();
      setLineasDelRemito(dataLineas);

      // Trae los resultados de análisis de todo el sistema
      // (después los cruzamos por linea_recoleccion_id)
      const responseResultados = await fetchConToken(
        "http://localhost:8080/api/v1/resultadoAnalisis",
      );
      const dataResultados = await responseResultados.json();
      setResultados(dataResultados);
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

  // Busca el resultado de análisis correspondiente a una línea específica
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

  if (cargando) return <p className="p-4">Cargando remitos...</p>;
  if (error) return <p className="p-4 text-danger">{error}</p>;

  return (
    <div className="p-4">
      {/* Vista lista — solo se muestra si NO hay remito seleccionado */}
      {!remitoSeleccionado && (
        <>
          <h2 className="mb-4">Remitos</h2>
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
        </>
      )}

      {/* Vista detalle — solo se muestra si HAY remito seleccionado */}
      {remitoSeleccionado && (
        <div>
          <button className="btn btn-secondary mb-3" onClick={volverALista}>
            ← Volver a remitos
          </button>

          <h2 className="mb-4">Remito {remitoSeleccionado.numero_remito}</h2>

          {cargandoDetalle ? (
            <p>Cargando líneas de recolección...</p>
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
                    <td>{linea.temperatura_celsius}°C</td>
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
