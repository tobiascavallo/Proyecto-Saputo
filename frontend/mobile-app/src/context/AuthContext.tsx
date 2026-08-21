import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { setAuthFailureHandler } from '../api/client';

// Claims del JWT que emite el backend (ver models.Claims en Go) — el rol no
// se usa acá (esta app es solo para camioneros), pero usuario_id sí: hace
// falta para resolver la empresa transportista propia al iniciar un remito.
interface JwtPayload {
  usuario_id: string;
  rol: string;
}

interface AuthContextData {
  userToken: string | null;
  usuarioId: string | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const usuarioId = useMemo(() => {
    if (!userToken) return null;
    try {
      return jwtDecode<JwtPayload>(userToken).usuario_id;
    } catch (e) {
      console.error('Error al decodificar el token:', e);
      return null;
    }
  }, [userToken]);

  // Verificar si ya hay un token guardado al abrir la app
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('user_token');
        if (token) {
          setUserToken(token);
        }
      } catch (e) {
        console.error('Error al leer el token:', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, []);

  const login = async (token: string, refreshToken: string) => {
    await SecureStore.setItemAsync('user_token', token);
    await SecureStore.setItemAsync('user_refresh_token', refreshToken);
    setUserToken(token);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_refresh_token');
    setUserToken(null);
  };

  // El interceptor de axios (client.ts) no es un componente y no puede leer
  // el contexto — se registra acá para poder cerrar la sesión cuando el
  // refresh token también venció y no hay forma de renovarla.
  useEffect(() => {
    setAuthFailureHandler(logout);
  }, []);

  return (
    <AuthContext.Provider value={{ userToken, usuarioId, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);