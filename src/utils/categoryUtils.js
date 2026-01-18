// src/utils/categoryUtils.js - VERSIÓN MEJORADA
import { supabase } from './supabase';

let categoryCache = null;
let categoryListCache = null;

// Mapa de nombres técnicos a nombres amigables
const FRIENDLY_NAMES = {
  'electronics': 'Electrónicos',
  'computers': 'Computadoras',
  'phones': 'Teléfonos',
  'home': 'Hogar',
  'toys': 'Juguetes',
  'fashion': 'Moda',
  'books': 'Libros',
  'sports': 'Deportes',
  'other': 'General',
  'electronics-accessories': 'Accesorios Electrónicos',
  'kitchen': 'Cocina',
  'beauty': 'Belleza',
  'health': 'Salud',
  'garden': 'Jardín',
  'office': 'Oficina',
  'tools': 'Herramientas'
};

export const loadCategories = async (forceRefresh = false) => {
  try {
    if (categoryCache && !forceRefresh) {
      return categoryCache;
    }

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description, icon')
      .order('name');
    
    if (error) throw error;
    
    // Crear dos estructuras de caché
    categoryCache = {};
    categoryListCache = [];
    
    data.forEach(category => {
      // Mapeo nombre → id
      categoryCache[category.name] = category.id;
      // Lista completa de categorías
      categoryListCache.push({
        id: category.id,
        name: category.name,
        friendlyName: FRIENDLY_NAMES[category.name] || 
                     category.name.charAt(0).toUpperCase() + category.name.slice(1),
        description: category.description,
        icon: category.icon
      });
    });
    
    console.log('✅ Categorias cargadas:', categoryListCache.length);
    return categoryCache;
  } catch (error) {
    console.error('❌ Error cargando categorias:', error);
    return null;
  }
};

export const getCategoryId = async (categoryName) => {
  try {
    if (!categoryCache) {
      await loadCategories();
    }
    
    const name = categoryName.toLowerCase().trim();
    
    // Buscar por nombre exacto
    if (categoryCache && categoryCache[name]) {
      return categoryCache[name];
    }
    
    // Buscar por nombre amigable
    const friendlyEntry = categoryListCache?.find(cat => 
      cat.friendlyName.toLowerCase() === name
    );
    if (friendlyEntry) {
      return friendlyEntry.id;
    }
    
    // Si no está en cache, buscar directamente
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name)
      .single();
    
    if (error) {
      console.error('Error buscando categoria por nombre:', error);
      return null;
    }
    
    // Actualizar cache
    if (data && data.id) {
      categoryCache[name] = data.id;
      return data.id;
    }
    
    return null;
  } catch (error) {
    console.error('Error en getCategoryId:', error);
    return null;
  }
};

export const getCategoriesList = async () => {
  try {
    if (categoryListCache) {
      return categoryListCache;
    }
    
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description, icon')
      .order('name');
    
    if (error) throw error;
    
    categoryListCache = data.map(category => ({
      id: category.id,
      name: category.name,
      friendlyName: FRIENDLY_NAMES[category.name] || 
                   category.name.charAt(0).toUpperCase() + category.name.slice(1),
      description: category.description,
      icon: category.icon
    }));
    
    return categoryListCache;
  } catch (error) {
    console.error('Error obteniendo lista de categorias:', error);
    return [];
  }
};

export const getCategoryName = async (categoryId) => {
  try {
    if (!categoryListCache) {
      await getCategoriesList();
    }
    
    // Buscar por ID
    const category = categoryListCache?.find(cat => cat.id === categoryId);
    if (category) {
      return {
        id: category.id,
        name: category.name,
        friendlyName: category.friendlyName,
        description: category.description,
        icon: category.icon
      };
    }
    
    // Si no está en cache, buscar directamente
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description, icon')
      .eq('id', categoryId)
      .single();
    
    if (error) {
      console.error('Error buscando categoria por ID:', error);
      return null;
    }
    
    if (data) {
      return {
        id: data.id,
        name: data.name,
        friendlyName: FRIENDLY_NAMES[data.name] || 
                     data.name.charAt(0).toUpperCase() + data.name.slice(1),
        description: data.description,
        icon: data.icon
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error en getCategoryName:', error);
    return null;
  }
};

export const getFriendlyCategoryName = (categoryIdOrName) => {
  if (!categoryIdOrName) return 'General';
  
  // Si ya es un nombre amigable, devolverlo
  if (typeof categoryIdOrName === 'string') {
    // Verificar si ya es un nombre amigable
    const friendlyNames = Object.values(FRIENDLY_NAMES);
    if (friendlyNames.includes(categoryIdOrName)) {
      return categoryIdOrName;
    }
    
    // Convertir nombre técnico a amigable
    return FRIENDLY_NAMES[categoryIdOrName.toLowerCase()] || 
           categoryIdOrName.charAt(0).toUpperCase() + categoryIdOrName.slice(1);
  }
  
  return 'General';
};

// Inicializar categorías al importar
loadCategories().catch(console.error);