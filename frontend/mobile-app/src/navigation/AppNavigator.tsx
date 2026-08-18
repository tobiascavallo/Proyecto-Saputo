import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RegistrarRecoleccionScreen } from '../screens/RegistrarRecoleccionScreen';
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
            <Stack.Screen name="Inicio" component={HomeScreen} options={{ title: 'Hoja de Ruta' }} />
            <Stack.Screen name="RegistrarRecoleccion" component={RegistrarRecoleccionScreen} options={{ title: 'Nueva Recolección' }} />
            <Stack.Screen name="HistorialRemitos" component={HistorialRemitosScreen} options={{ title: 'Historial / Pendientes' }} />
            <Stack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil del Chofer' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};