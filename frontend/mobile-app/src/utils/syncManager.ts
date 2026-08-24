// src/utils/syncManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

const QUEUE_KEY = '@recoleccion_outbox_queue';

export interface LineaPendiente {
  idLocal: string; // ID temporal generado en el celular (ej: uuid o timestamp)
  remitoId: string;
  tamboId: string;
  litros: number;
  temperatura: number;
  fechaCreacion: string;
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

// 3. Procesar la cola y enviar al backend de Go cuando hay conexión (Sync)
export const processOutboxQueue = async (): Promise<{ procesados: number; fallidos: number }> => {
  const queue = await getPendingLines();
  if (queue.length === 0) return { procesados: 0, fallidos: 0 };

  const remainingQueue: LineaPendiente[] = [];
  let procesados = 0;
  let fallidos = 0;

  for (const item of queue) {
    try {
      // Intenta enviar la línea al endpoint del backend
      await api.post(`/remitos/${item.remitoId}/lineas`, {
        tamboId: item.tamboId,
        litros: item.litros,
        temperatura: item.temperatura,
        fecha: item.fechaCreacion,
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