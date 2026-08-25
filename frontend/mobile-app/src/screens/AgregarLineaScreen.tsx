import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { enqueueLine } from '../utils/syncManager';
import { ahoraISO } from '../utils/fecha';

export const AgregarLineaScreen = ({ navigation, route }: any) => {
  const { remitoId, cantidadCisternas } = route.params;
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  const [tamboId, setTamboId] = useState('');
  const [litros, setLitros] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [cisterna, setCisterna] = useState<number | null>(cantidadCisternas === 1 ? 1 : null);
  const [codigoMuestraDiaria, setCodigoMuestraDiaria] = useState('');
  const [codigoMuestraUfc, setCodigoMuestraUfc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tambos, isLoading: loadingTambos } = useQuery({
    queryKey: ['tambos'],
    queryFn: async () => {
      const res = await api.get('/tambo');
      return res.data || [];
    },
  });

  const handleGuardarLinea = async () => {
    if (!tamboId || !litros || !temperatura || !cisterna || !codigoMuestraDiaria) {
      Alert.alert('Atención', 'Completá todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      remitoId,
      tamboId,
      litrosRecibidos: parseFloat(litros),
      temperaturaCelcius: parseFloat(temperatura),
      numeroCisterna: cisterna,
      horaRecoleccion: ahoraISO(),
      codigoMuestraDiaria,
      codigoMuestraUfc: codigoMuestraUfc || undefined,
    };

    try {
      if (isOnline) {
        // Envío directo — mismos nombres de campo que dto.CrearLineaRecoleccionRequest.
        await api.post('/lineaRecoleccion', {
          remito_id: payload.remitoId,
          tambo_id: payload.tamboId,
          litros_recibidos: payload.litrosRecibidos,
          temperatura_celcius: payload.temperaturaCelcius,
          numero_cisterna: payload.numeroCisterna,
          hora_recoleccion: payload.horaRecoleccion,
          codigo_muestra_diaria: payload.codigoMuestraDiaria,
          codigo_muestra_ufc: payload.codigoMuestraUfc,
        });
        queryClient.invalidateQueries({ queryKey: ['lineasDelRemito', remitoId] });
        Alert.alert('Éxito', 'Línea de recolección registrada correctamente');
      } else {
        // Sin señal: se encola localmente. useAutoSync la manda sola apenas
        // vuelva la conexión — el camionero no tiene que hacer nada más.
        await enqueueLine({ idLocal: `local_${Date.now()}`, ...payload });
        queryClient.invalidateQueries({ queryKey: ['lineasPendientes', remitoId] });
        Alert.alert(
          'Guardado en el celular',
          'Sin señal: la recolección se guardó localmente y se va a enviar sola apenas recuperes conexión.',
        );
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Error al registrar la línea');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            ⚠️ Sin conexión: esta línea se va a guardar en el celular
          </Text>
        </View>
      )}

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
        onPress={handleGuardarLinea}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isOnline ? 'GUARDAR LÍNEA' : 'GUARDAR EN EL CELULAR'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7fafc' },
  offlineBanner: {
    backgroundColor: '#feebc8',
    borderColor: '#fbd38d',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  offlineText: { color: '#c05621', fontSize: 13, fontWeight: '600', textAlign: 'center' },
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
