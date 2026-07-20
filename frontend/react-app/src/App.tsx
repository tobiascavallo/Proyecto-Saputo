// Importamos las herramientas de navegación de React Router
// BrowserRouter: envuelve toda la app y habilita el sistema de rutas
// Routes: contenedor de todas las rutas
// Route: define una ruta específica
// Navigate: redirige al usuario a otra ruta
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Importamos los componentes que vamos a mostrar en cada ruta
import Login from "./componentes/Login";
import Dashboard from "./componentes/Dashboard";

// Componente que protege rutas — actúa como un portero
// "children" es lo que está adentro de <RutaProtegida>...</RutaProtegida>
function RutaProtegida({ children }: { children: React.ReactNode }) {
  // Busca el token JWT en el navegador
  const token = localStorage.getItem("token");

  // Si no hay token, el usuario no está logueado
  // Lo mandamos de vuelta al login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Si hay token, mostramos lo que estaba adentro de <RutaProtegida>
  return children;
}

function App() {
  return (
    // BrowserRouter envuelve todo — sin esto el routing no funciona
    <BrowserRouter>
      {/* Routes es el contenedor de todas las rutas de la app */}
      <Routes>
        {/* Ruta pública — cualquiera puede entrar */}
        <Route path="/login" element={<Login />} />

        {/* Ruta protegida — solo entra si hay token */}
        {/* RutaProtegida envuelve al Dashboard y lo custodia */}
        <Route
          path="/dashboard"
          element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// Exportamos App para que main.tsx pueda usarlo
export default App;
