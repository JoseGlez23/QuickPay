// src/screens/PaymentScreen.js - VERSIÓN CORREGIDA
import React, { useState } from "react";
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

export default function PaymentScreen({ route, navigation }) {
  const { colors, isDarkMode } = useTheme();
  const { user, cart: cartFromAuth, cartTotal, clearCart } = useAuth();
  const { createOrder, refreshOrders } = useOrders();

  const cart = cartFromAuth || [];
  const total = cartTotal || 0;

  const [form, setForm] = useState({
    cp: "",
    estado: "",
    municipio: "",
    localidad: "",
    colonia: "",
    nombre: "",
    telefono: "",
    tipoDomicilio: "Residencial",
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isFormValid =
    form.cp.trim().length > 0 &&
    form.estado.trim().length > 0 &&
    form.municipio.trim().length > 0 &&
    form.colonia.trim().length > 0 &&
    form.nombre.trim().length > 0 &&
    form.telefono.trim().length >= 10;

  const handlePressContinuar = () => {
    if (isFormValid) {
      setShowConfirmModal(true);
    } else {
      setShowAlertModal(true);
    }
  };

  const handleCreateOrder = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);

    try {
      if (!user?.id) {
        Alert.alert("Error", "Usuario no autenticado.");
        setIsProcessing(false);
        return;
      }

      if (cart.length === 0) {
        Alert.alert("Error", "El carrito está vacío.");
        setIsProcessing(false);
        return;
      }

      const productosSinProvider = cart.filter((item) => !item.provider_id);

      if (productosSinProvider.length > 0) {
        Alert.alert(
          "Error",
          `Hay ${productosSinProvider.length} producto(s) sin proveedor asignado.`,
        );
        setIsProcessing(false);
        return;
      }

      const productosPorProveedor = {};

      cart.forEach((item) => {
        const providerId = item.provider_id;

        if (!productosPorProveedor[providerId]) {
          productosPorProveedor[providerId] = {
            providerId,
            items: [],
            total: 0,
          };
        }

        const itemTotal = (item.price || 0) * (item.quantity || 1);
        productosPorProveedor[providerId].items.push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          stock: item.stock || 0,
        });
        productosPorProveedor[providerId].total += itemTotal;
      });

      const fullAddress = `${form.colonia}, ${form.localidad}, ${form.municipio}, ${form.estado}, CP: ${form.cp}`;

      const pedidosCreados = [];

      for (const [providerId, datosProveedor] of Object.entries(
        productosPorProveedor,
      )) {
        const orderData = {
          client_id: user.id,
          provider_id: providerId,
          total: datosProveedor.total,
          shipping_address: fullAddress,
          status: "pending",
          payment_status: "paid",
          payment_method: "manual",
          cancelable_until: new Date(
            Date.now() + 15 * 60 * 60 * 1000,
          ).toISOString(),
          notes: `Teléfono: ${form.telefono}, Nombre: ${form.nombre}, Tipo: ${form.tipoDomicilio}`,
        };

        const result = await createOrder(orderData, datosProveedor.items);

        if (result.success) {
          pedidosCreados.push(result.order);
        } else {
          throw new Error(
            `Error creando pedido para proveedor ${providerId}: ${result.error}`,
          );
        }
      }

      if (pedidosCreados.length > 0) {
        await refreshOrders();
        clearCart();

        Alert.alert(
          "Pedido Creado Exitosamente",
          `Tu pedido ha sido registrado.\n\nTotal: $${total.toFixed(2)}`,
          [
            {
              text: "Ver Mis Pedidos",
              onPress: () => {
                navigation.navigate("ClientTabs", {
                  screen: "ClientOrders",
                });
              },
            },
            {
              text: "Seguir Comprando",
              onPress: () => {
                navigation.navigate("ClientTabs", {
                  screen: "ClientHome",
                });
              },
            },
          ],
        );

        setForm({
          cp: "",
          estado: "",
          municipio: "",
          localidad: "",
          colonia: "",
          nombre: "",
          telefono: "",
          tipoDomicilio: "Residencial",
        });
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Ocurrió un error al procesar el pedido.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

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
              Datos Faltantes
            </Text>
            <Text
              style={[styles.modalAlertText, { color: colors.textSecondary }]}
            >
              Por favor completa todos los campos marcados con * para continuar.
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

      <Modal visible={showConfirmModal} transparent animationType="slide">
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: colors.modalOverlay },
          ]}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Confirmar Pedido
            </Text>

            <View
              style={[
                styles.modalTotalBox,
                { backgroundColor: colors.background },
              ]}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                Total a transferir:
              </Text>
              <Text style={[styles.modalTotalValue, { color: colors.primary }]}>
                ${(total * 1.15).toFixed(2)}
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

            <Text
              style={[styles.modalInfoText, { color: colors.textSecondary }]}
            >
              • El pedido se creará con estado "Pendiente"
              {"\n"}• Se reducirá el stock de los productos
              {"\n"}• Recibirás una notificación cuando el proveedor procese tu
              pedido
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.btnFlex,
                  { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" },
                ]}
                onPress={() => setShowConfirmModal(false)}
                disabled={isProcessing}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontWeight: "700",
                    opacity: isProcessing ? 0.5 : 1,
                  }}
                >
                  Regresar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btnFlex,
                  styles.btnMain,
                  {
                    backgroundColor: colors.primary,
                    opacity: isProcessing ? 0.7 : 1,
                  },
                ]}
                onPress={handleCreateOrder}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.btnTextWhite}>Confirmar Pedido</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 200 }]}
        >
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Finalizar Compra
          </Text>

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

            {cart.map((item, index) => (
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
                    Cantidad: {item.quantity} × ${item.price.toFixed(2)}
                  </Text>
                  {item.provider_name && (
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                      Proveedor: {item.provider_name}
                    </Text>
                  )}
                </View>
                <Text style={[styles.productPrice, { color: colors.primary }]}>
                  ${(item.price * item.quantity).toFixed(2)}
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
                ${total.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                Impuestos (15%):
              </Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>
                ${(total * 0.15).toFixed(2)}
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
                ${(total * 1.15).toFixed(2)}
              </Text>
            </View>
          </View>

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
              placeholder="Escribe aquí tu CP"
              value={form.cp}
              onChangeText={(t) => setForm({ ...form, cp: t })}
              keyboardType="numeric"
              maxLength={5}
              theme={colors}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <CustomInput
                  label="ESTADO *"
                  placeholder="Estado"
                  value={form.estado}
                  onChangeText={(t) => setForm({ ...form, estado: t })}
                  theme={colors}
                />
              </View>
              <View style={styles.halfInput}>
                <CustomInput
                  label="MUNICIPIO *"
                  placeholder="Municipio"
                  value={form.municipio}
                  onChangeText={(t) => setForm({ ...form, municipio: t })}
                  theme={colors}
                />
              </View>
            </View>

            <CustomInput
              label="LOCALIDAD *"
              placeholder="Escribe aquí tu localidad"
              value={form.localidad}
              onChangeText={(t) => setForm({ ...form, localidad: t })}
              theme={colors}
            />

            <CustomInput
              label="COLONIA *"
              placeholder="Escribe aquí tu colonia"
              value={form.colonia}
              onChangeText={(t) => setForm({ ...form, colonia: t })}
              theme={colors}
            />

            <Text style={[styles.cardHeaderSmall, { color: colors.text }]}>
              Datos de contacto
            </Text>

            <CustomInput
              label="NOMBRE COMPLETO *"
              placeholder="Escribe tu nombre completo"
              value={form.nombre}
              onChangeText={(t) => setForm({ ...form, nombre: t })}
              theme={colors}
            />

            <CustomInput
              label="TELÉFONO *"
              placeholder="10 dígitos"
              value={form.telefono}
              onChangeText={(t) => setForm({ ...form, telefono: t })}
              keyboardType="phone-pad"
              maxLength={10}
              theme={colors}
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
                  onPress={() => setForm({ ...form, tipoDomicilio: tipo })}
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
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              shadowColor: colors.text,
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 20,
            },
          ]}
        >
          <View style={styles.totalInfo}>
            <Text style={[styles.totalSub, { color: colors.textSecondary }]}>
              Total Final
            </Text>
            <Text style={[styles.totalBig, { color: colors.primary }]}>
              ${(total * 1.15).toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.btnPay,
              {
                backgroundColor: colors.primary,
                opacity: isFormValid ? 1 : 0.5,
              },
            ]}
            onPress={handlePressContinuar}
            disabled={!isFormValid || cart.length === 0}
          >
            <Text style={styles.btnPayText}>
              {cart.length === 0 ? "Carrito Vacío" : "Continuar"}
            </Text>
            <Icon name="chevron-right" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const CustomInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  maxLength,
  theme,
}) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
          color: theme.text,
        },
      ]}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary + "80"}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      maxLength={maxLength}
    />
  </View>
);

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
  },
});
