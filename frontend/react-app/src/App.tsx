// Importamos las herramientas de navegación de React Router
// BrowserRouter: envuelve toda la app y habilita el sistema de rutas
// Routes: contenedor de todas las rutas
// Route: define una ruta específica
// Navigate: redirige al usuario a otra ruta
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

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

  // El token puede estar corrupto o con formato inválido (ej. quedó a
  // medias en localStorage). Si jwtDecode tira, tratamos la sesión como
  // no válida en vez de romper el render.
  let rol: string | null = null;
  try {
    rol = (jwtDecode(token) as { rol?: string }).rol ?? null;
  } catch {
    return <Navigate to="/login" />;
  }

  if (!rol || !rolesPermitidos.includes(rol)) {
    return <Navigate to="/login" />;
  }

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
