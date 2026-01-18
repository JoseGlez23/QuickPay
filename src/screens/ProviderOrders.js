import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  Alert, StatusBar, SafeAreaView, Animated, Dimensions, ScrollView,
  ActivityIndicator, Platform, Easing
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // IMPORTAMOS EL TEMA
import { supabase } from '../utils/supabase';

const { width } = Dimensions.get('window');

// Colores de estado adaptativos para mejor contraste
const getStatusColors = (isDarkMode) => ({
  pending: { bg: isDarkMode ? '#451a03' : '#FEF3C7', color: '#F59E0B', label: 'Pendiente', icon: 'clock-outline' },
  paid: { bg: isDarkMode ? '#064e3b' : '#D1FAE5', color: '#10B981', label: 'Pagado', icon: 'cash-check' },
  processing: { bg: isDarkMode ? '#1e3a8a' : '#DBEAFE', color: '#60A5FA', label: 'En proceso', icon: 'cog-sync' },
  shipped: { bg: isDarkMode ? '#4c1d95' : '#EDE9FE', color: '#A78BFA', label: 'Enviado', icon: 'truck-delivery' },
  delivered: { bg: isDarkMode ? '#064e3b' : '#DCFCE7', color: '#10B981', label: 'Entregado', icon: 'check-circle' },
  cancelled: { bg: isDarkMode ? '#450a0a' : '#FEE2E2', color: '#EF4444', label: 'Cancelado', icon: 'close-circle' },
});

const statusFilters = [
  { id: 'all', label: 'Todos', icon: 'all-inclusive' },
  { id: 'pending', label: 'Pendientes', icon: 'clock-alert-outline' },
  { id: 'processing', label: 'En proceso', icon: 'cached' },
  { id: 'shipped', label: 'Enviados', icon: 'truck-fast' },
  { id: 'delivered', label: 'Listos', icon: 'check-all' },
];

export default function ProviderOrders({ navigation }) {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme(); // CONSUMIMOS EL TEMA GLOBAL
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, revenue: 0, average: 0 });

  const statusColors = getStatusColors(isDarkMode);
  const bgAnim1 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user?.id) loadOrders();
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
    const updated = orders.map(o => o.id === id ? { ...o, status: newStatus } : o);
    setOrders(updated);
    filterOrders(selectedFilter, updated);
    Alert.alert("Éxito", "Estado actualizado correctamente");
  };

  const renderOrderItem = ({ item }) => {
    const status = statusColors[item.status] || statusColors.pending;
    return (
      <View style={[styles.orderCard, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.orderNum, { color: colors.text }]}>Pedido #{item.orderNumber}</Text>
            <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Icon name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusTxt, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.clientRow}>
          <View style={[styles.clientAvatar, { backgroundColor: isDarkMode ? '#1e293b' : '#eff6ff' }]}>
            <Icon name="account" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.clientName, { color: colors.text }]}>{item.clientName}</Text>
        </View>

        <View style={[styles.itemsBox, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }]}>
          {item.items.map((prod, i) => (
            <Text key={i} style={[styles.itemText, { color: colors.textSecondary }]} numberOfLines={1}>
              • {prod.productName} <Text style={{fontWeight: 'bold', color: colors.text}}>(x{prod.quantity})</Text>
            </Text>
          ))}
        </View>

        <View style={[styles.cardFooter, { borderTopColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total a cobrar</Text>
            <Text style={[styles.totalVal, { color: '#10B981' }]}>${item.total.toFixed(2)}</Text>
          </View>
          
          <View style={styles.actions}>
            {item.status === 'pending' && (
              <TouchableOpacity style={[styles.btnGreen, { backgroundColor: '#10B981' }]} onPress={() => handleStatusChange(item.id, 'processing')}>
                <Icon name="check-bold" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            {item.status === 'processing' && (
              <TouchableOpacity style={[styles.btnBlue, { backgroundColor: colors.primary }]} onPress={() => handleStatusChange(item.id, 'shipped')}>
                <Icon name="truck-fast" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.btnDetails} onPress={() => navigation.navigate('OrderDetail', { order: item })}>
              <Icon name="chevron-right" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <Animated.View style={[styles.bgCircle, { 
        transform: [{ translateY: bgAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) }],
        backgroundColor: colors.primary, opacity: 0.1, top: -50, right: -50 
      }]} />

      <View style={[styles.headerSafe, { backgroundColor: colors.card }]}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="chevron-left" size={32} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Mis Pedidos</Text>
            <View style={{ width: 40 }} /> 
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            <View style={[styles.miniStat, {backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderLeftColor: colors.primary}]}>
              <Text style={[styles.statNum, {color: colors.text}]}>{stats.total}</Text>
              <Text style={[styles.statLab, {color: colors.textSecondary}]}>Totales</Text>
            </View>
            <View style={[styles.miniStat, {backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderLeftColor: '#f59e0b'}]}>
              <Text style={[styles.statNum, {color: colors.text}]}>{stats.pending}</Text>
              <Text style={[styles.statLab, {color: colors.textSecondary}]}>Pendientes</Text>
            </View>
            <View style={[styles.miniStat, {backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderLeftColor: '#10B981'}]}>
              <Text style={[styles.statNum, {color: colors.text}]}>${stats.revenue.toFixed(0)}</Text>
              <Text style={[styles.statLab, {color: colors.textSecondary}]}>Ingresos</Text>
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
              style={[
                styles.filterChip, 
                { backgroundColor: colors.card, borderColor: isDarkMode ? '#334155' : '#e2e8f0' },
                selectedFilter === f.id && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
            >
              <Icon name={f.icon} size={16} color={selectedFilter === f.id ? '#fff' : colors.textSecondary} />
              <Text style={[styles.filterChipText, { color: selectedFilter === f.id ? '#fff' : colors.textSecondary }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadOrders} colors={[colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="package-variant" size={80} color={isDarkMode ? '#334155' : '#e2e8f0'} />
              <Text style={[styles.emptyTxt, {color: colors.textSecondary}]}>No hay pedidos aquí</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  bgCircle: { position: 'absolute', width: 250, height: 250, borderRadius: 125 },
  headerSafe: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4, zIndex: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  backBtn: { padding: 5 },
  statsScroll: { paddingHorizontal: 20, marginVertical: 20 },
  miniStat: { padding: 12, borderRadius: 16, marginRight: 15, minWidth: 100, borderLeftWidth: 4 },
  statNum: { fontSize: 18, fontWeight: '900' },
  statLab: { fontSize: 11, fontWeight: '600' },
  filterBar: { marginVertical: 15 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginRight: 10, borderWidth: 1 },
  filterChipText: { marginLeft: 8, fontSize: 13, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  orderCard: { borderRadius: 24, padding: 20, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  orderNum: { fontSize: 16, fontWeight: '800' },
  orderDate: { fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, gap: 5 },
  statusTxt: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  clientAvatar: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  clientName: { fontSize: 14, fontWeight: '700' },
  itemsBox: { borderRadius: 15, padding: 12, marginBottom: 15 },
  itemText: { fontSize: 13, marginBottom: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 15 },
  totalLabel: { fontSize: 11, fontWeight: '600' },
  totalVal: { fontSize: 20, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  btnGreen: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnBlue: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnDetails: { padding: 5 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyTxt: { marginTop: 15, fontWeight: '600' }
});