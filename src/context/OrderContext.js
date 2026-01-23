import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../utils/supabase";

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const { user } = useAuth();
  const [clientOrders, setClientOrders] = useState([]);
  const [providerOrders, setProviderOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadOrders();
    subscribeToOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    console.log("📦 Cargando pedidos para usuario:", {
      userRole: user.role,
      userId: user.id,
      email: user.email,
    });

    setLoading(true);
    setError(null);

    try {
      if (user.role === "client") {
        console.log("🛒 Buscando pedidos como CLIENTE...");

        // Consulta de órdenes del cliente
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false });

        if (ordersError) {
          console.error("❌ Error en consulta orders:", ordersError);
          throw ordersError;
        }

        if (!ordersData || ordersData.length === 0) {
          console.log("📭 No hay pedidos para este cliente");
          setClientOrders([]);
          setLoading(false);
          return;
        }

        console.log(`✅ Encontradas ${ordersData.length} órdenes`);

        // Procesar cada orden para obtener items y productos
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            try {
              // CONSULTA CORREGIDA: Usamos la relación correcta
              const { data: itemsData, error: itemsError } = await supabase
                .from("order_items")
                .select(
                  `
                  id,
                  order_id,
                  product_id,
                  quantity,
                  unit_price,
                  subtotal,
                  created_at,
                  products!inner (
                    id,
                    name,
                    description,
                    price,
                    discount_price,
                    images,
                    stock,
                    provider_id,
                    category_id,
                    is_active
                  )
                `,
                )
                .eq("order_id", order.id);

              if (itemsError) {
                console.error(
                  `❌ Error items para orden ${order.id}:`,
                  itemsError,
                );
              }

              console.log(`📋 Orden ${order.id}:`, {
                itemsCount: itemsData?.length,
                primerProducto: itemsData?.[0]?.products?.name,
                tieneProducto: itemsData?.[0]?.products !== undefined,
              });

              // Obtener información del proveedor SOLO si existe provider_id
              let providerInfo = null;
              if (order.provider_id) {
                try {
                  const { data: providerData, error: providerError } =
                    await supabase
                      .from("users")
                      .select("id, name, email, phone, avatar_url")
                      .eq("id", order.provider_id)
                      .single();

                  if (providerError) {
                    console.log(
                      `ℹ️ No se encontró proveedor ${order.provider_id}:`,
                      providerError.message,
                    );
                  } else {
                    providerInfo = providerData;
                  }
                } catch (providerErr) {
                  console.log(
                    `ℹ️ Error obteniendo proveedor ${order.provider_id}:`,
                    providerErr.message,
                  );
                }
              }

              // Procesar items para aplanar la estructura del producto
              const processedItems = (itemsData || []).map((item) => {
                // El producto está anidado como 'products' (debido al !inner)
                const product = item.products || {};

                return {
                  ...item,
                  product: {
                    id: product.id || item.product_id,
                    name: product.name || "Producto sin nombre",
                    description: product.description || "",
                    price: product.price || item.unit_price || 0,
                    discount_price: product.discount_price || null,
                    images: product.images || [],
                    stock: product.stock || 0,
                    provider_id: product.provider_id,
                    category_id: product.category_id,
                    is_active: product.is_active,
                  },
                };
              });

              console.log(`✅ Orden ${order.id} procesada:`, {
                itemsProcesados: processedItems.length,
                primerProducto: processedItems[0]?.product?.name,
              });

              return {
                ...order,
                items: processedItems,
                orderNumber: order.order_number,
                total: parseFloat(order.total) || 0,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                provider: providerInfo,
              };
            } catch (itemError) {
              console.error(
                `⚠️ Error procesando orden ${order.id}:`,
                itemError,
              );
              return {
                ...order,
                items: [],
                orderNumber: order.order_number,
                total: parseFloat(order.total) || 0,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                provider: null,
              };
            }
          }),
        );

        console.log("📊 Pedidos procesados:", {
          total: ordersWithItems.length,
          primerPedido: {
            id: ordersWithItems[0]?.id,
            items: ordersWithItems[0]?.items?.length,
            primerItem: ordersWithItems[0]?.items?.[0],
          },
        });

        setClientOrders(ordersWithItems);
      } else if (user.role === "provider") {
        console.log("🏪 Buscando pedidos como PROVEEDOR...");

        // Consulta de órdenes del proveedor
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;

        if (!ordersData || ordersData.length === 0) {
          console.log("📭 No hay pedidos para este proveedor");
          setProviderOrders([]);
          setLoading(false);
          return;
        }

        // Procesar órdenes del proveedor
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            try {
              // Consulta de items para proveedor
              const { data: itemsData } = await supabase
                .from("order_items")
                .select(
                  `
                  id,
                  order_id,
                  product_id,
                  quantity,
                  unit_price,
                  subtotal,
                  created_at,
                  products!inner (
                    id,
                    name,
                    description,
                    price,
                    discount_price,
                    images,
                    stock
                  )
                `,
                )
                .eq("order_id", order.id);

              // Obtener información del cliente
              let clientInfo = null;
              if (order.client_id) {
                try {
                  const { data: clientData } = await supabase
                    .from("users")
                    .select("id, name, email, phone, address")
                    .eq("id", order.client_id)
                    .single();
                  clientInfo = clientData;
                } catch (err) {
                  console.log(
                    `ℹ️ Error obteniendo cliente ${order.client_id}:`,
                    err.message,
                  );
                }
              }

              // Procesar items
              const processedItems = (itemsData || []).map((item) => {
                const product = item.products || {};

                return {
                  ...item,
                  product: {
                    id: product.id || item.product_id,
                    name: product.name || "Producto sin nombre",
                    description: product.description || "",
                    price: product.price || item.unit_price || 0,
                    discount_price: product.discount_price || null,
                    images: product.images || [],
                    stock: product.stock || 0,
                  },
                };
              });

              return {
                ...order,
                items: processedItems,
                orderNumber: order.order_number,
                total: parseFloat(order.total) || 0,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                client: clientInfo,
              };
            } catch (error) {
              console.error(`⚠️ Error procesando orden ${order.id}:`, error);
              return {
                ...order,
                items: [],
                orderNumber: order.order_number,
                total: parseFloat(order.total) || 0,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
              };
            }
          }),
        );

        setProviderOrders(ordersWithItems);
      }
    } catch (err) {
      console.error("❌ Error cargando pedidos:", err);
      setError(err.message);

      if (user?.role === "client") {
        setClientOrders([]);
      } else if (user?.role === "provider") {
        setProviderOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const subscribeToOrders = () => {
    if (!user) return;

    console.log("🔔 Suscribiéndose a cambios en pedidos...");

    const channel = supabase
      .channel(`orders-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter:
            user.role === "provider"
              ? `provider_id=eq.${user.id}`
              : `client_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("🔄 Cambio en pedidos detectado:", payload.eventType);
          loadOrders();
        },
      )
      .subscribe((status) => {
        console.log(`📡 Estado suscripción: ${status}`);
      });

    return () => {
      console.log("🔕 Desuscribiendo de pedidos");
      supabase.removeChannel(channel);
    };
  };

  const createOrder = async (orderData, items) => {
    try {
      console.log("🛍️ CREANDO PEDIDO =========================");
      console.log("📦 Datos del pedido:", {
        client_id: orderData.client_id,
        provider_id: orderData.provider_id,
        total: orderData.total,
        itemsCount: items.length,
      });

      console.log(
        "📋 Items recibidos:",
        items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          provider_id: item.provider_id,
          stock: item.stock,
        })),
      );

      // 1. Crear el pedido
      console.log("⚙️ Creando registro en tabla 'orders'...");
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error("❌ Error creando orden:", orderError);
        throw orderError;
      }

      console.log("✅ Pedido creado:", order.id);

      // 2. Crear TODOS los items del pedido SIN subtotal (lo calculará PostgreSQL automáticamente)
      console.log("📝 Creando items en 'order_items'...");
      const orderItems = items.map((item) => {
        const quantity = item.quantity || 1;
        const price = item.price || 0;

        // SOLO insertamos las columnas que NO son generadas
        // PostgreSQL calculará automáticamente subtotal = quantity * unit_price
        return {
          order_id: order.id,
          product_id: item.id,
          quantity: quantity,
          unit_price: price,
          // NO incluir subtotal - PostgreSQL lo calculará automáticamente
        };
      });

      console.log(
        `📦 ${orderItems.length} items a crear (sin subtotal, será calculado automáticamente):`,
        orderItems,
      );

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("❌ Error creando items:", itemsError);
        throw itemsError;
      }

      console.log(
        `✅ ${orderItems.length} items creados para pedido ${order.id}`,
      );

      // 3. Actualizar stock de TODOS los productos
      console.log("📊 Actualizando stock de productos...");
      for (const item of items) {
        const currentStock = item.stock || 0;
        const quantity = item.quantity || 1;
        const newStock = Math.max(0, currentStock - quantity);

        console.log(
          `   Producto ${item.id}: ${currentStock} → ${newStock} (-${quantity})`,
        );

        const { error: stockError } = await supabase
          .from("products")
          .update({
            stock: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (stockError) {
          console.error(
            `⚠️ Error reduciendo stock producto ${item.id}:`,
            stockError,
          );
        }
      }

      // 4. Verificar total
      const calculatedTotal = items.reduce((sum, item) => {
        return sum + (item.price || 0) * (item.quantity || 1);
      }, 0);

      console.log("💰 Total verificado:", {
        calculado: calculatedTotal,
        enOrderData: orderData.total,
        diferencia: Math.abs(calculatedTotal - orderData.total),
      });

      // Si hay discrepancia, actualizar el total
      if (Math.abs(calculatedTotal - orderData.total) > 0.01) {
        console.log("🔄 Actualizando total en la orden...");
        const { error: updateError } = await supabase
          .from("orders")
          .update({ total: calculatedTotal })
          .eq("id", order.id);

        if (updateError) {
          console.error("❌ Error actualizando total:", updateError);
        } else {
          console.log("✅ Total actualizado:", calculatedTotal);
        }
      }

      // 5. Recargar los pedidos
      console.log("🔄 Recargando lista de pedidos...");
      await loadOrders();

      console.log("🎉 PEDIDO CREADO EXITOSAMENTE =============");
      return {
        success: true,
        order: { ...order, total: calculatedTotal || orderData.total },
        message: `Pedido creado exitosamente con ${items.length} productos`,
      };
    } catch (error) {
      console.error("❌ Error creando pedido:", error);
      return {
        success: false,
        error: error.message || "Error desconocido al crear pedido",
      };
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      await loadOrders();

      return {
        success: true,
        order: data,
        message: `Estado actualizado a: ${status}`,
      };
    } catch (error) {
      console.error("❌ Error actualizando estado:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  const cancelOrder = async (orderId, reason = "") => {
    try {
      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (fetchError) throw new Error("Pedido no encontrado");

      const now = new Date();
      const cancelableUntil = new Date(order.cancelable_until || now);

      if (now > cancelableUntil) {
        throw new Error("El tiempo para cancelar ha expirado");
      }

      if (!["pending", "paid"].includes(order.status)) {
        throw new Error("Solo puedes cancelar pedidos pendientes o pagados");
      }

      const { data, error } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      // Restaurar stock
      const { data: items } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId);

      if (items && items.length > 0) {
        for (const item of items) {
          await supabase
            .from("products")
            .update({
              stock: supabase.raw("stock + ?", [item.quantity]),
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.product_id)
            .catch((err) => {
              console.error(
                `❌ Error restaurando stock ${item.product_id}:`,
                err,
              );
            });
        }
      }

      await loadOrders();

      return {
        success: true,
        order: data,
        message: "Pedido cancelado exitosamente",
      };
    } catch (error) {
      console.error("❌ Error cancelando pedido:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  const getOrderById = async (orderId) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select(
          `
          id,
          order_id,
          product_id,
          quantity,
          unit_price,
          subtotal,
          created_at,
          products!inner (
            id,
            name,
            description,
            price,
            discount_price,
            images,
            stock
          )
        `,
        )
        .eq("order_id", orderId);

      let clientInfo = null;
      let providerInfo = null;

      if (order.client_id) {
        try {
          const { data: clientData } = await supabase
            .from("users")
            .select("*")
            .eq("id", order.client_id)
            .single();
          clientInfo = clientData;
        } catch (err) {
          console.log(`ℹ️ Error obteniendo cliente:`, err.message);
        }
      }

      if (order.provider_id) {
        try {
          const { data: providerData } = await supabase
            .from("users")
            .select("*")
            .eq("id", order.provider_id)
            .single();
          providerInfo = providerData;
        } catch (err) {
          console.log(`ℹ️ Error obteniendo proveedor:`, err.message);
        }
      }

      // Procesar items
      const processedItems = (items || []).map((item) => {
        const product = item.products || {};

        return {
          ...item,
          product: {
            id: product.id || item.product_id,
            name: product.name || "Producto sin nombre",
            description: product.description || "",
            price: product.price || item.unit_price || 0,
            discount_price: product.discount_price || null,
            images: product.images || [],
            stock: product.stock || 0,
          },
        };
      });

      return {
        success: true,
        order: {
          ...order,
          items: processedItems,
          client: clientInfo,
          provider: providerInfo,
          orderNumber: order.order_number,
          total: parseFloat(order.total) || 0,
        },
      };
    } catch (error) {
      console.error("❌ Error obteniendo pedido:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  const value = {
    clientOrders,
    providerOrders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getOrderById,
    refreshOrders: loadOrders,
    isProvider: user?.role === "provider",
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders debe ser usado dentro de OrderProvider");
  }
  return context;
};
