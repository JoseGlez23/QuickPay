// src/utils/categoryUtils.js
import { supabase } from './supabase';

let categoryCache = null;

export const loadCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
    
    if (error) throw error;
    
    categoryCache = data.reduce((map, category) => {
      map[category.name] = category.id;
      return map;
    }, {});
    
    console.log('Categorias cargadas:', categoryCache);
    return categoryCache;
  } catch (error) {
    console.error('Error cargando categorias:', error);
    return null;
  }
};

export const getCategoryId = async (categoryName) => {
  try {
    if (!categoryCache) {
      await loadCategories();
    }
    
    const name = categoryName.toLowerCase().trim();
    
    if (categoryCache && categoryCache[name]) {
      return categoryCache[name];
    }
    
    // Si no esta en cache, buscar directamente
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
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description, icon')
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error obteniendo lista de categorias:', error);
    return [];
  }
};