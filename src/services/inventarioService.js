// services/inventarioService.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api'; 

// Configuración base de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ========== INVENTARIO ==========
export const inventarioService = {
  // Obtener todo el inventario CON FILTROS MEJORADOS
  getAll: async (filters = {}) => {
    try {
      console.log('📡 inventarioService.getAll con filtros:', filters);
      
      // Si hay filtros específicos, usar el endpoint de búsqueda
      if (filters.cliente || filters.tipo || filters.presentacion) {
        return await inventarioService.buscar({
          cliente_nombre: filters.cliente,
          tipo: filters.tipo,
          presentacion_volumen: filters.presentacion
        });
      }
      
      // Si no, usar el endpoint normal con query params
      const params = new URLSearchParams();
      
      if (filters.categoria) params.append('categoria', filters.categoria);
      if (filters.marca) params.append('marca', filters.marca);
      if (filters.variedad) params.append('variedad', filters.variedad);
      if (filters.search) params.append('search', filters.search);
      
      const queryString = params.toString();
      const url = queryString ? `/inventario?${queryString}` : '/inventario';
      
      console.log('📡 URL:', url);
      
      const response = await api.get(url);
      
      console.log('✅ Respuesta recibida:', {
        success: response.data.success,
        count: response.data.data?.length || 0
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error en getAll:', error);
      throw error;
    }
  },

  //NUEVO: Método de búsqueda específico
  buscar: async (criterios = {}) => {
    try {
      console.log('🔍 inventarioService.buscar con criterios:', criterios);
      
      const params = new URLSearchParams();
      
      if (criterios.cliente_nombre) params.append('cliente_nombre', criterios.cliente_nombre);
      if (criterios.cliente_id) params.append('cliente_id', criterios.cliente_id);
      if (criterios.tipo) params.append('tipo', criterios.tipo);
      if (criterios.presentacion_volumen) params.append('presentacion_volumen', criterios.presentacion_volumen);
      if (criterios.categoria_nombre) params.append('categoria_nombre', criterios.categoria_nombre);
      if (criterios.marca_id) params.append('marca_id', criterios.marca_id);
      if (criterios.variedad_id) params.append('variedad_id', criterios.variedad_id);
      if (criterios.codigo_lote) params.append('codigo_lote', criterios.codigo_lote);
      
      const url = `/inventario/buscar?${params.toString()}`;
      console.log('📡 URL de búsqueda:', url);
      
      const response = await api.get(url);
      
      console.log('✅ Búsqueda completada:', {
        success: response.data.success,
        count: response.data.count || response.data.data?.length || 0
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error en buscar:', error);
      throw error;
    }
  },

  // Obtener un item por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/inventario/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear nuevo item de inventario
  create: async (data) => {
    try {
      console.log('📝 Creando inventario:', data);
      const response = await api.post('/inventario', data);
      console.log('✅ Inventario creado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creando inventario:', error);
      throw error;
    }
  },

  // Actualizar item de inventario
  update: async (id, data) => {
    try {
      const response = await api.put(`/inventario/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar item de inventario
  delete: async (id) => {
    try {
      const response = await api.delete(`/inventario/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Registrar movimiento de inventario
  registrarMovimiento: async (data) => {
    try {
      const response = await api.post('/inventario/movimiento', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener alertas de stock bajo
  getAlertas: async () => {
    try {
      const response = await api.get('/inventario/alertas');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener items con stock bajo
  getStockBajo: async () => {
    try {
      const response = await api.get('/inventario/stock-bajo');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// ========== CLIENTES ==========
export const clienteService = {
  getAll: async () => {
    try {
      const response = await api.get('/clientes');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// ========== MARCAS ==========
export const marcaService = {
  getAll: async (clienteId = null) => {
    try {
      const url = clienteId ? `/marcas?cliente_id=${clienteId}` : '/marcas';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// ========== CATEGORÍAS ==========
export const categoriaService = {
  getAll: async () => {
    try {
      const response = await api.get('/categorias');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// ========== VARIEDADES ==========
export const variedadService = {
  getAll: async () => {
    try {
      const response = await api.get('/variedades');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// ========== PRESENTACIONES ==========
export const presentacionService = {
  getAll: async () => {
    try {
      const response = await api.get('/presentaciones');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// ========== PROVEEDORES ==========
export const proveedorService = {
  getAll: async () => {
    try {
      const response = await api.get('/proveedores');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default api;