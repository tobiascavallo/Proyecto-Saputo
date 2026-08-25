import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useRemitoActivo } from '../hooks/useRemitoActivo';
import { getPendingLines } from '../utils/syncManager';

export const RemitoActivoScreen = ({ navigation }: any) => {
  const queryClient = useQueryClient();
  const { data: remito, isLoading: loadingRemito } = useRemitoActivo();

  // Se necesita el vehículo del remito para saber si tiene cisterna propia
  // — RemitoResponse solo trae el ID, no el detalle. Con eso más si hay
  // acoplado, se calcula cuántas cisternas hay disponibles para la línea
  // nueva (misma regla que en IniciarRecorridoScreen).
  const { data: vehiculo } = useQuery({
    queryKey: ['vehiculo', remito?.vehiculo_id],
    queryFn: async () => {
      const res = await api.get(`/vehiculo/${remito.vehiculo_id}`);
      return res.data;
    },
    enabled: !!remito?.vehiculo_id,
  });

  const { data: tambos } = useQuery({
    queryKey: ['tambos'],
    queryFn: async () => {
      const res = await api.get('/tambo');
      return res.data || [];
    },
  });

  const { data: lineas, isLoading: loadingLineas } = useQuery({
    queryKey: ['lineasDelRemito', remito?.id],
    queryFn: async () => {
      const res = await api.get(`/lineaRecoleccion/remito/${remito.id}`);
      return res.data || [];
    },
    enabled: !!remito?.id,
  });

  // Líneas guardadas offline (AsyncStorage) que todavía no llegaron al
  // backend — sin esto, una recolección cargada sin señal "desaparece" para
  // el camionero hasta que useAutoSync la sincronice sola.
  const { data: lineasPendientes } = useQuery({
    queryKey: ['lineasPendientes', remito?.id],
    queryFn: async () => {
      const todas = await getPendingLines();
      return todas.filter((l) => l.remitoId === remito.id);
    },
    enabled: !!remito?.id,
  });

  const cantidadCisternas =
    (vehiculo?.tiene_cisterna_propia ? 1 : 0) + (remito?.acoplado_id ? 1 : 0);

  const cantidadPendientes = (lineasPendientes || []).length;
  const totalLineas = (lineas || []).length + cantidadPendientes;
  // Si hay líneas sin sincronizar no se puede finalizar: el backend
  // rechazaría esas líneas apenas se sincronicen contra un remito ya
  // finalizado ("no se pueden agregar líneas a un remito finalizado") y se
  // perderían en silencio en un reintento infinito.
  const finalizarBloqueado = totalLineas === 0 || cantidadPendientes > 0;

  const finalizarMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/remito/${remito.id}/finalizar`);
      return res.data;
    },
    onSuccess: () => {
      // Ya sabemos que no hay remito en curso — no hace falta que Cargando
      // vuelva a preguntarle al backend, mismo criterio que al crear uno.
      queryClient.setQueryData(['remitoActivo'], null);
      Alert.alert('Éxito', 'Remito finalizado correctamente');
      navigation.replace('IniciarRecorrido');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.error || 'No se pudo finalizar el remito');
    },
  });

  function nombreTambo(tamboId: string) {
    const tambo = tambos?.find((t: any) => t.id === tamboId);
    return tambo ? `Tambo N° ${tambo.numero_tambo}` : 'Tambo';
  }

  if (loadingRemito || !remito) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2b6cb0" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚛 Recorrido N° {remito.numero_recorrido}</Text>
        <Text style={styles.cardText}>Remito N° {remito.numero_remito}</Text>
        {vehiculo && <Text style={styles.cardText}>Vehículo: {vehiculo.patente}</Text>}
        <View style={styles.badgeContainer}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>En curso</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate('AgregarLinea', { remitoId: remito.id, cantidadCisternas })}
      >
        <Text style={styles.actionButtonIcon}>📝</Text>
        <View style={styles.actionButtonTextContainer}>
          <Text style={styles.actionButtonTitle}>Agregar línea</Text>
          <Text style={styles.actionButtonSubtitle}>Registrar carga de un tambo</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Líneas cargadas en este viaje</Text>
      {loadingLineas ? (
        <ActivityIndicator color="#2b6cb0" />
      ) : totalLineas === 0 ? (
        <Text style={styles.emptyText}>Todavía no cargaste ningún tambo en este viaje.</Text>
      ) : (
        <>
          {(lineas || []).map((linea: any) => (
            <View key={linea.id} style={styles.lineaCard}>
              <Text style={styles.lineaTambo}>{nombreTambo(linea.tambo_id)}</Text>
              <Text style={styles.infoText}>🥛 {linea.litros_recibidos} Lts — 🌡️ {linea.temperatura_celcius}°C</Text>
              <Text style={styles.infoText}>Cisterna N° {linea.numero_cisterna}</Text>
              <Text style={styles.infoText}>🧪 {linea.codigo_muestra_diaria}</Text>
            </View>
          ))}
          {(lineasPendientes || []).map((linea) => (
            <View key={linea.idLocal} style={[styles.lineaCard, styles.lineaCardPendiente]}>
              <View style={styles.lineaPendienteHeader}>
                <Text style={styles.lineaTambo}>{nombreTambo(linea.tamboId)}</Text>
                <View style={styles.pendienteBadge}>
                  <Text style={styles.pendienteBadgeText}>⏳ Sin sincronizar</Text>
                </View>
              </View>
              <Text style={styles.infoText}>🥛 {linea.litrosRecibidos} Lts — 🌡️ {linea.temperaturaCelcius}°C</Text>
              <Text style={styles.infoText}>Cisterna N° {linea.numeroCisterna}</Text>
              <Text style={styles.infoText}>🧪 {linea.codigoMuestraDiaria}</Text>
            </View>
          ))}
        </>
      )}

      <TouchableOpacity
        style={[styles.finalizarButton, finalizarBloqueado && styles.finalizarButtonDisabled]}
        onPress={() => finalizarMutation.mutate()}
        disabled={finalizarBloqueado || finalizarMutation.isPending}
      >
        {finalizarMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.finalizarButtonText}>FINALIZAR REMITO</Text>
        )}
      </TouchableOpacity>
      {cantidadPendientes > 0 ? (
        <Text style={styles.hintText}>
          Tenés {cantidadPendientes} recolección{cantidadPendientes === 1 ? '' : 'es'} sin
          enviar, esperá a tener señal para finalizar el remito.
        </Text>
      ) : totalLineas === 0 ? (
        <Text style={styles.hintText}>Cargá al menos un tambo para poder finalizar.</Text>
      ) : null}

      <View style={styles.footerLinks}>
        <TouchableOpacity onPress={() => navigation.navigate('HistorialRemitos')}>
          <Text style={styles.footerLinkText}>📋 Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
          <Text style={styles.footerLinkText}>👤 Perfil</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc' },
  card: {
    backgroundColor: '#1a365d',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  cardTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  cardText: { color: '#e2e8f0', fontSize: 15, marginBottom: 4 },
  badgeContainer: { marginTop: 10, alignItems: 'flex-start' },
  statusBadge: { backgroundColor: '#38a169', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  actionButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonIcon: { fontSize: 28, marginRight: 14 },
  actionButtonTextContainer: { flex: 1 },
  actionButtonTitle: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
  actionButtonSubtitle: { fontSize: 13, color: '#718096', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2d3748', marginBottom: 12 },
  emptyText: { color: '#a0aec0', fontStyle: 'italic', marginBottom: 12 },
  lineaCard: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  lineaCardPendiente: { borderColor: '#f6ad55', borderStyle: 'dashed', backgroundColor: '#fffaf0' },
  lineaPendienteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pendienteBadge: { backgroundColor: '#dd6b20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  pendienteBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  lineaTambo: { fontSize: 15, fontWeight: 'bold', color: '#1a365d', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#4a5568', marginBottom: 2 },
  finalizarButton: { backgroundColor: '#e53e3e', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  finalizarButtonDisabled: { backgroundColor: '#cbd5e0' },
  finalizarButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  hintText: { color: '#a0aec0', fontSize: 12, textAlign: 'center', marginTop: 8 },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginTop: 24, marginBottom: 40 },
  footerLinkText: { color: '#2b6cb0', fontWeight: 'bold', fontSize: 14 },
});
