// hooks/useClientes.js
import { useState, useEffect } from 'react';
import { clienteService } from '../services/clienteService';

export const useClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar clientes al montar
  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clienteService.getAll();
      setClientes(response.data || response);
    } catch (err) {
      console.error('Error cargando clientes:', err);
      setError('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const createCliente = async (clienteData) => {
    try {
      const response = await clienteService.create(clienteData);
      await loadClientes(); // Recargar lista
      return response;
    } catch (err) {
      console.error('Error creando cliente:', err);
      throw err;
    }
  };

  const updateCliente = async (id, clienteData) => {
    try {
      const response = await clienteService.update(id, clienteData);
      await loadClientes(); // Recargar lista
      return response;
    } catch (err) {
      console.error('Error actualizando cliente:', err);
      throw err;
    }
  };

  const deleteCliente = async (id) => {
    try {
      const response = await clienteService.delete(id);
      await loadClientes(); // Recargar lista
      return response;
    } catch (err) {
      console.error('Error eliminando cliente:', err);
      throw err;
    }
  };

  return {
    clientes,
    loading,
    error,
    loadClientes,
    createCliente,
    updateCliente,
    deleteCliente
  };
};