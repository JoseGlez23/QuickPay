// src/context/ProductContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "../utils/supabase";
import { useAuth } from "./AuthContext";
import { getCategoryId, loadCategories } from "../utils/categoryUtils";
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { v4 as uuidv4 } from 'uuid';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const { user } = useAuth();

  const [allProducts, setAllProducts] = useState([]);
  const [providerProducts, setProviderProducts] = useState([]);

  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingProvider, setLoadingProvider] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initCategories = async () => {
      try {
        await loadCategories();
      } catch (error) {
        console.error("Error inicializando categorías:", error);
      }
    };

    initCategories();
  }, []);

  useEffect(() => {
    if (!user) {
      setAllProducts([]);
      setProviderProducts([]);
      return;
    }

    if (user.role === "provider") {
      loadProviderProducts(user.id);
    } else {
      loadAllProducts();
    }
  }, [user?.id, user?.role]);

  const uploadImageToSupabase = async (imageUri, productId) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileName = `product_${productId}_${uuidv4()}.jpg`;
      const filePath = `products/${fileName}`;

      console.log(`Subiendo imagen: ${fileName}`);

      const { data, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, decode(base64), {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error subiendo imagen:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      console.log(`Imagen subida: ${urlData.publicUrl}`);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error procesando imagen:', error);
      throw error;
    }
  };

  const processImagesForUpdate = async (images, productId, existingImages = []) => {
    console.log('Procesando imágenes:', {
      totalImagenes: images.length,
      nuevas: images.filter(img => !img.startsWith('http')).length,
      existentes: existingImages.length
    });

    const processedImages = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      if (image.startsWith('https://') && image.includes('supabase')) {
        console.log(`Manteniendo imagen existente ${i + 1}`);
        processedImages.push(image);
      } else if (image.startsWith('file://') || image.startsWith('content://')) {
        console.log(`Subiendo nueva imagen ${i + 1}`);
        try {
          const uploadedUrl = await uploadImageToSupabase(image, productId);
          processedImages.push(uploadedUrl);
        } catch (error) {
          console.error(`Error subiendo imagen ${i + 1}:`, error);
          if (existingImages[i]) {
            processedImages.push(existingImages[i]);
          }
        }
      } else {
        processedImages.push(image);
      }
    }

    console.log(`Imagenes procesadas: ${processedImages.length}`);
    return processedImages;
  };

  const formatProductFromSupabase = (product) => {
    if (!product) return null;

    return {
      id: product.id,
      provider_id: product.provider_id,
      providerId: product.provider_id,
      name: product.name,
      price: parseFloat(product.price) || 0,
      description: product.description || "",
      images: product.images || [],
      stock: parseInt(product.stock) || 0,
      category: product.category?.name || "other",
      categoryId: product.category_id,
      categoryName: product.category?.name || "other",
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      isActive: product.is_active !== false,
      discountPrice: product.discount_price
        ? parseFloat(product.discount_price)
        : null,
      rating: product.rating || 0,
      reviewsCount: product.reviews_count || 0,
      providerName: product.provider?.name || "Proveedor",
      provider: product.provider
        ? {
            id: product.provider_id,
            name: product.provider.name,
            email: product.provider.email,
          }
        : null,
      delivery: "Envío gratis",
      isNew: product.created_at
        ? new Date(product.created_at) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : false,
      image: product.images?.[0] || "https://via.placeholder.com/150",
    };
  };

  const formatProductToSupabase = async (product) => {
    try {
      let categoryId = product.categoryId;

      if (!categoryId && product.category && product.category !== "other") {
        categoryId = await getCategoryId(product.category);
      }

      if (!categoryId) {
        const defaultCategoryId = await getCategoryId("other");
        categoryId = defaultCategoryId;
      }

      console.log('Preparando datos para Supabase:', {
        categoryId,
        category: product.category,
        imagesCount: product.images?.length || 0
      });

      return {
        provider_id: product.providerId || product.provider_id,
        name: product.name.trim(),
        description: product.description?.trim() || null,
        price: parseFloat(product.price) || 0,
        discount_price: product.discountPrice
          ? parseFloat(product.discountPrice)
          : null,
        category_id: categoryId,
        images: product.images && product.images.length > 0 ? product.images : null,
        stock: parseInt(product.stock) || 0,
        is_active: product.isActive !== false,
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error en formatProductToSupabase:", error);
      throw error;
    }
  };

  const loadAllProducts = useCallback(async () => {
    try {
      setLoadingAll(true);
      setError(null);

      console.log("Cargando todos los productos...");

      const { data, error: supabaseError } = await supabase
        .from("products")
        .select(`
          *,
          provider:users(id, name, email),
          category:categories(id, name, description)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      console.log("Productos cargados:", data?.length || 0);

      const formattedProducts = (data || [])
        .map(formatProductFromSupabase)
        .filter((product) => product !== null && product.isActive);

      console.log("Productos formateados:", formattedProducts.length);
      setAllProducts(formattedProducts);
      return formattedProducts;
    } catch (error) {
      console.error("Error en loadAllProducts:", error);
      setError(error.message);
      setAllProducts([]);
      return [];
    } finally {
      setLoadingAll(false);
    }
  }, []);

  const loadProviderProducts = useCallback(async (providerId) => {
    if (!providerId) {
      setProviderProducts([]);
      return [];
    }

    try {
      setLoadingProvider(true);
      setError(null);

      console.log(`Cargando productos para proveedor: ${providerId}`);

      const { data, error: supabaseError } = await supabase
        .from("products")
        .select(`
          *,
          provider:users(id, name, email),
          category:categories(id, name, description)
        `)
        .eq("provider_id", providerId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      console.log("Productos del proveedor:", data?.length || 0);

      const formattedProducts = (data || [])
        .map(formatProductFromSupabase)
        .filter((product) => product !== null && product.isActive);

      console.log("Productos del proveedor formateados:", formattedProducts.length);
      setProviderProducts(formattedProducts);
      return formattedProducts;
    } catch (error) {
      console.error("Error en loadProviderProducts:", error);
      setError(error.message);
      setProviderProducts([]);
      return [];
    } finally {
      setLoadingProvider(false);
    }
  }, []);

  const updateProduct = async (updatedProduct) => {
    try {
      setError(null);
      console.log("INICIANDO ACTUALIZACIÓN DE PRODUCTO");

      const { id, ...updates } = updatedProduct;

      const currentProduct = (user?.role === "provider" ? providerProducts : allProducts).find((p) => p.id === id);
      if (!currentProduct) {
        throw new Error("Producto no encontrado");
      }

      console.log("Datos recibidos para actualizar:", {
        id,
        updates,
        currentImages: currentProduct.images?.length || 0,
        newImages: updates.images?.length || 0
      });

      let finalImages = currentProduct.images || [];

      if (updates.images && updates.images.length > 0) {
        console.log("Procesando imágenes...");
        finalImages = await processImagesForUpdate(
          updates.images,
          id,
          currentProduct.images || []
        );
      }

      const combinedProduct = {
        ...currentProduct,
        ...updates,
        images: finalImages,
        provider_id: currentProduct.provider_id || currentProduct.providerId,
        providerId: currentProduct.provider_id || currentProduct.providerId,
      };

      console.log("Producto combinado para actualizar:", {
        name: combinedProduct.name,
        imagesCount: combinedProduct.images?.length,
        category: combinedProduct.category,
        categoryId: combinedProduct.categoryId
      });

      const productForSupabase = await formatProductToSupabase(combinedProduct);

      if (productForSupabase.images && !Array.isArray(productForSupabase.images)) {
        productForSupabase.images = [productForSupabase.images];
      }

      console.log("Enviando a Supabase:", {
        ...productForSupabase,
        imagesCount: productForSupabase.images?.length
      });

      const { data, error: updateError } = await supabase
        .from("products")
        .update(productForSupabase)
        .eq("id", id)
        .select(`
          *,
          provider:users(id, name, email),
          category:categories(id, name, description)
        `)
        .single();

      if (updateError) {
        console.error("Error de Supabase:", updateError);
        throw updateError;
      }

      if (!data) {
        throw new Error("No se recibió respuesta del servidor");
      }

      const formattedProduct = formatProductFromSupabase(data);

      console.log("Producto actualizado exitosamente:", {
        id: formattedProduct.id,
        name: formattedProduct.name,
        images: formattedProduct.images?.length || 0,
        category: formattedProduct.category
      });

      if (user?.role === "provider") {
        setProviderProducts((prev) =>
          prev.map((p) => (p.id === id ? formattedProduct : p))
        );
      } else {
        setAllProducts((prev) =>
          prev.map((p) => (p.id === id ? formattedProduct : p))
        );
      }

      return {
        success: true,
        product: formattedProduct,
        message: "Producto actualizado correctamente",
      };
    } catch (error) {
      console.error("Error completo en updateProduct:", error);
      setError(error.message);
      return {
        success: false,
        error: error.message || "Error al actualizar el producto",
      };
    }
  };

  const addProduct = async (productData) => {
    try {
      setError(null);

      if (!user?.id) {
        throw new Error("Usuario no autenticado. Por favor inicia sesión.");
      }

      const finalProductData = {
        ...productData,
        provider_id: user.id,
        providerId: user.id,
        isActive: true,
      };

      console.log("Creando nuevo producto:", finalProductData);

      let imageUrls = [];
      if (finalProductData.images && finalProductData.images.length > 0) {
        console.log("Subiendo imágenes del nuevo producto...");

        const productForSupabase = await formatProductToSupabase(finalProductData);
        const productWithoutImages = { ...productForSupabase, images: null };

        const { data: newProduct, error: createError } = await supabase
          .from("products")
          .insert([productWithoutImages])
          .select()
          .single();

        if (createError) throw createError;

        for (let i = 0; i < finalProductData.images.length; i++) {
          const imageUri = finalProductData.images[i];
          if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
            const uploadedUrl = await uploadImageToSupabase(imageUri, newProduct.id);
            imageUrls.push(uploadedUrl);
          } else {
            imageUrls.push(imageUri);
          }
        }

        const { data: updatedProduct, error: updateError } = await supabase
          .from("products")
          .update({ images: imageUrls })
          .eq("id", newProduct.id)
          .select(`
            *,
            provider:users(id, name, email),
            category:categories(id, name, description)
          `)
          .single();

        if (updateError) throw updateError;

        const formattedProduct = formatProductFromSupabase(updatedProduct);

        if (user?.role === "provider") {
          setProviderProducts((prev) => [formattedProduct, ...prev]);
        }

        return {
          success: true,
          product: formattedProduct,
          message: "Producto creado exitosamente",
        };
      } else {
        const productForSupabase = await formatProductToSupabase(finalProductData);

        const { data, error } = await supabase
          .from("products")
          .insert([productForSupabase])
          .select(`
            *,
            provider:users(id, name, email),
            category:categories(id, name, description)
          `)
          .single();

        if (error) throw error;

        const newProduct = formatProductFromSupabase(data);

        if (user?.role === "provider") {
          setProviderProducts((prev) => [newProduct, ...prev]);
        }

        return {
          success: true,
          product: newProduct,
          message: "Producto creado exitosamente",
        };
      }
    } catch (error) {
      console.error("Error en addProduct:", error);
      setError(error.message);
      return {
        success: false,
        error: error.message,
        message: "Error al crear producto",
      };
    }
  };

  const deleteProduct = async (productId) => {
    try {
      setError(null);

      console.log(`Eliminando producto ID: ${productId}`);

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      if (user?.role === "provider") {
        setProviderProducts((prev) => prev.filter((p) => p.id !== productId));
      }

      console.log(`Producto ${productId} eliminado correctamente`);

      return {
        success: true,
        message: "Producto eliminado correctamente",
      };
    } catch (error) {
      console.error("Error en deleteProduct:", error);
      setError(error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  const refreshProducts = async () => {
    if (user?.role === "provider" && user?.id) {
      return await loadProviderProducts(user.id);
    } else {
      return await loadAllProducts();
    }
  };

  const getMyProducts = () => {
    if (user?.role !== "provider" || !user?.id) return [];
    return providerProducts;
  };

  const getProductById = (productId) => {
    if (user?.role === "provider") {
      return providerProducts.find((p) => p.id === productId) || null;
    }
    return allProducts.find((p) => p.id === productId) || null;
  };

  const getProductsByProvider = (providerId) => {
    return providerProducts.filter(
      (p) => p.provider_id === providerId || p.providerId === providerId
    );
  };

  const updateProductStock = async (productId, newStock) => {
    try {
      const product = getProductById(productId);
      if (!product) {
        throw new Error("Producto no encontrado");
      }

      const updatedProduct = {
        ...product,
        stock: Math.max(0, newStock),
      };

      const result = await updateProduct(updatedProduct);

      if (result.success) {
        console.log(
          `Stock actualizado para producto ${productId}: ${product.stock} -> ${newStock}`
        );
      }

      return result;
    } catch (error) {
      console.error("Error actualizando stock:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  const searchProducts = (query) => {
    if (!query.trim()) {
      return user?.role === "provider" ? providerProducts : allProducts;
    }

    const searchTerm = query.toLowerCase();
    const list = user?.role === "provider" ? providerProducts : allProducts;

    return list.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
  };

  const filterProductsByCategory = (category) => {
    if (!category || category === "all") {
      return user?.role === "provider" ? providerProducts : allProducts;
    }

    const list = user?.role === "provider" ? providerProducts : allProducts;

    return list.filter(
      (product) =>
        product.category === category || product.categoryId === category
    );
  };

  const value = {
    products: allProducts,
    loading: loadingAll,

    myProducts: getMyProducts(),
    providerLoading: loadingProvider,

    addProduct,
    deleteProduct,
    updateProduct,
    refreshProducts,

    loadAllProducts,
    loadProviderProducts,

    getProductById,
    getProductsByProvider,
    updateProductStock,
    searchProducts,
    filterProductsByCategory,

    userRole: user?.role,
    isProvider: user?.role === "provider",
    currentUserId: user?.id,
  };

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts debe usarse dentro de un ProductProvider");
  }
  return context;
};