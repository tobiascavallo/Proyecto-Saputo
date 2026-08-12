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

interface EmpresaRef {
  id: string;
  nombre: string;
  cuit: string;
  domicilio: string;
  activo: boolean;
}

interface TamberoRef {
  id: string;
  nombre: string;
  cuit: string;
  telefono: string;
  email: string;
  activo: boolean;
}

export interface UsuarioBasico {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email: string;
  rol: string;
}

export interface CamioneroBasico {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_dni: string;
  usuario_telefono: string;
  empresa_transportista_id: string;
  empresa_transportista_nombre: string;
}

interface DatosReferenciaValor {
  nombreTambo: (id: string) => string;
  // null = no se pudo cargar el listado completo (sin permiso para este rol)
  nombreUsuario: (id: string) => string | null;
  obtenerUsuarioBasico: (id: string) => Promise<UsuarioBasico | null>;
  // Devuelve null tanto si hubo un error como si el camionero todavía no
  // completó sus datos — en ambos casos, la UI debe mostrar "sin datos
  // completados" en vez de romper.
  obtenerCamioneroPorUsuario: (usuarioId: string) => Promise<CamioneroBasico | null>;
  // Saca a un usuario del caché de camionero — se llama después de crear un
  // registro de Camionero, para que el próximo "Ver detalle" en la misma
  // sesión pida el dato de nuevo en vez de reusar el "sin datos completados"
  // que se pudo haber cacheado antes.
  invalidarCamionero: (usuarioId: string) => void;
  // Vuelve a pedir el listado de usuarios — se llama después de crear un
  // usuario nuevo, para que aparezca con su nombre resuelto (en vez de ID
  // crudo) en Remitos/Solicitudes sin esperar a un refresco manual de
  // página. No hace nada si el rol logueado no tiene acceso a ese listado
  // (empleado).
  invalidarUsuarios: () => void;
  // Listado completo de empresas transportistas — lo consumen los <select>
  // de AltaVehiculo.tsx y AltaAcoplado.tsx, para no pedirlo cada uno por su
  // cuenta y para que ambos vean una empresa recién creada sin recargar.
  empresas: EmpresaRef[];
  invalidarEmpresas: () => void;
  // Listado completo de tamberos — lo consume el <select> de AltaTambo.tsx.
  tamberos: TamberoRef[];
  invalidarTamberos: () => void;
  // Vuelve a pedir el listado de tambos — se llama después de crear un
  // tambo nuevo, para que nombreTambo() lo resuelva en Remito.tsx sin
  // esperar a un refresco manual.
  invalidarTambos: () => void;
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
  const [empresas, setEmpresas] = useState<EmpresaRef[]>([]);
  const [tamberos, setTamberos] = useState<TamberoRef[]>([]);
  const [basicosCache, setBasicosCache] = useState<
    Record<string, UsuarioBasico>
  >({});
  // El valor cacheado es null cuando ya se pidió y el camionero no tiene
  // datos completados (o falló) — distinto de "todavía no se pidió", que es
  // cuando la clave ni siquiera está presente en el objeto.
  const [camionerosCache, setCamionerosCache] = useState<
    Record<string, CamioneroBasico | null>
  >({});

  // Extraído a useCallback (en vez de vivir solo dentro del useEffect) para
  // poder reusarlo desde invalidarUsuarios() y forzar un refetch real, no
  // solo limpiar el estado y esperar a que algo más lo vuelva a pedir.
  const cargarUsuarios = useCallback(async () => {
    if (rolDesdeToken() !== "encargado") return;

    try {
      const response = await fetchConToken(`${API_URL}/api/v1/usuario`);
      if (!response.ok) return;
      setUsuarios((await response.json()) || []);
    } catch {
      // Sin lista de usuarios, se cae al detalle bajo demanda.
    }
  }, []);

  // Mismo criterio que cargarUsuarios: se extraen a useCallback para poder
  // reusarlos desde las funciones invalidarX() y forzar un refetch real.
  const cargarTambos = useCallback(async () => {
    try {
      const response = await fetchConToken(`${API_URL}/api/v1/tambo`);
      if (!response.ok) return;
      setTambos((await response.json()) || []);
    } catch {
      // Sin datos de referencia el fallback es mostrar el ID crudo.
    }
  }, []);

  const cargarEmpresas = useCallback(async () => {
    try {
      const response = await fetchConToken(
        `${API_URL}/api/v1/empresaTransportista`,
      );
      if (!response.ok) return;
      setEmpresas((await response.json()) || []);
    } catch {
      // Sin datos de referencia, los <select> que dependen de esto quedan
      // vacíos — cada componente ya maneja ese caso mostrando su propio error.
    }
  }, []);

  const cargarTamberos = useCallback(async () => {
    try {
      const response = await fetchConToken(`${API_URL}/api/v1/tambero`);
      if (!response.ok) return;
      setTamberos((await response.json()) || []);
    } catch {
      // Idem cargarEmpresas.
    }
  }, []);

  useEffect(() => {
    cargarTambos();
    cargarUsuarios();
    cargarEmpresas();
    cargarTamberos();
  }, [cargarTambos, cargarUsuarios, cargarEmpresas, cargarTamberos]);

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

  const obtenerCamioneroPorUsuario = useCallback(
    async (usuarioId: string) => {
      if (usuarioId in camionerosCache) return camionerosCache[usuarioId];

      try {
        const response = await fetchConToken(
          `${API_URL}/api/v1/camionero/usuario/${usuarioId}`,
        );
        if (!response.ok) {
          setCamionerosCache((actual) => ({ ...actual, [usuarioId]: null }));
          return null;
        }

        const datos: CamioneroBasico = await response.json();
        setCamionerosCache((actual) => ({ ...actual, [usuarioId]: datos }));
        return datos;
      } catch {
        return null;
      }
    },
    [camionerosCache],
  );

  const invalidarCamionero = useCallback((usuarioId: string) => {
    setCamionerosCache((actual) => {
      if (!(usuarioId in actual)) return actual;
      const { [usuarioId]: _quitado, ...resto } = actual;
      return resto;
    });
  }, []);

  const invalidarUsuarios = useCallback(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const invalidarEmpresas = useCallback(() => {
    cargarEmpresas();
  }, [cargarEmpresas]);

  const invalidarTamberos = useCallback(() => {
    cargarTamberos();
  }, [cargarTamberos]);

  const invalidarTambos = useCallback(() => {
    cargarTambos();
  }, [cargarTambos]);

  const valor = useMemo(
    () => ({
      nombreTambo,
      nombreUsuario,
      obtenerUsuarioBasico,
      obtenerCamioneroPorUsuario,
      invalidarCamionero,
      invalidarUsuarios,
      empresas,
      invalidarEmpresas,
      tamberos,
      invalidarTamberos,
      invalidarTambos,
    }),
    [
      nombreTambo,
      nombreUsuario,
      obtenerUsuarioBasico,
      obtenerCamioneroPorUsuario,
      invalidarCamionero,
      invalidarUsuarios,
      empresas,
      invalidarEmpresas,
      tamberos,
      invalidarTamberos,
      invalidarTambos,
    ],
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
