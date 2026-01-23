// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { Alert } from "react-native";
import { supabase } from "../utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem("cart");
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
      } catch (error) {
        console.error("Error cargando carrito desde AsyncStorage:", error);
      }
    };
    loadCart();
  }, []);

  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem("cart", JSON.stringify(cart));
      } catch (error) {
        console.error("Error guardando carrito en AsyncStorage:", error);
      }
    };
    if (cart.length > 0) {
      saveCart();
    }
  }, [cart]);

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
            name:
              authUser.user.user_metadata?.name ||
              authUser.user.email?.split("@")[0],
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

            await AsyncStorage.setItem("user", JSON.stringify(newProfile));

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

        await AsyncStorage.setItem("user", JSON.stringify(profile));

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

        throw new Error(
          "Error completando registro. Por favor intenta iniciar sesión.",
        );
      }

      console.log("Usuario creado en tabla:", userData.id);
      setUser(userData);

      await AsyncStorage.setItem("user", JSON.stringify(userData));

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
        const basicUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
          role: data.user.user_metadata?.role || "client",
        };

        setUser(basicUser);
        await AsyncStorage.setItem("user", JSON.stringify(basicUser));
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

  const updateProfile = async (updates) => {
    try {
      console.log("Actualizando perfil con datos:", updates);
      setLoading(true);

      if (!user) {
        throw new Error("No hay usuario autenticado");
      }

      if (!updates || Object.keys(updates).length === 0) {
        throw new Error("No hay datos para actualizar");
      }

      const { data, error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error actualizando perfil en Supabase:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No se recibió respuesta del servidor");
      }

      console.log("Perfil actualizado exitosamente:", data);

      const updatedUser = { ...user, ...data };
      setUser(updatedUser);

      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

      return {
        success: true,
        user: updatedUser,
        message: "Perfil actualizado correctamente",
      };
    } catch (error) {
      console.error("Error en updateProfile:", error);
      return {
        success: false,
        error: error.message || "Error al actualizar el perfil",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      console.log("Iniciando proceso de logout...");

      try {
        const { data: sessionCheck, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.warn("Error verificando sesión:", sessionError.message);
        } else if (!sessionCheck.session) {
          console.log(
            "No hay sesión activa en Supabase, limpiando datos locales...",
          );
        } else {
          console.log("Sesión activa encontrada, procediendo a cerrarla...");

          const { error: signOutError } = await supabase.auth.signOut();

          if (signOutError) {
            console.warn(
              "Advertencia al cerrar sesión en Supabase:",
              signOutError.message,
            );
            console.log("Continuando con limpieza local...");
          } else {
            console.log("Sesión cerrada exitosamente en Supabase");
          }
        }
      } catch (authError) {
        console.warn(
          "Error en verificación de sesión (continuando):",
          authError.message,
        );
      }

      console.log("Limpiando estado local...");
      setUser(null);
      setSession(null);

      try {
        await AsyncStorage.removeItem("user");
        console.log("AsyncStorage limpiado correctamente");
      } catch (storageError) {
        console.warn("Error limpiando AsyncStorage:", storageError.message);
      }

      console.log("Logout completado exitosamente");
      return {
        success: true,
        message: "Sesión cerrada correctamente",
      };
    } catch (error) {
      console.error("Error crítico en logout:", error);

      console.log("Limpiando datos locales después de error...");
      setUser(null);
      setSession(null);

      try {
        await AsyncStorage.removeItem("user");
      } catch (storageError) {
        console.warn("Error secundario limpiando storage:", storageError);
      }

      return {
        success: false,
        error: error.message || "Error técnico al cerrar sesión",
        message:
          "Los datos locales han sido limpiados, pero hubo un error técnico",
      };
    } finally {
      setLoading(false);
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
        name:
          authUser.user.user_metadata?.name ||
          authUser.user.email?.split("@")[0],
        role: authUser.user.user_metadata?.role || "client",
      };

      const { data: newUser, error } = await supabase
        .from("users")
        .insert([newUserData])
        .select()
        .single();

      if (error) throw error;

      setUser(newUser);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));

      return { success: true, user: newUser };
    } catch (error) {
      console.error("Error migrando usuario:", error);
      return { success: false, error: error.message };
    }
  };

  const addToCart = (product, quantity = 1) => {
    try {
      console.log("Agregando producto al carrito:", {
        id: product.id,
        name: product.name,
        provider_id: product.provider_id,
        providerId: product.providerId,
      });

      const providerId = product.provider_id || product.providerId;

      if (!providerId) {
        console.error("Producto sin provider_id:", product);
        Alert.alert(
          "Error",
          "No se pudo identificar el proveedor del producto. Intenta nuevamente.",
        );
        return;
      }

      setCart((prev) => {
        const exists = prev.find((item) => item.id === product.id);
        if (exists) {
          return prev.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  provider_id: providerId,
                }
              : item,
          );
        }

        const cartItem = {
          id: product.id,
          name: product.name,
          description: product.description,
          price: parseFloat(product.price) || 0,
          discount_price:
            product.discount_price || product.discountPrice || null,
          category_id: product.category_id,
          images: product.images || (product.image ? [product.image] : []),
          stock: product.stock || 0,
          quantity: quantity,
          provider_id: providerId,
          provider_name:
            product.provider_name || product.provider?.name || "Proveedor",
          created_at: product.created_at,
          updated_at: product.updated_at,
        };

        console.log(
          "Producto agregado al carrito con provider_id:",
          cartItem.provider_id,
        );
        return [...prev, cartItem];
      });
    } catch (error) {
      console.error("Error agregando al carrito:", error);
    }
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
      }),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
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
