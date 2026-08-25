import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// Mismo criterio que QueryClient.ts (onlineManager): "online" es tener
// conexión Y que internet sea efectivamente alcanzable, no solo estar
// asociado a un WiFi/datos sin salida real a internet.
function esOnline(state: NetInfoState): boolean {
  return Boolean(state.isConnected && state.isInternetReachable);
}

// Estado de red para el resto de la app (banner offline, bloquear "Iniciar
// recorrido" sin señal, decidir si una línea se manda directo o se encola).
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    NetInfo.fetch().then((state) => setIsOnline(esOnline(state)));

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(esOnline(state));
    });

    return unsubscribe;
  }, []);

  return { isOnline };
}
