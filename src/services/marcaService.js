// services/marcaService.js
// Servicio para gestionar las marcas de mezcal

import api from './api'; // Asegúrate de que la ruta sea correcta según tu proyecto

export const marcaService = {
  // Obtener todas las marcas con filtros opcionales
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.activo !== undefined) {
        params.append('activo', filters.activo);
      }
      if (filters.cliente_id) {
        params.append('cliente_id', filters.cliente_id);
      }

      const queryString = params.toString();
      const url = queryString ? `/marcas?${queryString}` : '/marcas';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error al obtener marcas:', error);
      throw error;
    }
  },

  // Obtener marcas por cliente ID
  getByClienteId: async (clienteId) => {
    try {
      const response = await api.get(`/marcas?cliente_id=${clienteId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener marcas del cliente:', error);
      throw error;
    }
  },

  // Crear nueva marca
  create: async (data) => {
    try {
      const response = await api.post('/marcas', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear marca:', error);
      throw error;
    }
  },

  // Actualizar marca
  update: async (id, data) => {
    try {
      const response = await api.put(`/marcas/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar marca:', error);
      throw error;
    }
  }
};

export default marcaService;