import { useState, useEffect } from "react";
import { API_URL, fetchConToken } from "../api";
import { useDatosReferencia } from "../contextos/DatosReferenciaContext";

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
  const { invalidarCamionero } = useDatosReferencia();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empresaId, setEmpresaId] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function fetchDatos() {
      try {
        const [responseUsuario, responseEmpresas] = await Promise.all([
          fetchConToken(`${API_URL}/api/v1/usuario/${usuarioId}`),
          fetchConToken(`${API_URL}/api/v1/empresaTransportista`),
        ]);

        if (responseUsuario.ok) {
          const usuario = await responseUsuario.json();
          setNombreUsuario(`${usuario.nombre} ${usuario.apellido}`);
        }

        const dataEmpresas = await responseEmpresas.json();
        setEmpresas(dataEmpresas || []);
      } catch (error) {
        setError("Error al cargar los datos necesarios");
      }
    }

    fetchDatos();
  }, [usuarioId]);

  async function handleGuardar() {
    if (!empresaId) {
      setError("Seleccioná una empresa transportista");
      return;
    }

    setGuardando(true);
    setError("");
    try {
      const response = await fetchConToken(`${API_URL}/api/v1/camionero`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: usuarioId,
          empresa_transportista_id: empresaId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al guardar los datos del camionero");
        return;
      }

      invalidarCamionero(usuarioId);
      onGuardado();
    } catch (error) {
      setError("Error al conectar con el servidor");
    } finally {
      setGuardando(false);
    }
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
            disabled={guardando}
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
