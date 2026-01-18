// src/screens/ProductDetailScreen.js - VERSIÓN CON THEME CONTEXT COMPLETA
import React, { useState, useEffect } from "react";
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
  Alert,
  SafeAreaView,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useTheme } from "../context/ThemeContext"; // IMPORTADO
import { supabase } from "../utils/supabase";

const { width, height } = Dimensions.get("window");

export default function ProductDetailScreen({ route, navigation }) {
  const { productId, productData } = route.params || {};
  const { addToCart, cartCount } = useAuth();
  const { products } = useProducts();
  const { colors, isDarkMode } = useTheme(); // USANDO TU CONTEXTO

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [providerName, setProviderName] = useState("");
  const scrollY = new Animated.Value(0);

  // Función para formatear precio con comas
  const formatPrice = (price) => {
    if (!price && price !== 0) return "$0.00";
    const formatted = parseFloat(price).toFixed(2);
    const parts = formatted.split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `$${integerPart}.${parts[1]}`;
  };

  // Función para obtener detalles completos del producto
  const fetchProductDetails = async (id) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`*, provider:users(name, email), category:categories(name, description, icon)`)
        .eq("id", id)
        .eq("is_active", true)
        .single();
      if (error) {
        console.error("Error cargando producto:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Error en fetchProductDetails:", error);
      return null;
    }
  };

  // Cargar detalles del producto
  useEffect(() => {
    const loadProductDetails = async () => {
      try {
        setLoading(true);
        let productDetails = null;
        if (productId) {
          productDetails = await fetchProductDetails(productId);
        } else if (productData?.id) {
          productDetails = await fetchProductDetails(productData.id);
        }

        if (productDetails) {
          let catName = "General";
          if (productDetails.category?.name) {
            catName = productDetails.category.name;
          } else if (productDetails.category_id) {
            const { data: categoryData } = await supabase
              .from("categories")
              .select("name")
              .eq("id", productDetails.category_id)
              .single();
            if (categoryData) catName = categoryData.name;
          }

          let provName = "Proveedor";
          if (productDetails.provider?.name) {
            provName = productDetails.provider.name;
          } else if (productDetails.provider_id) {
            const { data: providerData } = await supabase
              .from("users")
              .select("name")
              .eq("id", productDetails.provider_id)
              .single();
            if (providerData) provName = providerData.name;
          }

          const formattedProduct = {
            id: productDetails.id,
            providerId: productDetails.provider_id,
            name: productDetails.name,
            price: parseFloat(productDetails.price),
            description: productDetails.description || "",
            images: productDetails.images || [],
            stock: productDetails.stock || 0,
            categoryId: productDetails.category_id,
            createdAt: productDetails.created_at,
            updatedAt: productDetails.updated_at,
            isActive: productDetails.is_active || true,
            discountPrice: productDetails.discount_price ? parseFloat(productDetails.discount_price) : null,
            delivery: productDetails.delivery_options || "Envío gratis",
            isNew: productDetails.created_at ? new Date(productDetails.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : false,
            brand: productDetails.brand || "Marca reconocida",
          };

          setProduct(formattedProduct);
          setCategoryName(catName);
          setProviderName(provName);
          await loadRelatedProducts(formattedProduct.categoryId, formattedProduct.id);
        } else {
          Alert.alert("Error", "Producto no encontrado");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error cargando producto:", error);
        Alert.alert("Error", "No se pudo cargar el producto");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    loadProductDetails();
  }, [productId, productData]);

  // Cargar productos relacionados
  const loadRelatedProducts = async (categoryId, excludeId) => {
    try {
      if (!categoryId) return;
      const { data, error } = await supabase
        .from("products")
        .select(`id, name, price, discount_price, images, provider_id, category_id, provider:users(name), category:categories(name)`)
        .eq("is_active", true)
        .neq("id", excludeId)
        .eq("category_id", categoryId)
        .limit(4)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const formattedProducts = data.map((item) => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          discountPrice: item.discount_price ? parseFloat(item.discount_price) : null,
          image: item.images && item.images.length > 0 ? item.images[0] : null,
          providerName: item.provider?.name || "Proveedor",
          categoryName: item.category?.name || "General",
        }));
        setRelatedProducts(formattedProducts);
      } else {
        setRelatedProducts([]);
      }
    } catch (error) {
      console.error("Error cargando relacionados:", error);
    }
  };

  const getFriendlyCategoryName = (category) => {
    const categoryMap = { electronics: "Electrónicos", computers: "Computadoras", phones: "Teléfonos", home: "Hogar", other: "General" };
    return categoryMap[category?.toLowerCase()] || category || "General";
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    Alert.alert("¡Agregado!", `${product.name} se añadió al carrito.`, [
      { text: "Seguir comprando", onPress: () => navigation.goBack() },
      { text: "Ver Carrito", onPress: () => navigation.navigate("ClientTabs", { screen: "ClientCart" }) },
    ]);
  };

  const handleBuyNow = () => {
    if (!product) return;
    const total = (product.discountPrice || product.price) * quantity;
    navigation.navigate("Payment", {
      total: total,
      items: [{ ...product, quantity, price: product.discountPrice || product.price }],
    });
  };

  const getProductFeatures = () => {
    if (!product) return [];
    const features = ["Producto de alta calidad", "Garantía incluida", "Envío disponible"];
    const friendlyCategory = getFriendlyCategoryName(categoryName);
    if (friendlyCategory !== "General") features.unshift(`Categoría: ${friendlyCategory}`);
    if (providerName && providerName !== "Proveedor") features.push(`Vendido por: ${providerName}`);
    if (product.brand && product.brand !== "Marca reconocida") features.unshift(`Marca: ${product.brand}`);
    return features;
  };

  const getProductImage = (index = 0) => {
    if (!product || !product.images || product.images.length === 0) {
      return { uri: "https://images.unsplash.com/photo-1556656793-08538906a9f8?q=80&w=800" };
    }
    return { uri: product.images[index < product.images.length ? index : 0] };
  };

  const calculateDiscount = () => {
    if (!product || !product.discountPrice || !product.price) return 0;
    return Math.round(((product.price - product.discountPrice) / product.price) * 100);
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 200],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  });

  if (loading || !product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando producto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const discount = calculateDiscount();
  const finalPrice = product.discountPrice || product.price;
  const features = getProductFeatures();
  const friendlyCategory = getFriendlyCategoryName(categoryName);
  const totalFormatted = formatPrice(finalPrice * quantity);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      {/* HEADER FLOTANTE CON TEMA */}
      <Animated.View style={[styles.header, { opacity: headerOpacity, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={() => setIsFavorite(!isFavorite)}>
            <Icon name={isFavorite ? "favorite" : "favorite-border"} size={24} color={isFavorite ? "#DC2626" : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate("ClientCart")}>
            <Icon name="shopping-cart" size={24} color={colors.text} />
            {cartCount > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* IMAGEN DEL PRODUCTO */}
        <View style={[styles.imageSection, { backgroundColor: isDarkMode ? "#000" : "#F9FAFB" }]}>
          <Image source={getProductImage(selectedImage)} style={styles.mainImage} resizeMode="contain" />
          {product.images && product.images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailsContainer} contentContainerStyle={styles.thumbnailsContent}>
              {product.images.map((img, index) => (
                <TouchableOpacity key={index} onPress={() => setSelectedImage(index)} style={[styles.thumbnail, { borderColor: selectedImage === index ? colors.primary : "transparent" }]}>
                  <Image source={{ uri: img }} style={styles.thumbnailImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {discount > 0 && <View style={styles.discountBadge}><Text style={styles.discountText}>-{discount}%</Text></View>}
        </View>

        <View style={styles.contentSection}>
          {/* INFORMACIÓN BÁSICA CON TEMA */}
          <View style={styles.basicInfo}>
            <View style={styles.brandRow}>
              <Text style={[styles.brand, { color: colors.textSecondary }]}>{product.brand}</Text>
              {friendlyCategory !== "General" && (
                <View style={[styles.categoryBadge, { backgroundColor: isDarkMode ? "#1E293B" : "#EFF6FF" }]}>
                  <Icon name="category" size={14} color={colors.primary} />
                  <Text style={[styles.categoryText, { color: colors.primary }]}>{friendlyCategory}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
            <View style={styles.stockRow}>
              <Icon name="inventory" size={16} color={product.stock > 0 ? "#10B981" : "#EF4444"} />
              <Text style={[styles.stockText, { color: product.stock > 0 ? "#10B981" : "#EF4444" }]}>
                {product.stock > 0 ? `En stock: ${product.stock}` : "Agotado"}
              </Text>
            </View>
            {providerName && providerName !== "Proveedor" && (
              <View style={styles.providerContainer}>
                <Icon name="store" size={16} color={colors.textSecondary} />
                <Text style={[styles.providerText, { color: colors.textSecondary }]}>Vendido por: {providerName}</Text>
              </View>
            )}
          </View>

          {/* PRECIO CON TEMA */}
          <View style={styles.priceSection}>
            <Text style={[styles.currentPrice, { color: colors.text }]}>{formatPrice(finalPrice)}</Text>
            {product.discountPrice && product.price && <Text style={styles.originalPrice}>{formatPrice(product.price)}</Text>}
            <View style={[styles.deliveryBadge, { backgroundColor: isDarkMode ? "#1E293B" : "#EFF6FF" }]}>
              <Icon name="local-shipping" size={16} color={colors.primary} />
              <Text style={[styles.deliveryText, { color: colors.primary }]}>{product.delivery}</Text>
            </View>
          </View>

          {/* CANTIDAD CON TEMA */}
          <View style={styles.quantitySection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cantidad</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity onPress={() => quantity > 1 && setQuantity(quantity - 1)} style={[styles.quantityButton, { backgroundColor: colors.border }]}>
                <Icon name="remove" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
              <TouchableOpacity onPress={() => product.stock > 0 && quantity < product.stock && setQuantity(quantity + 1)} style={[styles.quantityButton, { backgroundColor: colors.border }]}>
                <Icon name="add" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.availableText, { color: colors.textSecondary }]}>{product.stock > 0 ? `Disponibles: ${product.stock}` : "Agotado"}</Text>
            </View>
          </View>

          {/* DESCRIPCIÓN CON TEMA */}
          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Descripción</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>{product.description}</Text>
            </View>
          )}

          {/* CARACTERÍSTICAS CON TEMA */}
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Características</Text>
            <View style={[styles.featuresList, { backgroundColor: isDarkMode ? colors.card : "#F9FAFB" }]}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Icon name="check-circle" size={18} color="#10B981" />
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ESPECIFICACIONES CON TEMA */}
          <View style={styles.specsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Especificaciones</Text>
            <View style={styles.specsGrid}>
              {[
                { icon: "local-shipping", label: "Envío", value: product.delivery, color: colors.primary },
                { icon: "verified", label: "Garantía", value: "1 año", color: "#10B981" },
                { icon: "category", label: "Categoría", value: friendlyCategory, color: "#F59E0B" },
                { icon: "inventory", label: "Stock", value: product.stock > 0 ? "Disponible" : "Agotado", color: "#8B5CF6" },
              ].map((spec, i) => (
                <View key={i} style={[styles.specItem, { backgroundColor: isDarkMode ? colors.card : "#F9FAFB" }]}>
                  <Icon name={spec.icon} size={20} color={spec.color} />
                  <Text style={styles.specLabel}>{spec.label}</Text>
                  <Text style={[styles.specValue, { color: colors.text }]}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* PRODUCTOS RELACIONADOS CON TEMA */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Productos relacionados</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedContent}>
                {relatedProducts.map((related) => (
                  <TouchableOpacity key={related.id} style={[styles.relatedCard, { backgroundColor: isDarkMode ? colors.card : "#F9FAFB" }]} onPress={() => navigation.replace("ProductDetail", { productId: related.id })}>
                    <Image source={{ uri: related.image || "https://via.placeholder.com/150" }} style={styles.relatedImage} resizeMode="cover" />
                    <Text style={[styles.relatedName, { color: colors.text }]} numberOfLines={2}>{related.name}</Text>
                    <Text style={styles.relatedCategory}>{related.categoryName}</Text>
                    <Text style={[styles.relatedPrice, { color: colors.text }]}>{formatPrice(related.discountPrice || related.price)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* BOTONES DE ACCIÓN CON TEMA */}
      <View style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.actionPriceLabel, { color: colors.textSecondary }]}>Total:</Text>
          <Text style={[styles.actionPrice, { color: colors.text }]}>{totalFormatted}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={handleAddToCart} style={[styles.addToCartButton, { borderColor: colors.primary, backgroundColor: isDarkMode ? "#1E293B" : "#EFF6FF" }]} disabled={product.stock === 0}>
            <Icon name="add-shopping-cart" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.buyButton, { backgroundColor: colors.primary }, product.stock === 0 && styles.disabledButton]} onPress={handleBuyNow} disabled={product.stock === 0}>
            <Text style={styles.buyText}>{product.stock === 0 ? "Agotado" : "Comprar ahora"}</Text>
            {product.stock > 0 && <Icon name="arrow-forward" size={20} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16 },
  header: { position: "absolute", top: 0, left: 0, right: 0, height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15, zIndex: 1000, borderBottomWidth: 1 },
  headerButton: { padding: 8 },
  headerTitle: { fontSize: 14, fontWeight: "600", flex: 1, textAlign: "center", marginHorizontal: 10 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  cartBadge: { position: "absolute", top: 0, right: 0, backgroundColor: "#EF4444", borderRadius: 10, width: 18, height: 18, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#FFF" },
  cartBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  imageSection: { width: width, height: height * 0.4, justifyContent: "center", alignItems: "center", position: "relative" },
  mainImage: { width: "85%", height: "85%" },
  thumbnailsContainer: { position: "absolute", bottom: 10, left: 0, right: 0 },
  thumbnailsContent: { paddingHorizontal: 10 },
  thumbnail: { width: 50, height: 50, borderRadius: 8, marginHorizontal: 5, borderWidth: 2, overflow: "hidden" },
  thumbnailImage: { width: "100%", height: "100%" },
  discountBadge: { position: "absolute", top: 20, left: 20, backgroundColor: "#EF4444", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  discountText: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  contentSection: { padding: 20, paddingBottom: 100 },
  basicInfo: { marginBottom: 20 },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  brand: { fontSize: 14, fontWeight: "500", fontStyle: "italic" },
  categoryBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 10 },
  categoryText: { fontSize: 12, fontWeight: "500", marginLeft: 4 },
  productName: { fontSize: 22, fontWeight: "bold", marginBottom: 15, lineHeight: 28 },
  stockRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  stockText: { marginLeft: 5, fontSize: 14, fontWeight: "500" },
  providerContainer: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  providerText: { marginLeft: 5, fontSize: 14 },
  priceSection: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  currentPrice: { fontSize: 32, fontWeight: "bold" },
  originalPrice: { fontSize: 20, color: "#9CA3AF", textDecorationLine: "line-through", marginLeft: 10, marginRight: 20 },
  deliveryBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  deliveryText: { marginLeft: 5, fontSize: 14, fontWeight: "500" },
  quantitySection: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  quantityControls: { flexDirection: "row", alignItems: "center" },
  quantityButton: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  quantityText: { fontSize: 18, fontWeight: "bold", width: 40, textAlign: "center", marginHorizontal: 10 },
  availableText: { fontSize: 14, marginLeft: 15, fontStyle: "italic" },
  descriptionSection: { marginBottom: 25 },
  description: { fontSize: 16, lineHeight: 24 },
  featuresSection: { marginBottom: 25 },
  featuresList: { borderRadius: 12, padding: 20 },
  featureItem: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  featureText: { marginLeft: 12, fontSize: 15, flex: 1 },
  specsSection: { marginBottom: 25 },
  specsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 15 },
  specItem: { width: (width - 70) / 2, borderRadius: 12, padding: 15, alignItems: "center" },
  specLabel: { fontSize: 12, color: "#6B7280", marginTop: 8, marginBottom: 4 },
  specValue: { fontSize: 14, fontWeight: "500", textAlign: "center" },
  relatedSection: { marginBottom: 25 },
  relatedContent: { paddingRight: 20 },
  relatedCard: { width: 150, marginRight: 15, borderRadius: 12, padding: 10 },
  relatedImage: { width: "100%", height: 120, borderRadius: 8, marginBottom: 10 },
  relatedName: { fontSize: 13, marginBottom: 5, height: 36, lineHeight: 18 },
  relatedCategory: { fontSize: 11, color: "#6B7280", marginBottom: 5, fontStyle: "italic" },
  relatedPrice: { fontSize: 16, fontWeight: "bold" },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 15, borderTopWidth: 1, paddingBottom: Platform.OS === "ios" ? 30 : 15 },
  priceContainer: { flex: 1 },
  actionPriceLabel: { fontSize: 14, marginBottom: 2 },
  actionPrice: { fontSize: 22, fontWeight: "bold" },
  actionButtons: { flexDirection: "row", alignItems: "center", gap: 10, width: "65%" },
  addToCartButton: { width: 50, height: 50, borderRadius: 12, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  buyButton: { flex: 1, height: 50, borderRadius: 12, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 8 },
  buyText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  disabledButton: { opacity: 0.5 },
});