// services/clienteService.js
import api from './inventarioService';

export const clienteService = {
  // Obtener todos los clientes
  getAll: async () => {
    try {
      const response = await api.get('/clientes');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener un cliente por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/clientes/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear nuevo cliente
  create: async (data) => {
    try {
      const response = await api.post('/clientes', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar cliente
  update: async (id, data) => {
    try {
      const response = await api.put(`/clientes/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar cliente (soft delete)
  delete: async (id) => {
    try {
      const response = await api.delete(`/clientes/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};