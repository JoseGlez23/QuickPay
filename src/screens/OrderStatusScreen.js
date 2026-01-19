import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  SafeAreaView,
  Image,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../utils/supabase";

const { width, height } = Dimensions.get("window");

const statusConfig = {
  pending: {
    label: "Pendiente",
    color: "#F59E0B",
    bg: "#FEF3C7",
    icon: "schedule",
    darkBg: "#451a03",
    action: "Esperando confirmación",
  },
  paid: {
    label: "Pagado",
    color: "#10B981",
    bg: "#D1FAE5",
    icon: "check-circle",
    darkBg: "#064e3b",
    action: "Pago confirmado",
  },
  processing: {
    label: "En proceso",
    color: "#3B82F6",
    bg: "#DBEAFE",
    icon: "settings",
    darkBg: "#1e3a8a",
    action: "Preparando tu pedido",
  },
  shipped: {
    label: "Enviado",
    color: "#8B5CF6",
    bg: "#EDE9FE",
    icon: "local-shipping",
    darkBg: "#4c1d95",
    action: "En camino a tu dirección",
  },
  delivered: {
    label: "Entregado",
    color: "#059669",
    bg: "#D1FAE5",
    icon: "check-circle",
    darkBg: "#064e3b",
    action: "Pedido entregado",
  },
  cancelled: {
    label: "Cancelado",
    color: "#DC2626",
    bg: "#FEE2E2",
    icon: "cancel",
    darkBg: "#450a0a",
    action: "Pedido cancelado",
  },
};

export default function OrderStatusScreen({ route, navigation }) {
  const { colors, isDarkMode } = useTheme();
  const { orderId } = route.params || { orderId: "ORD-001" };

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
      startPulseAnimation();
    }
  }, [orderId]);

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      // Aquí puedes conectar con tu API real
      // Por ahora uso datos de ejemplo
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simular carga

      const mockOrder = {
        id: orderId,
        orderNumber: `ORD-${orderId.slice(-6).toUpperCase()}`,
        date: new Date().toISOString(),
        total: 1299.99,
        status: "delivered",
        items: [
          {
            id: "1",
            name: "iPhone 15 Pro Max 256GB",
            price: 1299.99,
            quantity: 1,
            image:
              "https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=400",
          },
          {
            id: "2",
            name: "Apple AirPods Pro",
            price: 249.99,
            quantity: 1,
            image:
              "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?q=80&w=400",
          },
        ],
        shipping: {
          address:
            "Av. Principal 123, Col. Centro, Ciudad de México, CDMX 06000",
          method: "Express Delivery",
          trackingNumber: "TRK-789456123XYZ",
          estimatedDelivery: "17 Nov 2023",
          actualDelivery: "17 Nov 2023, 03:30 PM",
          carrier: "DHL Express",
          phone: "+52 55 1234 5678",
        },
        payment: {
          method: "Tarjeta de crédito Visa",
          lastFour: "1234",
          status: "Pagado",
          transactionId: "TXN-456789123",
          amount: 1299.99,
          date: new Date().toISOString(),
        },
        provider: {
          name: "Apple Store Oficial",
          phone: "+52 800 123 4567",
          email: "support@apple.com",
        },
        timeline: [
          {
            status: "ordered",
            label: "Pedido realizado",
            date: "15 Nov 2023, 10:30 AM",
            completed: true,
            icon: "shopping-bag",
          },
          {
            status: "paid",
            label: "Pago confirmado",
            date: "15 Nov 2023, 10:35 AM",
            completed: true,
            icon: "payment",
          },
          {
            status: "processing",
            label: "Preparando pedido",
            date: "15 Nov 2023, 11:00 AM",
            completed: true,
            icon: "build",
          },
          {
            status: "shipped",
            label: "Enviado",
            date: "16 Nov 2023, 09:00 AM",
            completed: true,
            icon: "local-shipping",
          },
          {
            status: "delivered",
            label: "Entregado",
            date: "17 Nov 2023, 03:30 PM",
            completed: true,
            icon: "check-circle",
          },
        ],
      };

      setOrderDetails(mockOrder);
    } catch (error) {
      console.error("Error loading order details:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrderDetails();
  };

  const handleHelpRequest = () => {
    setShowHelpModal(true);
  };

  const submitHelpRequest = async () => {
    // Aquí puedes enviar la solicitud de ayuda
    console.log("Help request:", helpMessage);
    setShowHelpModal(false);
    setHelpMessage("");

    // Mostrar confirmación
    // Alert.alert('Solicitud enviada', 'Nos pondremos en contacto contigo pronto.');
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
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    return statusConfig[status]?.color || "#6B7280";
  };

  const renderTimelineStep = (step, index, totalSteps) => {
    const isLast = index === totalSteps - 1;
    const isActive = step.completed;
    const statusColor = getStatusColor(step.status);

    return (
      <View key={step.status} style={styles.timelineStep}>
        <View style={styles.timelineIconContainer}>
          {!isLast && (
            <View
              style={[
                styles.timelineConnector,
                {
                  backgroundColor: isActive
                    ? statusColor
                    : isDarkMode
                      ? "#374151"
                      : "#E5E7EB",
                },
              ]}
            />
          )}
          <Animated.View
            style={[
              styles.timelineIconWrapper,
              {
                backgroundColor: isActive
                  ? statusColor
                  : isDarkMode
                    ? "#374151"
                    : "#F3F4F6",
                transform: [{ scale: isActive ? pulseAnim : 1 }],
              },
            ]}
          >
            <Icon
              name={step.icon}
              size={20}
              color={isActive ? "#FFFFFF" : isDarkMode ? "#9CA3AF" : "#6B7280"}
            />
          </Animated.View>
        </View>

        <View style={styles.timelineContent}>
          <Text
            style={[
              styles.timelineLabel,
              { color: isActive ? colors.text : colors.textSecondary },
            ]}
          >
            {step.label}
          </Text>
          <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>
            {step.date}
          </Text>
          {isActive && (
            <View
              style={[
                styles.completedBadge,
                { backgroundColor: isDarkMode ? "#064e3b" : "#D1FAE5" },
              ]}
            >
              <Icon name="check" size={12} color="#10B981" />
              <Text style={[styles.completedText, { color: "#10B981" }]}>
                Completado
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const navigateToHome = () => {
    navigation.navigate("ClientHome");
  };

  const copyToClipboard = (text) => {
    // Aquí puedes implementar la funcionalidad de copiar
    console.log("Copied:", text);
    // Alert.alert('Copiado', 'Texto copiado al portapapeles');
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [240, 140],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 80, 100],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  });

  if (loading && !orderDetails) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Cargando detalles del pedido...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatus = orderDetails?.status || "pending";
  const statusInfo = statusConfig[currentStatus];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={statusInfo?.color || colors.primary}
        translucent
      />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
            backgroundColor: statusInfo?.color || colors.primary,
          },
        ]}
      >
        <Animated.View
          style={[styles.headerContent, { opacity: headerOpacity }]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={[
                styles.backButton,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Animated.View style={{ opacity: titleOpacity }}>
              <Text style={styles.headerTitleSmall}>
                Pedido #{orderDetails?.orderNumber}
              </Text>
            </Animated.View>

            <TouchableOpacity
              style={[
                styles.helpButton,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
              onPress={handleHelpRequest}
            >
              <Icon name="help-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerMain}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Icon
                name={statusInfo?.icon || "help"}
                size={60}
                color="#FFFFFF"
              />
            </Animated.View>
            <Text style={styles.orderStatusText}>
              {statusInfo?.label || "Estado desconocido"}
            </Text>
            <Text style={styles.orderActionText}>
              {statusInfo?.action || ""}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Help Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showHelpModal}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                ¿Necesitas ayuda con tu pedido?
              </Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                Describe el problema o pregunta sobre tu pedido:
              </Text>

              <TextInput
                style={[
                  styles.helpInput,
                  {
                    backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB",
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                multiline
                numberOfLines={4}
                placeholder="Escribe aquí tu mensaje..."
                placeholderTextColor={colors.textSecondary}
                value={helpMessage}
                onChangeText={setHelpMessage}
              />

              <Text
                style={[styles.contactInfo, { color: colors.textSecondary }]}
              >
                O contacta al proveedor:
              </Text>

              <TouchableOpacity
                style={[
                  styles.contactButton,
                  { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" },
                ]}
              >
                <Icon name="phone" size={20} color={colors.primary} />
                <Text
                  style={[styles.contactButtonText, { color: colors.text }]}
                >
                  {orderDetails?.provider?.phone || "Sin número disponible"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.modalCancelButton,
                  { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" },
                ]}
                onPress={() => setShowHelpModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={submitHelpRequest}
              >
                <Text style={styles.modalSubmitText}>Enviar solicitud</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[statusInfo?.color || colors.primary]}
            tintColor={statusInfo?.color || colors.primary}
          />
        }
      >
        {/* Order Info Banner */}
        <Animated.View
          style={[
            styles.orderInfoBanner,
            {
              backgroundColor: colors.card,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.orderInfoHeader}>
            <Text style={[styles.orderInfoTitle, { color: colors.text }]}>
              #{orderDetails?.orderNumber}
            </Text>
            <Text
              style={[styles.orderInfoDate, { color: colors.textSecondary }]}
            >
              {formatDate(orderDetails?.date)}
            </Text>
          </View>

          <View style={styles.orderInfoGrid}>
            <View style={styles.orderInfoItem}>
              <Icon name="receipt" size={20} color={colors.primary} />
              <Text
                style={[styles.orderInfoLabel, { color: colors.textSecondary }]}
              >
                Total
              </Text>
              <Text style={[styles.orderInfoValue, { color: colors.text }]}>
                {formatCurrency(orderDetails?.total || 0)}
              </Text>
            </View>

            <View style={styles.orderInfoItem}>
              <Icon name="local-shipping" size={20} color="#8B5CF6" />
              <Text
                style={[styles.orderInfoLabel, { color: colors.textSecondary }]}
              >
                Envío
              </Text>
              <Text style={[styles.orderInfoValue, { color: colors.text }]}>
                {orderDetails?.shipping?.method || "Standard"}
              </Text>
            </View>

            <View style={styles.orderInfoItem}>
              <Icon name="store" size={20} color="#10B981" />
              <Text
                style={[styles.orderInfoLabel, { color: colors.textSecondary }]}
              >
                Tienda
              </Text>
              <Text
                style={[styles.orderInfoValue, { color: colors.text }]}
                numberOfLines={1}
              >
                {orderDetails?.provider?.name || "Tienda"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Timeline Section */}
        <View
          style={[styles.timelineSection, { backgroundColor: colors.card }]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Progreso del pedido
            </Text>
            <View style={styles.deliveryStatus}>
              <Icon
                name={statusInfo?.icon || "help"}
                size={16}
                color={statusInfo?.color}
              />
              <Text
                style={[
                  styles.deliveryStatusText,
                  { color: statusInfo?.color },
                ]}
              >
                {statusInfo?.label}
              </Text>
            </View>
          </View>

          <View style={styles.timelineContainer}>
            {orderDetails?.timeline?.map((step, index) =>
              renderTimelineStep(step, index, orderDetails.timeline.length),
            )}
          </View>
        </View>

        {/* Products Section */}
        <View
          style={[styles.productsSection, { backgroundColor: colors.card }]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Productos ({orderDetails?.items?.length || 0})
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                Ver todos
              </Text>
            </TouchableOpacity>
          </View>

          {orderDetails?.items?.map((item) => (
            <View
              key={item.id}
              style={[
                styles.productCard,
                { backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB" },
              ]}
            >
              <Image source={{ uri: item.image }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text
                  style={[styles.productName, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <View style={styles.productDetails}>
                  <View style={styles.quantityBadge}>
                    <Text
                      style={[
                        styles.quantityText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      x{item.quantity}
                    </Text>
                  </View>
                  <Text
                    style={[styles.productPrice, { color: colors.primary }]}
                  >
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Shipping & Payment Details */}
        <View style={styles.detailsSection}>
          {/* Shipping Details */}
          <Animated.View
            style={[
              styles.detailCard,
              {
                backgroundColor: colors.card,
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.detailHeader}>
              <Icon name="location-on" size={24} color={colors.primary} />
              <Text style={[styles.detailTitle, { color: colors.text }]}>
                Información de envío
              </Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailText, { color: colors.text }]}>
                {orderDetails?.shipping?.address}
              </Text>

              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Método
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {orderDetails?.shipping?.method}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Transportista
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {orderDetails?.shipping?.carrier}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.copyButton,
                  { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" },
                ]}
                onPress={() =>
                  copyToClipboard(orderDetails?.shipping?.trackingNumber)
                }
              >
                <Icon
                  name="content-copy"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.copyText, { color: colors.textSecondary }]}
                >
                  {orderDetails?.shipping?.trackingNumber}
                </Text>
                <Text
                  style={[styles.copyLabel, { color: colors.textSecondary }]}
                >
                  (Copiar)
                </Text>
              </TouchableOpacity>

              <View style={styles.deliveryInfo}>
                <Icon
                  name="calendar-today"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={[styles.deliveryInfoText, { color: colors.text }]}>
                  Entregado: {orderDetails?.shipping?.actualDelivery}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Payment Details */}
          <Animated.View
            style={[
              styles.detailCard,
              {
                backgroundColor: colors.card,
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.detailHeader}>
              <Icon name="credit-card" size={24} color={colors.primary} />
              <Text style={[styles.detailTitle, { color: colors.text }]}>
                Información de pago
              </Text>
            </View>
            <View style={styles.detailContent}>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Método
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {orderDetails?.payment?.method}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Estado
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: isDarkMode ? "#064e3b" : "#D1FAE5" },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: "#10B981" }]}>
                      {orderDetails?.payment?.status}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Transacción
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      copyToClipboard(orderDetails?.payment?.transactionId)
                    }
                  >
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {orderDetails?.payment?.transactionId}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailItem}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Fecha
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDate(orderDetails?.payment?.date)}
                  </Text>
                </View>
              </View>

              <View style={styles.amountRow}>
                <Text
                  style={[styles.amountLabel, { color: colors.textSecondary }]}
                >
                  Monto total:
                </Text>
                <Text style={[styles.amountValue, { color: "#10B981" }]}>
                  {formatCurrency(orderDetails?.payment?.amount)}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={navigateToHome}
          >
            <Icon name="shopping-bag" size={24} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Seguir comprando</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Icon name="receipt" size={20} color={colors.text} />
              <Text
                style={[styles.secondaryButtonText, { color: colors.text }]}
              >
                Ver recibo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handleHelpRequest}
            >
              <Icon name="help-outline" size={20} color={colors.text} />
              <Text
                style={[styles.secondaryButtonText, { color: colors.text }]}
              >
                Ayuda
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleSmall: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    opacity: 0.9,
  },
  headerMain: {
    alignItems: "center",
  },
  orderStatusText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 10,
    marginBottom: 5,
  },
  orderActionText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 16,
  },
  helpInput: {
    height: 120,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    textAlignVertical: "top",
  },
  contactInfo: {
    fontSize: 14,
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSubmitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  orderInfoBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  orderInfoHeader: {
    marginBottom: 16,
  },
  orderInfoTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  orderInfoDate: {
    fontSize: 14,
  },
  orderInfoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderInfoItem: {
    alignItems: "center",
    flex: 1,
  },
  orderInfoLabel: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  timelineSection: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  deliveryStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deliveryStatusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  timelineContainer: {
    marginLeft: 10,
  },
  timelineStep: {
    flexDirection: "row",
    marginBottom: 28,
  },
  timelineIconContainer: {
    alignItems: "center",
    marginRight: 20,
    position: "relative",
  },
  timelineConnector: {
    position: "absolute",
    top: 32,
    left: 15.5,
    width: 2,
    height: "100%",
    zIndex: 0,
  },
  timelineIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  timelineDate: {
    fontSize: 13,
    marginBottom: 8,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  completedText: {
    fontSize: 12,
    fontWeight: "600",
  },
  productsSection: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  productCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityBadge: {
    backgroundColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quantityText: {
    fontSize: 13,
    fontWeight: "500",
  },
  productPrice: {
    fontSize: 17,
    fontWeight: "bold",
  },
  detailsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 16,
  },
  detailCard: {
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  detailContent: {
    gap: 16,
  },
  detailText: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailGrid: {
    flexDirection: "row",
    gap: 20,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  copyText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  copyLabel: {
    fontSize: 12,
    fontStyle: "italic",
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deliveryInfoText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  amountLabel: {
    fontSize: 15,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButtons: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
