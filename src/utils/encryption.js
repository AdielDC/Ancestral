// src/utils/encryption.js
import CryptoJS from 'crypto-js';

// ⚠️ Solución para el error "process is not defined"
// En Vite usa import.meta.env, en Create React App usa process.env
const getEnvVariable = (key, defaultValue) => {
  // Para Vite
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  // Para Create React App
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  // Fallback
  return defaultValue;
};

const SECRET_KEY = getEnvVariable(
  'REACT_APP_ENCRYPTION_KEY', 
  'envasadora-ancestral-secret-key-2024-xyz'
);

export const encryptionService = {
  /**
   * Encripta cualquier dato (string, objeto, array)
   * @param {*} data - Dato a encriptar
   * @returns {string|null} - Dato encriptado o null si hay error
   */
  encrypt: (data) => {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('❌ Error al encriptar:', error);
      return null;
    }
  },

  /**
   * Desencripta un dato previamente encriptado
   * @param {string} encryptedData - Dato encriptado
   * @returns {*|null} - Dato desencriptado o null si hay error
   */
  decrypt: (encryptedData) => {
    try {
      if (!encryptedData) return null;
      
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) return null;
      
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('❌ Error al desencriptar:', error);
      return null;
    }
  },

  /**
   * Hash de una cadena (útil para verificaciones)
   * @param {string} text - Texto a hashear
   * @returns {string} - Hash del texto
   */
  hash: (text) => {
    return CryptoJS.SHA256(text).toString();
  }
};