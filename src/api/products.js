// src/api/products.js
import { supabase } from '../utils/supabase';

export const productsAPI = {
  // Obtener todos los productos activos con joins
  async getAllProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          provider:users(name, email),
          category:categories(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en getAllProducts:', error);
      throw error;
    }
  },

  // Obtener productos de un proveedor
  async getProviderProducts(providerId) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `)
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en getProviderProducts:', error);
      throw error;
    }
  },

  // Crear producto
  async createProduct(productData) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select(`
          *,
          provider:users(name),
          category:categories(name)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en createProduct:', error);
      throw error;
    }
  },

  // Actualizar producto
  async updateProduct(id, updates) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          provider:users(name),
          category:categories(name)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en updateProduct:', error);
      throw error;
    }
  },

  // Soft delete producto
  async deleteProduct(id) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en deleteProduct:', error);
      throw error;
    }
  },

  // Obtener producto por ID
  async getProductById(id) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          provider:users(name, email),
          category:categories(name)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getProductById:', error);
      throw error;
    }
  }
};