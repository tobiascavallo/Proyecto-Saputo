import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export const HistorialRemitosScreen = () => {
  const { data: remitos, isLoading, refetch } = useQuery({
    queryKey: ['remitos'],
    queryFn: async () => {
      const res = await api.get('/remito');
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
          renderItem={({ item }) => (
            <View style={styles.remitoCard}>
              <View style={styles.headerCard}>
                <Text style={styles.tamboName}>Tambo #{item.tambo_id}</Text>
                <View style={styles.syncBadge}>
                  <Text style={styles.syncText}>Sincronizado</Text>
                </View>
              </View>
              <Text style={styles.infoText}>🥛 Litros: {item.litros} Lts</Text>
              <Text style={styles.infoText}>🌡️ Temp: {item.temperatura} °C</Text>
              <Text style={styles.infoText}>🧪 Muestra: {item.codigo_muestra}</Text>
              <Text style={styles.dateText}>{new Date(item.created_at || Date.now()).toLocaleString()}</Text>
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
  tamboName: { fontSize: 16, fontWeight: 'bold', color: '#1a365d' },
  syncBadge: { backgroundColor: '#38a169', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  syncText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  infoText: { fontSize: 14, color: '#4a5568', marginBottom: 2 },
  dateText: { fontSize: 12, color: '#a0aec0', marginTop: 6, textAlign: 'right' },
});