import React, { useRef } from 'react';
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
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BottomNav from '../components/BottomNav';

const { width } = Dimensions.get('window');

export default function OrderStatusScreen({ route, navigation }) {
  const { orderId } = route.params || { orderId: 'ORD-001' };
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // DATOS DE EJEMPLO BASADOS EN EL ID
  const orderDetails = {
    id: orderId,
    date: '15 Nov 2023, 10:30 AM',
    total: 1299.99,
    status: 'delivered',
    items: [
      { id: '1', name: 'iPhone 15 Pro Max 256GB', price: 1299.99, quantity: 1, image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=400' },
    ],
    shipping: {
      address: 'Av. Principal 123, Col. Centro, Ciudad de México, CDMX 06000',
      method: 'Express Delivery',
      trackingNumber: 'TRK-789456123XYZ',
      estimatedDelivery: '17 Nov 2023',
      actualDelivery: '17 Nov 2023, 03:30 PM',
    },
    payment: {
      method: 'Tarjeta de crédito Visa',
      lastFour: '1234',
      status: 'Pagado',
      transactionId: 'TXN-456789123',
    },
    timeline: [
      { status: 'ordered', label: 'Pedido realizado', date: '15 Nov 2023, 10:30 AM', completed: true, icon: 'shopping-bag' },
      { status: 'paid', label: 'Pago confirmado', date: '15 Nov 2023, 10:35 AM', completed: true, icon: 'payment' },
      { status: 'processing', label: 'Preparando pedido', date: '15 Nov 2023, 11:00 AM', completed: true, icon: 'build' },
      { status: 'shipped', label: 'Enviado', date: '16 Nov 2023, 09:00 AM', completed: true, icon: 'local-shipping' },
      { status: 'delivered', label: 'Entregado', date: '17 Nov 2023, 03:30 PM', completed: true, icon: 'check-circle' },
    ],
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 100],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const renderTimelineStep = (step, index, totalSteps) => {
    const isLast = index === totalSteps - 1;
    const isActive = step.completed;
    
    return (
      <View key={step.status} style={styles.timelineStep}>
        <View style={styles.timelineIconContainer}>
          {!isLast && (
            <View style={[
              styles.timelineConnector,
              { backgroundColor: isActive ? '#3B82F6' : '#E5E7EB' }
            ]} />
          )}
          <View style={[
            styles.timelineIconWrapper,
            { backgroundColor: isActive ? '#3B82F6' : '#F3F4F6' }
          ]}>
            <Icon 
              name={step.icon} 
              size={20} 
              color={isActive ? '#FFFFFF' : '#6B7280'} 
            />
          </View>
        </View>
        
        <View style={styles.timelineContent}>
          <Text style={[
            styles.timelineLabel,
            { color: isActive ? '#111827' : '#6B7280' }
          ]}>
            {step.label}
          </Text>
          <Text style={styles.timelineDate}>{step.date}</Text>
          {isActive && (
            <View style={styles.completedBadge}>
              <Icon name="check" size={12} color="#10B981" />
              <Text style={styles.completedText}>Completado</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const navigateToHome = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <View style={styles.headerGradient}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Animated.View style={{ opacity: headerTitleOpacity }}>
              <Text style={styles.headerTitleSmall}>Pedido #{orderDetails.id}</Text>
            </Animated.View>
            <TouchableOpacity style={styles.shareButton}>
              <Icon name="share" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerMain}>
            <View style={styles.orderStatusBadge}>
              <Icon name="check-circle" size={24} color="#FFFFFF" />
              <Text style={styles.orderStatusText}>Pedido Entregado</Text>
            </View>
            <Text style={styles.orderId}>#{orderDetails.id}</Text>
            <Text style={styles.orderDate}>{orderDetails.date}</Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Timeline */}
        <View style={styles.timelineSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Progreso del envío</Text>
            <View style={styles.deliveryStatus}>
              <Icon name="local-shipping" size={16} color="#10B981" />
              <Text style={styles.deliveryStatusText}>Entregado</Text>
            </View>
          </View>
          
          <View style={styles.timelineContainer}>
            {orderDetails.timeline.map((step, index) => 
              renderTimelineStep(step, index, orderDetails.timeline.length)
            )}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumen del pedido</Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: '#3B82F610' }]}>
                <Icon name="receipt" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>${orderDetails.total.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: '#10B98110' }]}>
                <Icon name="payment" size={20} color="#10B981" />
              </View>
              <Text style={styles.summaryLabel}>Pago</Text>
              <Text style={styles.summaryValue}>Completado</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: '#8B5CF610' }]}>
                <Icon name="local-shipping" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.summaryLabel}>Envío</Text>
              <Text style={styles.summaryValue}>Express</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: '#F59E0B10' }]}>
                <Icon name="inventory" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.summaryLabel}>Artículos</Text>
              <Text style={styles.summaryValue}>{orderDetails.items.length}</Text>
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Productos</Text>
          {orderDetails.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemQuantity}>Cantidad: {item.quantity}</Text>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Shipping & Payment */}
        <View style={styles.detailsSection}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Icon name="location-on" size={20} color="#3B82F6" />
              <Text style={styles.detailTitle}>Información de envío</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailText}>{orderDetails.shipping.address}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Método:</Text>
                <Text style={styles.detailValue}>{orderDetails.shipping.method}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Seguimiento:</Text>
                <Text style={styles.detailValue}>{orderDetails.shipping.trackingNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Entregado:</Text>
                <Text style={styles.detailValue}>{orderDetails.shipping.actualDelivery}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Icon name="credit-card" size={20} color="#3B82F6" />
              <Text style={styles.detailTitle}>Información de pago</Text>
            </View>
            <View style={styles.detailContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Método:</Text>
                <Text style={styles.detailValue}>{orderDetails.payment.method}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estado:</Text>
                <View style={[styles.statusBadge, { backgroundColor: '#10B98120' }]}>
                  <Text style={[styles.statusText, { color: '#10B981' }]}>
                    {orderDetails.payment.status}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transacción:</Text>
                <Text style={styles.detailValue}>{orderDetails.payment.transactionId}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction]}
            onPress={navigateToHome}
          >
            <Icon name="shopping-bag" size={20} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Seguir comprando</Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]}>
              <Icon name="receipt" size={20} color="#3B82F6" />
              <Text style={styles.secondaryActionText}>Ver recibo</Text>
            </TouchableOpacity>
            
           
          </View>
        </View>
      </ScrollView>
      
      {/* BARRA DE NAVEGACIÓN */}
    
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#3B82F6',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerGradient: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitleSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  shareButton: {
    padding: 5,
  },
  headerMain: {
    alignItems: 'center',
  },
  orderStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
    gap: 8,
  },
  orderStatusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  orderId: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 14,
    color: '#FFFFFFCC',
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  timelineSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  deliveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deliveryStatusText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  timelineContainer: {
    marginLeft: 10,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 20,
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    top: 32,
    left: 15.5,
    width: 2,
    height: '100%',
    zIndex: 0,
  },
  timelineIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  timelineDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#10B98120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
  },
  completedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  summarySection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  summaryCard: {
    width: (width - 70) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  itemsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 5,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  detailsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 15,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  detailContent: {
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  primaryAction: {
    backgroundColor: '#3B82F6',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryActionText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
});
