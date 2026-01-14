// src/services/api.js
import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', 
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token desencriptado
api.interceptors.request.use((config) => {
  // 🔐 Obtener token desencriptado del storage seguro
  const token = secureStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔑 Token agregado a la petición');
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🚫 Error 401: No autorizado, limpiando sesión');
      secureStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;