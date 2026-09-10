import { useState } from "react";
import Remitos from "./Remito";
import SolicitudesEdicion from "./SolicitudesEdicion";
import ResultadosAnalisis from "./ResultadosAnalisis";
import AltaUsuario from "./AltaUsuario";
import AltaCamionero from "./AltaCamionero";
import AltaEmpresaTransportista from "./AltaEmpresaTransportista";
import AltaVehiculo from "./AltaVehiculo";
import AltaAcoplado from "./AltaAcoplado";
import AltaTambero from "./AltaTambero";
import AltaTambo from "./AltaTambo";
import Navbar from "./Navbar";
import { useSincronizacionSSE } from "../hooks/useSincronizacionSSE";

function Encargado() {
  // Controla si estamos en el panel operativo o en la vista de Gestión
  const [vista, setVista] = useState<"panel" | "gestion">("panel");

  const [seccionActiva, setSeccionActiva] = useState("remitos");
  const [seccionGestion, setSeccionGestion] = useState("usuarios");

  // Aviso breve para eventos de solicitudes de edición. Vive acá (nivel
  // panel) y no en SolicitudesEdicion para que el encargado se entere de
  // una solicitud nueva esté en la pestaña que esté.
  const [toast, setToast] = useState<{
    mensaje: string;
    tipo: "warning" | "info";
  } | null>(null);

  function mostrarToast(mensaje: string, tipo: "warning" | "info") {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  // Única suscripción SSE del panel: mapea cada evento a la invalidación de
  // su query key. Los callbacks de solicitudes agregan el toast encima.
  useSincronizacionSSE({
    onSolicitudCreada: () =>
      mostrarToast("Llegó una solicitud de edición nueva", "warning"),
    onSolicitudResuelta: (datos) =>
      mostrarToast(
        `Una solicitud fue ${datos?.estado === "aprobada" ? "aprobada" : "rechazada"}`,
        "info",
      ),
  });

  // Los datos de referencia (usuarios, tambos, etc.) los cachea TanStack
  // Query a nivel global — cada pantalla pide lo suyo con su hook y el
  // caché compartido evita refetchs al alternar entre "panel" y "gestion".
  return (
    <>
      {toast && (
        <div
          className={`toast show position-fixed top-0 end-0 m-3 text-bg-${toast.tipo}`}
          style={{ zIndex: 1080 }}
        >
          <div className="toast-body">{toast.mensaje}</div>
        </div>
      )}

      {vista === "gestion" ? (
        // ----- VISTA: GESTIÓN -----
        <>
          <Navbar titulo="Gestión" />
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-2 bg-dark min-vh-100 p-3">
                <button
                  className="btn btn-outline-light btn-sm mb-4"
                  onClick={() => setVista("panel")}
                >
                  ← Volver al panel
                </button>
                <ul className="list-unstyled">
                  <li
                    className="text-white mb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSeccionGestion("usuarios")}
                  >
                    Usuarios
                  </li>
                  <li
                    className="text-white mb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSeccionGestion("camioneros")}
                  >
                    Camioneros
                  </li>
                  <li
                    className="text-white mb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSeccionGestion("empresas")}
                  >
                    Empresas transportistas
                  </li>
                  <li
                    className="text-white mb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSeccionGestion("vehiculos")}
                  >
                    Vehículos
                  </li>
                  <li
                    className="text-white mb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSeccionGestion("acoplados")}
                  >
                    Acoplados
                  </li>
                  <li
                    className="text-white mb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSeccionGestion("tamberos")}
                  >
                    Tamberos
                  </li>
                  <li
                    className="text-white mb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSeccionGestion("tambos")}
                  >
                    Tambos
                  </li>
                </ul>
              </div>

              <div className="col-md-10">
                {seccionGestion === "usuarios" && <AltaUsuario />}
                {seccionGestion === "camioneros" && <AltaCamionero />}
                {seccionGestion === "empresas" && <AltaEmpresaTransportista />}
                {seccionGestion === "vehiculos" && <AltaVehiculo />}
                {seccionGestion === "acoplados" && <AltaAcoplado />}
                {seccionGestion === "tamberos" && <AltaTambero />}
                {seccionGestion === "tambos" && <AltaTambo />}
              </div>
            </div>
          </div>
        </>
      ) : (
        // ----- VISTA: PANEL PRINCIPAL -----
        <>
          <Navbar
            titulo="Panel Encargado"
            onConfigClick={() => setVista("gestion")}
          />
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-2 bg-dark min-vh-100 p-3">
                <ul className="list-unstyled mt-2">
                  <li
                    className="text-white mb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSeccionActiva("remitos")}
                  >
                    Remitos
                  </li>
                  <li
                    className="text-white mb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSeccionActiva("solicitudes")}
                  >
                    Solicitudes de edición
                  </li>
                  <li
                    className="text-white mb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSeccionActiva("analisis")}
                  >
                    Resultado de Análisis
                  </li>
                </ul>
              </div>

              <div className="col-md-10">
                {seccionActiva === "remitos" && <Remitos />}
                {seccionActiva === "solicitudes" && <SolicitudesEdicion />}
                {seccionActiva === "analisis" && <ResultadosAnalisis />}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Encargado;
