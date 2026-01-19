import React, { useState, useEffect, useRef } from "react";
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
  SafeAreaView,
  Animated,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../utils/supabase";

const { width, height } = Dimensions.get("window");

export default function ProductDetailScreen({ route, navigation }) {
  const { productId, productData } = route.params || {};
  const { addToCart } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const moveAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const formatPrice = (price) => {
    if (!price && price !== 0) return "$0.00";
    const formatted = parseFloat(price).toFixed(2);
    const parts = formatted.split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `$${integerPart}.${parts[1]}`;
  };

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const id = productId || productData?.id;
        const { data, error } = await supabase
          .from("products")
          .select(`*, category:categories(name)`)
          .eq("id", id)
          .single();

        if (data) {
          setProduct({
            ...data,
            price: parseFloat(data.price),
            brand: data.brand || "Marca reconocida",
            categoryName: data.category?.name || "General",
            images: data.images || []
          });
        }
      } catch (e) {
        console.error("Error al cargar producto:", e);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [productId]);

  const runCartAnimation = () => {
    moveAnim.setValue({ x: width / 2 - 50, y: height * 0.2 });
    scaleAnim.setValue(1);
    opacityAnim.setValue(1);
    rotateAnim.setValue(0);

    Animated.parallel([
      Animated.timing(moveAnim, {
        toValue: { x: width - 80, y: -50 },
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowModal(true);
    });
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    runCartAnimation();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  if (loading || !product) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
              <Icon name="check" size={40} color="#FFF" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>¡Agregado!</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              {product.name} se añadió con éxito.
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalBtnText}>Continuar explorando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Animated.Image
        source={{ uri: product.images?.[selectedImage] || 'https://via.placeholder.com/400' }}
        style={[
          styles.animImage,
          {
            transform: [
              { translateX: moveAnim.x },
              { translateY: moveAnim.y },
              { scale: scaleAnim },
              { rotate: rotation }
            ],
            opacity: opacityAnim
          }
        ]}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        <View style={[styles.imageContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f9f9f9' }]}>
          <Image source={{ uri: product.images?.[selectedImage] }} style={styles.mainImg} resizeMode="contain" />
          <View style={styles.thumbWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbScroll}>
              {product.images?.map((img, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => setSelectedImage(index)}
                  style={[styles.thumbItem, { borderColor: selectedImage === index ? colors.primary : 'transparent', backgroundColor: colors.card }]}
                >
                  <Image source={{ uri: img }} style={styles.thumbImg} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.categoryRow}>
            <Text style={[styles.brand, { color: colors.primary }]}>{product.brand}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>{product.categoryName}</Text>
            </View>
          </View>

          <Text style={[styles.name, { color: colors.text }]}>{product.name}</Text>
          <Text style={[styles.price, { color: colors.text }]}>{formatPrice(product.price)}</Text>
          
          <View style={styles.divider} />

          <Text style={[styles.subTitle, { color: colors.text }]}>Descripción</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{product.description}</Text>
          
          <View style={styles.qtyRow}>
            <View>
              <Text style={[styles.subTitle, { color: colors.text, marginTop: 0 }]}>Seleccionar cantidad</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Unidades para tu orden</Text>
            </View>
            <View style={[styles.qtySelector, { backgroundColor: isDarkMode ? '#333' : '#F0F0F0' }]}>
              <TouchableOpacity onPress={() => quantity > 1 && setQuantity(quantity - 1)} style={styles.qtyBtn}>
                <Icon name="remove" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.qtyVal, { color: colors.text }]}>{quantity}</Text>
              <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}>
                <Icon name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.footerContent}>
          <View style={styles.totalContainer}>
            <Text style={[styles.totalLab, { color: colors.textSecondary }]}>Total estimado</Text>
            <Text style={[styles.totalValText, { color: colors.text }]}>{formatPrice(product.price * quantity)}</Text>
          </View>
          <TouchableOpacity 
            onPress={handleAddToCart} 
            style={[styles.fullCartBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Icon name="shopping-bag" size={22} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.buyText}>Agregar al carrito</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  animImage: { position: 'absolute', width: 100, height: 100, zIndex: 99, borderRadius: 50 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.85, borderRadius: 25, padding: 30, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 10 },
  modalSub: { fontSize: 16, textAlign: 'center', marginBottom: 25, opacity: 0.8 },
  modalBtn: { width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  imageContainer: { width: width, height: height * 0.45, justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' },
  mainImg: { width: '80%', height: '75%' },
  thumbWrapper: { position: 'absolute', bottom: 20, width: '100%' },
  thumbScroll: { paddingHorizontal: 20 },
  thumbItem: { width: 60, height: 60, borderRadius: 12, marginRight: 12, borderWidth: 1.5, overflow: 'hidden', padding: 5 },
  thumbImg: { width: '100%', height: '100%', borderRadius: 8 },
  
  infoBox: { padding: 24 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  categoryText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  brand: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  name: { fontSize: 28, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 },
  price: { fontSize: 24, fontWeight: '400', marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#eee', width: '100%', marginVertical: 10, opacity: 0.5 },
  subTitle: { fontSize: 17, fontWeight: '700', marginTop: 15, marginBottom: 8 },
  desc: { fontSize: 15, lineHeight: 24, opacity: 0.8 },
  
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  qtySelector: { flexDirection: 'row', alignItems: 'center', borderRadius: 15, padding: 5 },
  qtyBtn: { width: 35, height: 35, justifyContent: 'center', alignItems: 'center' },
  qtyVal: { fontSize: 18, fontWeight: '700', marginHorizontal: 15, minWidth: 20, textAlign: 'center' },
  
  footer: {
    position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 20, 
    paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    borderTopWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 15
  },
  footerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalContainer: { flex: 0.4 },
  totalLab: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  totalValText: { fontSize: 20, fontWeight: '800' },
  fullCartBtn: { flex: 0.6, height: 58, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  buyText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});