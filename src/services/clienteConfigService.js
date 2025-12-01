// services/clienteConfigService.js
import api from './inventarioService';

/**
 * Obtiene la configuración de todos los clientes
 */
export const obtenerTodasConfiguraciones = async () => {
  try {
    const response = await api.get('/cliente-config/todos');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    throw error;
  }
};

/**
 * Obtiene la configuración de un cliente específico
 */
export const obtenerConfiguracionCliente = async (clienteId) => {
  try {
    const response = await api.get(`/cliente-config/${clienteId}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo configuración del cliente:', error);
    throw error;
  }
};

/**
 * Actualiza toda la configuración de un cliente
 */
export const actualizarConfiguracionCliente = async (clienteId, configuracion) => {
  try {
    const response = await api.put(`/cliente-config/${clienteId}`, configuracion);
    return response.data;
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    throw error;
  }
};

/**
 * Actualiza las variedades de un cliente
 */
export const actualizarVariedadesCliente = async (clienteId, variedades) => {
  try {
    const response = await api.put(`/cliente-config/${clienteId}/variedades`, { variedades });
    return response.data;
  } catch (error) {
    console.error('Error actualizando variedades:', error);
    throw error;
  }
};

/**
 * Actualiza las presentaciones de un cliente
 */
export const actualizarPresentacionesCliente = async (clienteId, presentaciones) => {
  try {
    const response = await api.put(`/cliente-config/${clienteId}/presentaciones`, { presentaciones });
    return response.data;
  } catch (error) {
    console.error('Error actualizando presentaciones:', error);
    throw error;
  }
};

/**
 * Actualiza los tipos de un cliente
 */
export const actualizarTiposCliente = async (clienteId, tipos) => {
  try {
    const response = await api.put(`/cliente-config/${clienteId}/tipos`, { tipos });
    return response.data;
  } catch (error) {
    console.error('Error actualizando tipos:', error);
    throw error;
  }
};

export default {
  obtenerTodasConfiguraciones,
  obtenerConfiguracionCliente,
  actualizarConfiguracionCliente,
  actualizarVariedadesCliente,
  actualizarPresentacionesCliente,
  actualizarTiposCliente
};