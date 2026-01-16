// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../utils/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  const fetchUserProfile = async (authUserId) => {
    try {
      if (!authUserId) {
        setUser(null);
        return null;
      }

      console.log("Buscando perfil para auth_id:", authUserId);

      let { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUserId)
        .maybeSingle();

      if (error) {
        console.error("Error buscando perfil por auth_id:", error);
        const { data: profileById } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUserId)
          .maybeSingle();
        profile = profileById;
      }

      if (!profile) {
        console.log("Usuario no encontrado, creando nuevo perfil...");
        
        const { data: authUser } = await supabase.auth.getUser();
        
        if (authUser?.user) {
          const newUserData = {
            auth_id: authUser.user.id,
            email: authUser.user.email,
            name: authUser.user.user_metadata?.name || authUser.user.email?.split("@")[0],
            role: authUser.user.user_metadata?.role || "client",
          };

          console.log("Creando usuario con datos:", newUserData);

          const { data: newProfile, error: createError } = await supabase
            .from("users")
            .insert([newUserData])
            .select()
            .single();

          if (createError) {
            console.error("Error creando usuario:", createError);
            throw createError;
          }

          if (newProfile) {
            console.log("Usuario creado exitosamente:", newProfile.id);
            setUser(newProfile);
            return newProfile;
          }
        }
      } else {
        if (!profile.auth_id) {
          console.log("Actualizando usuario con auth_id...");
          const { error: updateError } = await supabase
            .from("users")
            .update({ auth_id: authUserId })
            .eq("id", profile.id);

          if (updateError) {
            console.error("Error actualizando auth_id:", updateError);
          }
        }

        console.log("Usuario encontrado:", profile.id);
        setUser(profile);
        return profile;
      }

      return null;
    } catch (error) {
      console.error("Error en fetchUserProfile:", error);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event);
      setSession(newSession);

      if (newSession?.user) {
        await fetchUserProfile(newSession.user.id);
      } else {
        setUser(null);
        setCart([]);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, name, role = "client") => {
    try {
      setLoading(true);

      console.log("Registrando usuario:", { email, name, role });

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

      if (!authData.user?.confirmed_at) {
        return {
          success: true,
          message: "Registro exitoso! Por favor verifica tu email.",
          needsEmailVerification: true,
        };
      }

      console.log("Creando usuario en tabla users...");
      const newUserData = {
        auth_id: authData.user.id,
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
        console.error("Error creando usuario en tabla:", userError);
        
        setTimeout(() => fetchUserProfile(authData.user.id), 1000);
        
        throw new Error("Error completando registro. Por favor intenta iniciar sesión.");
      }

      console.log("Usuario creado en tabla:", userData.id);
      setUser(userData);

      return {
        success: true,
        message: "Registro completado exitosamente!",
        user: userData,
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

  const signIn = async (email, password) => {
    try {
      setLoading(true);

      console.log("Intentando login para:", email);

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

      console.log("Login exitoso, buscando perfil...");
      
      const profile = await fetchUserProfile(data.user.id);
      
      if (!profile) {
        console.warn("No se pudo obtener/crear perfil, usando datos básicos");
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
          role: data.user.user_metadata?.role || "client",
        });
      }

      return {
        success: true,
        message: "Inicio de sesión exitoso!",
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

  const logout = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error cerrando sesión en Supabase:", error);
        throw error;
      }

      setUser(null);
      setSession(null);
      setCart([]);

      console.log("Sesión cerrada exitosamente");
      return { success: true };
    } catch (error) {
      console.error("Error en logout:", error);
      return {
        success: false,
        error: error.message || "Error al cerrar sesión",
      };
    } finally {
      setLoading(false);
    }
  };

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

  const migrateUser = async () => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser?.user) return { success: false, error: "No autenticado" };

      console.log("Migrando usuario:", authUser.user.id);
      
      const { data: existing } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authUser.user.id)
        .maybeSingle();

      if (existing) {
        return { success: true, message: "Usuario ya migrado", user: existing };
      }

      const newUserData = {
        auth_id: authUser.user.id,
        email: authUser.user.email,
        name: authUser.user.user_metadata?.name || authUser.user.email?.split("@")[0],
        role: authUser.user.user_metadata?.role || "client",
      };

      const { data: newUser, error } = await supabase
        .from("users")
        .insert([newUserData])
        .select()
        .single();

      if (error) throw error;

      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      console.error("Error migrando usuario:", error);
      return { success: false, error: error.message };
    }
  };

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

  const value = {
    user,
    session,
    loading,
    cart,
    cartTotal,
    cartCount,
    signUp,
    signIn,
    logout,
    updateProfile,
    migrateUser,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
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