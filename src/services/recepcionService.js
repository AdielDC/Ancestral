// services/recepcionService.js
import api from './inventarioService';

export const recepcionService = {
  // Obtener todas las recepciones
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
      if (filters.cliente_id) params.append('cliente_id', filters.cliente_id);
      if (filters.estado) params.append('estado', filters.estado);

      const response = await api.get(`/recepciones?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener una recepción por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/recepciones/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear nueva recepción
  create: async (data) => {
    try {
      const response = await api.post('/recepciones', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar recepción
  update: async (id, data) => {
    try {
      const response = await api.put(`/recepciones/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar recepción
  delete: async (id) => {
    try {
      const response = await api.delete(`/recepciones/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener datos para el formulario (proveedores, clientes, inventario)
  getDatosFormulario: async () => {
    try {
      const response = await api.get('/recepciones/datos-formulario');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};