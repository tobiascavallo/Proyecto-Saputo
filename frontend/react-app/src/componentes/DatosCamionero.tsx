import { useState } from "react";
import { useUsuarios } from "../hooks/useUsuarios";
import { useEmpresas } from "../hooks/useEmpresas";
import { useCrearCamionero } from "../hooks/useCamioneros";

// DatosCamionero.tsx - Segundo paso del alta de un camionero: el usuario
// (login, rol) ya existe, acá se completa el dato específico del rol
// (empresa transportista). Si el encargado cierra o cancela este paso, el
// camionero queda "sin datos completados" — es un estado válido, no un
// error; puede completarse más tarde desde la sección Camioneros de Gestión.
function DatosCamionero({
  usuarioId,
  onGuardado,
  onCancelar,
}: {
  usuarioId: string;
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  // El usuario recién se creó en AltaUsuario, que invalidó ["usuarios"] — el
  // listado ya cacheado lo contiene (o lo va a contener apenas termine el
  // refetch; hasta entonces se muestra el texto genérico).
  const { data: usuarios = [] } = useUsuarios();
  const { data: empresas = [] } = useEmpresas();
  const crearCamionero = useCrearCamionero();

  const usuario = usuarios.find((u: any) => u.id === usuarioId);
  const nombreUsuario = usuario
    ? `${usuario.nombre} ${usuario.apellido}`
    : "";

  const [empresaId, setEmpresaId] = useState("");
  const [error, setError] = useState("");

  function handleGuardar() {
    if (!empresaId) {
      setError("Seleccioná una empresa transportista");
      return;
    }
    setError("");

    crearCamionero.mutate(
      { usuario_id: usuarioId, empresa_transportista_id: empresaId },
      {
        onSuccess: () => onGuardado(),
        onError: (e: Error) => setError(e.message),
      },
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <h4 className="mb-3">Datos del camionero</h4>
        <p className="text-muted">
          Completá la empresa transportista de{" "}
          {nombreUsuario || "este camionero"}. Si preferís hacerlo más
          adelante, podés completarlo después desde la sección Camioneros.
        </p>

        <select
          value={empresaId}
          onChange={(e) => setEmpresaId(e.target.value)}
          className="form-select mb-3"
        >
          <option value="">Seleccionar empresa transportista</option>
          {empresas.map((empresa: any) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.nombre}
            </option>
          ))}
        </select>

        <div className="d-flex gap-2">
          <button
            className="btn btn-primary flex-grow-1"
            onClick={handleGuardar}
            disabled={crearCamionero.isPending}
          >
            Guardar datos del camionero
          </button>
          <button className="btn btn-outline-secondary" onClick={onCancelar}>
            Completar más tarde
          </button>
        </div>

        {error && <p className="text-danger mt-2">{error}</p>}
      </div>
    </div>
  );
}

export default DatosCamionero;
