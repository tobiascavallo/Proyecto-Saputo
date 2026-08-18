import { useState, useEffect, useCallback, useRef } from "react";
import { API_URL, fetchConToken } from "../api";
import { useEventosSSE } from "../sse";
import { useDatosReferencia } from "../contextos/DatosReferenciaContext";
import NombreUsuario from "./NombreUsuario";

interface RemitosProps {
  // Si vienen, la vista queda acotada a los remitos de ese camionero
  // puntual (usado desde Gestión → Camioneros, "Ver remitos"). Sin props,
  // el comportamiento es el de siempre: todos los remitos del sistema.
  camioneroId?: string;
  nombreCamionero?: string;
  onVolver?: () => void;
}

function Remitos({ camioneroId, nombreCamionero, onVolver }: RemitosProps) {
  const { nombreTambo } = useDatosReferencia();
  const [remitos, setRemitos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Filtro de estado — arranca en "en_curso" para que el aterrizaje sea limpio
  const [filtroEstado, setFiltroEstado] = useState("en_curso");

  const [remitoSeleccionado, setRemitoSeleccionado] = useState<any>(null);
  const [lineasDelRemito, setLineasDelRemito] = useState<any[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Búsqueda por código de muestra (lector de barcode USB) — solo tiene
  // sentido en la vista global, no cuando Remito.tsx está acotado a un
  // camionero puntual (ver prop camioneroId).
  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [buscandoCodigo, setBuscandoCodigo] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const [lineaResaltadaId, setLineaResaltadaId] = useState<string | null>(
    null,
  );
  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  // Trae los remitos según el filtro activo. Se reusa tanto para el efecto
  // que depende de "filtroEstado" como para el refresco disparado por SSE.
  const fetchRemitos = useCallback(async () => {
    setCargando(true);
    try {
      // "todos" es un valor solo del frontend — si se elige, no mandamos
      // el query param "estado" y el backend devuelve todo sin filtrar.
      const params = new URLSearchParams();
      if (filtroEstado !== "todos") params.set("estado", filtroEstado);
      if (camioneroId) params.set("camionero_id", camioneroId);
      const query = params.toString();
      const response = await fetchConToken(
        `${API_URL}/api/v1/remito${query ? `?${query}` : ""}`,
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
  }, [filtroEstado, camioneroId]);

  useEffect(() => {
    fetchRemitos();
  }, [fetchRemitos]);

  // Tiempo real: cuando otro usuario sincroniza o finaliza un remito, no
  // llega el objeto completo por el socket — alcanza con volver a pedir
  // la lista para que quede al día.
  useEventosSSE({
    remito_sincronizado: fetchRemitos,
    remito_finalizado: fetchRemitos,
  });

  // Abre el detalle de un remito (líneas + resultados) — lo usan tanto "Ver
  // detalle" como la búsqueda por código de muestra. lineaAResaltar marca
  // la fila que hay que destacar en la tabla de líneas (null si se entró
  // por el botón normal, sin ninguna línea puntual en mente).
  async function abrirDetalleRemito(
    remito: any,
    lineaAResaltar: string | null = null,
  ) {
    setRemitoSeleccionado(remito);
    setLineaResaltadaId(lineaAResaltar);
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

  // Se ejecuta cuando el usuario clickea "Ver detalle" de un remito
  function verDetalleRemito(remito: any) {
    abrirDetalleRemito(remito);
  }

  function volverALista() {
    setRemitoSeleccionado(null);
    setLineasDelRemito([]);
    setResultados([]);
    setLineaResaltadaId(null);
  }

  // Busca la línea por código de muestra, resuelve su remito y abre el
  // detalle con esa línea resaltada. Se dispara con Enter (el lector de
  // barcode USB "tipea" el código y manda un Enter automático) y siempre
  // devuelve el foco al input al terminar, para poder escanear de corrido.
  async function buscarPorCodigo() {
    if (!codigoBusqueda.trim()) return;

    setBuscandoCodigo(true);
    setErrorBusqueda("");

    try {
      const responseLinea = await fetchConToken(
        `${API_URL}/api/v1/lineaRecoleccion/codigo?codigo=${codigoBusqueda}`,
      );

      if (!responseLinea.ok) {
        const data = await responseLinea.json();
        setErrorBusqueda(
          data.error || "No se encontró ninguna línea con ese código",
        );
        return;
      }

      const linea = await responseLinea.json();

      const responseRemito = await fetchConToken(
        `${API_URL}/api/v1/remito/${linea.remito_id}`,
      );

      if (!responseRemito.ok) {
        const data = await responseRemito.json();
        setErrorBusqueda(
          data.error || "No se pudo abrir el remito de esa línea",
        );
        return;
      }

      const remito = await responseRemito.json();
      await abrirDetalleRemito(remito, linea.id);
    } catch (error) {
      setErrorBusqueda("Error al conectar con el servidor");
    } finally {
      setBuscandoCodigo(false);
      setCodigoBusqueda("");
      inputBusquedaRef.current?.focus();
    }
  }

  // Se dispara con cada tecla — nos interesa detectar específicamente "Enter"
  function manejarTeclaBusqueda(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      buscarPorCodigo();
    }
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
          {camioneroId && onVolver && (
            <button className="btn btn-secondary mb-3" onClick={onVolver}>
              ← Volver a camioneros
            </button>
          )}

          <h2 className="mb-4">
            {camioneroId ? `Remitos de ${nombreCamionero}` : "Remitos"}
          </h2>

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
                    <td>
                      <NombreUsuario
                        key={remito.camionero_id}
                        id={remito.camionero_id}
                      />
                    </td>
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

          {/* Búsqueda por código de muestra — solo en la vista global, no
              cuando Remito.tsx está acotado a un camionero puntual, porque
              un código escaneado puede pertenecer a cualquier camionero. */}
          {!camioneroId && (
            <div
              className="card shadow-sm"
              style={{
                position: "fixed",
                bottom: "1rem",
                right: "1rem",
                width: "280px",
                zIndex: 1030,
              }}
            >
              <div className="card-body p-2">
                <label className="form-label text-muted small mb-1">
                  Buscar por código de muestra
                </label>
                <div className="input-group input-group-sm">
                  <input
                    ref={inputBusquedaRef}
                    type="text"
                    placeholder="Escaneá o escribí el código..."
                    value={codigoBusqueda}
                    onChange={(e) => setCodigoBusqueda(e.target.value)}
                    onKeyDown={manejarTeclaBusqueda}
                    className="form-control"
                    autoFocus
                  />
                  <button
                    className="btn btn-outline-primary"
                    onClick={buscarPorCodigo}
                    disabled={buscandoCodigo}
                  >
                    🔍
                  </button>
                </div>
                {buscandoCodigo && (
                  <small className="text-muted">Buscando...</small>
                )}
                {errorBusqueda && (
                  <small className="text-danger d-block mt-1">
                    {errorBusqueda}
                  </small>
                )}
              </div>
            </div>
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
                  <tr
                    key={linea.id}
                    className={
                      linea.id === lineaResaltadaId ? "table-warning" : undefined
                    }
                  >
                    <td>{nombreTambo(linea.tambo_id)}</td>
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
