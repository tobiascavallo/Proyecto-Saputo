import { useState } from "react";
import Remitos from "./Remito";
import SolicitudesEdicion from "./SolicitudesEdicion";
import ResultadosAnalisis from "./ResultadosAnalisis";
import AltaUsuario from "./AltaUsuario";
import AltaEmpresaTransportista from "./AltaEmpresaTransportista";
import AltaVehiculo from "./AltaVehiculo";
import AltaAcoplado from "./AltaAcoplado";
import AltaTambero from "./AltaTambero";
import AltaTambo from "./AltaTambo";
import Navbar from "./Navbar";

function Encargado() {
  // Controla si estamos en el panel operativo o en la vista de Gestión
  const [vista, setVista] = useState<"panel" | "gestion">("panel");

  const [seccionActiva, setSeccionActiva] = useState("remitos");
  const [seccionGestion, setSeccionGestion] = useState("usuarios");

  // ----- VISTA: GESTIÓN -----
  if (vista === "gestion") {
    return (
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
              {seccionGestion === "empresas" && <AltaEmpresaTransportista />}
              {seccionGestion === "vehiculos" && <AltaVehiculo />}
              {seccionGestion === "acoplados" && <AltaAcoplado />}
              {seccionGestion === "tamberos" && <AltaTambero />}
              {seccionGestion === "tambos" && <AltaTambo />}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ----- VISTA: PANEL PRINCIPAL -----
  return (
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
  );
}

export default Encargado;
