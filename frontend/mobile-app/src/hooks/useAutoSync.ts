import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from './useNetworkStatus';
import { processOutboxQueue } from '../utils/syncManager';

// Motor de sincronización automática: al montar la app y cada vez que se
// recupera señal, intenta vaciar la cola local de líneas pendientes contra
// el backend. Ninguna pantalla tiene que dispararlo a mano.
export function useAutoSync() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const sincronizando = useRef(false);

  useEffect(() => {
    if (!isOnline || sincronizando.current) return;

    sincronizando.current = true;
    processOutboxQueue()
      .then(({ procesados }) => {
        if (procesados > 0) {
          // Coincidencia de prefijo: invalida todas las queries de líneas
          // (de cualquier remito) y de la cola local pendiente, para que
          // RemitoActivoScreen se entere sin que nadie tenga que recargar.
          queryClient.invalidateQueries({ queryKey: ['lineasDelRemito'] });
          queryClient.invalidateQueries({ queryKey: ['lineasPendientes'] });
        }
      })
      .finally(() => {
        sincronizando.current = false;
      });
  }, [isOnline, queryClient]);
}
