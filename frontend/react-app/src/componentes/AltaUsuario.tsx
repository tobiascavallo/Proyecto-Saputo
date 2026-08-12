import { useState, useEffect, useCallback } from "react";
import { API_URL, fetchConToken } from "../api";
import DatosCamionero from "./DatosCamionero";
import { useDatosReferencia } from "../contextos/DatosReferenciaContext";

const FORM_VACIO = {
  nombre: "",
  apellido: "",
  dni: "",
  telefono: "",
  email: "",
  contrasena: "",
  rol: "",
};

function AltaUsuario() {
  const { invalidarUsuarios } = useDatosReferencia();
  const [vista, setVista] = useState<"listado" | "nuevo" | "datosCamionero">(
    "listado",
  );
  const [usuarioCreadoId, setUsuarioCreadoId] = useState<string | null>(null);

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargandoListado, setCargandoListado] = useState(true);
  const [errorListado, setErrorListado] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

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

  const usuariosFiltrados = usuarios.filter((u: any) => {
    if (filtroEstado === "activos") return u.activo;
    if (filtroEstado === "inactivos") return !u.activo;
    return true;
  });

  function nombreRol(rol: string) {
    if (rol === "camionero") return "Camionero";
    if (rol === "empleado") return "Empleado";
    if (rol === "encargado") return "Encargado";
    return rol;
  }

  function dniValido(dni: string) {
    return /^\d{7,8}$/.test(dni);
  }

  function iniciarEdicion(usuario: any) {
    setEditandoId(usuario.id);
    setForm({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni || "",
      telefono: usuario.telefono || "",
      email: usuario.email,
      contrasena: "",
      rol: usuario.rol,
    });
    setError("");
    setExito("");
    setVista("nuevo");
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setVista("listado");
  }

  async function handleSubmit() {
    // Validación básica del lado del cliente — evita gastar una llamada al
    // backend con datos que ya sabemos inválidos. En edición, el DNI es
    // opcional: si se deja vacío no se toca; si se completa, debe ser válido.
    if (!editandoId && !dniValido(form.dni)) {
      setError("El DNI debe tener 7 u 8 dígitos numéricos");
      return;
    }
    if (editandoId && form.dni && !dniValido(form.dni)) {
      setError("El DNI debe tener 7 u 8 dígitos numéricos");
      return;
    }
    if (!editandoId && !form.telefono.trim()) {
      setError("El teléfono es requerido");
      return;
    }

    try {
      const url = editandoId
        ? `${API_URL}/api/v1/usuario/${editandoId}`
        : `${API_URL}/api/v1/usuario`;

      const response = await fetchConToken(url, {
        method: editandoId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(
          data.error ||
            (editandoId
              ? "Error al actualizar el usuario"
              : "Error al crear el usuario"),
        );
        return;
      }

      // Edición: mensaje de éxito y de vuelta al listado.
      if (editandoId) {
        setExito("Usuario actualizado correctamente");
        setEditandoId(null);
        setForm(FORM_VACIO);
        fetchUsuarios();
        setVista("listado");
        return;
      }

      const data = await response.json();
      const rolCreado = form.rol;

      setForm(FORM_VACIO);

      // El usuario nuevo todavía no está en el caché compartido del
      // contexto (se cargó una sola vez al entrar al panel) — sin esto,
      // seguiría apareciendo como ID crudo en Remitos/Solicitudes hasta
      // que alguien recargue la página a mano.
      invalidarUsuarios();

      // Si el usuario nuevo es camionero, el alta no termina acá — falta
      // completar la empresa transportista en un segundo paso. Si no,
      // el flujo de siempre: mensaje de éxito y de vuelta al listado.
      if (rolCreado === "camionero") {
        setUsuarioCreadoId(data.id);
        setVista("datosCamionero");
      } else {
        setExito("Usuario creado correctamente");
        fetchUsuarios();
        setVista("listado");
      }
    } catch (error) {
      setError("Error al conectar con el servidor");
    }
  }

  async function handleDesactivar(usuario: any) {
    if (
      !window.confirm(
        `¿Desactivar a ${usuario.nombre} ${usuario.apellido}?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetchConToken(
        `${API_URL}/api/v1/usuario/${usuario.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json();
        setErrorListado(data.error || "Error al desactivar el usuario");
        return;
      }

      fetchUsuarios();
    } catch (error) {
      setErrorListado("Error al conectar con el servidor");
    }
  }

  function finalizarDatosCamionero() {
    setUsuarioCreadoId(null);
    fetchUsuarios();
    setVista("listado");
  }

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">Usuarios</h2>

      {vista !== "datosCamionero" && (
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${vista === "listado" ? "active" : ""}`}
              onClick={() => {
                setEditandoId(null);
                setForm(FORM_VACIO);
                setVista("listado");
              }}
            >
              Listado
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${vista === "nuevo" ? "active" : ""}`}
              onClick={() => {
                if (!editandoId) setForm(FORM_VACIO);
                setVista("nuevo");
              }}
            >
              {editandoId ? "Editar usuario" : "Nuevo usuario"}
            </button>
          </li>
        </ul>
      )}

      {vista === "datosCamionero" && usuarioCreadoId && (
        <DatosCamionero
          usuarioId={usuarioCreadoId}
          onGuardado={finalizarDatosCamionero}
          onCancelar={finalizarDatosCamionero}
        />
      )}

      {vista === "listado" && (
        <>
          <div className="btn-group mb-3">
            <button
              className={`btn btn-sm ${filtroEstado === "activos" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setFiltroEstado("activos")}
            >
              Activos
            </button>
            <button
              className={`btn btn-sm ${filtroEstado === "inactivos" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setFiltroEstado("inactivos")}
            >
              Inactivos
            </button>
            <button
              className={`btn btn-sm ${filtroEstado === "todos" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setFiltroEstado("todos")}
            >
              Todos
            </button>
          </div>

          {cargandoListado ? (
            <p>Cargando usuarios...</p>
          ) : errorListado ? (
            <p className="text-danger">{errorListado}</p>
          ) : usuariosFiltrados.length === 0 ? (
            <p className="text-muted">No hay usuarios para mostrar.</p>
          ) : (
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario: any) => (
                  <tr key={usuario.id}>
                    <td>
                      {usuario.nombre} {usuario.apellido}
                    </td>
                    <td>{usuario.dni || "—"}</td>
                    <td>{usuario.telefono || "—"}</td>
                    <td>{usuario.email}</td>
                    <td>{nombreRol(usuario.rol)}</td>
                    <td>
                      {usuario.activo ? (
                        <span className="badge bg-success">Activo</span>
                      ) : (
                        <span className="badge bg-secondary">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => iniciarEdicion(usuario)}
                        >
                          Editar
                        </button>
                        {usuario.activo && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDesactivar(usuario)}
                          >
                            Desactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

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
              type="text"
              placeholder="DNI (7 u 8 dígitos)"
              value={form.dni}
              onChange={(e) => setForm({ ...form, dni: e.target.value })}
              className="form-control mb-3"
            />
            <input
              type="text"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
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
              placeholder={
                editandoId
                  ? "Contraseña (dejar en blanco para no cambiar)"
                  : "Contraseña"
              }
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

            <div className="d-flex gap-2">
              <button
                onClick={handleSubmit}
                className="btn btn-primary flex-grow-1"
              >
                {editandoId ? "Guardar cambios" : "Crear usuario"}
              </button>
              {editandoId && (
                <button
                  className="btn btn-outline-secondary"
                  onClick={cancelarEdicion}
                >
                  Cancelar
                </button>
              )}
            </div>

            {error && <p className="text-danger mt-2">{error}</p>}
            {exito && <p className="text-success mt-2">{exito}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default AltaUsuario;
