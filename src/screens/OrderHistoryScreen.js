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
import { useOrders } from "../context/OrderContext";
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
  const searchInputRef = useRef(null);

  useEffect(() => {
    calculateStats();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [clientOrders]);

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

      if (order.orderNumber?.toLowerCase().includes(searchLower)) {
        return true;
      }

      if (order.provider?.name?.toLowerCase().includes(searchLower)) {
        return true;
      }

      if (order.items && order.items.length > 0) {
        const foundInItems = order.items.some((item) => {
          const productName = item.product?.name?.toLowerCase() || "";
          return productName.includes(searchLower);
        });
        if (foundInItems) return true;
      }

      return false;
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

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return `$${numAmount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderOrderItem = ({ item: order, index }) => {
    const config = statusConfig[order.status] || statusConfig.pending;
    const itemCount =
      order.items?.reduce(
        (sum, orderItem) => sum + (orderItem.quantity || 1),
        0,
      ) || 0;

    return (
      <TouchableOpacity
        onPress={() => handleOrderClick(order)}
        activeOpacity={0.9}
        style={[
          styles.orderCard,
          {
            backgroundColor: colors.card,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <View style={styles.orderNumberRow}>
              <Icon name="receipt" size={18} color={colors.primary} />
              <Text style={[styles.orderId, { color: colors.text }]}>
                {order.orderNumber ||
                  `Pedido #${order.id?.slice(-8).toUpperCase() || "N/A"}`}
              </Text>
            </View>
            <View style={styles.timeInfo}>
              <Icon name="access-time" size={14} color={colors.textSecondary} />
              <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                {formatDate(order.createdAt)}
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
          {order.items && order.items.length > 0 ? (
            order.items.map((orderItem, idx) => {
              const product = orderItem.product || {};
              const productName =
                product.name || `Producto #${product.id?.slice(-6) || "N/A"}`;
              const quantity = orderItem.quantity || 1;
              const price = parseFloat(
                orderItem.unit_price || product.price || 0,
              );

              return (
                <View key={orderItem.id || idx} style={styles.productRow}>
                  <View style={styles.productInfo}>
                    <Text
                      style={[styles.productName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {productName}
                    </Text>
                    <View style={styles.productDetails}>
                      <Text
                        style={[
                          styles.productQuantity,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Cantidad: {quantity} × ${price.toFixed(2)}
                      </Text>
                      <Text
                        style={[styles.subtotalValue, { color: "#10B981" }]}
                      >
                        Total: {formatCurrency(price * quantity)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.noProducts}>
              <Text
                style={[styles.noProductsText, { color: colors.textSecondary }]}
              >
                No hay información de productos
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
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              Total del pedido:
            </Text>
            <Text style={[styles.totalAmount, { color: "#10B981" }]}>
              {formatCurrency(order.total || 0)}
            </Text>
            {order.provider?.name && (
              <Text
                style={[styles.providerName, { color: colors.textSecondary }]}
              >
                Proveedor: {order.provider.name}
              </Text>
            )}
          </View>

          <Icon name="arrow-forward" size={20} color={colors.text} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="inventory" size={70} color={colors.textSecondary} />
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

      {!loading && !searchQuery && (
        <TouchableOpacity
          style={[styles.shopButton, { backgroundColor: colors.primary }]}
          onPress={navigateToHome}
        >
          <Icon name="shopping-bag" size={20} color="#FFFFFF" />
          <Text style={styles.shopButtonText}>Explorar productos</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && clientOrders.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Cargando tus pedidos...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Mis Pedidos</Text>
            <Text style={styles.headerSubtitle}>
              {orderStats.total} pedidos
            </Text>
          </View>

          <TouchableOpacity onPress={() => setShowSearch(true)}>
            <Icon name="search" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de búsqueda */}
      <Modal
        visible={showSearch}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.searchModal, { backgroundColor: colors.card }]}>
            <View style={styles.searchHeader}>
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Buscar pedidos..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowSearch(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BARRA DE FILTROS */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filters.map((filter) => {
            const isSelected = selectedFilter === filter.id;
            const filterCount = clientOrders.filter(
              (o) => o.status === filter.id,
            ).length;

            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setSelectedFilter(filter.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? filter.color : "transparent",
                    borderColor: isSelected ? filter.color : colors.border,
                  },
                ]}
              >
                <Icon
                  name={filter.icon}
                  size={18}
                  color={isSelected ? "#fff" : colors.textSecondary}
                  style={styles.filterIcon}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? "#fff" : colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {filter.label}
                </Text>

                {isSelected && filter.id !== "all" && filterCount > 0 && (
                  <View style={styles.filterCountBadge}>
                    <Text style={styles.filterCountText}>{filterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.scrollIndicator}>
          <Icon name="chevron-right" size={16} color={colors.textSecondary} />
        </View>
      </View>

      {/* Lista de pedidos */}
      {filteredOrders.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeaderContainer}>
              <Text style={[styles.listHeaderTitle, { color: colors.text }]}>
                Historial de Pedidos
              </Text>
              <Text
                style={[
                  styles.listHeaderCount,
                  { color: colors.textSecondary },
                ]}
              >
                {filteredOrders.length} de {clientOrders.length} pedidos
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 50 : 100,
  },
  searchModal: {
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 20,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  filterScrollContent: {
    paddingRight: 30,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1.5,
    marginRight: 12,
    minHeight: 46,
    minWidth: 110,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterIcon: {
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  filterCountBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  scrollIndicator: {
    position: "absolute",
    right: 10,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  ordersList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  listHeaderContainer: {
    marginBottom: 15,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  listHeaderCount: {
    fontSize: 13,
  },
  orderCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
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
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderDate: {
    fontSize: 12,
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 5,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  orderContent: {
    marginBottom: 12,
  },
  productRow: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  productDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productQuantity: {
    fontSize: 13,
  },
  subtotalValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  noProducts: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  noProductsText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerLeft: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  providerName: {
    fontSize: 12,
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
  },
  shopButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shopButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: "center",
  },
});
