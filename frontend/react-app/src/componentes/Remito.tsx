import { useState, useRef } from "react";
import { useNombreTambo } from "../hooks/useTambos";
import {
  useRemitos,
  useLineasDeRemito,
  buscarLineaPorCodigo,
  obtenerRemitoPorId,
} from "../hooks/useRemitos";
import { useResultados } from "../hooks/useResultados";
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
  const nombreTambo = useNombreTambo();

  // Filtro de estado — arranca en "en_curso" para que el aterrizaje sea limpio
  const [filtroEstado, setFiltroEstado] = useState("en_curso");
  const remitosQuery = useRemitos(filtroEstado, camioneroId);
  const remitos = remitosQuery.data ?? [];

  const [remitoSeleccionado, setRemitoSeleccionado] = useState<any>(null);
  const [lineaResaltadaId, setLineaResaltadaId] = useState<string | null>(null);

  // Detalle: líneas del remito abierto + listado de resultados (compartido
  // con ResultadosAnalisis.tsx). Las queries se disparan solas cuando hay un
  // remito seleccionado.
  const lineasQuery = useLineasDeRemito(remitoSeleccionado?.id);
  const resultadosQuery = useResultados();
  const lineasDelRemito = lineasQuery.data ?? [];
  const resultados = resultadosQuery.data ?? [];

  // Búsqueda por código de muestra (lector de barcode USB) — solo tiene
  // sentido en la vista global, no cuando Remito.tsx está acotado a un
  // camionero puntual (ver prop camioneroId).
  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [buscandoCodigo, setBuscandoCodigo] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  // El refresco en tiempo real (remitos, líneas, resultados) lo maneja
  // useSincronizacionSSE a nivel panel — acá solo se consumen las queries.

  function abrirDetalleRemito(
    remito: any,
    lineaAResaltar: string | null = null,
  ) {
    setRemitoSeleccionado(remito);
    setLineaResaltadaId(lineaAResaltar);
  }

  function verDetalleRemito(remito: any) {
    abrirDetalleRemito(remito);
  }

  function volverALista() {
    setRemitoSeleccionado(null);
    setLineaResaltadaId(null);
  }

  // Busca la línea por código, resuelve su remito y abre el detalle con esa
  // línea resaltada. Se dispara con Enter (el lector de barcode "tipea" el
  // código y manda un Enter automático) y siempre devuelve el foco al input.
  async function buscarPorCodigo() {
    if (!codigoBusqueda.trim()) return;

    setBuscandoCodigo(true);
    setErrorBusqueda("");

    try {
      const linea = await buscarLineaPorCodigo(codigoBusqueda);
      const remito = await obtenerRemitoPorId(linea.remito_id);
      abrirDetalleRemito(remito, linea.id);
    } catch (e) {
      setErrorBusqueda(
        e instanceof Error ? e.message : "Error al conectar con el servidor",
      );
    } finally {
      setBuscandoCodigo(false);
      setCodigoBusqueda("");
      inputBusquedaRef.current?.focus();
    }
  }

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

          {remitosQuery.isPending ? (
            <p>Cargando remitos...</p>
          ) : remitosQuery.isError ? (
            <p className="text-danger">Error al obtener los remitos.</p>
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

          {lineasQuery.isPending ? (
            <p>Cargando líneas de recolección...</p>
          ) : lineasQuery.isError ? (
            <p className="text-danger">
              Error al obtener las líneas del remito.
            </p>
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
