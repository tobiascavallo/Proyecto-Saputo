import { useState } from "react";

function AltaUsuario() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    rol: "",
  });

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  async function handleSubmit() {
    try {
      const response = await fetch("http://localhost:8080/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        setError("Error al crear el usuario");
        return;
      }

      setExito("Usuario creado correctamente");
      setForm({ nombre: "", apellido: "", email: "", password: "", rol: "" });
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <h2 className="mb-4">Dar de alta usuario</h2>

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
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
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
    </div>
  );
}

export default AltaUsuario;
