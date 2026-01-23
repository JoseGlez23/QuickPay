// src/context/CartContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { cartAPI } from '../api/cart';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar carrito (primero local, luego sync con server)
  useEffect(() => {
    const loadCart = async () => {
      setLoading(true);
      try {
        // Cargar de AsyncStorage (para offline/quick load)
        const storedCart = await AsyncStorage.getItem('cart');
        if (storedCart) setCart(JSON.parse(storedCart));

        if (isAuthenticated && user?.role === 'client') {
          const serverCart = await cartAPI.getCart(user.id);
          setCart(serverCart);
          await AsyncStorage.setItem('cart', JSON.stringify(serverCart));
        }
      } catch (error) {
        console.error('Error cargando carrito:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [isAuthenticated, user]);

  // Suscripción realtime (solo si autenticado)
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'client') return;

    const unsubscribe = cartAPI.subscribeToCart(user.id, async (payload) => {
      // Recargar carrito al cambio
      const updatedCart = await cartAPI.getCart(user.id);
      setCart(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
    });

    return unsubscribe;
  }, [isAuthenticated, user]);

  // Función para agregar (sync local + server)
  const addToCart = async (product) => {
    if (!isAuthenticated || user?.role !== 'client') {
      Alert.alert('Error', 'Debes iniciar sesión como cliente para agregar al carrito.');
      return;
    }

    try {
      const result = await cartAPI.addToCart(user.id, product.id);
      const updatedCart = [...cart, { ...result, product }];
      setCart(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar al carrito.');
    }
  };

  // Similar para removeFromCart, updateQuantity, clearCart
  const removeFromCart = async (cartItemId) => {
    try {
      await cartAPI.removeFromCart(cartItemId);
      const updatedCart = cart.filter(item => item.id !== cartItemId);
      setCart(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (error) {
      Alert.alert('Error', 'No se pudo remover del carrito.');
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    try {
      const result = await cartAPI.updateQuantity(cartItemId, newQuantity);
      const updatedCart = cart.map(item => item.id === cartItemId ? { ...item, quantity: result.quantity } : item);
      setCart(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la cantidad.');
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated || user?.role !== 'client') return;

    try {
      await cartAPI.clearCart(user.id);
      setCart([]);
      await AsyncStorage.removeItem('cart');
    } catch (error) {
      Alert.alert('Error', 'No se pudo limpiar el carrito.');
    }
  };

  // Calculos (total, count) como antes
  const cartTotal = cart.reduce((total, item) => total + (item.product?.price || 0) * item.quantity, 0);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, loading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);