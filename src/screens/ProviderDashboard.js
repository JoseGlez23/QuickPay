import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
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
  Easing,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useTheme } from "../context/ThemeContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { supabase } from "../utils/supabase";

const { width } = Dimensions.get("window");

export default function ProviderDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const {
    myProducts,
    providerLoading: loading,
    refreshProducts,
  } = useProducts();
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    todaySales: 0,
    monthlySales: 0,
    loading: true,
  });

  const bgAnim1 = useRef(new Animated.Value(0)).current;
  const bgAnim2 = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = (anim, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };
    float(bgAnim1, 5000);
    float(bgAnim2, 8000);

    if (user?.id) {
      loadDashboardStats();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`provider-orders-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `provider_id=eq.${user.id}`,
        },
        () => {
          loadDashboardStats();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const toggleMenu = (show) => {
    if (show) {
      setMenuVisible(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 5,
        }),
        Animated.timing(menuOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: -300, useNativeDriver: true }),
        Animated.timing(menuOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setMenuVisible(false));
    }
  };

  const loadDashboardStats = async () => {
    try {
      setDashboardStats((prev) => ({ ...prev, loading: true }));

      if (!user?.id) {
        setDashboardStats({
          totalSales: 0,
          totalOrders: 0,
          pendingOrders: 0,
          todaySales: 0,
          monthlySales: 0,
          loading: false,
        });
        return;
      }

      const { data: salesData, error: salesError } = await supabase
        .from("order_items")
        .select(
          `
          subtotal,
          quantity,
          unit_price,
          order:orders!inner(
            id,
            status,
            created_at
          )
        `,
        )
        .eq("order.provider_id", user.id)
        .eq("order.status", "paid")
        .order("created_at", {
          ascending: false,
          foreignTable: "order",
        });

      if (salesError) {
        console.error("Error cargando ventas:", salesError);
      }

      const { data: pendingOrdersData, error: pendingError } = await supabase
        .from("orders")
        .select("id, status")
        .eq("provider_id", user.id)
        .in("status", ["pending", "paid"])
        .limit(100);

      let totalSales = 0;
      let todaySales = 0;
      let monthlySales = 0;
      const uniqueOrderIds = new Set();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );
      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      );

      if (salesData && salesData.length > 0) {
        salesData.forEach((item) => {
          const subtotal = item.subtotal || item.quantity * item.unit_price;
          totalSales += subtotal;
          uniqueOrderIds.add(item.order.id);

          const orderDate = new Date(item.order.created_at);

          if (orderDate >= today) {
            todaySales += subtotal;
          }

          if (orderDate >= firstDayOfMonth && orderDate <= lastDayOfMonth) {
            monthlySales += subtotal;
          }
        });
      }

      const totalOrders = uniqueOrderIds.size;
      const pendingOrders = pendingOrdersData?.length || 0;

      setDashboardStats({
        totalSales,
        totalOrders,
        pendingOrders,
        todaySales,
        monthlySales,
        loading: false,
      });
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
      setDashboardStats({
        totalSales: 0,
        totalOrders: 0,
        pendingOrders: 0,
        todaySales: 0,
        monthlySales: 0,
        loading: false,
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProducts(), loadDashboardStats()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro que quieres cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          await logout();
          toggleMenu(false);
        },
      },
    ]);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalProducts = myProducts.length;
  const lowStockProducts = myProducts.filter(
    (p) => p.stock > 0 && p.stock <= 5,
  ).length;

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <Animated.View
        style={[
          styles.bgCircle,
          {
            transform: [
              {
                translateY: bgAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 50],
                }),
              },
            ],
            top: 50,
            left: -40,
            backgroundColor: colors.primary,
            opacity: isDarkMode ? 0.08 : 0.12,
          },
        ]}
      />

      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: colors.card,
            shadowColor: isDarkMode ? "#000" : "#64748b",
          },
        ]}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => toggleMenu(true)}
              style={styles.menuBtn}
            >
              <Icon name="menu" size={32} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.textContainer}>
              <Text style={[styles.greet, { color: colors.textSecondary }]}>
                Panel de Control
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.name || "Proveedor"}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.profileAvatar,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => navigation.navigate("ProviderProfile")}
            >
              <Text style={styles.avatarTxt}>
                {user?.name?.charAt(0) || "P"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.card, borderLeftColor: colors.primary },
          ]}
        >
          <View style={styles.statsHeaderRow}>
            <Text style={[styles.statsTitle, { color: colors.textSecondary }]}>
              Resumen de ingresos
            </Text>
            {dashboardStats.loading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          {dashboardStats.loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.statsValueRow}>
              <View>
                <Text style={[styles.bigAmount, { color: colors.text }]}>
                  {formatCurrency(dashboardStats.totalSales)}
                </Text>
                <Text
                  style={[
                    styles.statsSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Ingresos totales
                </Text>
              </View>
              <Icon
                name="cash-multiple"
                size={40}
                color={colors.primary}
                opacity={0.2}
              />
            </View>
          )}
        </View>

        <View style={styles.miniStats}>
          <StatCard
            icon="package-variant"
            value={dashboardStats.totalOrders}
            label="Pedidos"
            color="#3b82f6"
            themeColors={colors}
          />
          <StatCard
            icon="clock-outline"
            value={dashboardStats.pendingOrders}
            label="Pendientes"
            color="#f59e0b"
            themeColors={colors}
          />
          <StatCard
            icon="calendar-today"
            value={formatCurrency(dashboardStats.todaySales)}
            label="Hoy"
            color="#10b981"
            themeColors={colors}
          />
        </View>

        <View style={styles.additionalStats}>
          <View
            style={[
              styles.additionalStatCard,
              { backgroundColor: colors.card },
            ]}
          >
            <Icon name="calendar-month" size={24} color="#8b5cf6" />
            <View style={styles.additionalStatInfo}>
              <Text
                style={[styles.additionalStatValue, { color: colors.text }]}
              >
                {formatCurrency(dashboardStats.monthlySales)}
              </Text>
              <Text
                style={[
                  styles.additionalStatLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Este mes
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.additionalStatCard,
              { backgroundColor: colors.card },
            ]}
          >
            <Icon name="package" size={24} color="#10b981" />
            <View style={styles.additionalStatInfo}>
              <Text
                style={[styles.additionalStatValue, { color: colors.text }]}
              >
                {totalProducts}
              </Text>
              <Text
                style={[
                  styles.additionalStatLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Productos
              </Text>
            </View>
          </View>
        </View>

        {lowStockProducts > 0 && (
          <View
            style={[
              styles.lowStockAlert,
              { backgroundColor: isDarkMode ? "#451a03" : "#fffbeb" },
            ]}
          >
            <View style={styles.lowStockHeader}>
              <Icon name="alert" size={20} color="#f59e0b" />
              <Text
                style={[
                  styles.lowStockTitle,
                  { color: isDarkMode ? "#fbbf24" : "#92400e" },
                ]}
              >
                Atención: Stock bajo
              </Text>
            </View>
            <Text
              style={[
                styles.lowStockText,
                { color: isDarkMode ? "#fbbf24" : "#92400e" },
              ]}
            >
              Tienes {lowStockProducts} producto
              {lowStockProducts > 1 ? "s" : ""} con menos de 5 unidades en stock
            </Text>
            <TouchableOpacity
              style={[
                styles.lowStockButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => navigation.navigate("ProviderProducts")}
            >
              <Text style={[styles.lowStockButtonText, { color: "#fff" }]}>
                Reabastecer
              </Text>
              <Icon name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Acciones rápidas
        </Text>
        <View style={styles.row}>
          <ActionButton
            icon="plus-box"
            label="Añadir"
            color="#10b981"
            bg="#ecfdf5"
            darkBg="#064e3b"
            onPress={() => navigation.navigate("AddProduct")}
            themeColors={colors}
          />
          <ActionButton
            icon="truck-delivery"
            label="Pedidos"
            color={colors.primary}
            bg="#eff6ff"
            darkBg="#1e3a8a"
            onPress={() => navigation.navigate("ProviderOrders")}
            themeColors={colors}
          />
        </View>

        <View style={styles.productsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Tus productos ({myProducts.length})
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("ProviderProducts")}
            style={styles.viewAllButton}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              Ver todos
            </Text>
            <Icon name="chevron-right" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 20 }}
          />
        ) : myProducts.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Icon
              name="package-variant-closed"
              size={50}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              No tienes productos aún
            </Text>
            <Text
              style={[styles.emptyStateText, { color: colors.textSecondary }]}
            >
              Comienza agregando tu primer producto para empezar a vender
            </Text>
            <TouchableOpacity
              style={[
                styles.emptyStateButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => navigation.navigate("AddProduct")}
            >
              <Icon
                name="plus"
                size={20}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.emptyStateButtonText}>
                Agregar primer producto
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {myProducts.slice(0, 4).map((item) => (
              <ProductItem
                key={item.id}
                item={item}
                themeColors={colors}
                onEdit={() =>
                  navigation.navigate("ProviderProducts", {
                    editProductId: item.id,
                  })
                }
              />
            ))}
          </View>
        )}

        {myProducts.length > 4 && (
          <TouchableOpacity
            style={[styles.seeMoreBtn, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate("ProviderProducts")}
          >
            <Text style={[styles.seeMoreText, { color: colors.primary }]}>
              Ver todos los productos ({myProducts.length})
            </Text>
            <Icon name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {dashboardStats.totalOrders > 0 && (
          <View style={[styles.recentOrders, { backgroundColor: colors.card }]}>
            <View style={styles.recentOrdersHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Actividad reciente
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("ProviderOrders")}
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  Ver todos
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentOrdersContent}>
              <Icon
                name="chart-line"
                size={30}
                color={colors.primary}
                opacity={0.2}
              />
              <Text
                style={[
                  styles.recentOrdersText,
                  { color: colors.textSecondary },
                ]}
              >
                {dashboardStats.todaySales > 0
                  ? `Hoy has generado ${formatCurrency(dashboardStats.todaySales)} en ventas`
                  : `Tienes ${dashboardStats.totalOrders} pedidos en total`}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {menuVisible && (
        <>
          <Animated.View style={[styles.overlay, { opacity: menuOpacity }]}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => toggleMenu(false)}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateX: slideAnim }],
                backgroundColor: colors.card,
              },
            ]}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <View
                style={[
                  styles.drawerHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View
                  style={[styles.dAvatar, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.dAvatarTxt}>{user?.name?.charAt(0)}</Text>
                </View>
                <Text style={[styles.dName, { color: colors.text }]}>
                  {user?.name}
                </Text>
                <Text style={[styles.dEmail, { color: colors.textSecondary }]}>
                  {user?.email}
                </Text>
              </View>

              <View style={styles.dContent}>
                <DrawerLink
                  icon="home"
                  label="Dashboard"
                  onPress={() => toggleMenu(false)}
                  themeColors={colors}
                />
                <DrawerLink
                  icon="account-circle"
                  label="Perfil"
                  onPress={() => {
                    toggleMenu(false);
                    navigation.navigate("ProviderProfile");
                  }}
                  themeColors={colors}
                />
                <View style={styles.themeSwitchRow}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 15,
                    }}
                  >
                    <Icon
                      name={isDarkMode ? "weather-night" : "weather-sunny"}
                      size={26}
                      color={colors.primary}
                    />
                    <Text style={[styles.dLinkText, { color: colors.text }]}>
                      Modo Oscuro
                    </Text>
                  </View>
                  <Switch
                    value={isDarkMode}
                    onValueChange={toggleTheme}
                    trackColor={{ false: "#cbd5e1", true: colors.primary }}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.logout,
                  { backgroundColor: isDarkMode ? "#451a1a" : "#fff1f2" },
                ]}
                onPress={handleLogout}
              >
                <Icon name="logout" size={22} color="#ef4444" />
                <Text style={styles.logoutTxt}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Animated.View>
        </>
      )}
    </View>
  );
}

// Sub-componentes
const StatCard = ({ icon, value, label, color, themeColors }) => (
  <View style={[styles.miniStatCard, { backgroundColor: themeColors.card }]}>
    <Icon name={icon} size={28} color={color} />
    <Text style={[styles.miniStatValue, { color: themeColors.text }]}>
      {value}
    </Text>
    <Text style={[styles.miniStatLabel, { color: themeColors.textSecondary }]}>
      {label}
    </Text>
  </View>
);

const ActionButton = ({
  icon,
  label,
  color,
  bg,
  darkBg,
  onPress,
  themeColors,
}) => (
  <TouchableOpacity
    style={[
      styles.actionBtn,
      { backgroundColor: themeColors.card, borderColor: color },
    ]}
    onPress={onPress}
  >
    <View
      style={[
        styles.iconBox,
        { backgroundColor: themeColors.isDarkMode ? darkBg : bg },
      ]}
    >
      <Icon name={icon} size={32} color={color} />
    </View>
    <Text style={[styles.actionLabel, { color: themeColors.text }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ProductItem = ({ item, themeColors, onEdit }) => (
  <View style={[styles.itemCard, { backgroundColor: themeColors.card }]}>
    <View
      style={[
        styles.imgWrap,
        { backgroundColor: themeColors.isDarkMode ? "#2d2d2d" : "#f1f5f9" },
      ]}
    >
      {item.images?.[0] ? (
        <Image source={{ uri: item.images[0] }} style={styles.img} />
      ) : (
        <Icon name="image-off" size={24} color="#ccc" />
      )}
      <TouchableOpacity
        style={[styles.editBtn, { backgroundColor: themeColors.primary }]}
        onPress={onEdit}
      >
        <Icon name="pencil" size={14} color="#fff" />
      </TouchableOpacity>
      {item.stock <= 5 && item.stock > 0 && (
        <View style={[styles.lowStockBadge, { backgroundColor: "#f59e0b" }]}>
          <Text style={styles.lowStockBadgeText}>{item.stock}</Text>
        </View>
      )}
      {item.stock === 0 && (
        <View style={[styles.lowStockBadge, { backgroundColor: "#ef4444" }]}>
          <Icon name="cancel" size={12} color="#fff" />
        </View>
      )}
    </View>
    <Text
      style={[styles.itemName, { color: themeColors.text }]}
      numberOfLines={1}
    >
      {item.name}
    </Text>
    <Text style={styles.itemPrice}>${parseFloat(item.price).toFixed(2)}</Text>
    <View style={styles.itemStockRow}>
      <Icon
        name={item.stock > 0 ? "check-circle" : "cancel"}
        size={12}
        color={item.stock > 0 ? "#10b981" : "#ef4444"}
      />
      <Text
        style={[
          styles.itemStock,
          {
            color: item.stock > 0 ? themeColors.textSecondary : "#ef4444",
          },
        ]}
      >
        {item.stock > 0 ? `${item.stock} disp.` : "Agotado"}
      </Text>
    </View>
  </View>
);

const DrawerLink = ({ icon, label, onPress, themeColors }) => (
  <TouchableOpacity style={styles.dLink} onPress={onPress}>
    <Icon name={icon} size={26} color={themeColors.primary} />
    <Text style={[styles.dLinkText, { color: themeColors.text }]}>{label}</Text>
  </TouchableOpacity>
);

// Tus estilos originales (sin cambios)
const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  bgCircle: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  headerContainer: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    paddingBottom: 15,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 35 : 10,
  },
  menuBtn: { padding: 5 },
  textContainer: { flex: 1, marginLeft: 15 },
  greet: { fontSize: 12, fontWeight: "600" },
  userName: { fontSize: 20, fontWeight: "900" },
  profileAvatar: {
    width: 45,
    height: 45,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  scroll: { padding: 20, paddingBottom: 40 },
  statsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  statsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statsTitle: { fontSize: 14, fontWeight: "600" },
  statsValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bigAmount: { fontSize: 28, fontWeight: "900" },
  statsSubtitle: { fontSize: 12, marginTop: 4 },
  loadingContainer: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  miniStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 10,
  },
  miniStatCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    elevation: 1,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
    textAlign: "center",
    minHeight: 24,
  },
  miniStatLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  additionalStats: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  additionalStatCard: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    gap: 12,
  },
  additionalStatInfo: {
    flex: 1,
  },
  additionalStatValue: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  additionalStatLabel: {
    fontSize: 12,
  },
  lowStockAlert: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  lowStockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  lowStockTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  lowStockText: {
    fontSize: 13,
    marginBottom: 12,
  },
  lowStockButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  lowStockButtonText: {
    fontSize: 14,
    fontWeight: "700",
    marginRight: 8,
  },
  row: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    elevation: 1,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemCard: {
    width: (width - 55) / 2,
    borderRadius: 15,
    padding: 12,
    marginBottom: 15,
    elevation: 1,
  },
  imgWrap: {
    width: "100%",
    height: 100,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    marginBottom: 10,
  },
  img: {
    width: "100%",
    height: "100%",
  },
  editBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    padding: 5,
    borderRadius: 6,
  },
  lowStockBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 20,
    alignItems: "center",
  },
  lowStockBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  itemName: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
    height: 36,
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 2,
    color: "#10b981",
  },
  itemStockRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 5,
  },
  itemStock: {
    fontSize: 11,
  },
  emptyState: {
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    marginBottom: 20,
    elevation: 1,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyStateButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyStateButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  seeMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
    elevation: 1,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: "700",
    marginRight: 5,
  },
  recentOrders: {
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    elevation: 2,
  },
  recentOrdersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  recentOrdersContent: {
    alignItems: "center",
    paddingVertical: 10,
  },
  recentOrdersText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 1000,
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    zIndex: 1001,
    padding: 25,
  },
  drawerHeader: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    marginBottom: 20,
    alignItems: "center",
  },
  dAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  dAvatarTxt: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  dName: { fontSize: 18, fontWeight: "900", textAlign: "center" },
  dEmail: { fontSize: 13, textAlign: "center", marginBottom: 10 },
  dContent: { flex: 1 },
  dLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 15,
  },
  themeSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  dLinkText: { fontSize: 16, fontWeight: "700" },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 15,
    borderRadius: 15,
    marginTop: 20,
  },
  logoutTxt: { color: "#ef4444", fontWeight: "800" },
});
