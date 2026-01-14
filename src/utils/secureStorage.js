// src/utils/secureStorage.js
import { encryptionService } from './encryption';

export const secureStorage = {
  /**
   * Guardar dato encriptado con expiración opcional
   * @param {string} key - Clave del item
   * @param {*} value - Valor a guardar
   * @param {number} expirationMinutes - Minutos hasta expiración (default: 30)
   */
  setItem: (key, value, expirationMinutes = 30) => {
    try {
      const now = new Date();
      const item = {
        value: value,
        expiry: now.getTime() + (expirationMinutes * 60 * 1000),
        timestamp: now.getTime()
      };
      
      const encrypted = encryptionService.encrypt(item);
      if (encrypted) {
        localStorage.setItem(key, encrypted);
        console.log(`🔐 Item '${key}' guardado de forma segura (expira en ${expirationMinutes} min)`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error al guardar item:', error);
      return false;
    }
  },

  /**
   * Obtener dato desencriptado verificando expiración
   * @param {string} key - Clave del item
   * @returns {*|null} - Valor desencriptado o null si no existe/expiró
   */
  getItem: (key) => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) {
        console.log(`⚠️ Item '${key}' no encontrado`);
        return null;
      }

      const item = encryptionService.decrypt(encrypted);
      if (!item) {
        console.warn(`⚠️ No se pudo desencriptar '${key}'`);
        localStorage.removeItem(key);
        return null;
      }

      const now = new Date().getTime();
      
      // Verificar expiración
      if (now > item.expiry) {
        console.log(`⏰ Item '${key}' ha expirado`);
        localStorage.removeItem(key);
        return null;
      }

      // Calcular tiempo restante
      const minutesRemaining = Math.floor((item.expiry - now) / 1000 / 60);
      console.log(`🔓 Item '${key}' recuperado (expira en ${minutesRemaining} min)`);

      return item.value;
    } catch (error) {
      console.error(`❌ Error al obtener '${key}':`, error);
      localStorage.removeItem(key);
      return null;
    }
  },

  /**
   * Eliminar un item
   * @param {string} key - Clave del item
   */
  removeItem: (key) => {
    localStorage.removeItem(key);
    console.log(`🗑️ Item '${key}' eliminado`);
  },

  /**
   * Limpiar todo el storage
   */
  clear: () => {
    localStorage.clear();
    console.log('🧹 Storage limpiado completamente');
  },

  /**
   * Verificar si un item existe y no ha expirado
   * @param {string} key - Clave del item
   * @returns {boolean}
   */
  hasItem: (key) => {
    const value = secureStorage.getItem(key);
    return value !== null;
  },

  /**
   * Renovar la expiración de un item
   * @param {string} key - Clave del item
   * @param {number} expirationMinutes - Nuevos minutos de expiración
   */
  renewItem: (key, expirationMinutes = 30) => {
    const value = secureStorage.getItem(key);
    if (value !== null) {
      secureStorage.setItem(key, value, expirationMinutes);
      console.log(`🔄 Item '${key}' renovado (nueva expiración: ${expirationMinutes} min)`);
      return true;
    }
    return false;
  }
};