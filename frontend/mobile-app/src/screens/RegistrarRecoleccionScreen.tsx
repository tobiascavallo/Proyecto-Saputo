import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export const RegistrarRecoleccionScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();
  const [tamboId, setTamboId] = useState('');
  const [litros, setLitros] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [codigoMuestra, setCodigoMuestra] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Carga de Tambos con caché local TanStack Query
  const { data: tambos, isLoading: loadingTambos } = useQuery({
    queryKey: ['tambos'],
    queryFn: async () => {
      const res = await api.get('/tambo');
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/remito', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remitos'] });
      Alert.alert('Éxito', 'Recolección registrada correctamente');
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Error al registrar recolección');
    },
  });

  const handleSubmit = () => {
    if (!tamboId || !litros || !temperatura || !codigoMuestra) {
      Alert.alert('Atención', 'Completá todos los campos obligatorios');
      return;
    }

    mutation.mutate({
      tambo_id: Number(tamboId),
      litros: parseFloat(litros),
      temperatura: parseFloat(temperatura),
      codigo_muestra: codigoMuestra,
      observaciones,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Tambo / Establecimiento (*)</Text>
      {loadingTambos ? (
        <ActivityIndicator color="#2b6cb0" />
      ) : (
        <View style={styles.tamboList}>
          {tambos?.map((t: any) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tamboOption, tamboId === String(t.id) && styles.selectedOption]}
              onPress={() => setTamboId(String(t.id))}
            >
              <Text style={[styles.tamboOptionText, tamboId === String(t.id) && styles.selectedOptionText]}>
                {t.nombre} ({t.codigo})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Litros Recolectados (*)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Ej: 4500.5"
        value={litros}
        onChangeText={setLitros}
      />

      <Text style={styles.label}>Temperatura °C (*)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Ej: 3.8"
        value={temperatura}
        onChangeText={setTemperatura}
      />

      <Text style={styles.label}>Código de Muestra / Frasco (*)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: MUEST-2026-001"
        value={codigoMuestra}
        onChangeText={setCodigoMuestra}
      />

      <Text style={styles.label}>Observaciones</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        numberOfLines={3}
        placeholder="Opcional..."
        value={observaciones}
        onChangeText={setObservaciones}
      />

      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleSubmit} 
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>GUARDAR RECOLECCIÓN</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7fafc' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#2d3748', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16 },
  multiline: { height: 80, textAlignVertical: 'top' },
  tamboList: { marginBottom: 10 },
  tamboOption: { padding: 12, backgroundColor: '#edf2f7', borderRadius: 8, marginBottom: 6 },
  selectedOption: { backgroundColor: '#2b6cb0' },
  tamboOptionText: { color: '#2d3748', fontWeight: 'bold' },
  selectedOptionText: { color: '#ffffff' },
  submitButton: { backgroundColor: '#38a169', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});