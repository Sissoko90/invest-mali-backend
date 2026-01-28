/**
 * Utilitaires de debug pour identifier les objets rendus directement dans React
 */
import React from 'react';

// Fonction pour sécuriser le rendu d'objets
export const safeRender = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  if (typeof value === 'object' && !React.isValidElement(value)) {
    // Si c'est un objet avec key, value, label (pattern de l'erreur)
    if (value.label) return value.label;
    if (value.value) return value.value;
    if (value.key) return value.key;
    
    // Sinon, convertir en string JSON
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '[Object non sérialisable]';
    }
  }
  
  return value;
};

// Fonction pour vérifier si une valeur peut être rendue directement
export const canRenderDirectly = (value) => {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined ||
    React.isValidElement(value)
  );
};

// Fonction pour débugger les objets avec key, value, label
export const debugObjectWithKVL = (obj, context = '') => {
  console.group(`🔍 Debug Object ${context}`);
  console.log('Type:', typeof obj);
  console.log('Is Array:', Array.isArray(obj));
  console.log('Keys:', obj ? Object.keys(obj) : 'null/undefined');
  
  if (obj && typeof obj === 'object') {
    console.log('Has key:', 'key' in obj);
    console.log('Has value:', 'value' in obj);
    console.log('Has label:', 'label' in obj);
    console.log('Content:', obj);
  }
  console.groupEnd();
  
  return obj;
};

export default {
  safeRender,
  canRenderDirectly,
  debugObjectWithKVL
};
