// Importamos las herramientas de navegación de React Router
// BrowserRouter: envuelve toda la app y habilita el sistema de rutas
// Routes: contenedor de todas las rutas
// Route: define una ruta específica
// Navigate: redirige al usuario a otra ruta
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";

// Importamos los componentes que vamos a mostrar en cada ruta
import Login from "./componentes/Login";
import Empleado from "./componentes/Empleado";
import Encargado from "./componentes/Encargado";

// Componente que protege rutas — actúa como un portero
// "children" es lo que está adentro de <RutaProtegida>...</RutaProtegida>
function RutaProtegida({
  children,
  rolesPermitidos,
}: {
  children: React.ReactNode;
  rolesPermitidos: string[];
}) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" />;
  }

  const payload: any = jwtDecode(token);

  if (!rolesPermitidos.includes(payload.rol)) {
    return <Navigate to="/login" />;
  }
  useEffect(() => {
    function manejarPageshow(event: PageTransitionEvent) {
      if (event.persisted) {
        window.location.reload();
      }
    }

    window.addEventListener("pageshow", manejarPageshow);
    return () => window.removeEventListener("pageshow", manejarPageshow);
  }, []);

  return children;
}

function App() {
  return (
    // BrowserRouter envuelve todo — sin esto el routing no funciona
    <BrowserRouter>
      {/* Routes es el contenedor de todas las rutas de la app */}
      <Routes>
        {/* Redirige la raíz al login automáticamente */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Ruta pública — cualquiera puede entrar */}
        <Route path="/login" element={<Login />} />

        {/* Ruta protegida para el empleado */}
        <Route
          path="/empleado"
          element={
            <RutaProtegida rolesPermitidos={["empleado"]}>
              <Empleado />
            </RutaProtegida>
          }
        />

        {/* Ruta protegida para el encargado */}
        <Route
          path="/encargado"
          element={
            <RutaProtegida rolesPermitidos={["encargado"]}>
              <Encargado />
            </RutaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// Exportamos App para que main.tsx pueda usarlo
export default App;
