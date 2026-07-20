// useState nos permite crear variables reactivas (cuando cambian, React actualiza la pantalla)
// useNavigate nos permite navegar entre rutas desde el código
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {

  // Variable reactiva para el email — arranca vacía
  const [email, setEmail] = useState("");

  // Variable reactiva para la contraseña — arranca vacía
  const [password, setPassword] = useState("");

  // Variable reactiva para mostrar errores en pantalla — arranca vacía
  const [error, setError] = useState("");

  // Hook que nos da una función para navegar a otras rutas
  const navigate = useNavigate();

  // Función que se ejecuta cuando el usuario clickea "Ingresar"
  // "async" porque hace una llamada a la API que tarda un tiempo
  async function handleLogin() {
    try {
      // Llama a la API del backend en Go
      // "await" pausa acá hasta que el servidor responda
      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST", // tipo de llamada HTTP
        headers: { "Content-Type": "application/json" }, // le dice al servidor que mandamos JSON
        body: JSON.stringify({ email, password }), // convierte los datos a JSON y los manda
      });

      // Convierte la respuesta del servidor a un objeto JavaScript
      // "await" porque esto también tarda un momento
      const data = await response.json();

      // Guarda el token JWT en el navegador para usarlo en futuras llamadas
      localStorage.setItem("token", data.token);

      // Redirige al usuario al dashboard
      navigate("/dashboard");

    } catch (error) {
      // Si algo salió mal (ej: no hay conexión), muestra el error en pantalla
      setError("Error al conectar con el servidor");
    }
  }

  return (
    // "container mt-5" — centra el contenido y agrega espacio arriba
    <div className="container mt-5">

      {/* "row justify-content-center" — centra el contenido horizontalmente */}
      <div className="row justify-content-center">

        {/* "col-md-4" — ocupa 4 de 12 columnas en pantallas medianas */}
        <div className="col-md-4">

          {/* "mb-4" — espacio abajo del título */}
          <h2 className="mb-4">Iniciar sesión</h2>

          {/* Input de email
              value={email} — muestra el valor actual del estado
              onChange — cada vez que el usuario tipea, actualiza el estado email */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control mb-3" // form-control = estilo Bootstrap, mb-3 = espacio abajo
          />

          {/* Input de contraseña — igual que el de email pero oculta los caracteres */}
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control mb-3"
          />

          {/* Botón que llama a handleLogin al clickear
              btn btn-primary = botón azul de Bootstrap
              w-100 = ancho 100% del contenedor */}
          <button onClick={handleLogin} className="btn btn-primary w-100">
            Ingresar
          </button>

          {/* Solo muestra el párrafo si "error" no está vacío
              text-danger = texto rojo de Bootstrap
              mt-2 = espacio arriba */}
          {error && <p className="text-danger mt-2">{error}</p>}

        </div>
      </div>
    </div>
  );
}

// Exportamos Login para que App.tsx pueda importarlo y usarlo
export default Login;