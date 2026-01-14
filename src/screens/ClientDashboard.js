import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BottomNav from '../components/BottomNav';

const { width } = Dimensions.get('window');

const COLORS = {
  primaryBlue: '#3B82F6',
  white: '#FFFFFF',
  textSecondary: '#6B7280',
  background: '#F3F4F6',
  successGreen: '#10B981',
};

// CATEGORÍAS
const categories = [
  { id: 'all', name: 'Todos', icon: 'grid-view' },
  { id: 'electronics', name: 'Celulares', icon: 'smartphone' },
  { id: 'computers', name: 'Computación', icon: 'computer' },
  { id: 'audio', name: 'Audio', icon: 'headset' },
  { id: 'wearables', name: 'Relojes', icon: 'watch' },
];

// TU LISTA DE PRODUCTOS ORIGINAL (Sincronizada con ProductDetail)
const mockProducts = [
  { id: '1', name: 'iPhone 15 Pro Max 256GB Titanium Space Gray', price: 1299.99, discountPrice: 1199.99, image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=400', category: 'electronics', isNew: true, delivery: 'Envío gratis' },
  { id: '2', name: 'MacBook Pro 14" M3 Pro Chip 18GB RAM', price: 1999.99, discountPrice: 1799.99, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400', category: 'computers', isNew: false, delivery: 'Envío gratis' },
  { id: '3', name: 'Sony WH-1000XM5 Noise Cancelling', price: 399.99, discountPrice: 349.99, image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=400', category: 'audio', isNew: true, delivery: 'Llega mañana' },
  { id: '4', name: 'Apple Watch Series 9 GPS 45mm Black', price: 429.99, discountPrice: 399.99, image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=400', category: 'wearables', isNew: false, delivery: 'Llega mañana' },
  { id: '5', name: 'Samsung Galaxy S24 Ultra 512GB Titanium', price: 1399.99, discountPrice: 1249.99, image: 'https://images.unsplash.com/photo-1610945415295-d9baf060e871?q=80&w=400', category: 'electronics', isNew: true, delivery: 'Envío gratis' },
  { id: '6', name: 'iPad Air M2 11" 128GB Wi-Fi Blue', price: 599.99, discountPrice: 549.99, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400', category: 'computers', isNew: true, delivery: 'Envío gratis' },
  { id: '7', name: 'AirPods Pro (2.ª generación) MagSafe', price: 249.99, discountPrice: 199.99, image: 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?q=80&w=400', category: 'audio', isNew: false, delivery: 'Llega hoy' },
  { id: '8', name: 'Monitor Gamer Samsung Odyssey G7 27"', price: 699.99, discountPrice: 589.99, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=400', category: 'computers', isNew: false, delivery: 'Envío gratis' },
];

export default function ClientDashboard({ navigation }) {
  const { user, cartCount } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // PROTECCIÓN DE ERROR: user?.name evita el crash si el objeto es null
  const userName = user?.name || 'Cliente';

  // FILTRADO DE PRODUCTOS
  const filteredProducts = mockProducts.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  // FUNCIÓN PARA NAVEGAR A PESTAÑAS - CORREGIDA
  const handleTabNavigation = (tabName) => {
    // IMPORTANTE: Cuando estamos en el tab navigator, podemos navegar directamente
    if (navigation.getState()?.routes[0]?.name === 'ClientTabs') {
      navigation.navigate(tabName);
    } else {
      // Si no estamos en el tab navigator, navegamos al tab primero
      navigation.navigate('ClientTabs', { screen: tabName });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryBlue} />
      
      {/* HEADER CON BUSCADOR */}
      <View style={styles.headerContainer}>
        <View style={styles.searchBarRow}>
          <View style={styles.searchWrapper}>
            <Icon name="search" size={20} color="#999" style={{marginLeft: 10}} />
            <TextInput 
              placeholder="Buscar productos..." 
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
         <TouchableOpacity 
  style={styles.headerIconButton} 
  onPress={() => navigation.navigate('ClientCart')}
>
          
            <View>
              <Icon name="shopping-cart" size={26} color={COLORS.white} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.locationRow}>
          <Icon name="location-on" size={14} color={COLORS.white} />
          <Text style={styles.locationText}>
            Enviar a {userName} - Calle Principal 123
          </Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* CATEGORÍAS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catContainer}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              onPress={() => setSelectedCategory(cat.id)}
              style={styles.catItem}
            >
              <View style={[styles.catCircle, selectedCategory === cat.id && styles.catCircleActive]}>
                <Icon 
                  name={cat.icon} 
                  size={24} 
                  color={selectedCategory === cat.id ? COLORS.white : COLORS.primaryBlue} 
                />
              </View>
              <Text style={[styles.catLabel, selectedCategory === cat.id && styles.catLabelActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TITULO SECCIÓN */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recomendados para ti</Text>
          <Text style={styles.resultsCount}>{filteredProducts.length} items</Text>
        </View>
        
        {/* GRID DE PRODUCTOS */}
        <View style={styles.grid}>
          {filteredProducts.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.productCard}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} // AQUÍ SE PASA EL ID
            >
              <Image source={{ uri: item.image }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.currentPrice}>${item.discountPrice.toFixed(2)}</Text>
                  <Text style={styles.deliveryTag}>FULL</Text>
                </View>
                <Text style={styles.deliveryText}>{item.delivery}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerContainer: { backgroundColor: COLORS.primaryBlue, paddingTop: 10, paddingHorizontal: 15, paddingBottom: 12 },
  searchBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, height: 45, borderRadius: 8 },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 14, color: '#333' },
  headerIconButton: { marginLeft: 15 },
  cartBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBlue },
  cartBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 13, color: COLORS.white, marginHorizontal: 5 },
  catContainer: { paddingHorizontal: 15, paddingVertical: 20 },
  catItem: { alignItems: 'center', marginRight: 22 },
  catCircle: { width: 55, height: 55, borderRadius: 28, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  catCircleActive: { backgroundColor: COLORS.primaryBlue },
  catLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 8 },
  catLabelActive: { color: COLORS.primaryBlue, fontWeight: 'bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 15, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  resultsCount: { color: COLORS.textSecondary, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 15 },
  productCard: { width: (width - 40) / 2, backgroundColor: COLORS.white, borderRadius: 10, marginBottom: 15, elevation: 2, overflow: 'hidden' },
  productImage: { width: '100%', height: 150, backgroundColor: '#fff', resizeMode: 'contain' },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, color: '#4B5563', height: 35 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  currentPrice: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  deliveryTag: { fontSize: 10, color: COLORS.primaryBlue, fontWeight: 'bold', fontStyle: 'italic' },
  deliveryText: { fontSize: 11, color: COLORS.successGreen, marginTop: 2, fontWeight: '600' }
});