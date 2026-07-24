import { useState } from "react";
import AltaUsuario from "./AltaUsuario";
import Remitos from "./Remito";
import SolicitudesEdicion from "./SolicitudesEdicion";
import ResultadosAnalisis from "./ResultadosAnalisis";
import Navbar from "./Navbar";

function Encargado() {
  const [seccionActiva, setSeccionActiva] = useState("alta-usuario");

  return (
    <>
      <Navbar titulo="Panel Encargado" />
      <div className="container-fluid">
        <div className="row">
          {/* Menú lateral */}
          <div className="col-md-2 bg-dark min-vh-100 p-3">
            <h5 className="text-white mb-4">Panel Encargado</h5>
            <ul className="list-unstyled">
              <li
                className="text-white mb-2"
                style={{ cursor: "pointer" }}
                onClick={() => setSeccionActiva("alta-usuario")}
              >
                Alta usuario
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
              <li
                className="text-white mb-2"
                style={{ cursor: "pointer" }}
                onClick={() => setSeccionActiva("remitos")}
              >
                Remitos
              </li>
            </ul>
          </div>

          {/* Contenido principal */}
          <div className="col-md-10">
            {seccionActiva === "alta-usuario" && <AltaUsuario />}
            {seccionActiva === "solicitudes" && <SolicitudesEdicion />}
            {seccionActiva === "analisis" && <ResultadosAnalisis />}
            {seccionActiva === "remitos" && <Remitos />}
          </div>
        </div>
      </div>
    </>
  );
}

export default Encargado;
