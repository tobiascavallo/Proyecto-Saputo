// src/api/QueryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

// Conecta el gestor de red de React Query con NetInfo
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected && state.isInternetReachable));
  });
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutos de caché fresca
      gcTime: 1000 * 60 * 60 * 24, // Mantiene la caché guardada 24 horas (anteriormente cacheTime)
      networkMode: 'offlineFirst', // Intenta leer de caché si no hay red
    },
    mutations: {
      networkMode: 'offlineFirst', // Permite encolar o manejar mutaciones offline
    },
  },
});