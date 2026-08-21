import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { fechaDeHoy } from '../utils/fecha';

// Qué tipo de acoplado engancha cada tipo de vehículo — mismo criterio que
// RemitoService.CrearRemito en el backend (tipoAcopladoCompatible): un
// camión lleva un acoplado con ejes propios, un tractor solo un
// semirremolque (se apoya sobre el tractor, no tiene ejes propios).
const ACOPLADO_COMPATIBLE: Record<string, string> = {
  camion: 'acoplado',
  tractor_semirremolque: 'semiremolque',
};

export const IniciarRecorridoScreen = ({ navigation }: any) => {
  const { usuarioId } = useAuth();
  const queryClient = useQueryClient();
  const [vehiculoId, setVehiculoId] = useState('');
  const [acopladoId, setAcopladoId] = useState('');
  const [numeroRecorrido, setNumeroRecorrido] = useState('');

  // Empresa transportista del camionero logueado — los selects de vehículo
  // y acoplado solo muestran flota de esa empresa.
  const { data: camionero, isLoading: loadingCamionero } = useQuery({
    queryKey: ['camionero', usuarioId],
    queryFn: async () => {
      const res = await api.get(`/camionero/usuario/${usuarioId}`);
      return res.data;
    },
    enabled: !!usuarioId,
  });

  const empresaId = camionero?.empresa_transportista_id;

  const { data: vehiculos, isLoading: loadingVehiculos } = useQuery({
    queryKey: ['vehiculosEmpresa', empresaId],
    queryFn: async () => {
      const res = await api.get(`/vehiculo/empresaTransportista/${empresaId}`);
      // El backend no filtra por activo acá (a diferencia de acoplado) —
      // se filtra del lado del cliente para no ofrecer de baja.
      return (res.data || []).filter((v: any) => v.activo);
    },
    enabled: !!empresaId,
  });

  const { data: acoplados, isLoading: loadingAcoplados } = useQuery({
    queryKey: ['acopladosEmpresa', empresaId],
    queryFn: async () => {
      const res = await api.get(`/acoplado/empresaTransportista/${empresaId}`);
      return res.data || [];
    },
    enabled: !!empresaId,
  });

  const vehiculoSeleccionado = vehiculos?.find((v: any) => v.id === vehiculoId);
  const acopladosCompatibles = vehiculoSeleccionado
    ? (acoplados || []).filter(
        (a: any) => a.tipo === ACOPLADO_COMPATIBLE[vehiculoSeleccionado.tipo],
      )
    : [];

  const cantidadCisternas =
    (vehiculoSeleccionado?.tiene_cisterna_propia ? 1 : 0) + (acopladoId ? 1 : 0);

  function seleccionarVehiculo(id: string) {
    setVehiculoId(id);
    // El acoplado elegido puede dejar de ser compatible con el vehículo
    // nuevo — se limpia para que el camionero no arrastre una combinación
    // inválida sin darse cuenta.
    setAcopladoId('');
  }

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/remito', payload);
      return res.data;
    },
    onSuccess: (data) => {
      // El backend devuelve el remito recién creado — sembramos el caché
      // compartido de useRemitoActivo con ese dato y vamos directo a
      // RemitoActivo, sin pasar por Cargando (que tendría que volver a
      // pedirlo por HTTP para enterarse de algo que ya tenemos en mano).
      queryClient.setQueryData(['remitoActivo'], data.remito);
      navigation.replace('RemitoActivo');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.error || 'No se pudo iniciar el recorrido');
    },
  });

  function handleSubmit() {
    if (!vehiculoId) {
      Alert.alert('Atención', 'Elegí un vehículo');
      return;
    }
    if (!numeroRecorrido) {
      Alert.alert('Atención', 'Ingresá el número de recorrido');
      return;
    }
    if (cantidadCisternas === 0) {
      Alert.alert(
        'Atención',
        'Este vehículo no tiene cisterna propia y no elegiste acoplado — no hay dónde cargar leche.',
      );
      return;
    }

    mutation.mutate({
      numero_recorrido: Number(numeroRecorrido),
      fecha: fechaDeHoy(),
      vehiculo_id: vehiculoId,
      acoplado_id: acopladoId || undefined,
      empresa_transportista_id: empresaId,
      creado_offline: false,
    });
  }

  const cargando = loadingCamionero || loadingVehiculos || loadingAcoplados;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🚛 Iniciar recorrido</Text>

      {cargando ? (
        <ActivityIndicator color="#2b6cb0" style={{ marginTop: 20 }} />
      ) : (
        <>
          <Text style={styles.label}>Vehículo (*)</Text>
          <View style={styles.optionList}>
            {(vehiculos || []).map((v: any) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.option, vehiculoId === v.id && styles.selectedOption]}
                onPress={() => seleccionarVehiculo(v.id)}
              >
                <Text style={[styles.optionText, vehiculoId === v.id && styles.selectedOptionText]}>
                  {v.patente} — {v.tipo === 'camion' ? 'Camión' : 'Tractor'}
                  {v.tiene_cisterna_propia ? ' (con cisterna propia)' : ''}
                </Text>
              </TouchableOpacity>
            ))}
            {(vehiculos || []).length === 0 && (
              <Text style={styles.emptyText}>No hay vehículos activos en tu empresa.</Text>
            )}
          </View>

          <Text style={styles.label}>Acoplado (opcional)</Text>
          <View style={styles.optionList}>
            <TouchableOpacity
              style={[styles.option, acopladoId === '' && styles.selectedOption]}
              onPress={() => setAcopladoId('')}
            >
              <Text style={[styles.optionText, acopladoId === '' && styles.selectedOptionText]}>
                Sin acoplado
              </Text>
            </TouchableOpacity>
            {vehiculoSeleccionado &&
              acopladosCompatibles.map((a: any) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.option, acopladoId === a.id && styles.selectedOption]}
                  onPress={() => setAcopladoId(a.id)}
                >
                  <Text style={[styles.optionText, acopladoId === a.id && styles.selectedOptionText]}>
                    {a.patente} — {a.tipo === 'acoplado' ? 'Acoplado' : 'Semirremolque'}
                  </Text>
                </TouchableOpacity>
              ))}
            {vehiculoSeleccionado && acopladosCompatibles.length === 0 && (
              <Text style={styles.emptyText}>
                No hay acoplados compatibles con este vehículo en tu empresa.
              </Text>
            )}
          </View>

          <Text style={styles.label}>Número de recorrido (*)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Ej: 12"
            value={numeroRecorrido}
            onChangeText={setNumeroRecorrido}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>INICIAR RECORRIDO</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7fafc' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a365d', marginBottom: 16, marginTop: 10 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#2d3748', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16 },
  optionList: { marginBottom: 6 },
  option: { padding: 12, backgroundColor: '#edf2f7', borderRadius: 8, marginBottom: 6 },
  selectedOption: { backgroundColor: '#2b6cb0' },
  optionText: { color: '#2d3748', fontWeight: 'bold' },
  selectedOptionText: { color: '#ffffff' },
  emptyText: { color: '#a0aec0', fontStyle: 'italic', marginBottom: 6 },
  submitButton: { backgroundColor: '#38a169', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
