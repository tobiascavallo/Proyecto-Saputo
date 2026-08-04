import { useState, useEffect, useCallback } from "react";
import { API_URL, fetchConToken } from "../api";

function AltaUsuario() {
  const [vista, setVista] = useState<"listado" | "nuevo">("listado");

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargandoListado, setCargandoListado] = useState(true);
  const [errorListado, setErrorListado] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    contrasena: "",
    rol: "",
  });

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const fetchUsuarios = useCallback(async () => {
    setCargandoListado(true);
    try {
      const response = await fetchConToken(`${API_URL}/api/v1/usuario`);
      if (!response.ok) {
        setErrorListado("Error al obtener los usuarios");
        return;
      }
      const data = await response.json();
      setUsuarios(data || []);
    } catch (error) {
      setErrorListado("Error al conectar con el servidor");
    } finally {
      setCargandoListado(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  function nombreRol(rol: string) {
    if (rol === "camionero") return "Camionero";
    if (rol === "empleado") return "Empleado";
    if (rol === "encargado") return "Encargado";
    return rol;
  }

  async function handleSubmit() {
    try {
      const response = await fetchConToken(`${API_URL}/api/v1/usuario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al crear el usuario");
        return;
      }

      setExito("Usuario creado correctamente");
      setForm({ nombre: "", apellido: "", email: "", contrasena: "", rol: "" });
      fetchUsuarios();
      setVista("listado");
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Usuarios</h2>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${vista === "listado" ? "active" : ""}`}
            onClick={() => setVista("listado")}
          >
            Listado
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${vista === "nuevo" ? "active" : ""}`}
            onClick={() => setVista("nuevo")}
          >
            Nuevo usuario
          </button>
        </li>
      </ul>

      {vista === "listado" &&
        (cargandoListado ? (
          <p>Cargando usuarios...</p>
        ) : errorListado ? (
          <p className="text-danger">{errorListado}</p>
        ) : usuarios.length === 0 ? (
          <p className="text-muted">Todavía no hay usuarios cargados.</p>
        ) : (
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario: any) => (
                <tr key={usuario.id}>
                  <td>
                    {usuario.nombre} {usuario.apellido}
                  </td>
                  <td>{usuario.email}</td>
                  <td>{nombreRol(usuario.rol)}</td>
                  <td>
                    {usuario.activo ? (
                      <span className="badge bg-success">Activo</span>
                    ) : (
                      <span className="badge bg-secondary">Inactivo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}

      {vista === "nuevo" && (
        <div className="row justify-content-center">
          <div className="col-md-5">
            <input
              type="text"
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="form-control mb-3"
            />
            <input
              type="text"
              placeholder="Apellido"
              value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
              className="form-control mb-3"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="form-control mb-3"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={form.contrasena}
              onChange={(e) =>
                setForm({ ...form, contrasena: e.target.value })
              }
              className="form-control mb-3"
            />
            <select
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
              className="form-select mb-3"
            >
              <option value="">Seleccionar rol</option>
              <option value="camionero">Camionero</option>
              <option value="empleado">Empleado</option>
              <option value="encargado">Encargado</option>
            </select>

            <button onClick={handleSubmit} className="btn btn-primary w-100">
              Crear usuario
            </button>

            {error && <p className="text-danger mt-2">{error}</p>}
            {exito && <p className="text-success mt-2">{exito}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default AltaUsuario;
