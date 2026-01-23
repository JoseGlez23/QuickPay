// src/api/cart.js
import { supabase } from '../utils/supabase';

export const cartAPI = {
  // Cargar carrito del usuario
  async getCart(clientId) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products (
            id, name, description, price, discount_price, images, stock,
            provider_id, category_id, is_active
          )
        `)
        .eq('client_id', clientId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error cargando carrito:', error);
      return [];
    }
  },

  // Agregar item al carrito (upsert para evitar duplicados)
  async addToCart(clientId, productId, quantity = 1) {
    try {
      const { data: existing, error: checkError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('client_id', clientId)
        .eq('product_id', productId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError; // Ignora si no existe

      let result;
      if (existing) {
        // Actualizar cantidad si ya existe
        const newQuantity = existing.quantity + quantity;
        const { data, error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insertar nuevo
        const { data, error } = await supabase
          .from('cart_items')
          .insert([{ client_id: clientId, product_id: productId, quantity }])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return result;
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      throw error;
    }
  },

  // Actualizar cantidad
  async updateQuantity(cartItemId, newQuantity) {
    try {
      if (newQuantity <= 0) {
        return await this.removeFromCart(cartItemId);
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', cartItemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error actualizando cantidad:', error);
      throw error;
    }
  },

  // Remover item
  async removeFromCart(cartItemId) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removiendo del carrito:', error);
      throw error;
    }
  },

  // Limpiar carrito
  async clearCart(clientId) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('client_id', clientId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error limpiando carrito:', error);
      throw error;
    }
  },

  // Suscripción realtime
  subscribeToCart(clientId, callback) {
    const channel = supabase
      .channel(`cart-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('Cambio en carrito:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }
};