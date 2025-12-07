// services/presentacionService.js
// Servicio para gestionar las presentaciones (volúmenes de botellas)

import api from './api'; // Asegúrate de que la ruta sea correcta según tu proyecto

export const presentacionService = {
  // Obtener todas las presentaciones
  getAll: async () => {
    try {
      const response = await api.get('/presentaciones');
      return response.data;
    } catch (error) {
      console.error('Error al obtener presentaciones:', error);
      throw error;
    }
  },

  // Obtener una presentación por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/presentaciones/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener presentación:', error);
      throw error;
    }
  },

  // Crear nueva presentación
  create: async (data) => {
    try {
      const response = await api.post('/presentaciones', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear presentación:', error);
      throw error;
    }
  },

  // Actualizar presentación
  update: async (id, data) => {
    try {
      const response = await api.put(`/presentaciones/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar presentación:', error);
      throw error;
    }
  },

  // Eliminar presentación
  delete: async (id) => {
    try {
      const response = await api.delete(`/presentaciones/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar presentación:', error);
      throw error;
    }
  }
};

export default presentacionService;