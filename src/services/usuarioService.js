import api from './api';

const usuarioService = {
  // Listar todos los usuarios
  async listarUsuarios(params = {}) {
    try {
      const response = await api.get('/usuarios', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener estadísticas
  async obtenerEstadisticas() {
    try {
      const response = await api.get('/usuarios/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener usuario por ID
  async obtenerUsuario(id) {
    try {
      const response = await api.get(`/usuarios/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Crear nuevo usuario
  async crearUsuario(datos) {
    try {
      const response = await api.post('/usuarios', datos);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Actualizar usuario
  async actualizarUsuario(id, datos) {
    try {
      const response = await api.put(`/usuarios/${id}`, datos);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cambiar contraseña de usuario
  async cambiarPassword(id, data) {
    try {
      const response = await api.put(`/usuarios/${id}/password`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Desactivar usuario
  async desactivarUsuario(id) {
    try {
      const response = await api.put(`/usuarios/${id}/deactivate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Activar usuario
  async activarUsuario(id) {
    try {
      const response = await api.put(`/usuarios/${id}/activate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Eliminar usuario permanentemente
  async eliminarUsuario(id) {
    try {
      const response = await api.delete(`/usuarios/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default usuarioService;