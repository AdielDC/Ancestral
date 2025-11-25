
import api from './inventarioService';

export const entregaService = {
  // Obtener todas las entregas
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
      if (filters.cliente_id) params.append('cliente_id', filters.cliente_id);
      if (filters.estado) params.append('estado', filters.estado);

      const response = await api.get(`/entregas?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener una entrega por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/entregas/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear nueva entrega
  create: async (data) => {
    try {
      const response = await api.post('/entregas', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar entrega
  update: async (id, data) => {
    try {
      const response = await api.put(`/entregas/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar entrega
  delete: async (id) => {
    try {
      const response = await api.delete(`/entregas/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener datos para el formulario (clientes, lotes, inventario)
  getDatosFormulario: async () => {
    try {
      const response = await api.get('/entregas/datos-formulario');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};