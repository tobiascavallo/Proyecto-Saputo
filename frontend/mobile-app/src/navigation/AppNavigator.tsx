import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { CargandoRemitoScreen } from '../screens/CargandoRemitoScreen';
import { IniciarRecorridoScreen } from '../screens/IniciarRecorridoScreen';
import { RemitoActivoScreen } from '../screens/RemitoActivoScreen';
import { AgregarLineaScreen } from '../screens/AgregarLineaScreen';
import { HistorialRemitosScreen } from '../screens/HistorialRemitosScreen';
import { PerfilScreen } from '../screens/PerfilScreen';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { userToken, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2b6cb0" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {userToken == null ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            {/* Primera pantalla tras el login: resuelve si hay un remito en
                curso y navega directo (Regla de negocio #2) — nunca es un
                destino al que se vuelva con el botón "atrás". */}
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
