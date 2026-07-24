import { useNavigate } from "react-router-dom";

function Navbar({ titulo }: { titulo: string }) {
  const navigate = useNavigate();

  async function handleLogout() {
    const refreshToken = localStorage.getItem("refresh_token");

    try {
      await fetch("http://localhost:8080/api/v1/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (error) {
      // Si falla el aviso al backend, igual sacamos al usuario del frontend
      console.log("No se pudo avisar al servidor, cerrando sesión localmente");
    }

    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  }

  return (
    <nav className="navbar navbar-dark bg-dark px-3 d-flex justify-content-between">
      <span className="navbar-brand mb-0 h5">{titulo}</span>
      <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </nav>
  );
}

export default Navbar;
