import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ahoraISO } from '../utils/fecha';

export const AgregarLineaScreen = ({ navigation, route }: any) => {
  const { remitoId, cantidadCisternas } = route.params;
  const queryClient = useQueryClient();

  const [tamboId, setTamboId] = useState('');
  const [litros, setLitros] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [cisterna, setCisterna] = useState<number | null>(cantidadCisternas === 1 ? 1 : null);
  const [codigoMuestraDiaria, setCodigoMuestraDiaria] = useState('');
  const [codigoMuestraUfc, setCodigoMuestraUfc] = useState('');

  const { data: tambos, isLoading: loadingTambos } = useQuery({
    queryKey: ['tambos'],
    queryFn: async () => {
      const res = await api.get('/tambo');
      return res.data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/lineaRecoleccion', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineasDelRemito', remitoId] });
      Alert.alert('Éxito', 'Línea de recolección registrada correctamente');
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.error || 'Error al registrar la línea');
    },
  });

  const handleSubmit = () => {
    if (!tamboId || !litros || !temperatura || !cisterna || !codigoMuestraDiaria) {
      Alert.alert('Atención', 'Completá todos los campos obligatorios');
      return;
    }

    mutation.mutate({
      remito_id: remitoId,
      tambo_id: tamboId,
      litros_recibidos: parseFloat(litros),
      temperatura_celcius: parseFloat(temperatura),
      numero_cisterna: cisterna,
      hora_recoleccion: ahoraISO(),
      codigo_muestra_diaria: codigoMuestraDiaria,
      codigo_muestra_ufc: codigoMuestraUfc || undefined,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Tambo / Establecimiento (*)</Text>
      {loadingTambos ? (
        <ActivityIndicator color="#2b6cb0" />
      ) : (
        <View style={styles.optionList}>
          {(tambos || []).map((t: any) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.option, tamboId === t.id && styles.selectedOption]}
              onPress={() => setTamboId(t.id)}
            >
              <Text style={[styles.optionText, tamboId === t.id && styles.selectedOptionText]}>
                Tambo N° {t.numero_tambo} — {t.tambero_nombre}
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

      <Text style={styles.label}>Cisterna (*)</Text>
      <View style={styles.optionList}>
        {Array.from({ length: cantidadCisternas }, (_, i) => i + 1).map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.option, cisterna === n && styles.selectedOption]}
            onPress={() => setCisterna(n)}
          >
            <Text style={[styles.optionText, cisterna === n && styles.selectedOptionText]}>
              Cisterna N° {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Código de Muestra Diaria (*)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: MUEST-2026-001"
        value={codigoMuestraDiaria}
        onChangeText={setCodigoMuestraDiaria}
      />

      <Text style={styles.label}>Código de Muestra UFC</Text>
      <TextInput
        style={styles.input}
        placeholder="Opcional"
        value={codigoMuestraUfc}
        onChangeText={setCodigoMuestraUfc}
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>GUARDAR LÍNEA</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7fafc' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#2d3748', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16 },
  optionList: { marginBottom: 10 },
  option: { padding: 12, backgroundColor: '#edf2f7', borderRadius: 8, marginBottom: 6 },
  selectedOption: { backgroundColor: '#2b6cb0' },
  optionText: { color: '#2d3748', fontWeight: 'bold' },
  selectedOptionText: { color: '#ffffff' },
  submitButton: { backgroundColor: '#38a169', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
