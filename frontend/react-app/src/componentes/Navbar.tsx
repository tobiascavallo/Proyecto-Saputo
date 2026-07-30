import { useNavigate } from "react-router-dom";
import { API_URL } from "../api";

function Navbar({
  titulo,
  onConfigClick,
}: {
  titulo: string;
  onConfigClick?: () => void;
}) {
  const navigate = useNavigate();

  async function handleLogout() {
    const refreshToken = localStorage.getItem("refresh_token");

    try {
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (error) {
      console.log("No se pudo avisar al servidor, cerrando sesión localmente");
    }

    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  }

  return (
    <nav className="navbar navbar-dark bg-dark px-3 d-flex justify-content-between">
      <span className="navbar-brand mb-0 h5">{titulo}</span>
      <div className="d-flex gap-2 align-items-center">
        {onConfigClick && (
          <button
            className="btn btn-outline-light btn-sm"
            onClick={onConfigClick}
            title="Gestión"
          >
            ⚙️
          </button>
        )}
        <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
