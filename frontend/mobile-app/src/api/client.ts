import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// REEMPLAZA "192.168.0.185" CON LA IP LOCAL DE LA MÁQUINA EN LA RED LOCAL
// Importante: No usaremos "localhost" para que Expo Go desde tu teléfono pueda alcanzar la API en Go.
const DEV_API_URL = 'http://192.168.0.185/api/v1';

export const api = axios.create({
  baseURL: DEV_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el Token JWT almacenado
api.interceptors.request.use(
  async (config) => {
    try {
      if (Platform.OS !== 'web') {
        const jwt = await SecureStore.getItemAsync('user_token');
        if (jwt) {
          config.headers.Authorization = `Bearer ${jwt}`;
        }
      }
    } catch (error) {
      console.error('Error al recuperar el token de SecureStore:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);