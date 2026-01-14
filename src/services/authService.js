// src/services/authService.js
import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';

const API_URL = 'http://localhost:3000/api';

// Configurar axios para incluir el token en todas las peticiones
axios.interceptors.request.use(
  (config) => {
    // 🔐 Obtener token desencriptado
    const token = secureStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🚫 Sesión inválida o expirada');
      secureStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class AuthService {
  // Registrar nuevo usuario
  async register(userData) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        nombre: `${userData.firstName} ${userData.lastName}`.trim(),
        email: userData.email,
        password: userData.password,
        rol: 'visualizador' // Rol por defecto
      });
      
      if (response.data.token) {
        // 🔐 Guardar con encriptación y expiración de 30 minutos
        secureStorage.setItem('token', response.data.token, 30);
        secureStorage.setItem('user', response.data.user, 30);
        console.log('✅ Usuario registrado y datos guardados de forma segura');
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error al registrar usuario';
    }
  }

  // Iniciar sesión
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      if (response.data.token) {
        // 🔐 Guardar con encriptación y expiración de 30 minutos
        secureStorage.setItem('token', response.data.token, 30);
        secureStorage.setItem('user', response.data.user, 30);
        console.log('✅ Sesión iniciada y datos guardados de forma segura');
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error al iniciar sesión';
    }
  }

  // Cerrar sesión
  logout() {
    console.log('👋 Cerrando sesión...');
    secureStorage.clear();
    window.location.href = '/login';
  }

  // Obtener usuario actual
  getCurrentUser() {
    const user = secureStorage.getItem('user');
    if (user) {
      console.log('👤 Usuario actual recuperado');
      return user;
    }
    console.log('⚠️ No hay usuario en sesión');
    return null;
  }

  // Verificar si el token está expirado (del JWT mismo)
  isTokenExpired() {
    try {
      const token = secureStorage.getItem('token');
      if (!token) return true;

      // Decodificar el JWT para obtener el payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Verificar si tiene campo de expiración
      if (!payload.exp) {
        console.warn('⚠️ Token sin campo de expiración');
        return false; // Si no tiene exp, asumimos que no expira
      }

      // Comparar con el tiempo actual
      const expiration = payload.exp * 1000; // Convertir a milisegundos
      const now = Date.now();

      // Agregar margen de 10 segundos para evitar problemas de timing
      const isExpired = now >= (expiration - 10000);
      
      if (isExpired) {
        console.log('⏰ Token JWT expirado');
      }
      
      return isExpired;
    } catch (error) {
      console.error('❌ Error al verificar expiración del token:', error);
      return true; // Si hay error al decodificar, considerar expirado
    }
  }

  // Verificar si está autenticado y el token es válido
  isAuthenticated() {
    // 🔐 Verificar que el token exista en storage y no haya expirado (storage)
    const token = secureStorage.getItem('token');
    if (!token) {
      console.log('⚠️ No hay token en storage');
      return false;
    }
    
    // Verificar que el token JWT no esté expirado
    if (this.isTokenExpired()) {
      console.log('🚫 Token expirado, limpiando sesión');
      secureStorage.clear();
      return false;
    }
    
    console.log('✅ Usuario autenticado correctamente');
    return true;
  }

  // Obtener token
  getToken() {
    return secureStorage.getItem('token');
  }

  // Obtener información del token decodificado
  getTokenPayload() {
    try {
      const token = this.getToken();
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('❌ Error al decodificar token:', error);
      return null;
    }
  }

  // Obtener tiempo restante del token (en minutos)
  getTokenTimeRemaining() {
    try {
      const payload = this.getTokenPayload();
      if (!payload || !payload.exp) return 0;

      const expiration = payload.exp * 1000;
      const now = Date.now();
      const remaining = expiration - now;

      return Math.floor(remaining / 1000 / 60); // Convertir a minutos
    } catch (error) {
      console.error('❌ Error al calcular tiempo restante:', error);
      return 0;
    }
  }

  // 🆕 Renovar sesión (extender tiempo de expiración)
  renewSession(minutes = 30) {
    const renewed = secureStorage.renewItem('token', minutes) && 
                    secureStorage.renewItem('user', minutes);
    if (renewed) {
      console.log(`🔄 Sesión renovada por ${minutes} minutos`);
    }
    return renewed;
  }

  // Recuperar contraseña
  async forgotPassword(email) {
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, {
        email
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error al solicitar recuperación';
    }
  }

  // Cambiar contraseña
  async changePassword(currentPassword, newPassword) {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }
      
      const response = await axios.put(`${API_URL}/users/${user.id}/password`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error al cambiar contraseña';
    }
  }
}

export default new AuthService();