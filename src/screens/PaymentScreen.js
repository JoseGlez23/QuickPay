import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useOrders } from "../context/OrderContext";
import { useStripe } from "@stripe/stripe-react-native";
import { supabase } from "../utils/supabase"; // Importar supabase para obtener provider_id

// CAMBIA ESTA URL CADA VEZ QUE REINICIES NGROK
const API_URL = "https://carolin-nonprovisional-correctly.ngrok-free.dev"; // ← ¡Pon aquí tu URL real de ngrok!

// Componente de input (sin cambios)
const CustomInput = React.memo(
  ({
    label,
    placeholder,
    value,
    onChangeText,
    keyboardType = "default",
    maxLength,
    theme,
    isProcessing,
    error,
  }) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.background,
            borderColor: error ? "#EF4444" : theme.border,
            color: theme.text,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary + "80"}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        editable={!isProcessing}
        selectionColor={theme.primary}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  ),
);

export default function PaymentScreen({ route, navigation }) {
  const { colors, isDarkMode } = useTheme();
  const { user, cart: cartFromAuth, cartTotal, clearCart } = useAuth();
  const { refreshOrders } = useOrders();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const cart = cartFromAuth || [];
  const total = cartTotal || 0;
  const totalConImpuestos = total * 1.15;

  const [form, setForm] = useState({
    cp: "",
    estado: "",
    municipio: "",
    localidad: "",
    colonia: "",
    nombre: user?.name || "",
    telefono: user?.phone || "",
    tipoDomicilio: "Residencial",
  });

  const [errors, setErrors] = useState({});
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enrichedCart, setEnrichedCart] = useState([]);

  // Enriquecer carrito con información de proveedor
  useEffect(() => {
    const enrichCartWithProviderInfo = async () => {
      if (cart.length === 0) {
        setEnrichedCart([]);
        return;
      }

      try {
        const enrichedItems = await Promise.all(
          cart.map(async (item) => {
            try {
              // Obtener información del producto desde Supabase
              const { data: productData, error } = await supabase
                .from("products")
                .select("provider_id, name, price, images, stock")
                .eq("id", item.id)
                .single();

              if (error) {
                console.error(`Error obteniendo producto ${item.id}:`, error);
                return {
                  ...item,
                  provider_id: item.provider_id || null,
                  price: item.price || 0,
                  name: item.name || "Producto",
                  images: item.images || [],
                };
              }

              return {
                ...item,
                provider_id: productData.provider_id,
                price: productData.price || item.price || 0,
                name: productData.name || item.name || "Producto",
                images: productData.images || item.images || [],
                stock: productData.stock || 0,
              };
            } catch (error) {
              console.error(`Error procesando producto ${item.id}:`, error);
              return {
                ...item,
                provider_id: item.provider_id || null,
                price: item.price || 0,
                name: item.name || "Producto",
                images: item.images || [],
                stock: 0,
              };
            }
          })
        );

        setEnrichedCart(enrichedItems);
      } catch (error) {
        console.error("Error enriqueciendo carrito:", error);
        setEnrichedCart(cart);
      }
    };

    enrichCartWithProviderInfo();
  }, [cart]);

  // Validación automática (sin loop infinito)
  const validateForm = useMemo(() => {
    const newErrors = {};

    if (!/^\d{5}$/.test(form.cp.trim()))
      newErrors.cp = "Código postal inválido (5 dígitos)";
    if (!/^\d{10}$/.test(form.telefono.trim()))
      newErrors.telefono = "Teléfono inválido (10 dígitos)";
    if (!form.estado.trim()) newErrors.estado = "Estado es requerido";
    if (!form.municipio.trim()) newErrors.municipio = "Municipio es requerido";
    if (!form.colonia.trim()) newErrors.colonia = "Colonia es requerida";
    if (!form.nombre.trim()) newErrors.nombre = "Nombre es requerido";
    if (!form.localidad.trim()) newErrors.localidad = "Localidad es requerida";

    return newErrors;
  }, [form]);

  useEffect(() => {
    setErrors(validateForm);
  }, [validateForm]);

  const updateFormField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = Object.keys(errors).length === 0;

  const handlePressContinuar = () => {
    if (cart.length === 0) {
      Alert.alert("Carrito vacío", "Agrega productos al carrito primero");
      return;
    }

    if (isFormValid) {
      setShowCardModal(true);
    } else {
      setShowAlertModal(true);
    }
  };

  const handleProcessPayment = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    setShowCardModal(false);

    try {
      console.log("User ID que se envía:", user?.id);
      console.log("Carrito enriquecido:", enrichedCart);

      const shippingAddress = `${form.colonia}, ${form.localidad}, ${form.municipio}, ${form.estado}, CP: ${form.cp}`;

      // Preparar cartItems con información completa
      const cartItems = enrichedCart.map((item) => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price) || 0,
        quantity: item.quantity || 1,
        provider_id: item.provider_id, // Asegurar que enviamos provider_id
      }));

      console.log("CartItems a enviar:", cartItems);

      const paymentData = {
        amount: totalConImpuestos,
        currency: "mxn",
        userId: user?.id,
        email: user?.email || "cliente@quickpay.com",
        name: form.nombre,
        phone: form.telefono,
        shippingAddress,
        cartItems: cartItems,
      };

      console.log("Enviando a backend:", `${API_URL}/create-payment-intent`);
      console.log("Body enviado:", JSON.stringify(paymentData, null, 2));

      const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      console.log("Respuesta recibida - Status:", response.status);
      console.log("Content-Type:", response.headers.get("content-type"));

      // Leemos como TEXTO primero para depurar
      const responseText = await response.text();
      console.log(
        "Respuesta cruda del servidor:",
        responseText.substring(0, 300),
      );

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${responseText}`);
      }

      // Solo ahora parseamos como JSON
      const data = JSON.parse(responseText);

      const { clientSecret } = data;

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "QuickPay",
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: form.nombre,
          email: user?.email,
          phone: form.telefono,
          address: {
            line1: shippingAddress,
            postalCode: form.cp,
            city: form.municipio,
            state: form.estado,
            country: "MX",
          },
        },
      });

      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          Alert.alert("Pago cancelado", "Puedes intentarlo de nuevo");
          return;
        }
        throw new Error(presentError.message);
      }

      const confirmResponse = await fetch(`${API_URL}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: data.paymentIntentId,
          userId: user?.id,
          totalAmount: totalConImpuestos,
          shippingAddress,
          cartItems: cartItems,
          notes: `Compra QuickPay - ${form.tipoDomicilio} - Teléfono: ${form.telefono}`,
        }),
      });

      const confirmText = await confirmResponse.text();
      console.log(
        "Respuesta de confirm-payment:",
        confirmText.substring(0, 300),
      );

      if (!confirmResponse.ok) {
        throw new Error(`Error en confirmación: ${confirmText}`);
      }

      const confirmData = JSON.parse(confirmText);

      if (!confirmData.success) {
        throw new Error(confirmData.error || "Error confirmando pago");
      }

      clearCart();
      await refreshOrders();

      Alert.alert(
        "¡Compra completada!",
        `Pago exitoso por $${totalConImpuestos.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN\n\nSe ha creado la orden: ${confirmData.orderNumber}`,
        [
          {
            text: "Ver mis pedidos",
            onPress: () =>
              navigation.navigate("ClientTabs", { screen: "ClientOrders" }),
          },
          { 
            text: "Continuar comprando",
            onPress: () => navigation.goBack()
          },
        ],
      );

      setForm({
        cp: "",
        estado: "",
        municipio: "",
        localidad: "",
        colonia: "",
        nombre: user?.name || "",
        telefono: user?.phone || "",
        tipoDomicilio: "Residencial",
      });
      
      // Limpiar carrito enriquecido
      setEnrichedCart([]);
    } catch (error) {
      console.error("Error en pago:", error);
      Alert.alert(
        "Error",
        error.message ||
          "No se pudo completar el pago.\n\nRevisa tu conexión o el servidor.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCardModal = () => (
    <Modal visible={showCardModal} transparent animationType="slide">
      <View
        style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}
      >
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Confirmar Pago
          </Text>

          <View
            style={[
              styles.modalTotalBox,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              Total a pagar:
            </Text>
            <Text style={[styles.modalTotalValue, { color: colors.primary }]}>
              $
              {totalConImpuestos.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                marginTop: 5,
              }}
            >
              Incluye impuestos (15%)
            </Text>
          </View>

          {/* Mostrar proveedores involucrados */}
          {enrichedCart.length > 0 && (
            <View style={[styles.providersInfo, { backgroundColor: colors.background + '40' }]}>
              <Text style={[styles.providersTitle, { color: colors.textSecondary }]}>
                Proveedores involucrados:
              </Text>
              {Array.from(new Set(enrichedCart.map(item => item.provider_id))).map((providerId, index) => {
                const providerItems = enrichedCart.filter(item => item.provider_id === providerId);
                const providerTotal = providerItems.reduce((sum, item) => 
                  sum + (item.price * (item.quantity || 1)), 0
                );
                
                return (
                  <View key={index} style={styles.providerItem}>
                    <Icon name="store" size={16} color={colors.primary} />
                    <Text style={[styles.providerText, { color: colors.text }]}>
                      {providerItems.length} producto{providerItems.length > 1 ? 's' : ''} • ${providerTotal.toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <Text
            style={[
              styles.modalInfoText,
              { color: colors.textSecondary, marginTop: 20 },
            ]}
          >
            Tarjeta de prueba (modo test):\n4242 4242 4242 4242\nFecha:
            cualquier futura\nCVC: 123
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.btnFlex, { backgroundColor: colors.card }]}
              onPress={() => setShowCardModal(false)}
              disabled={isProcessing}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: "700" }}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnFlex,
                {
                  backgroundColor: colors.primary,
                  opacity: isProcessing ? 0.5 : 1,
                },
              ]}
              onPress={handleProcessPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Icon
                    name="lock"
                    size={20}
                    color="#FFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.btnTextWhite}>Pagar ahora</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {renderCardModal()}

      <Modal visible={showAlertModal} transparent animationType="fade">
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: colors.modalOverlay },
          ]}
        >
          <View
            style={[styles.modalAlertContent, { backgroundColor: colors.card }]}
          >
            <Icon name="alert-circle" size={50} color="#EF4444" />
            <Text style={[styles.modalAlertTitle, { color: colors.text }]}>
              Datos incompletos
            </Text>
            <Text
              style={[styles.modalAlertText, { color: colors.textSecondary }]}
            >
              {Object.values(errors).filter(Boolean).join("\n") ||
                "Revisa los campos requeridos"}
            </Text>
            <TouchableOpacity
              style={[styles.btnAction, { backgroundColor: colors.primary }]}
              onPress={() => setShowAlertModal(false)}
            >
              <Text style={styles.btnTextWhite}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 200 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Finalizar Compra
          </Text>

          {/* Resumen del Pedido */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardHeader, { color: colors.text }]}>
                Resumen del Pedido
              </Text>
              <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
                {cart.length} {cart.length === 1 ? "producto" : "productos"}
              </Text>
            </View>

            {(enrichedCart.length > 0 ? enrichedCart : cart).map((item, index) => (
              <View key={index} style={styles.productRow}>
                <Image
                  source={{
                    uri: item.images?.[0] || "https://via.placeholder.com/150",
                  }}
                  style={styles.productImage}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.productName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    Cantidad: {item.quantity || 1} × $
                    {(item.price || 0).toFixed(2)}
                  </Text>
                  {item.provider_id && (
                    <Text style={{ color: colors.primary, fontSize: 11, marginTop: 2 }}>
                      <Icon name="store" size={10} /> Proveedor
                    </Text>
                  )}
                </View>
                <Text style={[styles.productPrice, { color: colors.primary }]}>
                  $
                  {((item.price || 0) * (item.quantity || 1)).toLocaleString(
                    "es-MX",
                    { minimumFractionDigits: 2 },
                  )}
                </Text>
              </View>
            ))}

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                Subtotal:
              </Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>
                ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                Impuestos (15%):
              </Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>
                $
                {(total * 0.15).toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text
                style={[
                  styles.totalLabel,
                  { color: colors.text, fontWeight: "bold" },
                ]}
              >
                Total:
              </Text>
              <Text
                style={[
                  styles.totalValue,
                  { color: colors.primary, fontWeight: "bold" },
                ]}
              >
                $
                {totalConImpuestos.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          {/* Datos de Entrega */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardHeader, { color: colors.text }]}>
                Datos de entrega
              </Text>
              <Icon name="map-marker" size={20} color={colors.primary} />
            </View>

            <CustomInput
              label="CÓDIGO POSTAL *"
              placeholder="5 dígitos (ej: 01000)"
              value={form.cp}
              onChangeText={(t) => updateFormField("cp", t)}
              keyboardType="numeric"
              maxLength={5}
              theme={colors}
              isProcessing={isProcessing}
              error={errors.cp}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <CustomInput
                  label="ESTADO *"
                  placeholder="Estado"
                  value={form.estado}
                  onChangeText={(t) => updateFormField("estado", t)}
                  theme={colors}
                  isProcessing={isProcessing}
                  error={errors.estado}
                />
              </View>
              <View style={styles.halfInput}>
                <CustomInput
                  label="MUNICIPIO *"
                  placeholder="Municipio"
                  value={form.municipio}
                  onChangeText={(t) => updateFormField("municipio", t)}
                  theme={colors}
                  isProcessing={isProcessing}
                  error={errors.municipio}
                />
              </View>
            </View>

            <CustomInput
              label="LOCALIDAD *"
              placeholder="Escribe aquí tu localidad"
              value={form.localidad}
              onChangeText={(t) => updateFormField("localidad", t)}
              theme={colors}
              isProcessing={isProcessing}
              error={errors.localidad}
            />

            <CustomInput
              label="COLONIA *"
              placeholder="Escribe aquí tu colonia"
              value={form.colonia}
              onChangeText={(t) => updateFormField("colonia", t)}
              theme={colors}
              isProcessing={isProcessing}
              error={errors.colonia}
            />

            <Text style={[styles.cardHeaderSmall, { color: colors.text }]}>
              Datos de contacto
            </Text>

            <CustomInput
              label="NOMBRE COMPLETO *"
              placeholder="Escribe tu nombre completo"
              value={form.nombre}
              onChangeText={(t) => updateFormField("nombre", t)}
              theme={colors}
              isProcessing={isProcessing}
              error={errors.nombre}
            />

            <CustomInput
              label="TELÉFONO *"
              placeholder="10 dígitos (ej: 5512345678)"
              value={form.telefono}
              onChangeText={(t) => updateFormField("telefono", t)}
              keyboardType="phone-pad"
              maxLength={10}
              theme={colors}
              isProcessing={isProcessing}
              error={errors.telefono}
            />

            <Text
              style={[
                styles.label,
                { color: colors.textSecondary, marginTop: 10 },
              ]}
            >
              TIPO DE DOMICILIO
            </Text>
            <View style={styles.radioGroup}>
              {["Residencial", "Oficina", "Comercial"].map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[
                    styles.radioOption,
                    {
                      backgroundColor:
                        form.tipoDomicilio === tipo
                          ? colors.primary
                          : "transparent",
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => updateFormField("tipoDomicilio", tipo)}
                  disabled={isProcessing}
                >
                  <Text
                    style={[
                      styles.radioText,
                      {
                        color:
                          form.tipoDomicilio === tipo ? "#FFF" : colors.text,
                      },
                    ]}
                  >
                    {tipo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomNav,
            { backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
        >
          <View style={styles.totalInfo}>
            <Text style={[styles.totalSub, { color: colors.textSecondary }]}>
              Total Final
            </Text>
            <Text style={[styles.totalBig, { color: colors.primary }]}>
              $
              {totalConImpuestos.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.btnPay,
              {
                backgroundColor: colors.primary,
                opacity:
                  isFormValid && cart.length > 0 && !isProcessing ? 1 : 0.5,
              },
            ]}
            onPress={handlePressContinuar}
            disabled={!isFormValid || cart.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.btnPayText}>
                  {cart.length === 0 ? "Carrito Vacío" : "Continuar al Pago"}
                </Text>
                <Icon name="chevron-right" size={24} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Estilos actualizados
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  mainTitle: { fontSize: 28, fontWeight: "900", marginBottom: 25 },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  cardHeader: { fontSize: 18, fontWeight: "800" },
  cardHeaderSmall: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 25,
    marginBottom: 10,
  },
  itemCount: {
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 15,
    backgroundColor: "#E2E8F0",
  },
  productName: { fontWeight: "700", fontSize: 15, flex: 1 },
  productPrice: { fontWeight: "800", fontSize: 16 },
  divider: { height: 1, marginVertical: 15 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 14, fontWeight: "600" },
  inputGroup: { marginBottom: 15 },
  label: {
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontWeight: "500",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  row: { flexDirection: "row", gap: 10 },
  halfInput: { flex: 1 },
  radioGroup: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  radioOption: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  radioText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === "android" ? 25 : 40,
    borderTopWidth: 1,
  },
  totalInfo: { flex: 1 },
  totalSub: { fontSize: 12, fontWeight: "600" },
  totalBig: { fontSize: 26, fontWeight: "900" },
  btnPay: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 25,
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  btnPayText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 17,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalAlertContent: {
    width: "85%",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    elevation: 10,
  },
  modalAlertTitle: { fontSize: 22, fontWeight: "900", marginTop: 15 },
  modalAlertText: {
    textAlign: "center",
    marginVertical: 15,
    fontSize: 15,
    lineHeight: 22,
  },
  btnAction: {
    width: "100%",
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
  },
  btnTextWhite: { color: "#FFF", fontWeight: "800", fontSize: 16 },
  modalSheet: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    alignItems: "center",
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 15,
    textAlign: "center",
  },
  modalTotalBox: {
    width: "100%",
    padding: 20,
    borderRadius: 20,
    marginVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalTotalValue: { fontSize: 36, fontWeight: "900", marginTop: 5 },
  modalInfoText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  providersInfo: {
    width: "100%",
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
  },
  providersTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  providerItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  providerText: {
    fontSize: 13,
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 10,
  },
  btnFlex: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  btnMain: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    flexDirection: "row",
  },
});