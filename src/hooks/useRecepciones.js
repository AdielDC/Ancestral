// hooks/useRecepciones.js
import { useState, useEffect } from 'react';
import { recepcionService } from '../services/recepcionService';

export const useRecepciones = () => {
  const [recepciones, setRecepciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Datos para el formulario
  const [proveedores, setProveedores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [datosFormularioCargados, setDatosFormularioCargados] = useState(false);

  // Cargar recepciones al montar
  useEffect(() => {
    loadRecepciones();
    loadDatosFormulario();
  }, []);

  const loadRecepciones = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await recepcionService.getAll(filters);
      setRecepciones(response.data || response);
    } catch (err) {
      console.error('Error cargando recepciones:', err);
      setError('Error al cargar las recepciones');
    } finally {
      setLoading(false);
    }
  };

  const loadDatosFormulario = async () => {
    try {
      const response = await recepcionService.getDatosFormulario();
      const data = response.data || response;
      
      setProveedores(data.proveedores || []);
      setClientes(data.clientes || []);
      setInventario(data.inventario || []);
      setDatosFormularioCargados(true);
    } catch (err) {
      console.error('Error cargando datos del formulario:', err);
    }
  };

  const createRecepcion = async (recepcionData) => {
    try {
      const response = await recepcionService.create(recepcionData);
      await loadRecepciones(); // Recargar lista
      return response;
    } catch (err) {
      console.error('Error creando recepción:', err);
      throw err;
    }
  };

  const updateRecepcion = async (id, recepcionData) => {
    try {
      const response = await recepcionService.update(id, recepcionData);
      await loadRecepciones(); // Recargar lista
      return response;
    } catch (err) {
      console.error('Error actualizando recepción:', err);
      throw err;
    }
  };

  const deleteRecepcion = async (id) => {
    try {
      const response = await recepcionService.delete(id);
      await loadRecepciones(); // Recargar lista
      return response;
    } catch (err) {
      console.error('Error eliminando recepción:', err);
      throw err;
    }
  };

  return {
    recepciones,
    loading,
    error,
    proveedores,
    clientes,
    inventario,
    datosFormularioCargados,
    loadRecepciones,
    createRecepcion,
    updateRecepcion,
    deleteRecepcion
  };
};