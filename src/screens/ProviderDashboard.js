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
  Switch, // Añadimos Switch
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useTheme } from "../context/ThemeContext"; // IMPORTAR TEMA
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width } = Dimensions.get("window");

export default function ProviderDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const { myProducts, loading, refreshProducts } = useProducts();
  const { colors, isDarkMode, toggleTheme } = useTheme(); // CONSUMIR TEMA

  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeStat, setActiveStat] = useState("today");

  // Animaciones existentes
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
  }, []);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProducts();
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

  const totalProducts = myProducts.length;
  const totalSales = myProducts.reduce(
    (sum, product) => sum + product.price * 10,
    0,
  );
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

      {/* Círculos de fondo adaptables */}
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
      <Animated.View
        style={[
          styles.bgCircle,
          {
            transform: [
              {
                translateX: bgAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 60],
                }),
              },
            ],
            bottom: 150,
            right: -60,
            backgroundColor: "#10b981",
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
        {/* Cuadro de Rendimiento */}
        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.card, borderLeftColor: colors.primary },
          ]}
        >
          <View style={styles.statsTop}>
            <Text style={[styles.statsTitle, { color: colors.textSecondary }]}>
              Resumen del negocio
            </Text>
            <View
              style={[
                styles.pillSelector,
                { backgroundColor: isDarkMode ? "#2d2d2d" : "#f1f5f9" },
              ]}
            >
              {["today", "week", "month"].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setActiveStat(t)}
                  style={[
                    styles.pill,
                    activeStat === t && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      {
                        color: activeStat === t ? "#fff" : colors.textSecondary,
                      },
                    ]}
                  >
                    {t === "today" ? "Hoy" : t === "week" ? "Sem" : "Mes"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.statsValueRow}>
            <View>
              <Text style={[styles.bigAmount, { color: colors.text }]}>
                ${totalSales.toLocaleString()}
              </Text>
              <Text
                style={[styles.statsSubtitle, { color: colors.textSecondary }]}
              >
                Ingresos estimados
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: isDarkMode ? "#064e3b" : "#ecfdf5" },
              ]}
            >
              <Icon name="trending-up" size={16} color="#10b981" />
              <Text style={[styles.badgeText, { color: "#10b981" }]}>
                +{totalProducts * 2}%
              </Text>
            </View>
          </View>
        </View>

        {/* Mini estadísticas */}
        <View style={styles.miniStats}>
          <StatCard
            icon="package-variant"
            value={totalProducts}
            label="Productos"
            color={colors.primary}
            themeColors={colors}
          />
          <StatCard
            icon="alert-circle"
            value={lowStockProducts}
            label="Bajo stock"
            color="#F59E0B"
            themeColors={colors}
          />
          <StatCard
            icon="star"
            value={totalProducts > 0 ? "4.8" : "0"}
            label="Rating"
            color="#8B5CF6"
            themeColors={colors}
          />
        </View>

        {/* Acciones Rápidas */}
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

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Tus productos ({myProducts.length})
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 20 }}
          />
        ) : (
          <View style={styles.grid}>
            {myProducts.slice(0, 4).map((item) => (
              <ProductItem
                key={item.id}
                item={item}
                themeColors={colors}
                onEdit={() => navigation.navigate("ProviderProducts")}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Menú Lateral (Drawer) */}
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

                {/* --- SECCIÓN MODO OSCURO --- */}
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
                    thumbColor={
                      Platform.OS === "ios"
                        ? "#fff"
                        : isDarkMode
                          ? "#fff"
                          : "#f4f3f4"
                    }
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

// Sub-componentes para limpiar el código principal
const StatCard = ({ icon, value, label, color, themeColors }) => (
  <View style={[styles.miniStatCard, { backgroundColor: themeColors.card }]}>
    <Icon name={icon} size={24} color={color} />
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
    </View>
    <Text
      style={[styles.itemName, { color: themeColors.text }]}
      numberOfLines={1}
    >
      {item.name}
    </Text>
    <Text style={styles.itemPrice}>${item.price}</Text>
    <Text style={[styles.itemStock, { color: themeColors.textSecondary }]}>
      {item.stock} disp.
    </Text>
  </View>
);

const DrawerLink = ({ icon, label, onPress, themeColors }) => (
  <TouchableOpacity style={styles.dLink} onPress={onPress}>
    <Icon name={icon} size={26} color={themeColors.primary} />
    <Text style={[styles.dLinkText, { color: themeColors.text }]}>{label}</Text>
  </TouchableOpacity>
);

// Los estilos se mantienen mayormente iguales, solo quitamos los colores fijos que ahora son dinámicos
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
  scroll: { padding: 20 },
  statsCard: {
    borderRadius: 25,
    padding: 20,
    elevation: 3,
    borderLeftWidth: 5,
    marginBottom: 15,
  },
  statsTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsTitle: { fontSize: 14, fontWeight: "700" },
  pillSelector: { flexDirection: "row", borderRadius: 10, padding: 3 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  pillText: { fontSize: 10, fontWeight: "700" },
  statsValueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    justifyContent: "space-between",
  },
  bigAmount: { fontSize: 32, fontWeight: "900" },
  statsSubtitle: { fontSize: 12, marginTop: 4 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
  },
  badgeText: { fontSize: 12, fontWeight: "bold", marginLeft: 3 },
  miniStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  miniStatCard: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
    elevation: 2,
  },
  miniStatValue: { fontSize: 20, fontWeight: "900", marginTop: 8 },
  miniStatLabel: { fontSize: 11, marginTop: 4 },
  row: { flexDirection: "row", gap: 15, marginVertical: 15 },
  actionBtn: {
    flex: 1,
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    elevation: 2,
  },
  iconBox: {
    width: 55,
    height: 55,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionLabel: { fontWeight: "800", fontSize: 13 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 10,
    marginBottom: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemCard: {
    width: (width - 55) / 2,
    borderRadius: 20,
    padding: 10,
    marginBottom: 15,
    elevation: 2,
  },
  imgWrap: {
    width: "100%",
    height: 100,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  img: { width: "100%", height: "100%" },
  editBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    padding: 6,
    borderRadius: 8,
  },
  itemName: { fontSize: 14, fontWeight: "700", marginTop: 10, height: 40 },
  itemPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: "#10b981",
    marginTop: 5,
  },
  itemStock: { fontSize: 12, marginTop: 2 },
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
  drawerHeader: { paddingVertical: 20, borderBottomWidth: 1, marginBottom: 20 },
  dAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  dAvatarTxt: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  dName: { fontSize: 18, fontWeight: "900" },
  dEmail: { fontSize: 13 },
  dContent: { flex: 1 },
  dLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
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
