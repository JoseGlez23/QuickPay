import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

export default function CartScreen({ navigation }) {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart } = useAuth();

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        
        <View style={styles.itemActions}>
          <View style={styles.qtyContainer}>
            <TouchableOpacity 
              onPress={() => updateQuantity(item.id, -1)} 
              style={styles.qtyBtn}
              disabled={item.quantity <= 1}
            >
              <Icon name="remove" size={18} color={item.quantity <= 1 ? "#9CA3AF" : "#111827"} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity 
              onPress={() => updateQuantity(item.id, 1)} 
              style={styles.qtyBtn}
            >
              <Icon name="add" size={18} color="#111827" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            onPress={() => removeFromCart(item.id)}
            style={styles.deleteButton}
          >
            <Icon name="delete-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert("Carrito vacío", "Agrega productos al carrito antes de proceder al pago");
      return;
    }
    navigation.navigate('Payment', { 
      total: cartTotal,
      items: cart
    });
  };

  const handleClearCart = () => {
    Alert.alert(
      "Vaciar carrito",
      "¿Estás seguro de que quieres eliminar todos los productos del carrito?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Vaciar", 
          style: "destructive",
          onPress: clearCart
        }
      ]
    );
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Carrito</Text>
          <View style={styles.emptyCartBadge}>
            <Icon name="shopping-cart" size={20} color="#6B7280" />
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIllustration}>
            <Icon name="shopping-cart" size={80} color="#E5E7EB" />
            <View style={styles.emptyIconCircle} />
          </View>
          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={styles.emptyText}>
            Agrega productos increíbles a tu carrito y vuelve aquí para completar tu compra
          </Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate('ClientHome')}
          >
            <Icon name="shopping-bag" size={20} color="#FFFFFF" />
            <Text style={styles.shopButtonText}>Descubrir productos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const shipping = cartTotal > 100 ? 0 : 9.99;
  const tax = cartTotal * 0.15;
  const grandTotal = cartTotal + shipping + tax;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Mi Carrito</Text>
          <Text style={styles.itemCount}>{cartCount} {cartCount === 1 ? 'artículo' : 'artículos'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.clearCartButton}
          onPress={handleClearCart}
        >
          <Icon name="delete-sweep" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={cart}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>Productos en el carrito</Text>
          </View>
        }
        ListFooterComponent={
          <>
            {/* Order Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen del pedido</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({cartCount} {cartCount === 1 ? 'artículo' : 'artículos'})</Text>
                <Text style={styles.summaryValue}>${cartTotal.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Envío</Text>
                <Text style={styles.summaryValue}>
                  {shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}
                </Text>
              </View>
              
              {shipping === 0 && cartTotal < 100 && (
                <Text style={styles.freeShippingText}>
                  <Icon name="local-offer" size={12} color="#10B981" /> 
                  ¡Agrega ${(100 - cartTotal).toFixed(2)} más para envío gratis!
                </Text>
              )}
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Impuestos (15%)</Text>
                <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>${grandTotal.toFixed(2)}</Text>
              </View>
              
              {shipping === 0 && (
                <View style={styles.freeShippingBadge}>
                  <Icon name="local-shipping" size={16} color="#10B981" />
                  <Text style={styles.freeShippingBadgeText}>Envío gratis aplicado</Text>
                </View>
              )}
            </View>

            {/* Promo Code */}
            <View style={styles.promoCard}>
              <View style={styles.promoInputContainer}>
                <Icon name="local-offer" size={20} color="#3B82F6" style={styles.promoIcon} />
                <Text style={styles.promoPlaceholder}>Código promocional</Text>
              </View>
              <TouchableOpacity style={styles.applyButton}>
                <Text style={styles.applyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>

            {/* Security Info */}
            <View style={styles.securityCard}>
              <Icon name="verified-user" size={20} color="#10B981" />
              <Text style={styles.securityText}>
                Compra 100% segura • Pago encriptado • Garantía de devolución
              </Text>
            </View>
          </>
        }
      />

      {/* Checkout Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerTotal}>
            <View>
              <Text style={styles.footerLabel}>Total a pagar</Text>
              {shipping === 0 && (
                <Text style={styles.freeShippingFooter}>Envío gratis ✓</Text>
              )}
            </View>
            <Text style={styles.footerAmount}>${grandTotal.toFixed(2)}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.checkoutBtn}
            onPress={handleCheckout}
          >
            <Icon name="lock" size={20} color="#FFFFFF" />
            <Text style={styles.checkoutBtnText}>Proceder al pago</Text>
            <Icon name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.continueShoppingBtn}
            onPress={() => navigation.navigate('ClientTabs', {screen: 'ClientHome'})}
          >
            <Icon name="add-shopping-cart" size={20} color="#3B82F6" />
            <Text style={styles.continueShoppingText}>Seguir comprando</Text>
          </TouchableOpacity>
        </View>
      </View>
       
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: StatusBar.currentHeight + 16,
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  itemCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  clearCartButton: {
    padding: 5,
  },
  emptyCartBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  listHeader: {
    paddingVertical: 20,
  },
  listHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  cartItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 5,
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 10,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 2,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    width: 30,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    marginBottom: 15,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  freeShippingText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 5,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 15,
  },
  totalRow: {
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  freeShippingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
    gap: 6,
  },
  freeShippingBadgeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  promoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  promoInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  promoIcon: {
    marginRight: 10,
  },
  promoPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  applyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 10,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98110',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#10B98120',
    gap: 10,
  },
  securityText: {
    fontSize: 12,
    color: '#10B981',
    flex: 1,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerContent: {
    padding: 20,
  },
  footerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  footerLabel: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '500',
  },
  freeShippingFooter: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  footerAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 18,
    marginBottom: 15,
    gap: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueShoppingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    gap: 10,
  },
  continueShoppingText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
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
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});