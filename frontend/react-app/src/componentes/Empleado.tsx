import { useState } from "react";
import Remitos from "./Remito";
import ResultadosAnalisis from "./ResultadosAnalisis";
import Navbar from "./Navbar";

function Empleado() {
  const [seccionActiva, setSeccionActiva] = useState("remitos");

  return (
    <>
      <Navbar titulo="Panel Empleado" />
      <div className="container-fluid">
        <div className="row">
          {/* Menú lateral */}
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
                onClick={() => setSeccionActiva("analisis")}
              >
                Resultados de análisis
              </li>
            </ul>
          </div>

          {/* Contenido principal */}
          <div className="col-md-10">
            {seccionActiva === "remitos" && <Remitos />}
            {seccionActiva === "analisis" && <ResultadosAnalisis />}
          </div>
        </div>
      </div>
    </>
  );
}

export default Empleado;
