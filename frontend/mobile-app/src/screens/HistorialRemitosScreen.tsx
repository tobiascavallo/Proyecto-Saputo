import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

// Lista los remitos ya finalizados del camionero (el en curso, si hay uno,
// vive en RemitoActivoScreen). Un remito es el viaje completo, no un tambo
// puntual — litros/temperatura/muestra están en sus líneas, no acá.
export const HistorialRemitosScreen = () => {
  const { data: remitos, isLoading, refetch } = useQuery({
    queryKey: ['remitosFinalizados'],
    queryFn: async () => {
      const res = await api.get('/remito', { params: { estado: 'finalizado' } });
      return res.data;
    },
  });

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#2b6cb0" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={remitos}
          keyExtractor={(item: any) => String(item.id)}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Todavía no finalizaste ningún remito.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.remitoCard}>
              <View style={styles.headerCard}>
                <Text style={styles.remitoTitle}>Remito N° {item.numero_remito}</Text>
                <View style={styles.syncBadge}>
                  <Text style={styles.syncText}>
                    {item.estado_sincronizacion === 'sincronizado' ? 'Sincronizado' : 'Pendiente'}
                  </Text>
                </View>
              </View>
              <Text style={styles.infoText}>🛣️ Recorrido N° {item.numero_recorrido}</Text>
              <Text style={styles.dateText}>{item.fecha}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc', padding: 16 },
  remitoCard: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  remitoTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a365d' },
  syncBadge: { backgroundColor: '#38a169', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  syncText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  infoText: { fontSize: 14, color: '#4a5568', marginBottom: 2 },
  dateText: { fontSize: 12, color: '#a0aec0', marginTop: 6, textAlign: 'right' },
  emptyText: { color: '#a0aec0', fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
});
