import { useState } from "react";
import DatosCamionero from "./DatosCamionero";
import {
  useUsuarios,
  useCrearUsuario,
  useActualizarUsuario,
  useActivarUsuario,
  useDesactivarUsuario,
} from "../hooks/useUsuarios";

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
  const usuariosQuery = useUsuarios();
  const usuarios = usuariosQuery.data ?? [];

  const crearUsuario = useCrearUsuario();
  const actualizarUsuario = useActualizarUsuario();
  const activarUsuario = useActivarUsuario();
  const desactivarUsuario = useDesactivarUsuario();

  const [vista, setVista] = useState<"listado" | "nuevo" | "datosCamionero">(
    "listado",
  );
  const [usuarioCreadoId, setUsuarioCreadoId] = useState<string | null>(null);

  const [filtroEstado, setFiltroEstado] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VACIO);

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [errorAccion, setErrorAccion] = useState("");

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

  function handleSubmit() {
    // Validación básica del lado del cliente. En edición, el DNI es opcional:
    // si se deja vacío no se toca; si se completa, debe ser válido.
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

    setError("");

    if (editandoId) {
      actualizarUsuario.mutate(
        { id: editandoId, body: form },
        {
          onSuccess: () => {
            setExito("Usuario actualizado correctamente");
            setEditandoId(null);
            setForm(FORM_VACIO);
            setVista("listado");
          },
          onError: (e: Error) => setError(e.message),
        },
      );
      return;
    }

    const rolCreado = form.rol;
    crearUsuario.mutate(form, {
      onSuccess: (data) => {
        setForm(FORM_VACIO);
        // Si el usuario nuevo es camionero, el alta no termina acá — falta
        // completar la empresa transportista en un segundo paso.
        if (rolCreado === "camionero") {
          setUsuarioCreadoId(data.id);
          setVista("datosCamionero");
        } else {
          setExito("Usuario creado correctamente");
          setVista("listado");
        }
      },
      onError: (e: Error) => setError(e.message),
    });
  }

  function handleDesactivar(usuario: any) {
    if (
      !window.confirm(`¿Desactivar a ${usuario.nombre} ${usuario.apellido}?`)
    ) {
      return;
    }
    setErrorAccion("");
    desactivarUsuario.mutate(usuario.id, {
      onError: (e: Error) => setErrorAccion(e.message),
    });
  }

  function handleActivar(usuario: any) {
    if (
      !window.confirm(`¿Reactivar a ${usuario.nombre} ${usuario.apellido}?`)
    ) {
      return;
    }
    setErrorAccion("");
    activarUsuario.mutate(usuario.id, {
      onError: (e: Error) => setErrorAccion(e.message),
    });
  }

  function finalizarDatosCamionero() {
    setUsuarioCreadoId(null);
    setVista("listado");
  }

  const guardando = crearUsuario.isPending || actualizarUsuario.isPending;

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

          {errorAccion && <p className="text-danger">{errorAccion}</p>}

          {usuariosQuery.isPending ? (
            <p>Cargando usuarios...</p>
          ) : usuariosQuery.isError ? (
            <p className="text-danger">Error al obtener los usuarios.</p>
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
                        {usuario.activo ? (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDesactivar(usuario)}
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleActivar(usuario)}
                          >
                            Reactivar
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
            {editandoId ? (
              // El rol no se puede cambiar en una edición — se muestra
              // informativo, no como select (ver dto.ActualizarUsuarioRequest).
              <div className="mb-3">
                <label className="form-label text-muted">Rol</label>
                <p className="form-control-plaintext">
                  {nombreRol(form.rol)}
                </p>
              </div>
            ) : (
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
            )}

            <div className="d-flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={guardando}
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
