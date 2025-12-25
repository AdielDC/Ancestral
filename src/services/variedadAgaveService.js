import api from './api'; 

export const variedadAgaveService = {
  // Obtener todas las variedades
  getAll: async () => {
    try {
      console.log('📋 Obteniendo variedades activas...');
      const response = await api.get('/variedades');
      console.log(`✅ ${response.data.data?.length || 0} variedades obtenidas`);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener variedades:', error.response?.data || error.message);
      throw error;
    }
  },

  // Obtener una variedad por ID
  getById: async (id) => {
    try {
      console.log('🔍 Obteniendo variedad ID:', id);
      const response = await api.get(`/variedades/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener variedad:', error.response?.data || error.message);
      throw error;
    }
  },

  // Crear nueva variedad
  create: async (data) => {
    try {
      console.log('➕ Creando variedad:', data.nombre);
      const response = await api.post('/variedades', data);
      console.log('✅ Variedad creada exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear variedad:', error.response?.data || error.message);
      throw error;
    }
  },

  // Actualizar variedad
  update: async (id, data) => {
    try {
      console.log('📝 Actualizando variedad ID:', id);
      const response = await api.put(`/variedades/${id}`, data);
      console.log('✅ Variedad actualizada exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar variedad:', error.response?.data || error.message);
      throw error;
    }
  },

  // Desactivar variedad (soft delete)
  delete: async (id) => {
    try {
      console.log('🗑️ Desactivando variedad ID:', id);
      const response = await api.delete(`/variedades/${id}`);
      console.log('✅ Variedad desactivada exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al desactivar variedad:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default variedadAgaveService;