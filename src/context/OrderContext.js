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

    console.log("Cargando pedidos para usuario:", {
      userRole: user.role,
      userId: user.id,
      email: user.email,
    });

    setLoading(true);
    setError(null);

    try {
      if (user.role === "client") {
        console.log("Buscando pedidos como CLIENTE...");

        // CONSULTA SIMPLIFICADA
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false });

        console.log("RESULTADO CONSULTA ORDERS:", {
          ordersDataCount: ordersData?.length,
          ordersData: ordersData,
          error: ordersError,
        });

        if (ordersError) {
          console.error("Error en consulta orders:", ordersError);
          throw ordersError;
        }

        if (!ordersData || ordersData.length === 0) {
          console.log("No hay pedidos para este cliente");
          setClientOrders([]);
          setLoading(false);
          return;
        }

        // OBTENER ITEMS POR SEPARADO CON TODOS LOS CAMPOS DEL PRODUCTO
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            try {
              // Obtener items de este pedido CON TODOS LOS CAMPOS DEL PRODUCTO
              const { data: itemsData, error: itemsError } = await supabase
                .from("order_items")
                .select(
                  `
                  *,
                  products (
                    id,
                    name,
                    description,
                    price,
                    discount_price,
                    images,
                    stock,
                    provider_id,
                    category_id,
                    is_active,
                    created_at,
                    updated_at
                  )
                `,
                )
                .eq("order_id", order.id);

              console.log(`Items para orden ${order.id}:`, {
                itemsCount: itemsData?.length,
                itemsData: itemsData,
                error: itemsError,
              });

              if (itemsError) {
                console.error(
                  `Error items para orden ${order.id}:`,
                  itemsError,
                );
              }

              // Depurar el primer producto para ver qué datos vienen
              if (itemsData && itemsData.length > 0 && itemsData[0].product) {
                console.log("Primer producto encontrado:", {
                  productName: itemsData[0].product.name,
                  productImages: itemsData[0].product.images,
                  productPrice: itemsData[0].product.price,
                  tieneProducto: !!itemsData[0].product,
                });
              }

              // Obtener info del proveedor
              let providerInfo = null;
              if (order.provider_id) {
                const { data: providerData } = await supabase
                  .from("users")
                  .select("name, email, phone")
                  .eq("id", order.provider_id)
                  .single();

                providerInfo = providerData;
              }

              return {
                ...order,
                items: itemsData || [],
                orderNumber: order.order_number,
                orderId: order.order_number || order.id,
                total: parseFloat(order.total) || 0,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                provider: providerInfo,
              };
            } catch (itemError) {
              console.error(`Error procesando orden ${order.id}:`, itemError);
              return {
                ...order,
                items: [],
                orderNumber: order.order_number,
                orderId: order.order_number || order.id,
                total: parseFloat(order.total) || 0,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                provider: null,
              };
            }
          }),
        );

        console.log("Pedidos procesados:", {
          total: ordersWithItems.length,
          primerPedido: ordersWithItems[0],
          tieneItems: ordersWithItems[0]?.items?.length || 0,
        });

        // Verificar estructura de datos
        if (
          ordersWithItems.length > 0 &&
          ordersWithItems[0].items?.length > 0
        ) {
          console.log("Estructura de datos del primer item:", {
            item: ordersWithItems[0].items[0],
            tieneProducto: !!ordersWithItems[0].items[0].product,
            productName: ordersWithItems[0].items[0].product?.name,
            productImages: ordersWithItems[0].items[0].product?.images,
          });
        }

        setClientOrders(ordersWithItems);
      } else if (user.role === "provider") {
        console.log("Buscando pedidos como PROVEEDOR...");

        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false });

        console.log("RESULTADO CONSULTA ORDERS PROVEEDOR:", {
          ordersDataCount: ordersData?.length,
          error: ordersError,
        });

        if (ordersError) throw ordersError;

        if (!ordersData || ordersData.length === 0) {
          console.log("No hay pedidos para este proveedor");
          setProviderOrders([]);
          setLoading(false);
          return;
        }

        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            try {
              // Obtener items con todos los campos del producto
              const { data: itemsData } = await supabase
                .from("order_items")
                .select(
                  `
                  *,
                  products (
                    id,
                    name,
                    description,
                    price,
                    discount_price,
                    images,
                    stock,
                    provider_id,
                    category_id,
                    is_active,
                    created_at,
                    updated_at
                  )
                `,
                )
                .eq("order_id", order.id);

              // Obtener info del cliente
              let clientInfo = null;
              if (order.client_id) {
                const { data: clientData } = await supabase
                  .from("users")
                  .select("name, email, phone, address")
                  .eq("id", order.client_id)
                  .single();

                clientInfo = clientData;
              }

              return {
                ...order,
                items: itemsData || [],
                orderNumber: order.order_number,
                orderId: order.order_number || order.id,
                total: parseFloat(order.total) || 0,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                client: clientInfo,
              };
            } catch (error) {
              console.error(`Error procesando orden ${order.id}:`, error);
              return {
                ...order,
                items: [],
                orderNumber: order.order_number,
                orderId: order.order_number || order.id,
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
      console.error("Error cargando pedidos:", err);
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

    console.log("Suscribiéndose a cambios en pedidos...");

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
          console.log("Cambio en pedidos detectado:", payload);
          loadOrders();
        },
      )
      .subscribe((status) => {
        console.log(`Estado suscripción: ${status}`);
      });

    return () => {
      console.log("Desuscribiendo de pedidos");
      supabase.removeChannel(channel);
    };
  };

  const createOrder = async (orderData, items) => {
    try {
      console.log("Creando pedido con datos:", {
        orderData,
        itemsCount: items.length,
        items: items,
      });

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error("Error creando orden:", orderError);
        throw orderError;
      }

      console.log("Pedido creado:", order.id);

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity || 1,
        unit_price: item.price,
      }));

      console.log("Creando items:", orderItems.length);

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Error creando items:", itemsError);
        throw itemsError;
      }

      console.log("Items creados");

      for (const item of items) {
        const currentStock = item.stock || 0;
        const quantity = item.quantity || 1;
        const newStock = Math.max(0, currentStock - quantity);

        const { error: stockError } = await supabase
          .from("products")
          .update({
            stock: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (stockError) {
          console.error(
            `Error reduciendo stock producto ${item.id}:`,
            stockError,
          );
        } else {
          console.log(
            `Stock actualizado: ${item.id} = ${currentStock} → ${newStock}`,
          );
        }
      }

      await loadOrders();

      return {
        success: true,
        order,
        message: "Pedido creado exitosamente",
      };
    } catch (error) {
      console.error("Error creando pedido:", error);
      return {
        success: false,
        error: error.message || "Error desconocido al crear pedido",
      };
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      console.log("Actualizando estado:", { orderId, status });

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
      console.error("Error actualizando estado:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  const cancelOrder = async (orderId, reason = "") => {
    try {
      console.log("Cancelando pedido:", { orderId, reason });

      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (fetchError) throw new Error("Pedido no encontrado");

      const now = new Date();
      const cancelableUntil = new Date(order.cancelable_until);

      if (now > cancelableUntil) {
        throw new Error("El tiempo para cancelar ha expirado (15 horas)");
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
              console.error(`Error restaurando stock ${item.product_id}:`, err);
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
      console.error("Error cancelando pedido:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  const getOrderById = async (orderId) => {
    try {
      console.log("Obteniendo pedido por ID:", orderId);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      // Obtener items con todos los campos del producto
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select(
          `
          *,
          products (
            id,
            name,
            description,
            price,
            discount_price,
            images,
            stock,
            provider_id,
            category_id,
            is_active,
            created_at,
            updated_at
          )
        `,
        )
        .eq("order_id", orderId);

      if (itemsError) {
        console.error("Error obteniendo items:", itemsError);
      }

      let clientInfo = null;
      let providerInfo = null;

      if (order.client_id) {
        const { data: clientData } = await supabase
          .from("users")
          .select("*")
          .eq("id", order.client_id)
          .single()
          .catch(() => null);

        clientInfo = clientData;
      }

      if (order.provider_id) {
        const { data: providerData } = await supabase
          .from("users")
          .select("*")
          .eq("id", order.provider_id)
          .single()
          .catch(() => null);

        providerInfo = providerData;
      }

      return {
        success: true,
        order: {
          ...order,
          items: items || [],
          client: clientInfo,
          provider: providerInfo,
          orderNumber: order.order_number,
          total: parseFloat(order.total) || 0,
        },
      };
    } catch (error) {
      console.error("Error obteniendo pedido:", error);
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
