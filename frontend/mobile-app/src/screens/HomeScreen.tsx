import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const HomeScreen = ({ navigation }: any) => {
  const { logout } = useAuth();

  return (
    <ScrollView style={styles.container}>
      {/* Tarjeta de Resumen del Viaje */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚛 Viaje Activo</Text>
        <Text style={styles.cardText}>Camión: Scania ABC-123</Text>
        <Text style={styles.cardText}>Acoplado: XYZ-789</Text>
        <View style={styles.badgeContainer}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>En Ruta</Text>
          </View>
        </View>
      </View>

      {/* Acciones Rápidas */}
      <Text style={styles.sectionTitle}>Acciones Principales</Text>

      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => navigation.navigate('RegistrarRecoleccion')}
      >
        <Text style={styles.actionButtonIcon}>📝</Text>
        <View style={styles.actionButtonTextContainer}>
          <Text style={styles.actionButtonTitle}>Nueva Recolección</Text>
          <Text style={styles.actionButtonSubtitle}>Registrar carga de leche en tambo</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={() => navigation.navigate('HistorialRemitos')}
      >
        <Text style={styles.actionButtonIcon}>📋</Text>
        <View style={styles.actionButtonTextContainer}>
          <Text style={styles.actionButtonTitle}>Historial / Pendientes</Text>
          <Text style={styles.actionButtonSubtitle}>Ver cargas subidas y sin sincronizar</Text>
        </View>
      </TouchableOpacity>

      {/* Botón de Cierre de Sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc', padding: 16 },
  card: {
    backgroundColor: '#1a365d',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  cardText: { color: '#e2e8f0', fontSize: 15, marginBottom: 4 },
  badgeContainer: { marginTop: 10, alignItems: 'flex-start' },
  statusBadge: { backgroundColor: '#38a169', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2d3748', marginBottom: 12 },
  actionButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryButton: { backgroundColor: '#edf2f7' },
  actionButtonIcon: { fontSize: 28, marginRight: 14 },
  actionButtonTextContainer: { flex: 1 },
  actionButtonTitle: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
  actionButtonSubtitle: { fontSize: 13, color: '#718096', marginTop: 2 },
  logoutButton: {
    backgroundColor: '#e53e3e',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoutButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});