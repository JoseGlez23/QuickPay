import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform,
  Alert,
  SafeAreaView,
  Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

// BASE DE DATOS UNIFICADA (Asegúrate de que las IDs coincidan con el Dashboard)
const productDetails = {
  '1': { 
    id: '1', 
    name: 'iPhone 15 Pro Max 256GB Titanium Space Gray', 
    price: 1299.99, 
    originalPrice: 1399.99,
    image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=800', 
    description: 'El iPhone más avanzado con titanio grado aeroespacial y el revolucionario chip A17 Pro. Pantalla Super Retina XDR de 6.7 pulgadas con ProMotion. Cámara de 48 MP con sistema de teleobjetivo de 5x.', 
    rating: 4.8, 
    reviews: 234, 
    stock: 15, 
    features: ['Chip A17 Pro', 'Cámara zoom 5x', 'Botón de Acción', 'Titanio grado aeroespacial', 'USB-C', 'iOS 17'],
    delivery: 'Envío gratis',
    warranty: '1 año de garantía',
    brand: 'Apple',
    category: 'Celulares'
  },
  '2': { 
    id: '2', 
    name: 'MacBook Pro 14" M3 Pro Chip 18GB RAM', 
    price: 1999.99, 
    originalPrice: 2199.99,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800', 
    description: 'Potencia salvaje para mentes creativas. Pantalla Liquid Retina XDR con ProMotion. Rendimiento extremo para edición de video, diseño 3D y desarrollo de apps.', 
    rating: 4.9, 
    reviews: 456, 
    stock: 8, 
    features: ['Chip M3 Pro', '18GB RAM', '512GB SSD', 'Pantalla XDR', '18 horas batería', 'macOS Sonoma'],
    delivery: 'Envío gratis',
    warranty: '1 año de garantía',
    brand: 'Apple',
    category: 'Computación'
  },
  '3': { 
    id: '3', 
    name: 'Sony WH-1000XM5 Noise Cancelling', 
    price: 399.99, 
    originalPrice: 449.99,
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800', 
    description: 'La mejor cancelación de ruido del mundo con un sonido excepcional. Procesador de audio integrado QN1 y ocho micrófonos para captura precisa de voz.', 
    rating: 4.7, 
    reviews: 789, 
    stock: 23, 
    features: ['ANC Inteligente', '30h batería', 'Audio Hi-Res', '8 micrófonos', 'Carga rápida', 'Control táctil'],
    delivery: 'Llega mañana',
    warranty: '2 años de garantía',
    brand: 'Sony',
    category: 'Audio'
  },
  '4': { 
    id: '4', 
    name: 'Apple Watch Series 9 GPS 45mm Black', 
    price: 429.99, 
    originalPrice: 459.99,
    image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=800', 
    description: 'Más potente, más brillante y con funciones de salud avanzadas. Chip S9 SiP de doble núcleo, pantalla Retina siempre activa y monitor de salud completo.', 
    rating: 4.6, 
    reviews: 112, 
    stock: 10, 
    features: ['Gesto doble toque', 'Sensor de oxígeno', 'Pantalla Retina', 'Chip S9', 'watchOS 10', 'Resistente al agua'],
    delivery: 'Llega mañana',
    warranty: '1 año de garantía',
    brand: 'Apple',
    category: 'Relojes'
  },
  '5': { 
    id: '5', 
    name: 'Samsung Galaxy S24 Ultra 512GB Titanium', 
    price: 1399.99, 
    originalPrice: 1499.99,
    image: 'https://images.unsplash.com/photo-1610945415295-d9baf060e871?q=80&w=800', 
    description: 'Llega la era de la IA móvil. Cámara de 200MP y S-Pen integrado. Pantalla Dynamic AMOLED 2X de 6.8 pulgadas con tasa de refresco de 120Hz.', 
    rating: 4.9, 
    reviews: 302, 
    stock: 12, 
    features: ['Galaxy AI', 'Cámara 200MP', 'Snapdragon 8 Gen 3', 'S-Pen integrado', '512GB almacenamiento', 'Android 14'],
    delivery: 'Envío gratis',
    warranty: '2 años de garantía',
    brand: 'Samsung',
    category: 'Celulares'
  },
  '6': { 
    id: '6', 
    name: 'iPad Air M2 11" 128GB Wi-Fi Blue', 
    price: 599.99, 
    originalPrice: 649.99,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800', 
    description: 'Ligero, potente y con el chip M2 para un rendimiento increíble. Pantalla Liquid Retina de 11 pulgadas, compatible con Apple Pencil y Magic Keyboard.', 
    rating: 4.8, 
    reviews: 156, 
    stock: 20, 
    features: ['Chip M2', 'Pantalla Liquid Retina', 'Touch ID', 'USB-C', 'Compatibilidad Apple Pencil', 'iPadOS 17'],
    delivery: 'Envío gratis',
    warranty: '1 año de garantía',
    brand: 'Apple',
    category: 'Computación'
  },
  '7': { 
    id: '7', 
    name: 'AirPods Pro (2.ª generación) MagSafe', 
    price: 249.99, 
    originalPrice: 299.99,
    image: 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?q=80&w=800', 
    description: 'Cancelación activa de ruido hasta dos veces más potente. Chip H2, audio espacial personalizado y estuche de carga MagSafe.', 
    rating: 4.9, 
    reviews: 890, 
    stock: 45, 
    features: ['Audio Espacial', 'USB-C', 'Resistente al agua', 'Chip H2', 'Carga MagSafe', '6h batería'],
    delivery: 'Llega hoy',
    warranty: '1 año de garantía',
    brand: 'Apple',
    category: 'Audio'
  },
  '8': { 
    id: '8', 
    name: 'Monitor Gamer Samsung Odyssey G7 27"', 
    price: 699.99, 
    originalPrice: 799.99,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800', 
    description: 'Monitor curvo gaming con tasa de refresco de 240Hz. Panel QLED 2K, curvatura 1000R y tecnología Quantum Dot para colores vibrantes.', 
    rating: 4.7, 
    reviews: 94, 
    stock: 6, 
    features: ['Curvatura 1000R', '240Hz', 'QLED', 'Resolución 2K', 'FreeSync Premium Pro', 'HDR600'],
    delivery: 'Envío gratis',
    warranty: '3 años de garantía',
    brand: 'Samsung',
    category: 'Computación'
  },
};

export default function ProductDetailScreen({ route, navigation }) {
  // OBTENEMOS EL ID QUE VIENE DEL DASHBOARD
  const { productId } = route.params || {};
  const { addToCart, cartCount } = useAuth();
  
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const scrollY = new Animated.Value(0);

  // BUSCAMOS EL PRODUCTO EN NUESTRA BASE DE DATOS USANDO EL ID
  const product = productDetails[productId];

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [productId]);

  // Si por alguna razón el ID no existe, mostramos error
  if (!product && !loading) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="error" size={60} color="#DC2626" />
        <Text style={styles.errorText}>Producto no encontrado</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    Alert.alert(
      "¡Agregado!", 
      `${product.name} se añadió al carrito.`, 
      [
        { text: "Seguir comprando", onPress: () => navigation.goBack() },
        { 
          text: "Ver Carrito", 
          onPress: () => navigation.navigate('Cart') 
        }
      ]
    );
  };

  const handleBuyNow = () => {
    navigation.navigate('Payment', { 
      total: product.price * quantity,
      items: [{
        ...product,
        quantity
      }]
    });
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 200],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp'
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const discount = product.originalPrice ? 
    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* HEADER FLOTANTE */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <Icon 
              name={isFavorite ? "favorite" : "favorite-border"} 
              size={24} 
              color={isFavorite ? "#DC2626" : "#333"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <Icon name="shopping-cart" size={24} color="#333" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* IMAGEN DEL PRODUCTO */}
        <View style={styles.imageSection}>
          <Image 
            source={{ uri: product.image }} 
            style={styles.mainImage} 
            resizeMode="contain" 
          />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
        </View>

        <View style={styles.contentSection}>
          {/* INFORMACIÓN BÁSICA */}
          <View style={styles.basicInfo}>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>{product.brand}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{product.category}</Text>
              </View>
            </View>
            
            <Text style={styles.productName}>{product.name}</Text>
            
            <View style={styles.ratingRow}>
              <View style={styles.ratingContainer}>
                <Icon name="star" size={18} color="#FBBF24" />
                <Text style={styles.ratingText}>{product.rating}</Text>
                <Text style={styles.reviewsText}>({product.reviews} reseñas)</Text>
              </View>
              <View style={styles.stockContainer}>
                <Icon name="check-circle" size={16} color="#10B981" />
                <Text style={styles.stockText}>En stock: {product.stock}</Text>
              </View>
            </View>
          </View>

          {/* PRECIO */}
          <View style={styles.priceSection}>
            <Text style={styles.currentPrice}>${product.price.toFixed(2)}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
            )}
            <View style={styles.deliveryBadge}>
              <Icon name="local-shipping" size={16} color="#3B82F6" />
              <Text style={styles.deliveryText}>{product.delivery}</Text>
            </View>
          </View>

          {/* CANTIDAD */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Cantidad</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                onPress={() => quantity > 1 && setQuantity(quantity - 1)} 
                style={styles.quantityButton}
                disabled={quantity <= 1}
              >
                <Icon name="remove" size={20} color={quantity <= 1 ? "#9CA3AF" : "#111827"} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity 
                onPress={() => quantity < product.stock && setQuantity(quantity + 1)} 
                style={styles.quantityButton}
                disabled={quantity >= product.stock}
              >
                <Icon name="add" size={20} color={quantity >= product.stock ? "#9CA3AF" : "#111827"} />
              </TouchableOpacity>
              <Text style={styles.stockText}>Disponibles: {product.stock}</Text>
            </View>
          </View>

          {/* DESCRIPCIÓN */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* CARACTERÍSTICAS */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Características principales</Text>
            <View style={styles.featuresList}>
              {product.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Icon name="check-circle" size={18} color="#10B981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ESPECIFICACIONES */}
          <View style={styles.specsSection}>
            <Text style={styles.sectionTitle}>Especificaciones</Text>
            <View style={styles.specsGrid}>
              <View style={styles.specItem}>
                <Icon name="local-shipping" size={20} color="#3B82F6" />
                <Text style={styles.specLabel}>Envío</Text>
                <Text style={styles.specValue}>{product.delivery}</Text>
              </View>
              <View style={styles.specItem}>
                <Icon name="verified" size={20} color="#10B981" />
                <Text style={styles.specLabel}>Garantía</Text>
                <Text style={styles.specValue}>{product.warranty}</Text>
              </View>
              <View style={styles.specItem}>
                <Icon name="store" size={20} color="#8B5CF6" />
                <Text style={styles.specLabel}>Marca</Text>
                <Text style={styles.specValue}>{product.brand}</Text>
              </View>
              <View style={styles.specItem}>
                <Icon name="category" size={20} color="#F59E0B" />
                <Text style={styles.specLabel}>Categoría</Text>
                <Text style={styles.specValue}>{product.category}</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* BOTONES DE ACCIÓN */}
      <View style={styles.actionBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.actionPriceLabel}>Total:</Text>
          <Text style={styles.actionPrice}>${(product.price * quantity).toFixed(2)}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            onPress={handleAddToCart} 
            style={styles.addToCartButton}
          >
            <Icon name="add-shopping-cart" size={22} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.buyButton} 
            onPress={handleBuyNow}
          >
            <Text style={styles.buyText}>Comprar ahora</Text>
            <Icon name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#FFF'
  },
  errorText: {
    fontSize: 18,
    color: '#DC2626',
    marginTop: 15,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  imageSection: { 
    width: width, 
    height: height * 0.4, 
    backgroundColor: '#F9FAFB', 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative',
  },
  mainImage: { 
    width: '85%', 
    height: '85%' 
  },
  discountBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contentSection: { 
    padding: 20,
    paddingBottom: 100,
  },
  basicInfo: {
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  brand: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  categoryText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  productName: { 
    fontSize: 22, 
    fontWeight: 'bold',
    color: '#111827', 
    marginBottom: 15,
    lineHeight: 28,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  reviewsText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#6B7280',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  currentPrice: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#111827' 
  },
  originalPrice: {
    fontSize: 20,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 10,
    marginRight: 20,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  deliveryText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  quantitySection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    width: 40, 
    textAlign: 'center',
    marginHorizontal: 10,
  },
  descriptionSection: {
    marginBottom: 25,
  },
  description: { 
    fontSize: 16, 
    color: '#4B5563', 
    lineHeight: 24 
  },
  featuresSection: {
    marginBottom: 25,
  },
  featuresList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
  },
  featureItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  featureText: { 
    marginLeft: 12, 
    fontSize: 15, 
    color: '#4B5563',
    flex: 1,
  },
  specsSection: {
    marginBottom: 25,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  specItem: {
    width: (width - 70) / 2,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    //flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  priceContainer: {
    flex: 1,
  },
  actionPriceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  actionPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
     marginHorizontal: 90,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addToCartButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButton: { 
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buyText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 16 
  }
});