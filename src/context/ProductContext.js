// src/context/ProductContext.js
import React, { createContext, useContext, useState } from 'react';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]); // inicia vacío

  const addProduct = (newProduct) => {
    const newId = products.length > 0
      ? Math.max(...products.map(p => p.id)) + 1
      : 1;

    const productWithId = {
      id: newId,
      providerId: newProduct.providerId, // ← ¡Esto es clave para filtrar después!
      name: newProduct.name.trim(),
      price: newProduct.price,
      description: newProduct.description?.trim() || '',
      images: newProduct.images || [], // Array de URIs locales
      stock: newProduct.stock ?? 10, // Valor por defecto
      createdAt: new Date().toISOString(),
      // Puedes agregar más campos aquí (ej. category, discount, etc.)
    };

    setProducts(prev => [...prev, productWithId]);
  };

  return (
    <ProductContext.Provider value={{ products, addProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts debe usarse dentro de un ProductProvider');
  }
  return context;
};