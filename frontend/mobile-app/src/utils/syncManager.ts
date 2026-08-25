// src/utils/syncManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

const QUEUE_KEY = '@recoleccion_outbox_queue';

// Una línea encolada offline — mismos campos que dto.CrearLineaRecoleccionRequest
// en el backend (remito_id, tambo_id, litros_recibidos, temperatura_celcius,
// numero_cisterna, hora_recoleccion, codigo_muestra_diaria, codigo_muestra_ufc),
// más idLocal e intentos para el manejo de la cola en el celular.
//
// No incluye remito: la creación de un remito exige señal (ver
// IniciarRecorridoScreen) — el remitoId que llega acá siempre es uno real ya
// confirmado por el backend, nunca uno temporal. Evita tener que reconciliar
// IDs temporales contra los reales de Mongo al sincronizar.
export interface LineaPendiente {
  idLocal: string;
  remitoId: string;
  tamboId: string;
  litrosRecibidos: number;
  temperaturaCelcius: number;
  numeroCisterna: number;
  horaRecoleccion: string;
  codigoMuestraDiaria: string;
  codigoMuestraUfc?: string;
  intentos: number;
}

// 1. Obtener la cola de líneas pendientes
export const getPendingLines = async (): Promise<LineaPendiente[]> => {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// 2. Guardar una nueva línea en la cola local (Offline)
export const enqueueLine = async (linea: Omit<LineaPendiente, 'intentos'>): Promise<void> => {
  const currentQueue = await getPendingLines();
  const newLinea: LineaPendiente = { ...linea, intentos: 0 };
  const updatedQueue = [...currentQueue, newLinea];
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
};

// 3. Procesar la cola y enviar al backend de Go cuando hay conexión (Sync).
// El endpoint real es POST /api/v1/lineaRecoleccion (no /remitos/:id/lineas,
// que no existe) con remito_id en el body — "api" ya tiene /api/v1 en su
// baseURL, así que acá solo va /lineaRecoleccion.
export const processOutboxQueue = async (): Promise<{ procesados: number; fallidos: number }> => {
  const queue = await getPendingLines();
  if (queue.length === 0) return { procesados: 0, fallidos: 0 };

  const remainingQueue: LineaPendiente[] = [];
  let procesados = 0;
  let fallidos = 0;

  for (const item of queue) {
    try {
      await api.post('/lineaRecoleccion', {
        remito_id: item.remitoId,
        tambo_id: item.tamboId,
        litros_recibidos: item.litrosRecibidos,
        temperatura_celcius: item.temperaturaCelcius,
        numero_cisterna: item.numeroCisterna,
        hora_recoleccion: item.horaRecoleccion,
        codigo_muestra_diaria: item.codigoMuestraDiaria,
        codigo_muestra_ufc: item.codigoMuestraUfc || undefined,
      });
      procesados++;
    } catch (error) {
      fallidos++;
      // Si falla, incrementa intentos y la conserva en la cola local
      remainingQueue.push({
        ...item,
        intentos: item.intentos + 1,
      });
    }
  }

  // Actualiza la cola guardando únicamente los items que fallaron
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
  return { procesados, fallidos };
};
