import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  RefreshControl, Animated, SafeAreaView, StatusBar, Platform,
  Dimensions, Alert, Easing, ActivityIndicator
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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

export default function ProviderDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const { myProducts, loading, refreshProducts } = useProducts();

  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeStat, setActiveStat] = useState("today");

  const bgAnim1 = useRef(new Animated.Value(0)).current;
  const bgAnim2 = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = (anim, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    };
    float(bgAnim1, 5000);
    float(bgAnim2, 8000);
  }, []);

  const toggleMenu = (show) => {
    if (show) {
      setMenuVisible(true);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 5 }),
        Animated.timing(menuOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: -300, useNativeDriver: true }),
        Animated.timing(menuOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMenuVisible(false));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  };

  // CORREGIDO: Función handleLogout con Alert
  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Cerrar sesión", 
          style: "destructive",
          onPress: async () => {
            // SOLO llamamos a logout, NO navegamos manualmente
            await logout();
            // Cerrar el menú después del logout
            toggleMenu(false);
          }
        }
      ]
    );
  };

  // Calcular estadísticas
  const totalProducts = myProducts.length;
  const totalSales = myProducts.reduce((sum, product) => sum + (product.price * 10), 0);
  const lowStockProducts = myProducts.filter(p => p.stock > 0 && p.stock <= 5).length;

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <Animated.View style={[styles.bgCircle, { 
        transform: [{ translateY: bgAnim1.interpolate({ inputRange: [0, 1], outputRange: [-20, 50] }) }],
        top: 50, left: -40, backgroundColor: THEME.primary, opacity: 0.12 
      }]} />
      <Animated.View style={[styles.bgCircle, { 
        transform: [{ translateX: bgAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }) }],
        bottom: 150, right: -60, backgroundColor: THEME.secondary, opacity: 0.12 
      }]} />

      <View style={styles.headerContainer}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => toggleMenu(true)} style={styles.menuBtn}>
              <Icon name="menu" size={32} color={THEME.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.textContainer}>
              <Text style={styles.greet}>Panel de Control</Text>
              <Text style={styles.userName}>{user?.name || "Proveedor"}</Text>
            </View>

            <TouchableOpacity 
              style={styles.profileAvatar} 
              onPress={() => navigation.navigate("ProviderProfile")}
            >
              <Text style={styles.avatarTxt}>{user?.name?.charAt(0) || "P"}</Text>
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
            colors={[THEME.primary]}
          />
        }
      >
        {/* Cuadro de Rendimiento PRO */}
        <View style={styles.statsCard}>
          <View style={styles.statsTop}>
            <Text style={styles.statsTitle}>Resumen del negocio</Text>
            <View style={styles.pillSelector}>
              {['today', 'week', 'month'].map(t => (
                <TouchableOpacity key={t} onPress={() => setActiveStat(t)} style={[styles.pill, activeStat === t && styles.pillActive]}>
                  <Text style={[styles.pillText, activeStat === t && styles.pillTextActive]}>
                    {t === 'today' ? 'Hoy' : t === 'week' ? 'Sem' : 'Mes'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.statsValueRow}>
            <View>
              <Text style={styles.bigAmount}>${totalSales.toLocaleString()}</Text>
              <Text style={styles.statsSubtitle}>Ingresos estimados</Text>
            </View>
            <View style={styles.badge}>
              <Icon name="trending-up" size={16} color={THEME.secondary} />
              <Text style={styles.badgeText}>+{totalProducts * 2}%</Text>
            </View>
          </View>
        </View>

        {/* Mini estadísticas */}
        <View style={styles.miniStats}>
          <View style={styles.miniStatCard}>
            <Icon name="package-variant" size={24} color={THEME.primary} />
            <Text style={styles.miniStatValue}>{totalProducts}</Text>
            <Text style={styles.miniStatLabel}>Productos</Text>
          </View>
          <View style={styles.miniStatCard}>
            <Icon name="alert-circle" size={24} color="#F59E0B" />
            <Text style={styles.miniStatValue}>{lowStockProducts}</Text>
            <Text style={styles.miniStatLabel}>Bajo stock</Text>
          </View>
          <View style={styles.miniStatCard}>
            <Icon name="star" size={24} color="#8B5CF6" />
            <Text style={styles.miniStatValue}>{totalProducts > 0 ? "4.8" : "0"}</Text>
            <Text style={styles.miniStatLabel}>Rating</Text>
          </View>
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.row}>
          <TouchableOpacity style={[styles.actionBtn, {borderColor: THEME.secondary}]} onPress={() => navigation.navigate("AddProduct")}>
            <View style={[styles.iconBox, {backgroundColor: '#ecfdf5'}]}>
              <Icon name="plus-box" size={32} color={THEME.secondary} />
            </View>
            <Text style={styles.actionLabel}>Añadir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, {borderColor: THEME.primary}]} onPress={() => navigation.navigate("ProviderOrders")}>
            <View style={[styles.iconBox, {backgroundColor: '#eff6ff'}]}>
              <Icon name="truck-delivery" size={32} color={THEME.primary} />
            </View>
            <Text style={styles.actionLabel}>Pedidos</Text>
          </TouchableOpacity>
        </View>

        {/* Inventario Rápido */}
        <Text style={styles.sectionTitle}>Tus productos ({myProducts.length})</Text>
        
        {loading ? (
          <View style={styles.loadingProducts}>
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={styles.loadingText}>Cargando productos...</Text>
          </View>
        ) : myProducts.length === 0 ? (
          <View style={styles.emptyProducts}>
            <Icon name="package-variant-closed" size={60} color="#e2e8f0" />
            <Text style={styles.emptyText}>No tienes productos aún</Text>
            <TouchableOpacity 
              style={styles.addFirstBtn}
              onPress={() => navigation.navigate("AddProduct")}
            >
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.addFirstText}>Agregar primer producto</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {myProducts.slice(0, 4).map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.imgWrap}>
                  {item.images?.[0] ? (
                    <Image source={{uri: item.images[0]}} style={styles.img} />
                  ) : (
                    <Icon name="image-off" size={24} color="#ccc" />
                  )}
                  <TouchableOpacity 
                    style={styles.editBtn} 
                    onPress={() => navigation.navigate("ProviderProducts")}
                  >
                    <Icon name="pencil" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>${item.price}</Text>
                <Text style={styles.itemStock}>{item.stock} disponibles</Text>
              </View>
            ))}
          </View>
        )}
        
        {myProducts.length > 4 && (
          <TouchableOpacity 
            style={styles.viewAllBtn}
            onPress={() => navigation.navigate("ProviderProducts")}
          >
            <Text style={styles.viewAllText}>Ver todos los productos ({myProducts.length})</Text>
            <Icon name="chevron-right" size={20} color={THEME.primary} />
          </TouchableOpacity>
        )}
        
        <View style={{height: 100}} />
      </ScrollView>

      {/* Menú Lateral (Drawer) */}
      {menuVisible && (
        <>
          <Animated.View style={[styles.overlay, { opacity: menuOpacity }]}>
            <TouchableOpacity style={{flex:1}} onPress={() => toggleMenu(false)} />
          </Animated.View>
          <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
            <SafeAreaView style={{flex: 1}}>
              <View style={styles.drawerHeader}>
                <View style={styles.dAvatar}><Text style={styles.dAvatarTxt}>{user?.name?.charAt(0)}</Text></View>
                <Text style={styles.dName}>{user?.name}</Text>
                <Text style={styles.dEmail}>{user?.email}</Text>
              </View>

              <View style={styles.dContent}>
                <DrawerLink icon="home" label="Dashboard" onPress={() => {toggleMenu(false);}} />
                <DrawerLink icon="package-variant" label="Mis Pedidos" onPress={() => {toggleMenu(false); navigation.navigate("ProviderOrders")}} />
                <DrawerLink icon="storefront" label="Mis Productos" onPress={() => {toggleMenu(false); navigation.navigate("ProviderProducts")}} />
                <DrawerLink icon="account-circle" label="Perfil" onPress={() => {toggleMenu(false); navigation.navigate("ProviderProfile")}} />
              </View>

              {/* CORREGIDO: Cambiado a handleLogout */}
              <TouchableOpacity style={styles.logout} onPress={handleLogout}>
                <Icon name="logout" size={22} color={THEME.danger} />
                <Text style={styles.logoutTxt}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const DrawerLink = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.dLink} onPress={onPress}>
    <Icon name={icon} size={26} color={THEME.primary} />
    <Text style={styles.dLinkText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: THEME.background },
  bgCircle: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  
  // Header Adjustments
  headerContainer: { backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5, paddingBottom: 15, zIndex: 10 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 35 : 10 },
  menuBtn: { padding: 5 },
  textContainer: { flex: 1, marginLeft: 15 },
  greet: { fontSize: 12, color: THEME.textSecondary, fontWeight: '600' },
  userName: { fontSize: 20, fontWeight: '900', color: THEME.textPrimary },
  profileAvatar: { width: 45, height: 45, borderRadius: 14, backgroundColor: THEME.primary, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  scroll: { padding: 20 },
  
  // Performance Card
  statsCard: { backgroundColor: '#fff', borderRadius: 25, padding: 20, elevation: 3, borderLeftWidth: 5, borderLeftColor: THEME.primary, marginBottom: 15 },
  statsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsTitle: { fontSize: 14, fontWeight: '700', color: THEME.textSecondary },
  pillSelector: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 3 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  pillActive: { backgroundColor: THEME.primary },
  pillText: { fontSize: 10, fontWeight: '700', color: THEME.textSecondary },
  pillTextActive: { color: '#fff' },
  statsValueRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, justifyContent: 'space-between' },
  bigAmount: { fontSize: 32, fontWeight: '900', color: THEME.textPrimary },
  statsSubtitle: { fontSize: 12, color: THEME.textSecondary, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', padding: 8, borderRadius: 8 },
  badgeText: { color: THEME.secondary, fontSize: 12, fontWeight: 'bold', marginLeft: 3 },

  // Mini Stats
  miniStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  miniStatCard: { flex: 1, backgroundColor: '#fff', borderRadius: 15, padding: 15, alignItems: 'center', marginHorizontal: 5 },
  miniStatValue: { fontSize: 20, fontWeight: '900', color: THEME.textPrimary, marginTop: 8 },
  miniStatLabel: { fontSize: 11, color: THEME.textSecondary, marginTop: 4 },

  // Actions
  row: { flexDirection: 'row', gap: 15, marginVertical: 15 },
  actionBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 15, alignItems: 'center', borderWidth: 1 },
  iconBox: { width: 55, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionLabel: { fontWeight: '800', fontSize: 13, color: THEME.textPrimary },

  // Grid
  sectionTitle: { fontSize: 18, fontWeight: '900', color: THEME.textPrimary, marginTop: 10, marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  itemCard: { width: (width - 55) / 2, backgroundColor: '#fff', borderRadius: 20, padding: 10, marginBottom: 15 },
  imgWrap: { width: '100%', height: 100, borderRadius: 15, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  img: { width: '100%', height: '100%' },
  editBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: THEME.primary, padding: 6, borderRadius: 8 },
  itemName: { fontSize: 14, fontWeight: '700', color: THEME.textPrimary, marginTop: 10, height: 40 },
  itemPrice: { fontSize: 16, fontWeight: '900', color: THEME.secondary, marginTop: 5 },
  itemStock: { fontSize: 12, color: THEME.textSecondary, marginTop: 2 },
  
  loadingProducts: { alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 10, color: THEME.textSecondary },
  
  emptyProducts: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 20 },
  emptyText: { color: THEME.textSecondary, marginTop: 15, fontWeight: '600', marginBottom: 20 },
  addFirstBtn: { backgroundColor: THEME.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 8 },
  addFirstText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 15, marginTop: 10 },
  viewAllText: { color: THEME.primary, fontWeight: '600', marginRight: 8 },

  // Drawer
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 },
  drawer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 280, backgroundColor: '#fff', zIndex: 1001, padding: 25 },
  drawerHeader: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 20 },
  dAvatar: { width: 60, height: 60, borderRadius: 20, backgroundColor: THEME.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  dAvatarTxt: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  dName: { fontSize: 18, fontWeight: '900', color: THEME.textPrimary },
  dEmail: { fontSize: 13, color: THEME.textSecondary },
  dContent: { flex: 1 },
  dLink: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, gap: 15 },
  dLinkText: { fontSize: 16, fontWeight: '700', color: THEME.textPrimary },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, backgroundColor: '#fff1f2', borderRadius: 15 },
  logoutTxt: { color: THEME.danger, fontWeight: '800' }
});