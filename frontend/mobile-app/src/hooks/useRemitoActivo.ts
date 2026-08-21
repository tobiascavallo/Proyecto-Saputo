import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

// Un camionero solo puede tener un remito en_curso a la vez (lo valida el
// backend en RemitoService.CrearRemito), así que "mi remito en curso" es
// simplemente el primer resultado de este filtro — sin necesidad de un
// endpoint dedicado. El service ya scopea por rol: un camionero autenticado
// recibe solo los suyos.
//
// Compartido entre CargandoRemitoScreen (decide a dónde navegar) y
// RemitoActivoScreen (lo usa para renderizar el viaje) — misma queryKey,
// mismo caché de TanStack Query, sin pedir el dato dos veces.
//
// refetchOnMount: "always" porque este hook decide routing — servir un
// resultado cacheado stale acá haría que, después de crear o finalizar un
// remito, la pantalla de Cargando no se entere y mande al camionero al
// lugar equivocado.
export function useRemitoActivo() {
  return useQuery({
    queryKey: ['remitoActivo'],
    queryFn: async () => {
      const res = await api.get('/remito', { params: { estado: 'en_curso' } });
      const remitos = res.data || [];
      return remitos.length > 0 ? remitos[0] : null;
    },
    refetchOnMount: 'always',
  });
}
