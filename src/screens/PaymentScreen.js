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
import BottomNav from '../components/BottomNav';

const { width } = Dimensions.get('window');

export default function PaymentScreen({ route, navigation }) {
  const { total = 1999.99, items = [] } = route.params || {};
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [address, setAddress] = useState('Av. Principal 123, Ciudad de México');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [saveCard, setSaveCard] = useState(false);
  const [installment, setInstallment] = useState(1);
  
  const animation = useRef(new Animated.Value(0)).current;

  const paymentMethods = [
    { id: 'card', icon: 'credit-card', label: 'Tarjeta', color: '#3B82F6' },
    { id: 'paypal', icon: 'paypal', label: 'PayPal', color: '#003087' },
    { id: 'applepay', icon: 'apple', label: 'Apple Pay', color: '#000000' },
    { id: 'googlepay', icon: 'google', label: 'Google Pay', color: '#4285F4' },
  ];

  const installments = [1, 3, 6, 9, 12];

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  const formatExpiryDate = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handlePayment = async () => {
    if (!isFormValid) return;
    
    setIsProcessing(true);
    
    // Simular animación de procesamiento
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

  const isFormValid = selectedMethod === 'card' 
    ? cardNumber.length >= 16 && cardName.trim() && expiryDate.length === 5 && cvv.length >= 3 && address.trim()
    : address.trim();

  const cardTypeIcon = () => {
    const firstDigit = cardNumber.charAt(0);
    if (firstDigit === '4') return 'credit-card';
    if (firstDigit === '5') return 'credit-card';
    if (firstDigit === '3') return 'credit-card';
    return 'payment';
  };

  const navigateToHome = () => {
    navigation.navigate('Home');
  };

  const renderProcessingAnimation = () => {
    const rotate = animation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.processingContainer}>
        <Animated.View style={[styles.processingCircle, { transform: [{ rotate }] }]}>
          <Icon name="credit-card" size={40} color="#FFFFFF" />
        </Animated.View>
        <Text style={styles.processingText}>Procesando pago...</Text>
        <Text style={styles.processingSubtext}>Por favor no cierres la aplicación</Text>
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
      </View>
    );
  };

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
          <Text style={styles.headerTitle}>Pago seguro</Text>
          <Text style={styles.headerSubtitle}>Paso 3 de 3</Text>
        </View>
        <TouchableOpacity style={styles.helpButton}>
          <Icon name="help" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {isProcessing ? (
            renderProcessingAnimation()
          ) : (
            <>
              {/* Order Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumen del pedido</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${(total * 0.85).toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Envío</Text>
                  <Text style={styles.summaryValue}>$0.00</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Impuestos</Text>
                  <Text style={styles.summaryValue}>${(total * 0.15).toFixed(2)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={[styles.summaryRow, { marginTop: 10 }]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
                </View>
              </View>

              {/* Payment Methods */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Método de pago</Text>
                <View style={styles.methodsGrid}>
                  {paymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.methodButton,
                        selectedMethod === method.id && styles.methodButtonActive
                      ]}
                      onPress={() => setSelectedMethod(method.id)}
                    >
                      <View style={[
                        styles.methodIcon,
                        { backgroundColor: selectedMethod === method.id ? method.color : '#F3F4F6' }
                      ]}>
                        <Icon 
                          name={method.icon} 
                          size={24} 
                          color={selectedMethod === method.id ? '#FFFFFF' : method.color}
                        />
                      </View>
                      <Text style={[
                        styles.methodLabel,
                        selectedMethod === method.id && styles.methodLabelActive
                      ]}>
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Card Details */}
              {selectedMethod === 'card' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Detalles de la tarjeta</Text>
                  
                  <View style={styles.cardPreview}>
                    <View style={styles.cardHeader}>
                      <Icon name={cardTypeIcon()} size={24} color="#FFFFFF" />
                      <View style={styles.cardChip}>
                        <Icon name="sim-card" size={20} color="gold" />
                      </View>
                    </View>
                    <Text style={styles.cardNumberPreview}>
                      {cardNumber || '•••• •••• •••• ••••'}
                    </Text>
                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.cardLabel}>Nombre</Text>
                        <Text style={styles.cardNamePreview}>
                          {cardName || 'NOMBRE EN LA TARJETA'}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.cardLabel}>Vence</Text>
                        <Text style={styles.cardExpiryPreview}>
                          {expiryDate || 'MM/AA'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Número de tarjeta</Text>
                    <View style={styles.inputWithIcon}>
                      <Icon name="credit-card" size={20} color="#6B7280" />
                      <TextInput
                        style={styles.input}
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChangeText={(text) => setCardNumber(formatCardNumber(text.slice(0, 19)))}
                        maxLength={19}
                        keyboardType="numeric"
                      />
                      {cardNumber.length >= 16 && (
                        <Icon name="check-circle" size={20} color="#10B981" />
                      )}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nombre en la tarjeta</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Juan Pérez"
                      value={cardName}
                      onChangeText={setCardName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.inputLabel}>Fecha de expiración</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="MM/AA"
                        value={expiryDate}
                        onChangeText={(text) => setExpiryDate(formatExpiryDate(text.slice(0, 5)))}
                        maxLength={5}
                        keyboardType="numeric"
                      />
                    </View>
                    
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                      <Text style={styles.inputLabel}>CVV</Text>
                      <View style={styles.inputWithIcon}>
                        <Icon name="lock" size={16} color="#6B7280" />
                        <TextInput
                          style={styles.input}
                          placeholder="123"
                          value={cvv}
                          onChangeText={(text) => setCvv(text.replace(/\D/g, '').slice(0, 4))}
                          maxLength={4}
                          keyboardType="numeric"
                          secureTextEntry
                        />
                      </View>
                    </View>
                  </View>

                  {/* Installments */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Meses sin intereses</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.installmentContainer}>
                        {installments.map((months) => (
                          <TouchableOpacity
                            key={months}
                            style={[
                              styles.installmentButton,
                              installment === months && styles.installmentButtonActive
                            ]}
                            onPress={() => setInstallment(months)}
                          >
                            <Text style={[
                              styles.installmentText,
                              installment === months && styles.installmentTextActive
                            ]}>
                              {months} {months === 1 ? 'mes' : 'meses'}
                            </Text>
                            {months > 1 && (
                              <Text style={styles.installmentAmount}>
                                ${(total / months).toFixed(2)}/mes
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  <TouchableOpacity 
                    style={styles.saveCardButton}
                    onPress={() => setSaveCard(!saveCard)}
                  >
                    <View style={[
                      styles.checkbox,
                      saveCard && styles.checkboxChecked
                    ]}>
                      {saveCard && <Icon name="check" size={16} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.saveCardText}>Guardar tarjeta para compras futuras</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Shipping Address */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dirección de envío</Text>
                <View style={styles.addressCard}>
                  <Icon name="location-on" size={24} color="#3B82F6" />
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

              {/* Security Info */}
              <View style={styles.securityCard}>
                <Icon name="shield" size={32} color="#10B981" />
                <View style={styles.securityInfo}>
                  <Text style={styles.securityTitle}>Pago 100% seguro</Text>
                  <Text style={styles.securityText}>
                    Tus datos están protegidos con encriptación SSL de nivel bancario. 
                    Nunca almacenamos información sensible.
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Payment Footer */}
        {!isProcessing && (
          <View style={styles.footer}>
            <View style={styles.footerContent}>
              <View style={styles.footerTotal}>
                <Text style={styles.footerLabel}>Total a pagar</Text>
                <Text style={styles.footerAmount}>${total.toFixed(2)}</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.payButton, (!isFormValid && styles.payButtonDisabled)]}
                onPress={handlePayment}
                disabled={!isFormValid}
              >
                <Icon name="lock" size={20} color="#FFFFFF" />
                <Text style={styles.payButtonText}>
                  {isFormValid ? 'Confirmar y pagar' : 'Completa los datos'}
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.secureNote}>
                <Icon name="verified" size={12} color="#10B981" /> Pago seguro con Stripe
              </Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
      
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  helpButton: {
    padding: 5,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 180,
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  processingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  processingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    marginBottom: 8,
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
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
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
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  methodButton: {
    width: (width - 70) / 4,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F610',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  methodLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  methodLabelActive: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  cardPreview: {
    backgroundColor: '#3B82F6',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  cardChip: {
    transform: [{ rotate: '90deg' }],
  },
  cardNumberPreview: {
    fontSize: 20,
    letterSpacing: 4,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginBottom: 30,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 5,
  },
  cardNamePreview: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  cardExpiryPreview: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
  },
  installmentContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 5,
  },
  installmentButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minWidth: 80,
  },
  installmentButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  installmentText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  installmentTextActive: {
    color: '#FFFFFF',
  },
  installmentAmount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  saveCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  saveCardText: {
    fontSize: 14,
    color: '#111827',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressInput: {
    flex: 1,
    marginLeft: 10,
    padding: 0,
    minHeight: 80,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98110',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#10B98120',
  },
  securityInfo: {
    flex: 1,
    marginLeft: 15,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 5,
  },
  securityText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
  },
  footerAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 18,
    marginBottom: 15,
    gap: 10,
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secureNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});