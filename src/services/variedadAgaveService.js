// services/variedadAgaveService.js
// Servicio para gestionar las variedades de agave

import api from './api'; // Asegúrate de que la ruta sea correcta según tu proyecto

export const variedadAgaveService = {
  // Obtener todas las variedades
  getAll: async () => {
    try {
      const response = await api.get('/variedades');
      return response.data;
    } catch (error) {
      console.error('Error al obtener variedades:', error);
      throw error;
    }
  },

  // Obtener una variedad por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/variedades/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener variedad:', error);
      throw error;
    }
  },

  // Crear nueva variedad
  create: async (data) => {
    try {
      const response = await api.post('/variedades', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear variedad:', error);
      throw error;
    }
  },

  // Actualizar variedad
  update: async (id, data) => {
    try {
      const response = await api.put(`/variedades/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar variedad:', error);
      throw error;
    }
  },

  // Eliminar variedad
  delete: async (id) => {
    try {
      const response = await api.delete(`/variedades/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar variedad:', error);
      throw error;
    }
  }
};

export default variedadAgaveService;