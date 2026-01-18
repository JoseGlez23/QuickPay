import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  StatusBar,
  SafeAreaView,
  Animated,
  Dimensions,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

// Función para formatear precios con comas
const formatPrice = (price) => {
  if (!price && price !== 0) return "$0.00";

  const formatted = parseFloat(price).toFixed(2);
  const parts = formatted.split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `$${integerPart}.${parts[1]}`;
};

const getStatusColors = (isDarkMode) => ({
  active: {
    bg: isDarkMode ? "#064e3b" : "#D1FAE5",
    color: "#10B981",
    label: "En Stock",
    icon: "check-circle",
  },
  low: {
    bg: isDarkMode ? "#451a03" : "#FEF3C7",
    color: "#F59E0B",
    label: "Stock bajo",
    icon: "alert-circle",
  },
  out: {
    bg: isDarkMode ? "#450a0a" : "#FEE2E2",
    color: "#EF4444",
    label: "Agotado",
    icon: "close-circle",
  },
});

export default function ProviderProductsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const {
    myProducts,
    loading,
    error,
    deleteProduct,
    updateProduct,
    refreshProducts,
  } = useProducts();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // FORMULARIO DE EDICIÓN MEJORADO
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    images: [],
  });
  const [updating, setUpdating] = useState(false);

  const statusColors = getStatusColors(isDarkMode);
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setProducts(myProducts);
    filterProducts(myProducts, searchQuery, selectedFilter);

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [myProducts, user?.id]);

  const filterProducts = (
    productList,
    query = searchQuery,
    filter = selectedFilter,
  ) => {
    let filtered = productList;
    if (query.trim() !== "") {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()),
      );
    }
    if (filter === "low")
      filtered = filtered.filter((p) => p.stock > 0 && p.stock <= 5);
    else if (filter === "out") filtered = filtered.filter((p) => p.stock === 0);
    setFilteredProducts(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  };

  // FUNCIÓN PARA SELECCIONAR MÚLTIPLES IMÁGENES
  const pickEditImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Necesitamos acceso a tus fotos para cambiar las imágenes.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - editForm.images.length,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = [
        ...editForm.images,
        ...result.assets.map((asset) => asset.uri),
      ];

      if (newImages.length > 5) {
        Alert.alert(
          "Límite alcanzado",
          "Solo puedes tener un máximo de 5 imágenes por producto.",
        );
        setEditForm({ ...editForm, images: newImages.slice(0, 5) });
      } else {
        setEditForm({ ...editForm, images: newImages });
      }
    }
  };

  // FUNCIÓN PARA ELIMINAR UNA IMAGEN DEL ARRAY
  const removeImage = (indexToRemove) => {
    const newImages = editForm.images.filter(
      (_, index) => index !== indexToRemove,
    );
    setEditForm({ ...editForm, images: newImages });
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description || "",
      images: product.images || [],
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct) return;

    if (!editForm.name.trim()) {
      Alert.alert("Error", "El nombre del producto es requerido");
      return;
    }

    if (!editForm.price || parseFloat(editForm.price) <= 0) {
      Alert.alert("Error", "El precio debe ser mayor a 0");
      return;
    }

    if (!editForm.stock || parseInt(editForm.stock) < 0) {
      Alert.alert("Error", "El stock no puede ser negativo");
      return;
    }

    setUpdating(true);
    try {
      const updatedProduct = {
        id: selectedProduct.id,
        name: editForm.name.trim(),
        price: parseFloat(editForm.price),
        stock: parseInt(editForm.stock),
        description: editForm.description.trim(),
        images: editForm.images,
        category: selectedProduct.category || "other", // Usar la categoría original
        providerId: selectedProduct.providerId,
      };

      console.log("Actualizando producto con datos:", updatedProduct);

      const result = await updateProduct(updatedProduct);
      if (result.success) {
        Alert.alert("Éxito", "Producto actualizado correctamente");
        setEditModalVisible(false);

        setProducts((prev) =>
          prev.map((p) => (p.id === selectedProduct.id ? result.product : p)),
        );

        await refreshProducts();
      } else {
        Alert.alert("Error", result.error || "Error al actualizar el producto");
      }
    } catch (e) {
      console.error("Error actualizando producto:", e);
      Alert.alert("Error", "Ocurrió un error al actualizar");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelete = async (productId) => {
    Alert.alert(
      "¿Eliminar producto?",
      "Esta acción borrará el producto permanentemente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const result = await deleteProduct(productId);
            if (result.success) {
              Alert.alert("Éxito", "Producto eliminado correctamente");
              await refreshProducts();
            } else {
              Alert.alert(
                "Error",
                result.error || "Error al eliminar el producto",
              );
            }
          },
        },
      ],
    );
  };

  const renderProduct = ({ item }) => {
    const status =
      item.stock === 0 ? "out" : item.stock <= 5 ? "low" : "active";
    const config = statusColors[status];

    return (
      <View style={[styles.productCard, { backgroundColor: colors.card }]}>
        <View style={styles.imageWrapper}>
          {item.images?.[0] ? (
            <Image source={{ uri: item.images[0] }} style={styles.productImg} />
          ) : (
            <View
              style={[
                styles.imgPlaceholder,
                { backgroundColor: isDarkMode ? "#1e293b" : "#f1f5f9" },
              ]}
            >
              <Icon name="image-off" size={40} color={colors.textSecondary} />
            </View>
          )}
          {item.images && item.images.length > 1 && (
            <View
              style={[
                styles.imageCountBadge,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.imageCountText}>
                +{item.images.length - 1}
              </Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Icon name={config.icon} size={12} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <View style={styles.productBody}>
          <View style={styles.row}>
            <Text
              style={[styles.productName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              {formatPrice(item.price)}
            </Text>
          </View>
          <Text
            style={[styles.productDesc, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.description || "Sin descripción"}
          </Text>

          <View
            style={[
              styles.stockRow,
              { borderTopColor: isDarkMode ? "#334155" : "#f1f5f9" },
            ]}
          >
            <View style={styles.stockInfo}>
              <Icon
                name="archive-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.stockText, { color: colors.textSecondary }]}>
                {item.stock} unidades
              </Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.iconBtnBlue,
                  { backgroundColor: isDarkMode ? "#1e3a8a" : "#eff6ff" },
                ]}
                onPress={() => handleEdit(item)}
              >
                <Icon name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.iconBtnRed,
                  { backgroundColor: isDarkMode ? "#450a0a" : "#fef2f2" },
                ]}
                onPress={() => handleConfirmDelete(item.id)}
              >
                <Icon name="trash-can-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[styles.mainContainer, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <Animated.View
        style={[
          styles.bgCircle,
          {
            transform: [
              {
                scale: bgAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }),
              },
            ],
            backgroundColor: colors.primary,
            opacity: 0.05,
          },
        ]}
      />

      <View style={[styles.headerSafe, { backgroundColor: colors.card }]}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Icon name="chevron-left" size={32} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Mi Inventario
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("AddProduct")}
              style={styles.addBtn}
            >
              <Icon name="plus-circle" size={32} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.searchBox,
              { backgroundColor: isDarkMode ? "#1e293b" : "#f1f5f9" },
            ]}
          >
            <Icon name="magnify" size={22} color={colors.textSecondary} />
            <TextInput
              placeholder="Buscar producto..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.inputSearch, { color: colors.text }]}
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                filterProducts(products, t);
              }}
            />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.filterArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {[
            { id: "all", label: "Todos", icon: "layers" },
            { id: "low", label: "Bajo Stock", icon: "alert-octagon" },
            { id: "out", label: "Agotados", icon: "close-circle-outline" },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => {
                setSelectedFilter(f.id);
                filterProducts(products, searchQuery, f.id);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.card,
                  borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                },
                selectedFilter === f.id && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Icon
                name={f.icon}
                size={16}
                color={selectedFilter === f.id ? "#fff" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      selectedFilter === f.id ? "#fff" : colors.textSecondary,
                  },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon
              name="package-variant-closed"
              size={80}
              color={isDarkMode ? "#334155" : "#e2e8f0"}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No tienes productos registrados
            </Text>
          </View>
        }
      />

      {/* MODAL DE EDICIÓN MEJORADO */}
      <Modal visible={editModalVisible} animationType="fade" transparent>
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, maxHeight: "90%" },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: isDarkMode ? "#334155" : "#f1f5f9" },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Editar Producto
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* SECCIÓN DE IMÁGENES (hasta 5) */}
              <View style={styles.editImagesContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Imágenes ({editForm.images.length}/5)
                </Text>

                <View style={styles.imagesGrid}>
                  {editForm.images.map((imageUri, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.editPreviewImage}
                      />
                      <TouchableOpacity
                        style={styles.removeImageBtn}
                        onPress={() => removeImage(index)}
                      >
                        <Icon name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {editForm.images.length < 5 && (
                    <TouchableOpacity
                      onPress={pickEditImages}
                      style={[
                        styles.addImageBtn,
                        { borderColor: colors.primary },
                      ]}
                    >
                      <Icon name="plus" size={30} color={colors.primary} />
                      <Text
                        style={[styles.addImageText, { color: colors.primary }]}
                      >
                        Agregar
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text
                  style={[styles.imagesNote, { color: colors.textSecondary }]}
                >
                  Máximo 5 imágenes. Toca para agregar o eliminar.
                </Text>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Nombre del Producto
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
                    color: colors.text,
                    borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                  },
                ]}
                value={editForm.name}
                onChangeText={(t) => setEditForm({ ...editForm, name: t })}
                placeholder="Nombre del producto"
                placeholderTextColor={colors.textSecondary}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Precio ($)
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
                        color: colors.text,
                        borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                      },
                    ]}
                    keyboardType="numeric"
                    value={editForm.price}
                    onChangeText={(t) => setEditForm({ ...editForm, price: t })}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Stock
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
                        color: colors.text,
                        borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                      },
                    ]}
                    keyboardType="numeric"
                    value={editForm.stock}
                    onChangeText={(t) => setEditForm({ ...editForm, stock: t })}
                    placeholder="10"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Descripción
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
                    color: colors.text,
                    borderColor: isDarkMode ? "#334155" : "#e2e8f0",
                    height: 100,
                    textAlignVertical: "top",
                  },
                ]}
                multiline
                numberOfLines={4}
                value={editForm.description}
                onChangeText={(t) =>
                  setEditForm({ ...editForm, description: t })
                }
                placeholder="Descripción del producto..."
                placeholderTextColor={colors.textSecondary}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  { backgroundColor: isDarkMode ? "#334155" : "#f1f5f9" },
                ]}
                onPress={() => setEditModalVisible(false)}
                disabled={updating}
              >
                <Text
                  style={[
                    styles.cancelBtnText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: updating ? 0.7 : 1,
                  },
                ]}
                onPress={handleSaveEdit}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  bgCircle: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -50,
    right: -50,
  },
  headerSafe: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "android" ? 40 : 10,
  },
  headerTitle: { fontSize: 22, fontWeight: "900" },
  backBtn: { padding: 5 },
  addBtn: { padding: 5 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    paddingHorizontal: 15,
    borderRadius: 15,
    height: 45,
  },
  inputSearch: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: "500" },
  filterArea: { marginVertical: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
  },
  chipText: { marginLeft: 8, fontSize: 12, fontWeight: "700" },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  productCard: {
    borderRadius: 20,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 2,
  },
  imageWrapper: { height: 160, position: "relative" },
  productImg: { width: "100%", height: "100%" },
  imgPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageCountBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#3B82F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  imageCountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  statusText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  productBody: { padding: 15 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  productName: { fontSize: 16, fontWeight: "800", flex: 1, marginRight: 10 },
  productPrice: { fontSize: 18, fontWeight: "900" },
  productDesc: { fontSize: 12, marginBottom: 15 },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 12,
  },
  stockInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  stockText: { fontSize: 13, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 10 },
  iconBtnBlue: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBtnRed: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  // ESTILOS DEL MODAL MEJORADO
  modalOverlay: { flex: 1, justifyContent: "center", padding: 20 },
  modalCard: {
    borderRadius: 24,
    overflow: "hidden",
    elevation: 10,
    width: "100%",
  },
  modalHeader: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },

  // Sección de imágenes mejorada
  editImagesContainer: { marginBottom: 20 },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
    justifyContent: "flex-start",
  },
  imageItem: {
    width: (width - 100) / 3,
    height: (width - 100) / 3,
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  editPreviewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  removeImageBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(239, 68, 68, 0.8)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageBtn: {
    width: (width - 100) / 3,
    height: (width - 100) / 3,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#3B82F6",
  },
  addImageText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 5,
  },
  imagesNote: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: "italic",
    textAlign: "center",
  },

  label: { fontSize: 12, fontWeight: "700", marginBottom: 8, marginTop: 5 },
  modalInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 15,
  },
  modalFooter: {
    padding: 20,
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  cancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    fontWeight: "600",
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { marginTop: 15, fontWeight: "600", marginBottom: 20 },
});
