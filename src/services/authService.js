import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Configurar axios para incluir el token en todas las peticiones
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
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
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error al iniciar sesión';
    }
  }

  // Cerrar sesión
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Obtener usuario actual
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  // Verificar si el token está expirado
  isTokenExpired() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return true;

      // Decodificar el JWT para obtener el payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Verificar si tiene campo de expiración
      if (!payload.exp) {
        console.warn('Token sin campo de expiración');
        return false; // Si no tiene exp, asumimos que no expira
      }

      // Comparar con el tiempo actual
      const expiration = payload.exp * 1000; // Convertir a milisegundos
      const now = Date.now();

      // Agregar margen de 10 segundos para evitar problemas de timing
      return now >= (expiration - 10000);
    } catch (error) {
      console.error('Error al verificar expiración del token:', error);
      return true; // Si hay error al decodificar, considerar expirado
    }
  }

  // Verificar si está autenticado y el token es válido
  isAuthenticated() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Verificar que el token no esté expirado
    if (this.isTokenExpired()) {
      // Limpiar datos si el token expiró
      this.logout();
      return false;
    }
    
    return true;
  }

  // Obtener token
  getToken() {
    return localStorage.getItem('token');
  }

  // Obtener información del token decodificado
  getTokenPayload() {
    try {
      const token = this.getToken();
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Error al decodificar token:', error);
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
      console.error('Error al calcular tiempo restante:', error);
      return 0;
    }
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