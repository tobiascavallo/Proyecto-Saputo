import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { API_URL, fetchConToken } from "../api";

// DatosReferenciaContext.tsx - Cachea, una sola vez por panel (Empleado o
// Encargado), los datos de referencia que se usan para mostrar nombres
// legibles en vez de IDs de Mongo en las tablas (remitos, solicitudes de
// edición, etc.), en vez de que cada componente los pida por separado.
//
// Ojo con el listado de usuarios: GET /api/v1/usuario está restringido a
// rol "encargado" (ver RecoleccionLactea/main.go) — para "empleado" ese
// fetch nunca va a tener éxito, así que directamente no se intenta y
// nombreUsuario() devuelve null para que el que llama pueda mostrar un
// fallback (ver componentes/NombreUsuario.tsx).

interface UsuarioRef {
  id: string;
  nombre: string;
  apellido: string;
}

interface TamboRef {
  id: string;
  numero_tambo: number;
  tambero_nombre: string;
}

export interface UsuarioBasico {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

interface DatosReferenciaValor {
  nombreTambo: (id: string) => string;
  // null = no se pudo cargar el listado completo (sin permiso para este rol)
  nombreUsuario: (id: string) => string | null;
  obtenerUsuarioBasico: (id: string) => Promise<UsuarioBasico | null>;
}

const DatosReferenciaContext = createContext<DatosReferenciaValor | null>(
  null,
);

function rolDesdeToken(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return (jwtDecode(token) as any).rol ?? null;
  } catch {
    return null;
  }
}

export function DatosReferenciaProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [tambos, setTambos] = useState<TamboRef[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioRef[] | null>(null);
  const [basicosCache, setBasicosCache] = useState<
    Record<string, UsuarioBasico>
  >({});

  useEffect(() => {
    async function cargarTambos() {
      try {
        const response = await fetchConToken(`${API_URL}/api/v1/tambo`);
        if (!response.ok) return;
        setTambos((await response.json()) || []);
      } catch {
        // Sin datos de referencia el fallback es mostrar el ID crudo.
      }
    }

    async function cargarUsuarios() {
      if (rolDesdeToken() !== "encargado") return;

      try {
        const response = await fetchConToken(`${API_URL}/api/v1/usuario`);
        if (!response.ok) return;
        setUsuarios((await response.json()) || []);
      } catch {
        // Sin lista de usuarios, se cae al detalle bajo demanda.
      }
    }

    cargarTambos();
    cargarUsuarios();
  }, []);

  const nombreTambo = useCallback(
    (id: string) => {
      const tambo = tambos.find((t) => t.id === id);
      if (!tambo) return id;
      return `N° ${tambo.numero_tambo} — ${tambo.tambero_nombre}`;
    },
    [tambos],
  );

  const nombreUsuario = useCallback(
    (id: string) => {
      if (!usuarios) return null;
      const usuario = usuarios.find((u) => u.id === id);
      return usuario ? `${usuario.nombre} ${usuario.apellido}` : id;
    },
    [usuarios],
  );

  const obtenerUsuarioBasico = useCallback(
    async (id: string) => {
      const cacheado = basicosCache[id];
      if (cacheado) return cacheado;

      try {
        const response = await fetchConToken(
          `${API_URL}/api/v1/usuario/${id}/basico`,
        );
        if (!response.ok) return null;

        const datos: UsuarioBasico = await response.json();
        setBasicosCache((actual) => ({ ...actual, [id]: datos }));
        return datos;
      } catch {
        return null;
      }
    },
    [basicosCache],
  );

  const valor = useMemo(
    () => ({ nombreTambo, nombreUsuario, obtenerUsuarioBasico }),
    [nombreTambo, nombreUsuario, obtenerUsuarioBasico],
  );

  return (
    <DatosReferenciaContext.Provider value={valor}>
      {children}
    </DatosReferenciaContext.Provider>
  );
}

export function useDatosReferencia() {
  const contexto = useContext(DatosReferenciaContext);
  if (!contexto) {
    throw new Error(
      "useDatosReferencia debe usarse dentro de <DatosReferenciaProvider>",
    );
  }
  return contexto;
}
