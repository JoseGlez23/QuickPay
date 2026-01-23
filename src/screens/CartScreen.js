import React, { useState, useEffect, useMemo, useRef } from "react"; // 1. Agregado useRef
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
  LayoutAnimation,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useProducts } from "../context/ProductContext";

export default function CartScreen({ navigation }) {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartCount,
    clearCart,
  } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { products, loading: productsLoading } = useProducts();

  const [enrichedCart, setEnrichedCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);

  // ESTADOS PARA EL POP-UP DE STOCK ESTILIZADO
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [modalStockInfo, setModalStockInfo] = useState({ name: "", stock: 0 });

  // 2. REFERENCIA PARA EVITAR CLICS RÁPIDOS (Anti-spam)
  const isProcessing = useRef(false);

  useEffect(() => {
    const enrichCartItems = () => {
      if (!cart.length || !products.length) {
        setEnrichedCart([]);
        setLoading(false);
        return;
      }

      const enriched = cart.map((cartItem) => {
        const fullProduct = products.find((p) => p.id === cartItem.id);
        if (fullProduct) {
          return {
            ...cartItem,
            provider_id: fullProduct.provider_id || cartItem.providerId || cartItem.provider_id,
            providerId: fullProduct.provider_id || cartItem.providerId,
            stock: fullProduct.stock || cartItem.stock || 0,
            providerName: fullProduct.providerName || "Proveedor",
            images: fullProduct.images || cartItem.images || [],
          };
        }
        return {
          ...cartItem,
          provider_id: cartItem.providerId || cartItem.provider_id,
          stock: cartItem.stock || 0,
        };
      });

      setEnrichedCart(enriched);
      if (selectedItems.length === 0) {
        setSelectedItems(enriched.map((i) => i.id));
      }
      setLoading(false);
    };

    if (!productsLoading) {
      enrichCartItems();
    }
  }, [cart, products, productsLoading]);

  const toggleItemSelection = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (selectedItems.length === enrichedCart.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(enrichedCart.map((item) => item.id));
    }
  };

  // 3. LÓGICA DE SUMAR CORREGIDA (BLOQUEO DE RÁFAGA)
  const handleIncreaseQuantity = (item) => {
    // Si ya estamos procesando un clic, ignoramos el siguiente
    if (isProcessing.current) return;

    const availableStock = item.stock || 0;
    
    // Validación estricta
    if (item.quantity >= availableStock) {
      setModalStockInfo({ name: item.name, stock: availableStock });
      setStockModalVisible(true);
      return;
    }

    // Bloqueamos clics por 100ms para dar tiempo a que el estado se actualice
    isProcessing.current = true;
    updateQuantity(item.id, 1);

    setTimeout(() => {
      isProcessing.current = false;
    }, 100); 
  };

  const totals = useMemo(() => {
    const selected = enrichedCart.filter((item) =>
      selectedItems.includes(item.id),
    );
    const subtotal = selected.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    const shipping = subtotal > 100 || subtotal === 0 ? 0 : 9.99;
    const tax = subtotal * 0.15;
    const grandTotal = subtotal + shipping + tax;

    return { subtotal, shipping, tax, grandTotal, count: selected.length };
  }, [enrichedCart, selectedItems]);

  const handleCheckout = () => {
    if (totals.count === 0) {
      Alert.alert("Carrito", "Selecciona al menos un producto.");
      return;
    }
    const itemsToCheckout = enrichedCart.filter((item) =>
      selectedItems.includes(item.id),
    );
    navigation.navigate("Payment", {
      total: totals.grandTotal,
      cartItems: itemsToCheckout,
    });
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedItems.includes(item.id);
    const availableStock = item.stock || 0;
    const isOutOfStock = item.quantity > availableStock;
    const hasReachedMax = item.quantity >= availableStock;

    return (
      <View style={[styles.cartItem, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          onPress={() => toggleItemSelection(item.id)}
          style={styles.selectorIcon}
        >
          <Icon
            name={isSelected ? "check-circle" : "radio-button-unchecked"}
            size={26}
            color={isSelected ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>

        <Image
          source={{ uri: item.images?.[0] || "https://via.placeholder.com/150" }}
          style={styles.itemImage}
        />

        <View style={styles.itemDetails}>
          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.itemPrice, { color: colors.primary }]}>
            ${item.price.toFixed(2)}
          </Text>

          <Text style={{ fontSize: 11, color: colors.textSecondary }}>
            Disponibles: {availableStock}
          </Text>

          {isOutOfStock && (
            <Text style={styles.stockWarning}>Sin stock suficiente</Text>
          )}

          <View style={styles.itemActions}>
            <View
              style={[
                styles.qtyContainer,
                { backgroundColor: isDarkMode ? "#333" : "#F3F4F6" },
              ]}
            >
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, -1)}
                disabled={item.quantity <= 1}
              >
                <Icon
                  name="remove"
                  size={18}
                  color={item.quantity <= 1 ? colors.textSecondary : colors.text}
                />
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: colors.text }]}>
                {item.quantity}
              </Text>
              
              <TouchableOpacity onPress={() => handleIncreaseQuantity(item)}>
                <Icon 
                  name="add" 
                  size={18} 
                  color={hasReachedMax ? colors.textSecondary : colors.text} 
                  style={{ opacity: hasReachedMax ? 0.3 : 1 }}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item.id)}>
              <Icon name="delete-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading || productsLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <Modal visible={stockModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIconBg, { backgroundColor: colors.primary + '20' }]}>
              <Icon name="inventory" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Límite de Stock</Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Solo hay <Text style={{color: colors.primary, fontWeight: '800'}}>{modalStockInfo.stock}</Text> unidades de <Text style={{fontWeight: '700'}}>{modalStockInfo.name}</Text> en existencia.
            </Text>
            <TouchableOpacity 
              style={[styles.modalBtn, { backgroundColor: colors.primary }]} 
              onPress={() => setStockModalVisible(false)}
            >
              <Text style={styles.modalBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Icon name="chevron-left" size={30} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Mi Carrito</Text>
            <Text style={styles.headerSubtitle}>{cartCount} artículos en total</Text>
          </View>
          <TouchableOpacity onPress={clearCart} style={styles.headerBtn}>
            <Icon name="delete-sweep" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {enrichedCart.length === 0 ? (
        <View style={styles.emptyCenter}>
          <Icon name="shopping-bag" size={70} color={colors.textSecondary} />
          <Text style={{ color: colors.text, fontSize: 18, marginTop: 10 }}>Carrito vacío</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={enrichedCart}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <TouchableOpacity style={styles.selectAllHeader} onPress={toggleSelectAll}>
                <Icon
                  name={selectedItems.length === enrichedCart.length ? "check-circle" : "radio-button-unchecked"}
                  size={22}
                  color={colors.primary}
                />
                <Text style={[styles.selectAllText, { color: colors.text }]}>Seleccionar todo</Text>
              </TouchableOpacity>
            }
          />

          <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.footerSelect} onPress={toggleSelectAll}>
              <Icon
                name={selectedItems.length === enrichedCart.length ? "check-circle" : "radio-button-unchecked"}
                size={22}
                color={colors.primary}
              />
              <Text style={{ fontSize: 10, color: colors.textSecondary }}>Todo</Text>
            </TouchableOpacity>

            <View style={styles.footerPrice}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Total a pagar:</Text>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.primary }}>
                ${totals.grandTotal.toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.payBtn, { backgroundColor: colors.primary, opacity: totals.count > 0 ? 1 : 0.5 }]}
              onPress={handleCheckout}
              disabled={totals.count === 0}
            >
              <Text style={styles.payBtnText}>Pagar ({totals.count})</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: Platform.OS === "ios" ? 55 : (StatusBar.currentHeight || 0) + 25,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerBtn: { width: 40, height: 40, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, justifyContent: "center", alignItems: "center" },
  headerTitleBox: { alignItems: "center" },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  headerSubtitle: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  list: { padding: 15, paddingBottom: 100 },
  selectAllHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15, gap: 10 },
  selectAllText: { fontWeight: "600", fontSize: 15 },
  cartItem: { flexDirection: "row", padding: 12, borderRadius: 15, marginBottom: 12, alignItems: "center", elevation: 2 },
  selectorIcon: { marginRight: 10 },
  itemImage: { width: 70, height: 70, borderRadius: 10, marginRight: 12 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  itemPrice: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  stockWarning: { color: "#EF4444", fontSize: 10, fontWeight: "bold", marginBottom: 4 },
  itemActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  qtyContainer: { flexDirection: "row", alignItems: "center", borderRadius: 5, padding: 3 },
  qtyText: { marginHorizontal: 10, fontWeight: "bold", fontSize: 14 },
  footer: { position: "absolute", bottom: 0, width: "100%", flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 10, paddingBottom: Platform.OS === "ios" ? 30 : 15, borderTopWidth: 1 },
  footerSelect: { alignItems: "center", marginRight: 15 },
  footerPrice: { flex: 1 },
  payBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, minWidth: 110, alignItems: "center" },
  payBtnText: { color: "#FFF", fontWeight: "bold" },
  emptyCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', padding: 25, borderRadius: 30, alignItems: 'center' },
  modalIconBg: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  modalDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalBtn: { width: '100%', paddingVertical: 12, borderRadius: 15, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});