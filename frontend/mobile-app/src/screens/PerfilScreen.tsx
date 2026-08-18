import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export const PerfilScreen = () => {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const handleResync = async () => {
    await queryClient.refetchQueries();
    Alert.alert('Éxito', 'Caché de datos maestros resincronizada');
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Text style={styles.avatarText}>👤</Text>
        <Text style={styles.driverName}>Chofer En Ruta</Text>
        <Text style={styles.driverRole}>Rol: Camionero</Text>
      </View>

      <TouchableOpacity style={styles.syncButton} onPress={handleResync}>
        <Text style={styles.syncButtonText}>🔄 Resincronizar Datos Maestros</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f7fafc', justifyContent: 'space-between' },
  profileHeader: { alignItems: 'center', marginTop: 40 },
  avatarText: { fontSize: 60, marginBottom: 10 },
  driverName: { fontSize: 22, fontWeight: 'bold', color: '#1a365d' },
  driverRole: { fontSize: 14, color: '#718096' },
  syncButton: { backgroundColor: '#2b6cb0', padding: 15, borderRadius: 8, alignItems: 'center' },
  syncButtonText: { color: '#fff', fontWeight: 'bold' },
  logoutButton: { backgroundColor: '#e53e3e', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 30 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
});