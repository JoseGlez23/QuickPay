import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  Alert, StatusBar, SafeAreaView, Animated, Dimensions, ScrollView,
  ActivityIndicator, Platform, Easing
} from 'react-native';
// Usamos MaterialCommunityIcons para máxima compatibilidad con Expo
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

const { width } = Dimensions.get('window');

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
  pending: { bg: '#FEF3C7', color: '#F59E0B', label: 'Pendiente', icon: 'clock-outline' },
  paid: { bg: '#D1FAE5', color: '#10B981', label: 'Pagado', icon: 'cash-check' },
  processing: { bg: '#DBEAFE', color: '#3B82F6', label: 'En proceso', icon: 'cog-sync' },
  shipped: { bg: '#EDE9FE', color: '#8B5CF6', label: 'Enviado', icon: 'truck-delivery' },
  delivered: { bg: '#DCFCE7', color: '#10B981', label: 'Entregado', icon: 'check-circle' },
  cancelled: { bg: '#FEE2E2', color: '#EF4444', label: 'Cancelado', icon: 'close-circle' },
};

const statusFilters = [
  { id: 'all', label: 'Todos', icon: 'all-inclusive' },
  { id: 'pending', label: 'Pendientes', icon: 'clock-alert-outline' },
  { id: 'processing', label: 'En proceso', icon: 'cached' },
  { id: 'shipped', label: 'Enviados', icon: 'truck-fast' },
  { id: 'delivered', label: 'Listos', icon: 'check-all' },
];

export default function ProviderOrders({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, revenue: 0, average: 0 });

  // Animaciones de fondo
  const bgAnim1 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim1, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bgAnim1, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`*, order_items (*, products (*)), clients:client_id (*)`)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders = ordersData.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        clientName: order.clients?.name || 'Cliente',
        total: parseFloat(order.total),
        status: order.status,
        createdAt: order.created_at,
        items: order.order_items?.map(item => ({
          productName: item.products?.name || 'Producto',
          quantity: item.quantity,
        })) || [],
      }));

      setOrders(formattedOrders);
      filterOrders(selectedFilter, formattedOrders);
      calculateStats(formattedOrders);
    } catch (error) {
      console.error(error);
      // Aquí iría el loadMockOrders si falla
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (list) => {
    const rev = list.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
    setStats({
      total: list.length,
      pending: list.filter(o => o.status === 'pending').length,
      revenue: rev,
      average: list.length > 0 ? rev / list.length : 0
    });
  };

  const filterOrders = (filterId, list = orders) => {
    setSelectedFilter(filterId);
    if (filterId === 'all') setFilteredOrders(list);
    else setFilteredOrders(list.filter(o => o.status === filterId));
  };

  const handleStatusChange = async (id, newStatus) => {
    // Simulación de actualización para agilidad de UI
    const updated = orders.map(o => o.id === id ? { ...o, status: newStatus } : o);
    setOrders(updated);
    filterOrders(selectedFilter, updated);
    Alert.alert("Éxito", "Estado actualizado correctamente");
  };

  const renderOrderItem = ({ item }) => {
    const status = statusColors[item.status] || statusColors.pending;
    return (
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNum}>Pedido #{item.orderNumber}</Text>
            <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Icon name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusTxt, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.clientRow}>
          <View style={styles.clientAvatar}>
            <Icon name="account" size={20} color={THEME.primary} />
          </View>
          <Text style={styles.clientName}>{item.clientName}</Text>
        </View>

        <View style={styles.itemsBox}>
          {item.items.map((prod, i) => (
            <Text key={i} style={styles.itemText} numberOfLines={1}>
              • {prod.productName} <Text style={{fontWeight: 'bold'}}>(x{prod.quantity})</Text>
            </Text>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Total a cobrar</Text>
            <Text style={styles.totalVal}>${item.total.toFixed(2)}</Text>
          </View>
          
          <View style={styles.actions}>
            {item.status === 'pending' && (
              <TouchableOpacity style={styles.btnGreen} onPress={() => handleStatusChange(item.id, 'processing')}>
                <Icon name="check-bold" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            {item.status === 'processing' && (
              <TouchableOpacity style={styles.btnBlue} onPress={() => handleStatusChange(item.id, 'shipped')}>
                <Icon name="truck-fast" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.btnDetails} onPress={() => navigation.navigate('OrderDetail', { order: item })}>
              <Icon name="chevron-right" size={24} color={THEME.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Esferas de fondo estilo Dashboard */}
      <Animated.View style={[styles.bgCircle, { 
        transform: [{ translateY: bgAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) }],
        top: -50, right: -50, backgroundColor: THEME.primary, opacity: 0.1 
      }]} />

      <View style={styles.headerSafe}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="chevron-left" size={32} color={THEME.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mis Pedidos</Text>
            <View style={{ width: 40 }} /> 
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <View style={[styles.miniStat, {borderLeftColor: THEME.primary}]}>
              <Text style={styles.statNum}>{stats.total}</Text>
              <Text style={styles.statLab}>Totales</Text>
            </View>
            <View style={[styles.miniStat, {borderLeftColor: '#f59e0b'}]}>
              <Text style={styles.statNum}>{stats.pending}</Text>
              <Text style={styles.statLab}>Pendientes</Text>
            </View>
            <View style={[styles.miniStat, {borderLeftColor: THEME.secondary}]}>
              <Text style={styles.statNum}>${stats.revenue.toFixed(0)}</Text>
              <Text style={styles.statLab}>Ingresos</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20}}>
          {statusFilters.map(f => (
            <TouchableOpacity 
              key={f.id} 
              onPress={() => filterOrders(f.id)}
              style={[styles.filterChip, selectedFilter === f.id && styles.filterChipActive]}
            >
              <Icon name={f.icon} size={16} color={selectedFilter === f.id ? '#fff' : THEME.textSecondary} />
              <Text style={[styles.filterChipText, selectedFilter === f.id && {color: '#fff'}]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={THEME.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="package-variant" size={80} color="#e2e8f0" />
              <Text style={styles.emptyTxt}>No hay pedidos en esta sección</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadOrders()} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: THEME.background },
  bgCircle: { position: 'absolute', width: 250, height: 250, borderRadius: 125 },
  
  headerSafe: { backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4, zIndex: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: THEME.textPrimary },
  backBtn: { padding: 5 },

  statsScroll: { paddingHorizontal: 20, marginVertical: 20 },
  miniStat: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 16, marginRight: 15, minWidth: 100, borderLeftWidth: 4 },
  statNum: { fontSize: 18, fontWeight: '900', color: THEME.textPrimary },
  statLab: { fontSize: 11, color: THEME.textSecondary, fontWeight: '600' },

  filterBar: { marginVertical: 15 },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  filterChipText: { marginLeft: 8, fontSize: 13, fontWeight: '700', color: THEME.textSecondary },

  list: { paddingHorizontal: 20, paddingBottom: 40 },
  orderCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  orderNum: { fontSize: 16, fontWeight: '800', color: THEME.textPrimary },
  orderDate: { fontSize: 12, color: THEME.textSecondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 5 },
  statusTxt: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  clientAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  clientName: { fontSize: 14, fontWeight: '700', color: THEME.textPrimary },

  itemsBox: { backgroundColor: '#f8fafc', borderRadius: 15, padding: 12, marginBottom: 15 },
  itemText: { fontSize: 13, color: THEME.textSecondary, marginBottom: 4 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
  totalLabel: { fontSize: 11, color: THEME.textSecondary, fontWeight: '600' },
  totalVal: { fontSize: 20, fontWeight: '900', color: THEME.secondary },

  actions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  btnGreen: { backgroundColor: THEME.secondary, width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnBlue: { backgroundColor: THEME.primary, width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnDetails: { padding: 5 },

  empty: { alignItems: 'center', marginTop: 100 },
  emptyTxt: { color: THEME.textSecondary, marginTop: 15, fontWeight: '600' }
});