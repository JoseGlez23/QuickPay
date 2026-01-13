// src/screens/ProviderDashboard.js
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  Animated,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import ProviderBottomNav from "../components/ProviderBottomNav";

const THEME = {
  primary: "#1E3A8A", // Azul Corporativo
  secondary: "#10B981", // Verde Esmeralda
  background: "#F1F5F9",
  card: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  danger: "#EF4444",
};

const { width } = Dimensions.get("window");
const STATUSBAR_HEIGHT =
  Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 0;

export default function ProviderDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const { products: allProducts, deleteProduct } = useProducts();

  const myProducts = allProducts.filter((p) => p.providerId === user?.id);

  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeStat, setActiveStat] = useState("today");

  const menuOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const statsData = {
    today: {
      sales: myProducts.length * 75,
      orders: Math.floor(myProducts.length * 0.8),
    },
    week: {
      sales: myProducts.length * 525,
      orders: Math.floor(myProducts.length * 5.6),
    },
    month: {
      sales: myProducts.length * 2250,
      orders: Math.floor(myProducts.length * 24),
    },
  };

  const currentStats = statsData[activeStat];

  // Acciones rápidas simplificadas
  const quickActions = [
    {
      id: "1",
      title: "Nuevo Producto",
      icon: "add-business",
      color: THEME.secondary,
      screen: "AddProduct",
    },
    {
      id: "2",
      title: "Gestionar Pedidos",
      icon: "local_shipping",
      color: THEME.primary,
      screen: "ProviderOrders",
    },
  ];

  const openMenu = () => {
    setMenuVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(menuOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: -300,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(menuOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setMenuVisible(false));
  };

  const handleDelete = (productId) => {
    Alert.alert(
      "Eliminar Producto",
      "¿Estás seguro de que deseas eliminar este producto permanentemente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteProduct(productId),
        },
      ]
    );
  };

  const handleEdit = (product) => {
    navigation.navigate("AddProduct", { product });
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.productImageWrapper}>
        {item.images?.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImg}>
            <Icon name="image" size={30} color={THEME.border} />
          </View>
        )}
        <TouchableOpacity
          style={styles.editBadge}
          onPress={() => handleEdit(item)}
        >
          <Icon name="edit" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.productDetails}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>

        <View style={styles.stockRow}>
          <View
            style={[
              styles.indicator,
              {
                backgroundColor:
                  item.stock > 5 ? THEME.secondary : THEME.danger,
              },
            ]}
          />
          <Text style={styles.stockText}>{item.stock} unidades</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Icon name="delete-outline" size={18} color={THEME.danger} />
          <Text style={styles.deleteText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header Simplificado sin campana ni búsqueda */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openMenu} style={styles.menuTrigger}>
          <Icon name="menu-open" size={30} color={THEME.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerGreeting}>Hola,</Text>
          <Text style={styles.headerName}>
            {user?.name?.split(" ")[0] || "Proveedor"}
          </Text>
        </View>
        <View style={styles.headerLogo}>
          <View style={styles.logoCircle}>
            <Icon name="bolt" size={20} color="#fff" />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME.primary]}
          />
        }
      >
        {/* Sección de Ventas */}
        <View style={styles.statsSection}>
          <View style={styles.statsHeader}>
            <Text style={styles.sectionTitle}>Resumen de Negocio</Text>
            <View style={styles.tabSelector}>
              {["today", "week", "month"].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setActiveStat(t)}
                  style={[styles.tab, activeStat === t && styles.tabActive]}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      activeStat === t && styles.tabLabelActive,
                    ]}
                  >
                    {t === "today" ? "Hoy" : t === "week" ? "Semana" : "Mes"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.mainCard}>
            <View>
              <Text style={styles.mainCardLabel}>Ventas Totales</Text>
              <Text style={styles.mainCardValue}>
                ${currentStats.sales.toLocaleString()}
              </Text>
            </View>
            <View style={styles.mainCardStats}>
              <Icon name="trending-up" size={24} color={THEME.secondary} />
              <Text style={styles.ordersCount}>
                {currentStats.orders} Pedidos
              </Text>
            </View>
          </View>
        </View>

        {/* Botones de Acción */}
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View
                style={[
                  styles.actionIconBg,
                  { backgroundColor: action.color + "15" },
                ]}
              >
                <Icon name={action.icon} size={28} color={action.color} />
              </View>
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Listado de Productos con Diseño de Tarjeta Mejorado */}
        <View style={styles.inventoryContainer}>
          <Text style={[styles.sectionTitle, { marginBottom: 15 }]}>
            Mis Productos
          </Text>
          <View style={styles.productsList}>
            {myProducts.map((item) => (
              <View key={item.id} style={styles.productWrapper}>
                {renderProduct({ item })}
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Menú Lateral */}
      {menuVisible && (
        <>
          <Animated.View style={[styles.overlay, { opacity: menuOpacity }]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={closeMenu}
            />
          </Animated.View>
          <Animated.View
            style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
          >
            <View style={styles.drawerHeader}>
              <View style={styles.drawerAvatar}>
                <Icon name="store" size={30} color="#fff" />
              </View>
              <Text style={styles.drawerUser}>{user?.name || "Comercio"}</Text>
              <Text style={styles.drawerEmail}>{user?.email}</Text>
            </View>
            <TouchableOpacity style={styles.drawerItem} onPress={handleLogout}>
              <Icon name="logout" size={22} color={THEME.danger} />
              <Text style={styles.drawerItemText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: STATUSBAR_HEIGHT + 10,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  menuTrigger: { padding: 5 },
  headerInfo: { flex: 1, marginLeft: 15 },
  headerGreeting: { fontSize: 14, color: THEME.textSecondary },
  headerName: { fontSize: 22, fontWeight: "800", color: THEME.textPrimary },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollBody: { paddingTop: 20 },
  statsSection: { paddingHorizontal: 20, marginBottom: 25 },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: THEME.textPrimary },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 4,
  },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  tabActive: { backgroundColor: "#fff" },
  tabLabel: { fontSize: 11, fontWeight: "700", color: THEME.textSecondary },
  tabLabelActive: { color: THEME.primary },
  mainCard: {
    backgroundColor: THEME.primary,
    borderRadius: 24,
    padding: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 10,
    shadowColor: THEME.primary,
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  mainCardLabel: { color: "#ffffff90", fontSize: 13, fontWeight: "600" },
  mainCardValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 5,
  },
  mainCardStats: { alignItems: "flex-end" },
  ordersCount: { color: "#fff", fontSize: 14, fontWeight: "600", marginTop: 5 },
  actionsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 30,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionText: { fontSize: 13, fontWeight: "700", color: THEME.textPrimary },
  inventoryContainer: { paddingHorizontal: 20 },
  productsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productWrapper: { width: (width - 55) / 2, marginBottom: 15 },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  productImageWrapper: {
    width: "100%",
    height: 130,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  productImage: { width: "100%", height: "100%" },
  placeholderImg: {
    width: "100%",
    height: "100%",
    backgroundColor: THEME.background,
    justifyContent: "center",
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: THEME.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  productDetails: { marginTop: 12, paddingHorizontal: 5 },
  productName: { fontSize: 15, fontWeight: "700", color: THEME.textPrimary },
  productPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.secondary,
    marginVertical: 4,
  },
  stockRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  indicator: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  stockText: { fontSize: 12, color: THEME.textSecondary, fontWeight: "600" },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 10,
    gap: 5,
  },
  deleteText: { fontSize: 12, fontWeight: "700", color: THEME.danger },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 1000,
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: "#fff",
    zIndex: 1001,
    paddingTop: STATUSBAR_HEIGHT + 20,
  },
  drawerHeader: {
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    marginBottom: 20,
  },
  drawerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: THEME.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  drawerUser: { fontSize: 18, fontWeight: "800", color: THEME.textPrimary },
  drawerEmail: { fontSize: 13, color: THEME.textSecondary },
  drawerItem: { flexDirection: "row", alignItems: "center", padding: 20 },
  drawerItemText: {
    marginLeft: 15,
    fontSize: 15,
    fontWeight: "700",
    color: THEME.danger,
  },
});
