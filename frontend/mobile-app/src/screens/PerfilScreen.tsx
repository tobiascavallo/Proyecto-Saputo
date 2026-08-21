import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const PerfilScreen = () => {
  const { usuarioId, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: camionero, isLoading, isError } = useQuery({
    queryKey: ['camionero', usuarioId],
    queryFn: async () => {
      const res = await api.get(`/camionero/usuario/${usuarioId}`);
      return res.data;
    },
    enabled: !!usuarioId,
  });

  const handleResync = async () => {
    await queryClient.refetchQueries();
    Alert.alert('Éxito', 'Caché de datos maestros resincronizada');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <Text style={styles.avatarText}>👤</Text>
        {isLoading ? (
          <ActivityIndicator color="#2b6cb0" style={{ marginTop: 12 }} />
        ) : isError ? (
          <Text style={styles.errorText}>No se pudieron cargar tus datos.</Text>
        ) : (
          <>
            <Text style={styles.driverName}>{camionero.usuario_nombre}</Text>
            <Text style={styles.driverRole}>Rol: Camionero</Text>
          </>
        )}
      </View>

      {!isLoading && !isError && (
        <View style={styles.dataCard}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>DNI</Text>
            <Text style={styles.dataValue}>{camionero.usuario_dni || '—'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Teléfono</Text>
            <Text style={styles.dataValue}>{camionero.usuario_telefono || '—'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Email</Text>
            <Text style={styles.dataValue}>{camionero.usuario_email || '—'}</Text>
          </View>
          <View style={[styles.dataRow, styles.dataRowLast]}>
            <Text style={styles.dataLabel}>Empresa transportista</Text>
            <Text style={styles.dataValue}>{camionero.empresa_transportista_nombre || '—'}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.syncButton} onPress={handleResync}>
        <Text style={styles.syncButtonText}>🔄 Resincronizar Datos Maestros</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f7fafc' },
  profileHeader: { alignItems: 'center', marginTop: 40, marginBottom: 24 },
  avatarText: { fontSize: 60, marginBottom: 10 },
  driverName: { fontSize: 22, fontWeight: 'bold', color: '#1a365d', textAlign: 'center' },
  driverRole: { fontSize: 14, color: '#718096' },
  errorText: { color: '#e53e3e', marginTop: 8, textAlign: 'center' },
  dataCard: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 30 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  dataRowLast: { borderBottomWidth: 0 },
  dataLabel: { color: '#718096', fontSize: 14 },
  dataValue: { color: '#2d3748', fontSize: 14, fontWeight: 'bold', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  syncButton: { backgroundColor: '#2b6cb0', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  syncButtonText: { color: '#fff', fontWeight: 'bold' },
  logoutButton: { backgroundColor: '#e53e3e', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 30 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
});
