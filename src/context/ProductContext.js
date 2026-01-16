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

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const formatProductFromSupabase = (product) => {
    return {
      id: product.id,
      providerId: product.provider_id,
      name: product.name,
      price: parseFloat(product.price),
      description: product.description || "",
      images: product.images || [],
      stock: product.stock || 0,
      category: product.category_id || "other",
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      isActive: product.is_active || true,
      discountPrice: product.discount_price
        ? parseFloat(product.discount_price)
        : null,
      rating: product.rating || 0,
      reviewsCount: product.reviews_count || 0,
      providerName: product.provider?.name || "Proveedor",
      delivery: "Envío gratis",
      isNew: product.created_at
        ? new Date(product.created_at) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : false,
    };
  };

  const formatProductToSupabase = async (product) => {
    try {
      const categoryId = await getCategoryId(product.category);
      
      if (!categoryId) {
        console.error("Categoría no encontrada:", product.category);
        throw new Error(`Categoría "${product.category}" no encontrada`);
      }
      
      return {
        provider_id: product.providerId,
        name: product.name.trim(),
        description: product.description.trim() || null,
        price: parseFloat(product.price),
        discount_price: product.discountPrice
          ? parseFloat(product.discountPrice)
          : null,
        category_id: categoryId,
        images: product.images && product.images.length > 0 ? product.images : null,
        stock: parseInt(product.stock) || 10,
        is_active: product.isActive !== undefined ? product.isActive : true,
      };
    } catch (error) {
      console.error("Error en formatProductToSupabase:", error);
      throw error;
    }
  };

  const loadAllProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from("products")
        .select(
          `
          *,
          provider:users(name)
        `
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (supabaseError) {
        console.error("Error cargando productos:", supabaseError);
        setError(supabaseError.message);
        setProducts([]);
        return [];
      }

      const formattedProducts = (data || []).map(formatProductFromSupabase);
      setProducts(formattedProducts);
      return formattedProducts;
    } catch (error) {
      console.error("Error en loadAllProducts:", error);
      setError(error.message);
      setProducts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProviderProducts = useCallback(async (providerId) => {
    if (!providerId) {
      setProducts([]);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Cargando productos para provider_id:", providerId);

      const { data, error: supabaseError } = await supabase
        .from("products")
        .select("*")
        .eq("provider_id", providerId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (supabaseError) {
        console.error("Error cargando productos del proveedor:", supabaseError);
        setError(supabaseError.message);
        setProducts([]);
        return [];
      }

      console.log(`Productos cargados: ${data?.length || 0}`);
      const formattedProducts = (data || []).map(formatProductFromSupabase);
      setProducts(formattedProducts);
      return formattedProducts;
    } catch (error) {
      console.error("Error en loadProviderProducts:", error);
      setError(error.message);
      setProducts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      if (!user) {
        setProducts([]);
        return;
      }

      console.log("Cargando productos para usuario:", user.id, user.role);

      if (user.role === "provider") {
        await loadProviderProducts(user.id);
      } else {
        await loadAllProducts();
      }
    };

    loadProducts();
  }, [user]);

  const addProduct = async (productData) => {
    try {
      setError(null);

      console.log("Intentando agregar producto...");
      console.log("Usuario actual:", user);

      if (!user?.id) {
        throw new Error("Usuario no autenticado. Por favor inicia sesión.");
      }

      const { data: userCheck, error: userError } = await supabase
        .from("users")
        .select("id, auth_id")
        .eq("id", user.id)
        .maybeSingle();

      if (userError || !userCheck) {
        console.error("Usuario no válido en tabla users:", userError);
        throw new Error("Usuario no válido. Por favor cierra sesión y vuelve a entrar.");
      }

      console.log("Usuario verificado:", userCheck.id);

      const finalProductData = {
        ...productData,
        providerId: user.id,
      };

      console.log("Datos del producto:", finalProductData);

      const productForSupabase = await formatProductToSupabase(finalProductData);

      console.log("Creando producto en Supabase:", {
        ...productForSupabase,
        provider_id: user.id
      });

      const { data, error: supabaseError } = await supabase
        .from("products")
        .insert([productForSupabase])
        .select()
        .single();

      if (supabaseError) {
        console.error("Error agregando producto:", supabaseError);
        
        if (supabaseError.code === "23503" && supabaseError.message.includes("provider_id")) {
          throw new Error(`Error: El usuario con ID ${user.id} no existe en la tabla users. Por favor cierra sesión y vuelve a entrar.`);
        }
        
        setError(supabaseError.message);
        return {
          success: false,
          error: supabaseError.message,
          message: "Error al crear producto",
        };
      }

      if (!data) {
        throw new Error("No se recibió respuesta del servidor");
      }

      const newProduct = formatProductFromSupabase(data);
      setProducts((prev) => [newProduct, ...prev]);

      return {
        success: true,
        product: newProduct,
        message: "Producto creado exitosamente",
      };
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

      const { data, error: supabaseError } = await supabase
        .from("products")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .select()
        .single();

      if (supabaseError) {
        console.error("Error eliminando producto:", supabaseError);
        setError(supabaseError.message);
        return {
          success: false,
          error: supabaseError.message,
        };
      }

      setProducts((prev) => prev.filter((product) => product.id !== productId));

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

  const updateProduct = async (updatedProduct) => {
    try {
      setError(null);

      const { id, ...updates } = updatedProduct;
      const productForSupabase = await formatProductToSupabase(updates);

      const { data, error: supabaseError } = await supabase
        .from("products")
        .update({
          ...productForSupabase,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (supabaseError) {
        console.error("Error actualizando producto:", supabaseError);
        setError(supabaseError.message);
        return {
          success: false,
          error: supabaseError.message,
        };
      }

      const formattedProduct = formatProductFromSupabase(data);
      setProducts((prev) =>
        prev.map((product) => (product.id === id ? formattedProduct : product))
      );

      return {
        success: true,
        product: formattedProduct,
        message: "Producto actualizado correctamente",
      };
    } catch (error) {
      console.error("Error en updateProduct:", error);
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
    if (!user?.id) return [];
    return products.filter((p) => p.providerId === user.id);
  };

  const value = {
    products,
    loading,
    error,
    myProducts: getMyProducts(),
    addProduct,
    deleteProduct,
    updateProduct,
    refreshProducts,
    loadAllProducts,
    loadProviderProducts,
    userRole: user?.role,
    isProvider: user?.role === "provider",
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