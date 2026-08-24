// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAutoSync } from '../hooks/useAutoSync';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

import { LoginScreen } from '../screens/LoginScreen';
import { CargandoRemitoScreen } from '../screens/CargandoRemitoScreen';
import { IniciarRecorridoScreen } from '../screens/IniciarRecorridoScreen';
import { RemitoActivoScreen } from '../screens/RemitoActivoScreen';
import { AgregarLineaScreen } from '../screens/AgregarLineaScreen';
import { HistorialRemitosScreen } from '../screens/HistorialRemitosScreen';
import { PerfilScreen } from '../screens/PerfilScreen';

import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { userToken, isLoading } = useAuth();
  
  // 1. Activa el motor de sincronización automática en segundo plano
  useAutoSync();

  // 2. Monitorea el estado de la red para mostrar un banner sin conexión si no hay señal
  const { isOnline } = useNetworkStatus();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2b6cb0" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* Banner de estado offline si el chofer pierde señal en el campo */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Modo Sin Conexión - Los registros se guardarán en el celular
          </Text>
        </View>
      )}

      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {userToken == null ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Cargando" component={CargandoRemitoScreen} options={{ headerShown: false }} />
            <Stack.Screen name="IniciarRecorrido" component={IniciarRecorridoScreen} options={{ title: 'Iniciar Recorrido', headerBackVisible: false }} />
            <Stack.Screen name="RemitoActivo" component={RemitoActivoScreen} options={{ title: 'Remito en Curso', headerBackVisible: false }} />
            <Stack.Screen name="AgregarLinea" component={AgregarLineaScreen} options={{ title: 'Nueva Línea' }} />
            <Stack.Screen name="HistorialRemitos" component={HistorialRemitosScreen} options={{ title: 'Historial' }} />
            <Stack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil del Chofer' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBanner: {
    backgroundColor: '#e53e3e',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});