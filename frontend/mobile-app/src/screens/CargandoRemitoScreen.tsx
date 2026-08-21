import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRemitoActivo } from '../hooks/useRemitoActivo';

// Primera pantalla tras el login (y a la que se vuelve después de crear o
// finalizar un remito): resuelve si el camionero tiene un viaje en curso y
// navega directo, sin que tenga que buscarlo — Regla de negocio #2.
export const CargandoRemitoScreen = ({ navigation }: any) => {
  // isFetching, no isLoading: en TanStack Query v5 isLoading solo es true en
  // el primer fetch de la query. refetchOnMount:"always" (ver
  // useRemitoActivo) sí dispara un refetch de fondo cada vez que esta
  // pantalla se vuelve a montar — como pasa después de crear o finalizar un
  // remito — pero con isLoading ya en false y "remito" todavía apuntando al
  // dato viejo cacheado. El efecto de abajo navegaba con ese dato viejo
  // antes de que llegara la respuesta fresca, dejando al camionero varado
  // en la pantalla de origen sin ningún error visible.
  const { data: remito, isFetching, isError, refetch } = useRemitoActivo();

  useEffect(() => {
    if (isFetching || isError) return;
    navigation.replace(remito ? 'RemitoActivo' : 'IniciarRecorrido');
  }, [isFetching, isError, remito, navigation]);

  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          No se pudo conectar con el servidor. Revisá tu conexión.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2b6cb0" />
      <Text style={styles.loadingText}>Buscando tu remito en curso...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f7fafc' },
  loadingText: { marginTop: 12, color: '#4a5568', fontSize: 15 },
  errorText: { color: '#e53e3e', textAlign: 'center', marginBottom: 16, fontSize: 15 },
  retryButton: { backgroundColor: '#2b6cb0', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: 'bold' },
});
