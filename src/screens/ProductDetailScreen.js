import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform,
  SafeAreaView,
  Animated,
  Modal,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../utils/supabase";

const { width, height } = Dimensions.get("window");

export default function ProductDetailScreen({ route, navigation }) {
  const { productId, productData } = route.params || {};
  const { addToCart } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [currentStock, setCurrentStock] = useState(0);

  // Animaciones para el feedback visual
  const moveAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const formatPrice = (price) => {
    return `$${parseFloat(price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  // 1. CARGA INICIAL
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const id = productId || productData?.id;
        const { data, error } = await supabase
          .from("products")
          .select(`*, category:categories(name)`)
          .eq("id", id)
          .single();

        if (data) {
          setProduct({
            ...data,
            price: parseFloat(data.price),
            brand: data.brand || "Marca",
            categoryName: data.category?.name || "General",
            images: data.images || [],
          });
          setCurrentStock(data.stock || 0);
          if (data.stock === 0) setQuantity(0);
        }
      } catch (e) {
        console.error("Error cargando producto:", e);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [productId]);

  // 2. SINCRONIZACIÓN REALTIME
  useEffect(() => {
    if (!product?.id) return;

    const subscription = supabase
      .channel(`stock-updates-${product.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `id=eq.${product.id}`,
        },
        (payload) => {
          const newStock = payload.new.stock;
          setCurrentStock(newStock);
          if (quantity > newStock) setQuantity(newStock);
        },
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [product?.id, quantity]);

  const handleQuantityChange = (operation) => {
    if (operation === "increase") {
      if (quantity < currentStock) setQuantity(quantity + 1);
      else
        Alert.alert(
          "Límite de stock",
          "No hay más unidades disponibles en inventario.",
        );
    } else {
      if (quantity > 1) setQuantity(quantity - 1);
    }
  };

  const runCartAnimation = () => {
    moveAnim.setValue({ x: width / 2 - 50, y: height * 0.2 });
    scaleAnim.setValue(1);
    opacityAnim.setValue(1);
    rotateAnim.setValue(0);

    Animated.parallel([
      Animated.timing(moveAnim, {
        toValue: { x: width - 80, y: -50 },
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddToCart = () => {
    if (currentStock <= 0) {
      Alert.alert(
        "Agotado",
        "Este producto no tiene stock disponible para agregar.",
      );
      return;
    }

    if (quantity > 0) {
      addToCart(product, quantity);
      runCartAnimation();
      setTimeout(() => setShowModal(true), 800);
    }
  };

  if (loading || !product) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* MODAL DE ÉXITO - CORREGIDO PARA NAVEGACIÓN */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
              <Icon name="add-shopping-cart" size={40} color="#FFF" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Agregado al Carrito
            </Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Has añadido {quantity} unidad(es). El stock se descontará solo al finalizar tu compra.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalBtnText}>Seguir Explorando</Text>
              </TouchableOpacity>
              
              {/* AQUÍ ESTÁ LA CORRECCIÓN: navigation.navigate("ClientCart") */}
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.cartBtn,
                  { borderColor: colors.primary },
                ]}
                onPress={() => {
                  setShowModal(false);
                  navigation.navigate("ClientTabs", { screen: "ClientCart" });
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: "700" }}>
                  Ver mi Carrito
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* IMAGEN ANIMADA PARA FEEDBACK */}
      <Animated.Image
        source={{ uri: product.images?.[selectedImage] }}
        style={[
          styles.animImage,
          {
            transform: [
              { translateX: moveAnim.x },
              { translateY: moveAnim.y },
              { scale: scaleAnim },
              { rotate: rotation },
            ],
            opacity: opacityAnim,
          },
        ]}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        <View style={[styles.imageContainer, { backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5" }]}>
          <Image
            source={{ uri: product.images?.[selectedImage] }}
            style={styles.mainImg}
            resizeMode="contain"
          />

          <View style={styles.thumbWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {product.images?.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImage(index)}
                  style={[
                    styles.thumbItem,
                    { borderColor: selectedImage === index ? colors.primary : "transparent" },
                  ]}
                >
                  <Image source={{ uri: img }} style={styles.thumbImg} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.headerRow}>
            <Text style={[styles.brand, { color: colors.primary }]}>
              {product.brand}
            </Text>
            <View style={[styles.stockTag, { backgroundColor: currentStock > 0 ? "#e8f5e9" : "#ffebee" }]}>
              <Text style={{ color: currentStock > 0 ? "#2e7d32" : "#c62828", fontSize: 11, fontWeight: "700" }}>
                {currentStock > 0 ? `${currentStock} DISPONIBLES` : "AGOTADO"}
              </Text>
            </View>
          </View>

          <Text style={[styles.name, { color: colors.text }]}>{product.name}</Text>
          <Text style={[styles.price, { color: colors.text }]}>{formatPrice(product.price)}</Text>

          <View style={styles.divider} />
          <Text style={[styles.subTitle, { color: colors.text }]}>Descripción</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{product.description}</Text>

          <View style={styles.qtyContainer}>
            <Text style={[styles.subTitle, { color: colors.text, marginBottom: 0 }]}>Seleccionar Cantidad</Text>
            <View style={[styles.qtySelector, { backgroundColor: isDarkMode ? "#333" : "#eee" }]}>
              <TouchableOpacity onPress={() => handleQuantityChange("decrease")} disabled={quantity <= 1}>
                <Icon name="remove" size={24} color={colors.text} style={{ opacity: quantity <= 1 ? 0.3 : 1 }} />
              </TouchableOpacity>
              <Text style={[styles.qtyVal, { color: colors.text }]}>{quantity}</Text>
              <TouchableOpacity onPress={() => handleQuantityChange("increase")} disabled={quantity >= currentStock}>
                <Icon name="add" size={24} color={colors.text} style={{ opacity: quantity >= currentStock ? 0.3 : 1 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.footerContent}>
          <View>
            <Text style={[styles.totalLab, { color: colors.textSecondary }]}>Total estimado</Text>
            <Text style={[styles.totalValText, { color: colors.text }]}>{formatPrice(product.price * quantity)}</Text>
          </View>

          <TouchableOpacity
            onPress={handleAddToCart}
            style={[styles.fullCartBtn, { backgroundColor: currentStock > 0 ? colors.primary : "#ccc" }]}
            disabled={currentStock <= 0}
          >
            <Text style={styles.buyText}>{currentStock > 0 ? "Agregar al carrito" : "Agotado"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  animImage: { position: "absolute", width: 70, height: 70, zIndex: 100, borderRadius: 35 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", borderRadius: 25, padding: 30, alignItems: "center" },
  iconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  modalSub: { fontSize: 15, textAlign: "center", marginBottom: 25, opacity: 0.7 },
  modalButtons: { width: "100%", gap: 12 },
  modalBtn: { width: "100%", height: 50, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  modalBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  cartBtn: { borderWidth: 2, backgroundColor: "transparent" },
  imageContainer: { width: width, height: height * 0.42, justifyContent: "center", alignItems: "center", borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  mainImg: { width: "85%", height: "85%" },
  thumbWrapper: { position: "absolute", bottom: 15, width: "100%" },
  thumbItem: { width: 55, height: 55, borderRadius: 12, marginRight: 12, borderWidth: 2, padding: 4, backgroundColor: "#FFF" },
  thumbImg: { width: "100%", height: "100%", borderRadius: 8 },
  infoBox: { padding: 25 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 14, fontWeight: "700", textTransform: "uppercase" },
  stockTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  name: { fontSize: 28, fontWeight: "800", marginTop: 5 },
  price: { fontSize: 24, fontWeight: "400", marginTop: 5 },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 20 },
  subTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  desc: { fontSize: 15, lineHeight: 24, opacity: 0.8 },
  qtyContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 30 },
  qtySelector: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 10, width: 130, justifyContent: "space-between" },
  qtyVal: { fontSize: 20, fontWeight: "800" },
  footer: { position: "absolute", bottom: 0, width: "100%", paddingHorizontal: 25, paddingTop: 20, paddingBottom: Platform.OS === "ios" ? 40 : 25, borderTopWidth: 1 },
  footerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLab: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  totalValText: { fontSize: 22, fontWeight: "800" },
  fullCartBtn: { paddingHorizontal: 30, height: 55, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  buyText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});