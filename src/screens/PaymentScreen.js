import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

export default function PaymentScreen({ route, navigation }) {
  const { total = 1999.99 } = route.params || {};
  const [address, setAddress] = useState('Av. Principal 123, Ciudad de México');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const animation = useRef(new Animated.Value(0)).current;

  // La validación ahora solo depende de la dirección
  const isFormValid = address.trim().length > 5;

  const handlePayment = async () => {
    if (!isFormValid) return;
    setIsProcessing(true);
    
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.delay(500),
    ]).start(() => {
      setIsProcessing(false);
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      navigation.navigate('OrderStatus', { 
        orderId,
        status: 'processing',
      });
    });
  };

  const renderProcessingAnimation = () => {
    const rotate = animation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.processingContainer}>
        <Animated.View style={[styles.processingCircle, { transform: [{ rotate }] }]}>
          <Icon name="sync" size={40} color="#FFFFFF" />
        </Animated.View>
        <Text style={styles.processingText}>Procesando pedido...</Text>
        <Text style={styles.processingSubtext}>Estamos confirmando tu orden</Text>
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Cambiamos el StatusBar a oscuro ya que el fondo es claro */}
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {isProcessing ? (
            renderProcessingAnimation()
          ) : (
            <>
              {/* Título de la pantalla (Ya que no hay header) */}
              <View style={styles.welcomeSection}>
                <Text style={styles.mainTitle}>Finalizar Compra</Text>
                <Text style={styles.mainSubtitle}>Revisa los detalles antes de pagar</Text>
              </View>

              {/* Resumen del pedido */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumen del pedido</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${(total * 0.85).toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Envío</Text>
                  <Text style={styles.summaryValue}>Gratis</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Impuestos</Text>
                  <Text style={styles.summaryValue}>${(total * 0.15).toFixed(2)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={[styles.summaryRow, { marginTop: 10 }]}>
                  <Text style={styles.totalLabel}>Total a pagar</Text>
                  <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                </View>
              </View>

              {/* Dirección de envío */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="local-shipping" size={20} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Dirección de entrega</Text>
                </View>
                <View style={styles.addressCard}>
                  <TextInput
                    style={[styles.input, styles.addressInput]}
                    placeholder="Calle, número, colonia, ciudad, código postal"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Info de Seguridad */}
              <View style={styles.securityCard}>
                <Icon name="verified-user" size={24} color="#10B981" />
                <View style={styles.securityInfo}>
                  <Text style={styles.securityTitle}>Compra Protegida</Text>
                  <Text style={styles.securityText}>
                    Tu transacción está protegida por nuestros sistemas de seguridad.
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer simple con el botón de acción */}
        {!isProcessing && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.payButton, (!isFormValid && styles.payButtonDisabled)]}
              onPress={handlePayment}
              disabled={!isFormValid}
            >
              <Text style={styles.payButtonText}>Confirmar y Pagar</Text>
              <Icon name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  welcomeSection: {
    marginBottom: 25,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  mainSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 500,
  },
  processingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  processingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  summaryValue: {
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressInput: {
    fontSize: 15,
    color: '#374151',
    minHeight: 80,
    lineHeight: 20,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  securityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    fontWeight: 'bold',
    color: '#065F46',
    fontSize: 14,
  },
  securityText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  footer: {
    padding: 24,
    backgroundColor: '#F3F4F6',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#111827', // Negro elegante
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
    elevation: 0,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
});