import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  RefreshControl, Alert, StatusBar, SafeAreaView, Animated,
  Dimensions, TextInput, Modal, ScrollView, Platform, ActivityIndicator
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";

const { width } = Dimensions.get("window");

const THEME = {
  primary: "#2563eb", 
  secondary: "#10b981", 
  background: "#f8fafc",
  card: "#ffffff",
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  danger: "#ef4444",
};

const statusColors = {
  active: { bg: "#D1FAE5", color: "#10B981", label: "En Stock", icon: "check-circle" },
  low: { bg: "#FEF3C7", color: "#F59E0B", label: "Stock bajo", icon: "alert-circle" },
  out: { bg: "#FEE2E2", color: "#EF4444", label: "Agotado", icon: "close-circle" },
};

export default function ProviderProductsScreen({ navigation }) {
  const { user } = useAuth();
  const { 
    myProducts, 
    loading, 
    error, 
    deleteProduct, 
    updateProduct, 
    refreshProducts 
  } = useProducts();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", price: "", stock: "", description: "" });
  const [updating, setUpdating] = useState(false);

  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setProducts(myProducts);
    filterProducts(myProducts, searchQuery, selectedFilter);

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 0, duration: 8000, useNativeDriver: true }),
      ])
    ).start();
  }, [myProducts, user?.id]);

  const filterProducts = (productList, query = searchQuery, filter = selectedFilter) => {
    let filtered = productList;
    if (query.trim() !== "") {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    }
    if (filter === "low") filtered = filtered.filter((p) => p.stock > 0 && p.stock <= 5);
    else if (filter === "out") filtered = filtered.filter((p) => p.stock === 0);
    setFilteredProducts(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  };

  // --- FUNCIÓN CON ALERTA DE SEGURIDAD PARA ELIMINAR ---
  const handleConfirmDelete = async (productId) => {
    Alert.alert(
      "¿Eliminar producto?",
      "Esta acción borrará el producto permanentemente de tu inventario. ¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            const result = await deleteProduct(productId);
            if (result.success) {
              Alert.alert("Éxito", "Producto eliminado correctamente.");
              // Actualizar lista local
              setProducts(prev => prev.filter(p => p.id !== productId));
            } else {
              Alert.alert("Error", result.error || "No se pudo eliminar el producto");
            }
          } 
        }
      ]
    );
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description || "",
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct) return;
    
    setUpdating(true);
    try {
      const updatedProduct = {
        ...selectedProduct,
        ...editForm,
        price: parseFloat(editForm.price),
        stock: parseInt(editForm.stock),
        id: selectedProduct.id
      };

      const result = await updateProduct(updatedProduct);
      if (result.success) {
        Alert.alert("Éxito", "Producto actualizado correctamente");
        setEditModalVisible(false);
        // Actualizar lista local
        setProducts(prev => 
          prev.map(p => p.id === selectedProduct.id ? result.product : p)
        );
      } else {
        Alert.alert("Error", result.error || "No se pudo actualizar el producto");
      }
    } catch (error) {
      Alert.alert("Error", "Error al actualizar el producto");
    } finally {
      setUpdating(false);
    }
  };

  const renderProduct = ({ item }) => {
    const status = item.stock === 0 ? "out" : item.stock <= 5 ? "low" : "active";
    const config = statusColors[status];

    return (
      <View style={styles.productCard}>
        <View style={styles.imageWrapper}>
          {item.images?.[0] ? (
            <Image source={{ uri: item.images[0] }} style={styles.productImg} />
          ) : (
            <View style={styles.imgPlaceholder}><Icon name="image-off" size={40} color="#cbd5e1" /></View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Icon name={config.icon} size={12} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.productBody}>
          <View style={styles.row}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
          </View>
          
          <Text style={styles.productDesc} numberOfLines={2}>{item.description || "Sin descripción"}</Text>

          <View style={styles.stockRow}>
            <View style={styles.stockInfo}>
              <Icon name="archive-outline" size={16} color={THEME.textSecondary} />
              <Text style={styles.stockText}>{item.stock} unidades</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.iconBtnBlue} onPress={() => handleEdit(item)}>
                <Icon name="pencil" size={20} color={THEME.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtnRed} onPress={() => handleConfirmDelete(item.id)}>
                <Icon name="trash-can-outline" size={20} color={THEME.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <Animated.View style={[styles.bgCircle, { 
        transform: [{ scale: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }],
        top: -50, right: -50, backgroundColor: THEME.primary, opacity: 0.05 
      }]} />

      <View style={styles.headerSafe}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="chevron-left" size={32} color={THEME.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mi Inventario</Text>
            <TouchableOpacity onPress={() => navigation.navigate("AddProduct")} style={styles.addBtn}>
              <Icon name="plus-circle" size={32} color={THEME.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Icon name="magnify" size={22} color={THEME.textSecondary} />
            <TextInput
              placeholder="Buscar producto..."
              style={styles.inputSearch}
              value={searchQuery}
              onChangeText={(t) => {setSearchQuery(t); filterProducts(products, t);}}
            />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.filterArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20}}>
          {[{id:'all', label: 'Todos', icon:'layers'}, {id:'low', label: 'Bajo Stock', icon:'alert-octagon'}, {id:'out', label: 'Agotados', icon:'close-circle-outline'}].map(f => (
            <TouchableOpacity 
              key={f.id} 
              onPress={() => {setSelectedFilter(f.id); filterProducts(products, searchQuery, f.id);}}
              style={[styles.chip, selectedFilter === f.id && styles.chipActive]}
            >
              <Icon name={f.icon} size={16} color={selectedFilter === f.id ? '#fff' : THEME.textSecondary} />
              <Text style={[styles.chipText, selectedFilter === f.id && {color: '#fff'}]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={24} color={THEME.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshProducts}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={[THEME.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="package-variant-closed" size={80} color="#e2e8f0" />
            <Text style={styles.emptyText}>No tienes productos registrados</Text>
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={() => navigation.navigate("AddProduct")}
            >
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.addFirstText}>Agregar primer producto</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal de Edición */}
      <Modal visible={editModalVisible} animationType="fade" transparent onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Producto</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} disabled={updating}>
                <Icon name="close" size={24} color={THEME.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{padding: 20}}>
              <Text style={styles.label}>Nombre del producto</Text>
              <TextInput 
                style={styles.modalInput} 
                value={editForm.name} 
                onChangeText={t => setEditForm({...editForm, name: t})} 
                editable={!updating}
              />
              
              <View style={{flexDirection: 'row', gap: 10}}>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>Precio ($)</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    keyboardType="numeric" 
                    value={editForm.price} 
                    onChangeText={t => setEditForm({...editForm, price: t})} 
                    editable={!updating}
                  />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>Stock actual</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    keyboardType="numeric" 
                    value={editForm.stock} 
                    onChangeText={t => setEditForm({...editForm, stock: t})} 
                    editable={!updating}
                  />
                </View>
              </View>

              <Text style={styles.label}>Descripción</Text>
              <TextInput 
                style={[styles.modalInput, {height: 80}]} 
                multiline 
                textAlignVertical="top" 
                value={editForm.description} 
                onChangeText={t => setEditForm({...editForm, description: t})} 
                editable={!updating}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.saveBtn, updating && styles.saveBtnDisabled]} 
                onPress={handleSaveEdit}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
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
  mainContainer: { flex: 1, backgroundColor: THEME.background },
  bgCircle: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  headerSafe: { backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4, zIndex: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: THEME.textPrimary },
  backBtn: { padding: 5 },
  addBtn: { padding: 5 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', margin: 20, paddingHorizontal: 15, borderRadius: 15, height: 45 },
  inputSearch: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '500' },
  filterArea: { marginVertical: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  chipText: { marginLeft: 8, fontSize: 12, fontWeight: '700', color: THEME.textSecondary },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  productCard: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 15, overflow: 'hidden', elevation: 2 },
  imageWrapper: { height: 160, position: 'relative' },
  productImg: { width: '100%', height: '100%' },
  imgPlaceholder: { width: '100%', height: '100%', backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  statusBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 5 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  productBody: { padding: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  productName: { fontSize: 16, fontWeight: '800', color: THEME.textPrimary, flex: 1, marginRight: 10 },
  productPrice: { fontSize: 18, fontWeight: '900', color: THEME.primary },
  productDesc: { fontSize: 12, color: THEME.textSecondary, marginBottom: 15 },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  stockInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockText: { fontSize: 13, fontWeight: '600', color: THEME.textSecondary },
  actionRow: { flexDirection: 'row', gap: 10 },
  iconBtnBlue: { backgroundColor: '#eff6ff', width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  iconBtnRed: { backgroundColor: '#fef2f2', width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
  modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: THEME.textPrimary },
  label: { fontSize: 12, fontWeight: '700', color: THEME.textSecondary, marginBottom: 8, marginTop: 5 },
  modalInput: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15 },
  modalFooter: { padding: 20 },
  saveBtn: { backgroundColor: THEME.primary, padding: 15, borderRadius: 15, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: THEME.textSecondary, opacity: 0.7 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: THEME.textSecondary },
  errorContainer: { backgroundColor: '#fef2f2', marginHorizontal: 20, marginTop: 10, padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: { flex: 1, color: THEME.danger, fontSize: 12 },
  retryButton: { backgroundColor: THEME.danger, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: THEME.textSecondary, marginTop: 15, fontWeight: '600', marginBottom: 20 },
  addFirstButton: { backgroundColor: THEME.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 8 },
  addFirstText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});