import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useRemitoActivo } from '../hooks/useRemitoActivo';
import { enqueueLine } from '../utils/syncManager';
import { api } from '../api/client';
import { queryClient } from '../api/QueryClient';

export const AgregarLineaScreen = ({ route, navigation }: any) => {
  const { data: remitoActivo } = useRemitoActivo();
  const remitoId = route.params?.remitoId || remitoActivo?.id;
  
  const { isOnline } = useNetworkStatus();

  const [tamboId, setTamboId] = useState('');
  const [litros, setLitros] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGuardarLinea = async () => {
    if (!tamboId || !litros || !temperatura) {
      Alert.alert('Atención', 'Por favor completa todos los campos requeridos.');
      return;
    }

    if (!remitoId) {
      Alert.alert('Error', 'No se encontró un remito activo asociado.');
      return;
    }

    setIsSubmitting(true);

    const payloadLinea = {
      remitoId,
      tamboId,
      litros: parseFloat(litros),
      temperatura: parseFloat(temperatura),
      fechaCreacion: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        // 🟢 ONLINE: Envío directo al backend en Go
        await api.post(`/remitos/${remitoId}/lineas`, payloadLinea);
        Alert.alert('Éxito', 'Línea de recolección guardada y sincronizada.');
      } else {
        // 🔴 OFFLINE: Guardado en cola local (AsyncStorage)
        await enqueueLine({
          idLocal: `local_${Date.now()}`,
          ...payloadLinea,
        });
        Alert.alert(
          'Guardado en Celular',
          'Modo sin señal: La recolección se guardó localmente y se enviará de forma automática al recuperar conexión.'
        );
      }

      // Refresca la caché local para actualizar la vista de RemitoActivoScreen
      queryClient.invalidateQueries({ queryKey: ['remitoActivo'] });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo guardar la línea.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            ⚠️ Sin conexión: Registro en almacenamiento local
          </Text>
        </View>
      )}

      <Text style={styles.label}>ID / Código de Tambo</Text>
      <TextInput
        style={styles.input}
        value={tamboId}
        onChangeText={setTamboId}
        placeholder="Ej: TAMBO-01"
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Litros Recolectados</Text>
      <TextInput
        style={styles.input}
        value={litros}
        onChangeText={setLitros}
        keyboardType="numeric"
        placeholder="Ej: 2500"
      />

      <Text style={styles.label}>Temperatura (°C)</Text>
      <TextInput
        style={styles.input}
        value={temperatura}
        onChangeText={setTemperatura}
        keyboardType="decimal-pad"
        placeholder="Ej: 3.5"
      />

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleGuardarLinea}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>
            {isOnline ? 'Guardar y Enviar' : 'Guardar Localmente'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f7fafc' },
  offlineBanner: {
    backgroundColor: '#feebc8',
    borderColor: '#fbd38d',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  offlineText: { color: '#c05621', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#2d3748', marginBottom: 6 },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2b6cb0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: { backgroundColor: '#a0aec0' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});