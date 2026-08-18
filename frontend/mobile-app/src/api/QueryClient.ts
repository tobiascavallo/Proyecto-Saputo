import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 horas de caché en memoria
      staleTime: 1000 * 60 * 5,    // Considerar datos frescos por 5 min
      retry: 2,
    },
  },
});