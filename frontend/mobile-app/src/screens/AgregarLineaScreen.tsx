import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { enqueueLine } from '../utils/syncManager';
import { ahoraISO } from '../utils/fecha';

// El envase de la muestra trae un código de barras pegado, pero el
// escáner detecta cualquier formato que llegue a cruzarse (QR incluido)
// "por las dudas" — no es el caso de uso principal, solo no lo bloqueamos.
const TIPOS_DE_CODIGO = [
  'code128', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code93', 'codabar', 'itf14',
  'qr', 'pdf417', 'aztec', 'datamatrix',
] as const;

// Modal de escaneo — se usa tanto para el código de muestra diaria como
// para el UFC (el llamador le pasa a qué campo va el resultado). El permiso
// de cámara se pide recién acá, al abrir, no antes; si falla o lo niegan,
// se puede cerrar y seguir cargando el código a mano en el formulario.
function EscanerCodigoModal({
  visible,
  onScanned,
  onCancelar,
}: {
  visible: boolean;
  onScanned: (codigo: string) => void;
  onCancelar: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [errorCamara, setErrorCamara] = useState(false);
  const escaneadoRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    escaneadoRef.current = false;
    setErrorCamara(false);
    if (!permission?.granted) {
      requestPermission();
    }
    // Solo nos interesa reaccionar a que el modal se abra, no a cada
    // cambio de "permission" (eso generaría un loop de pedidos).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleBarcodeScanned(resultado: { data: string }) {
    if (escaneadoRef.current) return;
    escaneadoRef.current = true;
    onScanned(resultado.data);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCancelar}
    >
      {/* Contenido solo montado mientras el modal está visible — así la
          cámara no queda prendida de fondo cuando se cierra. */}
      {visible && (
        <View style={styles.escanerContainer}>
          {errorCamara ? (
            <View style={styles.escanerFallback}>
              <Text style={styles.escanerFallbackText}>
                No se pudo acceder a la cámara. Podés escribir el código a mano
                en el formulario.
              </Text>
              <TouchableOpacity style={styles.escanerBoton} onPress={onCancelar}>
                <Text style={styles.escanerBotonText}>Volver al formulario</Text>
              </TouchableOpacity>
            </View>
          ) : !permission ? (
            <ActivityIndicator color="#fff" style={{ flex: 1 }} />
          ) : !permission.granted ? (
            <View style={styles.escanerFallback}>
              <Text style={styles.escanerFallbackText}>
                {permission.canAskAgain
                  ? 'Necesitamos tu permiso para usar la cámara y escanear el código.'
                  : 'No tenés permiso de cámara habilitado. Podés otorgarlo desde los ajustes del celular, o seguir escribiendo el código a mano.'}
              </Text>
              {permission.canAskAgain && (
                <TouchableOpacity style={styles.escanerBoton} onPress={requestPermission}>
                  <Text style={styles.escanerBotonText}>Dar permiso</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onCancelar} style={{ marginTop: 14 }}>
                <Text style={styles.escanerLink}>Escribir el código a mano</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: [...TIPOS_DE_CODIGO] }}
                onBarcodeScanned={handleBarcodeScanned}
                onMountError={() => setErrorCamara(true)}
              />
              <View style={styles.escanerOverlay} pointerEvents="none">
                <View style={styles.escanerMarco} />
                <Text style={styles.escanerAyuda}>
                  Apuntá la cámara al código de barras del envase
                </Text>
              </View>
              <TouchableOpacity style={styles.escanerCancelar} onPress={onCancelar}>
                <Text style={styles.escanerCancelarText}>✕ Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </Modal>
  );
}

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

  // Qué campo va a recibir el resultado del escaneo — null = modal cerrado.
  const [escaneando, setEscaneando] = useState<'diaria' | 'ufc' | null>(null);

  function handleCodigoEscaneado(codigo: string) {
    if (escaneando === 'diaria') setCodigoMuestraDiaria(codigo);
    else if (escaneando === 'ufc') setCodigoMuestraUfc(codigo);
    // Escaneo exitoso: se cierra el modal y queda el formulario, ya con el
    // campo completado.
    setEscaneando(null);
  }

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
      <View style={styles.filaConEscaner}>
        <TextInput
          style={[styles.input, styles.inputConEscaner]}
          placeholder="Ej: MUEST-2026-001"
          value={codigoMuestraDiaria}
          onChangeText={setCodigoMuestraDiaria}
        />
        <TouchableOpacity
          style={styles.botonEscanear}
          onPress={() => setEscaneando('diaria')}
        >
          <Text style={styles.botonEscanearIcono}>📷</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Código de Muestra UFC</Text>
      <View style={styles.filaConEscaner}>
        <TextInput
          style={[styles.input, styles.inputConEscaner]}
          placeholder="Opcional"
          value={codigoMuestraUfc}
          onChangeText={setCodigoMuestraUfc}
        />
        <TouchableOpacity
          style={styles.botonEscanear}
          onPress={() => setEscaneando('ufc')}
        >
          <Text style={styles.botonEscanearIcono}>📷</Text>
        </TouchableOpacity>
      </View>

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

      <EscanerCodigoModal
        visible={escaneando !== null}
        onScanned={handleCodigoEscaneado}
        onCancelar={() => setEscaneando(null)}
      />
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
  filaConEscaner: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  inputConEscaner: { flex: 1 },
  botonEscanear: {
    width: 48,
    backgroundColor: '#2b6cb0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonEscanearIcono: { fontSize: 20 },
  submitButton: { backgroundColor: '#38a169', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Modal de escaneo
  escanerContainer: { flex: 1, backgroundColor: '#000' },
  escanerFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  escanerFallbackText: { color: '#fff', fontSize: 15, textAlign: 'center', marginBottom: 20 },
  escanerBoton: { backgroundColor: '#2b6cb0', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  escanerBotonText: { color: '#fff', fontWeight: 'bold' },
  escanerLink: { color: '#90cdf4', fontSize: 14, textDecorationLine: 'underline' },
  escanerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escanerMarco: {
    width: '80%',
    height: 140,
    borderWidth: 3,
    borderColor: '#38a169',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  escanerAyuda: {
    color: '#fff',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  escanerCancelar: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  escanerCancelarText: { color: '#fff', fontWeight: 'bold' },
});
