// OrderHistoryScreen.js - VERSIÓN CORRECTA
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TextInput,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useOrders } from "../context/OrderContext"; // Importa desde OrderContext
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

const statusConfig = {
  pending: {
    label: "Pendiente",
    color: "#F59E0B",
    bg: "#FEF3C7",
    icon: "schedule",
    darkBg: "#451a03",
  },
  paid: {
    label: "Pagado",
    color: "#10B981",
    bg: "#D1FAE5",
    icon: "check-circle",
    darkBg: "#064e3b",
  },
  processing: {
    label: "En proceso",
    color: "#3B82F6",
    bg: "#DBEAFE",
    icon: "settings",
    darkBg: "#1e3a8a",
  },
  shipped: {
    label: "Enviado",
    color: "#8B5CF6",
    bg: "#EDE9FE",
    icon: "local-shipping",
    darkBg: "#4c1d95",
  },
  delivered: {
    label: "Entregado",
    color: "#059669",
    bg: "#D1FAE5",
    icon: "check-circle",
    darkBg: "#064e3b",
  },
  cancelled: {
    label: "Cancelado",
    color: "#DC2626",
    bg: "#FEE2E2",
    icon: "cancel",
    darkBg: "#450a0a",
  },
};

const filters = [
  { id: "all", label: "Todos", icon: "all-inclusive", color: "#6B7280" },
  { id: "pending", label: "Pendientes", icon: "schedule", color: "#F59E0B" },
  { id: "processing", label: "En proceso", icon: "settings", color: "#3B82F6" },
  {
    id: "shipped",
    label: "Enviados",
    icon: "local-shipping",
    color: "#8B5CF6",
  },
  {
    id: "delivered",
    label: "Entregados",
    icon: "check-circle",
    color: "#10B981",
  },
  { id: "cancelled", label: "Cancelados", icon: "cancel", color: "#EF4444" },
];

export default function OrderHistoryScreen({ navigation }) {
  // SOLO usa el hook aquí, no copies el código del OrderContext
  const { clientOrders, loading, refreshOrders } = useOrders();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    totalSpent: 0,
  });

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bgAnim1 = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);

  useEffect(() => {
    calculateStats();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim1, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim1, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [clientOrders]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const calculateStats = () => {
    const total = clientOrders.length;
    const pending = clientOrders.filter((o) => o.status === "pending").length;
    const delivered = clientOrders.filter(
      (o) => o.status === "delivered",
    ).length;
    const totalSpent = clientOrders
      .filter((o) => o.status === "delivered")
      .reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);

    setOrderStats({ total, pending, delivered, totalSpent });
  };

  const filteredOrders = clientOrders.filter((order) => {
    if (selectedFilter !== "all" && order.status !== selectedFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      return (
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.provider?.name?.toLowerCase().includes(searchLower) ||
        order.items?.some(
          (item) =>
            item.product?.name?.toLowerCase().includes(searchLower) ||
            item.product?.description?.toLowerCase().includes(searchLower),
        )
      );
    }

    return true;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  const handleOrderClick = (order) => {
    navigation.navigate("OrderStatus", {
      orderId: order.id,
      orderNumber: order.orderNumber || order.id,
    });
  };

  const navigateToHome = () => {
    navigation.navigate("ClientTabs", {
      screen: "ClientHome",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";

    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return (
        "Hoy " +
        date.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } else if (date.toDateString() === yesterday.toDateString()) {
      return (
        "Ayer " +
        date.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(numAmount);
  };

  const renderOrderItem = ({ item, index }) => {
    const config = statusConfig[item.status] || statusConfig.pending;
    const itemCount = item.items?.reduce(
      (sum, orderItem) => sum + (orderItem.quantity || 1),
      0,
    );

    // DEBUG: Ver qué datos llegan
    console.log("Orden:", {
      id: item.id,
      tieneItems: item.items?.length,
      primerItem: item.items?.[0],
    });

    return (
      <Animated.View
        style={[
          styles.orderCard,
          {
            backgroundColor: colors.card,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50 * (index + 1), 0],
                }),
              },
            ],
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleOrderClick(item)}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <View style={styles.orderInfo}>
              <View style={styles.orderNumberRow}>
                <Icon name="receipt" size={18} color={colors.primary} />
                <Text style={[styles.orderId, { color: colors.text }]}>
                  {item.orderNumber ||
                    `Pedido #${item.id?.slice(-8).toUpperCase() || "N/A"}`}
                </Text>
              </View>
              <View style={styles.timeInfo}>
                <Icon
                  name="access-time"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.orderDate, { color: colors.textSecondary }]}
                >
                  {formatDate(item.createdAt)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDarkMode ? config.darkBg : config.bg,
                },
              ]}
            >
              <Icon name={config.icon} size={16} color={config.color} />
              <Text style={[styles.statusText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>

          <View style={styles.orderContent}>
            {item.items && item.items.length > 0 ? (
              item.items.slice(0, 2).map((orderItem, idx) => {
                // El producto está en orderItem.product
                const product = orderItem.product || {};
                const productName = product.name || "Producto sin nombre";
                const productImage = product.images?.[0] || product.image;
                const quantity = orderItem.quantity || 1;
                const price = parseFloat(
                  orderItem.unit_price || product.price || 0,
                );

                return (
                  <View key={idx} style={styles.productRow}>
                    {productImage ? (
                      <Image
                        source={{ uri: productImage }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.productImagePlaceholder,
                          {
                            backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
                          },
                        ]}
                      >
                        <Icon
                          name="shopping-bag"
                          size={24}
                          color={colors.textSecondary}
                        />
                      </View>
                    )}

                    <View style={styles.productInfo}>
                      <Text
                        style={[styles.productName, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {productName}
                      </Text>

                      <View style={styles.productDetails}>
                        <View style={styles.detailRow}>
                          <Text
                            style={[
                              styles.productQuantity,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Cantidad: {quantity}
                          </Text>
                          <Text
                            style={[
                              styles.productPrice,
                              { color: colors.primary },
                            ]}
                          >
                            ${price.toFixed(2)}
                          </Text>
                        </View>

                        <View style={styles.subtotalRow}>
                          <Text
                            style={[
                              styles.subtotalLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Subtotal:
                          </Text>
                          <Text
                            style={[styles.subtotalValue, { color: "#10B981" }]}
                          >
                            ${(price * quantity).toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {product.description && (
                        <Text
                          style={[
                            styles.productDescription,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {product.description}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View
                style={[
                  styles.noProducts,
                  { backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB" },
                ]}
              >
                <Icon
                  name="error-outline"
                  size={24}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.noProductsText,
                    { color: colors.textSecondary },
                  ]}
                >
                  No hay información de productos
                </Text>
              </View>
            )}

            {item.items && item.items.length > 2 && (
              <View
                style={[
                  styles.moreProducts,
                  { backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB" },
                ]}
              >
                <Text
                  style={[
                    styles.moreProductsText,
                    { color: colors.textSecondary },
                  ]}
                >
                  +{item.items.length - 2} producto
                  {item.items.length - 2 !== 1 ? "s" : ""} más
                </Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.cardFooter,
              { borderTopColor: isDarkMode ? "#374151" : "#F3F4F6" },
            ]}
          >
            <View style={styles.footerLeft}>
              <View style={styles.totalRow}>
                <Text
                  style={[styles.totalLabel, { color: colors.textSecondary }]}
                >
                  Total del pedido:
                </Text>
                <Text style={[styles.totalAmount, { color: "#10B981" }]}>
                  {formatCurrency(item.total || 0)}
                </Text>
              </View>

              <View style={styles.footerMeta}>
                <View style={styles.metaItem}>
                  <Icon name="layers" size={14} color={colors.textSecondary} />
                  <Text
                    style={[styles.metaText, { color: colors.textSecondary }]}
                  >
                    {itemCount} artículo{itemCount !== 1 ? "s" : ""}
                  </Text>
                </View>

                {item.provider?.name && (
                  <View style={styles.metaItem}>
                    <Icon name="store" size={14} color={colors.textSecondary} />
                    <Text
                      style={[styles.metaText, { color: colors.textSecondary }]}
                    >
                      {item.provider.name}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.detailsButton,
                { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" },
              ]}
              onPress={() => handleOrderClick(item)}
            >
              <Text style={[styles.detailsButtonText, { color: colors.text }]}>
                Ver detalles
              </Text>
              <Icon name="arrow-forward" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderFilterChip = ({ item }) => {
    const isSelected = selectedFilter === item.id;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => setSelectedFilter(item.id)}
        style={[
          styles.filterChip,
          {
            backgroundColor: isSelected ? item.color : "transparent",
            borderColor: isSelected ? item.color : colors.border,
          },
        ]}
      >
        <Icon
          name={item.icon}
          size={16}
          color={isSelected ? "#fff" : colors.textSecondary}
        />
        <Text
          style={[
            styles.filterChipText,
            { color: isSelected ? "#fff" : colors.textSecondary },
          ]}
        >
          {item.label}
        </Text>

        {isSelected && item.id !== "all" && filteredOrders.length > 0 && (
          <View style={[styles.filterCount, { backgroundColor: "#fff" }]}>
            <Text style={[styles.filterCountText, { color: item.color }]}>
              {filteredOrders.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIllustration,
          { backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB" },
        ]}
      >
        <Icon
          name="inventory"
          size={70}
          color={isDarkMode ? "#4B5563" : "#9CA3AF"}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? "No se encontraron pedidos" : "No hay pedidos aún"}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {searchQuery
          ? "Intenta con otros términos de búsqueda"
          : loading
            ? "Cargando tus pedidos..."
            : "Tus compras aparecerán aquí cuando realices tu primer pedido"}
      </Text>

      {!loading && (
        <View style={styles.emptyActions}>
          {searchQuery ? (
            <TouchableOpacity
              style={[
                styles.clearSearchBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => setSearchQuery("")}
            >
              <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.shopButton, { backgroundColor: colors.primary }]}
              onPress={navigateToHome}
            >
              <Icon name="shopping-bag" size={20} color="#FFFFFF" />
              <Text style={styles.shopButtonText}>Explorar productos</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [220, 140],
    extrapolate: "clamp",
  });

  if (loading && clientOrders.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Cargando tus pedidos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
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
                  outputRange: [0, 60],
                }),
              },
            ],
            backgroundColor: colors.primary,
            opacity: isDarkMode ? 0.05 : 0.08,
            top: -100,
            right: -100,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={[
                styles.headerButton,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Mis Pedidos</Text>
              <Text style={styles.headerSubtitle}>
                {orderStats.total} pedidos •{" "}
                {formatCurrency(orderStats.totalSpent)}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.headerButton,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
              onPress={() => setShowSearch(true)}
            >
              <Icon name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.statsContainer}
          >
            <View
              style={[
                styles.statCard,
                { backgroundColor: "rgba(255,255,255,0.15)" },
              ]}
            >
              <Icon name="receipt" size={24} color="#FFFFFF" />
              <Text style={styles.statNumber}>{orderStats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: "rgba(245, 158, 11, 0.2)" },
              ]}
            >
              <Icon name="schedule" size={24} color="#FDE68A" />
              <Text style={styles.statNumber}>{orderStats.pending}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: "rgba(16, 185, 129, 0.2)" },
              ]}
            >
              <Icon name="check-circle" size={24} color="#A7F3D0" />
              <Text style={styles.statNumber}>{orderStats.delivered}</Text>
              <Text style={styles.statLabel}>Entregados</Text>
            </View>
          </ScrollView>
        </View>
      </Animated.View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showSearch}
        onRequestClose={() => setShowSearch(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}
        >
          <View style={[styles.searchModal, { backgroundColor: colors.card }]}>
            <View style={styles.searchModalHeader}>
              <Text style={[styles.searchModalTitle, { color: colors.text }]}>
                Buscar pedidos
              </Text>
              <TouchableOpacity onPress={() => setShowSearch(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputContainer}>
              <Icon
                name="search"
                size={20}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                ref={searchInputRef}
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB",
                    color: colors.text,
                  },
                ]}
                placeholder="Buscar por pedido, tienda o producto..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Icon name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <Text
              style={[styles.searchHelpText, { color: colors.textSecondary }]}
            >
              Busca por: número de pedido, nombre de tienda o producto
            </Text>
          </View>
        </View>
      </Modal>

      <View style={styles.filterContainer}>
        <FlatList
          data={filters}
          renderItem={renderFilterChip}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {filteredOrders.length === 0 ? (
        renderEmptyState()
      ) : (
        <Animated.FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.listHeaderTitle, { color: colors.text }]}>
                Historial de pedidos {searchQuery && `"${searchQuery}"`}
              </Text>
              <Text
                style={[
                  styles.listHeaderSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {filteredOrders.length} resultado
                {filteredOrders.length !== 1 ? "s" : ""}
              </Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.listFooter}>
              <Text
                style={[styles.footerText, { color: colors.textSecondary }]}
              >
                Mostrando {filteredOrders.length} de {clientOrders.length}{" "}
                pedidos
              </Text>
              {searchQuery && (
                <TouchableOpacity
                  style={[
                    styles.clearFilterBtn,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setSearchQuery("")}
                >
                  <Text
                    style={[styles.clearFilterText, { color: colors.text }]}
                  >
                    Limpiar búsqueda
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgCircle: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  header: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  headerContent: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  statsContainer: {
    paddingRight: 20,
  },
  statCard: {
    width: 110,
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 50 : 100,
  },
  searchModal: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  searchModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  searchModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 46,
    fontSize: 16,
    fontWeight: "500",
  },
  searchHelpText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  filterContainer: {
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  filterList: {
    paddingHorizontal: 20,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1.5,
    minWidth: 100,
  },
  filterChipText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "700",
  },
  filterCount: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: "900",
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  listHeaderTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  listHeaderSubtitle: {
    fontSize: 14,
  },
  ordersList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  orderCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  orderId: {
    fontSize: 17,
    fontWeight: "900",
    marginLeft: 8,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderDate: {
    fontSize: 13,
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orderContent: {
    marginBottom: 20,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 16,
    backgroundColor: "#F3F4F6",
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  productDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 14,
    fontWeight: "500",
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "700",
  },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  subtotalLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  subtotalValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  productDescription: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  moreProducts: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  moreProductsText: {
    fontSize: 14,
    fontWeight: "600",
  },
  noProducts: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  noProductsText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flex: 1,
    marginRight: 16,
  },
  totalRow: {
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "900",
  },
  footerMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    gap: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
    gap: 16,
  },
  footerText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  clearFilterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingTop: 50,
  },
  emptyIllustration: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
    maxWidth: "80%",
  },
  emptyActions: {
    gap: 12,
  },
  shopButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shopButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  clearSearchBtn: {
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
  },
  clearSearchText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
