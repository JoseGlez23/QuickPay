import React, { useState, useRef } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BottomNav from '../components/BottomNav';

const { width } = Dimensions.get('window');

const mockOrders = [
  {
    id: 'ORD-001',
    date: '15 Nov 2023',
    total: 1299.99,
    status: 'delivered',
    itemCount: 1,
    items: ['iPhone 15 Pro Max'],
    deliveryDate: '17 Nov 2023',
    image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=400',
  },
  {
    id: 'ORD-002',
    date: '10 Nov 2023',
    total: 1999.99,
    status: 'processing',
    itemCount: 2,
    items: ['MacBook Pro 14"', 'Magic Mouse'],
    estimatedDate: '20 Nov 2023',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400',
  },
  {
    id: 'ORD-003',
    date: '05 Nov 2023',
    total: 399.99,
    status: 'paid',
    itemCount: 1,
    items: ['Sony WH-1000XM5'],
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=400',
  },
  {
    id: 'ORD-004',
    date: '01 Nov 2023',
    total: 429.99,
    status: 'pending',
    itemCount: 1,
    items: ['Apple Watch Series 9'],
    image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=400',
  },
];

const statusConfig = {
  pending: {
    label: 'Pendiente',
    color: '#F59E0B',
    bg: '#FEF3C7',
    icon: 'pending',
  },
  paid: {
    label: 'Pagado',
    color: '#10B981',
    bg: '#D1FAE5',
    icon: 'payment',
  },
  processing: {
    label: 'En proceso',
    color: '#3B82F6',
    bg: '#DBEAFE',
    icon: 'settings',
  },
  delivered: {
    label: 'Entregado',
    color: '#8B5CF6',
    bg: '#EDE9FE',
    icon: 'check-circle',
  },
};

export default function OrderHistoryScreen({ navigation }) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [180, 100],
    extrapolate: 'clamp',
  });

  // FILTRAR PEDIDOS POR ESTADO
  const filteredOrders = mockOrders.filter(order => {
    if (selectedFilter === 'all') return true;
    return order.status === selectedFilter;
  });

  const handleOrderClick = (order) => {
    navigation.navigate('OrderStatus', { orderId: order.id });
  };

  const navigateToHome = () => {
    navigation.navigate('Home');
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: 'schedule',
      paid: 'check-circle',
      processing: 'settings',
      delivered: 'local-shipping',
    };
    return icons[status] || 'help';
  };

  const renderOrderItem = ({ item, index }) => {
    const config = statusConfig[item.status];
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderClick(item)}
        activeOpacity={0.9}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Image source={{ uri: item.image }} style={styles.orderImage} />
            <View>
              <Text style={styles.orderId}>Pedido #{item.id}</Text>
              <Text style={styles.orderDate}>
                <Icon name="calendar-today" size={12} color="#6B7280" /> {item.date}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Icon name={getStatusIcon(item.status)} size={14} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderItems}>
          {item.items.slice(0, 2).map((product, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.itemDot} />
              <Text style={styles.itemText} numberOfLines={1}>{product}</Text>
            </View>
          ))}
          {item.items.length > 2 && (
            <Text style={styles.moreItems}>+{item.items.length - 2} más</Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.footerLeft}>
            <View style={styles.quantityBadge}>
              <Icon name="inventory" size={14} color="#3B82F6" />
              <Text style={styles.quantityText}>{item.itemCount} artículo{item.itemCount !== 1 ? 's' : ''}</Text>
            </View>
            {item.deliveryDate && (
              <View style={styles.deliveryBadge}>
                <Icon name="local-shipping" size={14} color="#10B981" />
                <Text style={styles.deliveryText}>Entregado: {item.deliveryDate}</Text>
              </View>
            )}
            {item.estimatedDate && (
              <View style={styles.estimatedBadge}>
                <Icon name="schedule" size={14} color="#F59E0B" />
                <Text style={styles.estimatedText}>Entrega estimada: {item.estimatedDate}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>${item.total.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.orderAction}
          onPress={() => handleOrderClick(item)}
        >
          <Text style={styles.actionText}>Ver detalles</Text>
          <Icon name="arrow-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIllustration}>
        <Icon name="inventory" size={80} color="#E5E7EB" />
        <View style={styles.emptyIconCircle} />
      </View>
      <Text style={styles.emptyTitle}>No hay pedidos aún</Text>
      <Text style={styles.emptyText}>
        Tus compras aparecerán aquí cuando realices tu primer pedido
      </Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={navigateToHome}
      >
        <Icon name="shopping-bag" size={20} color="#FFFFFF" />
        <Text style={styles.shopButtonText}>Ir a comprar</Text>
      </TouchableOpacity>
    </View>
  );

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'processing', label: 'En proceso' },
    { id: 'delivered', label: 'Entregados' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Mis Pedidos</Text>
              <Text style={styles.orderCount}>
                {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
              </Text>
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Icon name="filter-list" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter.id && styles.filterTextActive
            ]}>
              {filter.label}
            </Text>
            {selectedFilter === filter.id && (
              <View style={styles.activeDot} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        renderEmptyState()
      ) : (
        <Animated.FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>Historial de pedidos</Text>
              <Text style={styles.listHeaderSubtitle}>
                Toca cualquier pedido para ver más detalles
              </Text>
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
  headerContent: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
    paddingHorizontal: 20,
    paddingBottom: 15,
    justifyContent: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  orderCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filterButton: {
    padding: 5,
  },
  filterScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginLeft: 5,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  listHeaderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  ordersList: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 3,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderItems: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginRight: 10,
  },
  itemText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  moreItems: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginTop: 5,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  footerLeft: {
    flex: 1,
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 8,
    gap: 5,
  },
  quantityText: {
    fontSize: 12,
    color: '#6B7280',
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginBottom: 8,
  },
  deliveryText: {
    fontSize: 12,
    color: '#10B981',
  },
  estimatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
  },
  estimatedText: {
    fontSize: 12,
    color: '#F59E0B',
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 3,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  orderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 5,
  },
  actionText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingTop: 50,
  },
  emptyIllustration: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  emptyIconCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});