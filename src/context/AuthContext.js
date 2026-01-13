// src/context/AuthContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import { supabase } from "../utils/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  // Función para obtener perfil de usuario
  const fetchUserProfile = async (userId) => {
    try {
      if (!userId) {
        setUser(null);
        return null;
      }

      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error obteniendo perfil:", error);
        setUser(null);
        return null;
      }

      if (profile) {
        setUser(profile);
        return profile;
      }

      return null;
    } catch (error) {
      console.error("Error en fetchUserProfile:", error);
      setUser(null);
      return null;
    }
  };

  // Inicializar autenticación
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Obtener sesión actual
        const { data: { session: currentSession }, error } = 
          await supabase.auth.getSession();

        if (error) {
          console.error("Error obteniendo sesión:", error);
          setUser(null);
          setSession(null);
          return;
        }

        setSession(currentSession);

        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error inicializando auth:", error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Escuchar cambios en autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);

        if (newSession?.user) {
          await fetchUserProfile(newSession.user.id);
        } else {
          setUser(null);
          setCart([]);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Registro
  const signUp = async (email, password, name, role = "client") => {
    try {
      setLoading(true);

      // Registrar en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: role,
          },
        },
      });

      if (authError) {
        let errorMessage = "Error en el registro";
        if (authError.message.includes("User already registered")) {
          errorMessage = "Este email ya está registrado";
        } else if (authError.message.includes("Password")) {
          errorMessage = "La contraseña debe tener al menos 6 caracteres";
        }
        throw new Error(errorMessage);
      }

      // Si el registro requiere confirmación de email
      if (!authData.user?.confirmed_at) {
        return {
          success: true,
          message: "¡Registro exitoso! Por favor verifica tu email.",
          needsEmailVerification: true,
        };
      }

      // Si el email ya estaba verificado, crear perfil automáticamente
      const newUserData = {
        id: authData.user.id,
        email: email,
        name: name,
        role: role,
      };

      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert([newUserData])
        .select()
        .single();

      if (userError) {
        console.warn("No se pudo crear perfil:", userError);
      } else {
        setUser(userData);
      }

      return {
        success: true,
        message: "¡Registro completado exitosamente!",
        user: userData || newUserData,
      };
    } catch (error) {
      console.error("Error en signUp:", error);
      return {
        success: false,
        error: error.message || "Error en el registro",
      };
    } finally {
      setLoading(false);
    }
  };

  // Login
  const signIn = async (email, password) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let errorMessage = "Credenciales incorrectas";
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email o contraseña incorrectos";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Por favor confirma tu email antes de iniciar sesión";
        } else if (error.message.includes("User not found")) {
          errorMessage = "No existe una cuenta con este email";
        }
        throw new Error(errorMessage);
      }

      // Obtener perfil del usuario
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

      setUser(profile || {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
        role: data.user.user_metadata?.role || "client",
      });

      return {
        success: true,
        message: "¡Inicio de sesión exitoso!",
      };
    } catch (error) {
      console.error("Error en signIn:", error);
      return {
        success: false,
        error: error.message || "Error en el inicio de sesión",
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setCart([]);
      return { success: true };
    } catch (error) {
      console.error("Error en logout:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar perfil
  const updateProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setUser(data);
      return { success: true, user: data };
    } catch (error) {
      console.error("Error en updateProfile:", error);
      return { success: false, error: error.message };
    }
  };

  // Funciones del carrito
  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) =>
    setCart((prev) => prev.filter((item) => item.id !== productId));

  const updateQuantity = (productId, amount) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newQty = item.quantity + amount;
          return { ...item, quantity: newQty > 0 ? newQty : 1 };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Valor del contexto
  const value = {
    // Estado
    user,
    session,
    loading,
    cart,
    cartTotal,
    cartCount,

    // Autenticación
    signUp,
    signIn,
    logout,
    updateProfile,

    // Carrito
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,

    // Utilitarios
    isAuthenticated: !!user,
    userRole: user?.role || "guest",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider");
  }
  return context;
};