// hooks/useInventario.js
import { useState, useEffect } from 'react';
import { 
  inventarioService, 
  clienteService, 
  marcaService, 
  categoriaService,
  variedadService,
  presentacionService,
  proveedorService
} from '../services/inventarioService';

export const useInventario = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para las opciones de filtros
  const [clientes, setClientes] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [variedades, setVariedades] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  // Función para mapear los alias del backend al formato esperado por el frontend
  const mapearInventario = (items) => {
    return items.map(item => ({
      ...item,
      // Mapear los alias en minúsculas a mayúsculas
      CATEGORIA_INSUMO: item.categoria || item.CATEGORIA_INSUMO,
      CLIENTE: item.cliente || item.CLIENTE,
      MARCA: item.marca || item.MARCA,
      VARIEDADES_AGAVE: item.variedad || item.VARIEDADES_AGAVE,
      PRESENTACION: item.presentacion || item.PRESENTACION,
      PROVEEDOR: item.proveedor || item.PROVEEDOR
    }));
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar inventario y opciones de filtros en paralelo
      const [
        inventarioData,
        clientesData,
        marcasData,
        categoriasData,
        variedadesData,
        presentacionesData,
        proveedoresData
      ] = await Promise.all([
        inventarioService.getAll(),
        clienteService.getAll(),
        marcaService.getAll(),
        categoriaService.getAll(),
        variedadService.getAll(),
        presentacionService.getAll(),
        proveedorService.getAll()
      ]);

      // Extraer datos y mapear inventario
      const inventarioRaw = inventarioData.data || inventarioData;
      const inventarioMapeado = mapearInventario(inventarioRaw);

      setInventory(inventarioMapeado);
      setFilteredInventory(inventarioMapeado);
      setClientes(clientesData.data || clientesData);
      setMarcas(marcasData.data || marcasData);
      setCategorias(categoriasData.data || categoriasData);
      setVariedades(variedadesData.data || variedadesData);
      setPresentaciones(presentacionesData.data || presentacionesData);
      setProveedores(proveedoresData.data || proveedoresData);
      
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos del inventario');
    } finally {
      setLoading(false);
    }
  };

  // Recargar inventario
  const reloadInventory = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await inventarioService.getAll(filters);
      const data = response.data || response;
      const inventarioMapeado = mapearInventario(data);
      
      setInventory(inventarioMapeado);
      setFilteredInventory(inventarioMapeado);
      return inventarioMapeado;
    } catch (err) {
      console.error('Error recargando inventario:', err);
      setError('Error al recargar el inventario');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Registrar movimiento
  const registrarMovimiento = async (movementData) => {
    try {
      const response = await inventarioService.registrarMovimiento(movementData);
      
      // Actualizar el inventario local
      await reloadInventory();
      
      return response;
    } catch (err) {
      console.error('Error registrando movimiento:', err);
      throw err;
    }
  };

  // Obtener alertas de stock bajo
  const getAlertas = async () => {
    try {
      const response = await inventarioService.getAlertas();
      const data = response.data || response;
      return mapearInventario(data);
    } catch (err) {
      console.error('Error obteniendo alertas:', err);
      throw err;
    }
  };

  // Obtener items con stock bajo
  const getStockBajo = async () => {
    try {
      const response = await inventarioService.getStockBajo();
      const data = response.data || response;
      return mapearInventario(data);
    } catch (err) {
      console.error('Error obteniendo stock bajo:', err);
      throw err;
    }
  };

  // Crear nuevo item
  const createItem = async (itemData) => {
    try {
      const response = await inventarioService.create(itemData);
      await reloadInventory();
      return response;
    } catch (err) {
      console.error('Error creando item:', err);
      throw err;
    }
  };

  // Actualizar item
  const updateItem = async (id, itemData) => {
    try {
      const response = await inventarioService.update(id, itemData);
      await reloadInventory();
      return response;
    } catch (err) {
      console.error('Error actualizando item:', err);
      throw err;
    }
  };

  // Eliminar item
  const deleteItem = async (id) => {
    try {
      const response = await inventarioService.delete(id);
      await reloadInventory();
      return response;
    } catch (err) {
      console.error('Error eliminando item:', err);
      throw err;
    }
  };

  // Aplicar filtros locales
  const applyFilters = (filters, searchTerm = '') => {
    let result = [...inventory];
    
    // Búsqueda por texto
    if (searchTerm.trim() !== "") {
      result = result.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (item.CATEGORIA_INSUMO?.nombre || '').toLowerCase().includes(searchLower) ||
          (item.CLIENTE?.nombre || '').toLowerCase().includes(searchLower) ||
          (item.MARCA?.nombre || '').toLowerCase().includes(searchLower) ||
          (item.VARIEDADES_AGAVE?.nombre || '').toLowerCase().includes(searchLower) ||
          (item.PROVEEDOR?.nombre || '').toLowerCase().includes(searchLower) ||
          (item.codigo_lote || '').toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Filtros específicos
    if (filters.category && filters.category !== "all") {
      result = result.filter(item => 
        item.CATEGORIA_INSUMO?.nombre === filters.category
      );
    }
    if (filters.client && filters.client !== "all") {
      result = result.filter(item => 
        item.CLIENTE?.nombre === filters.client
      );
    }
    if (filters.variety && filters.variety !== "all") {
      result = result.filter(item => 
        item.VARIEDADES_AGAVE?.nombre === filters.variety
      );
    }
    if (filters.presentation && filters.presentation !== "all") {
      result = result.filter(item => 
        item.PRESENTACION?.volumen === filters.presentation
      );
    }
    if (filters.type && filters.type !== "all") {
      result = result.filter(item => item.tipo === filters.type);
    }
    
    setFilteredInventory(result);
    return result;
  };

  return {
    inventory,
    filteredInventory,
    loading,
    error,
    clientes,
    marcas,
    categorias,
    variedades,
    presentaciones,
    proveedores,
    reloadInventory,
    registrarMovimiento,
    getAlertas,
    getStockBajo,
    createItem,
    updateItem,
    deleteItem,
    applyFilters
  };
};