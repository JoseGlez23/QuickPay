import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

// ✅ TU URL DE NGROK
const API_URL = "https://semimanneristic-flurried-carolann.ngrok-free.dev";

export default function PaymentScreen({ route, navigation }) {
  return (
    <StripeProvider
      publishableKey="pk_test_51SS2vZ3KzYA7b3meNYrMIRasQW033HHoca8JTa9mk0xYOAYW4X24XK0CaSQV8eIEJsap9Thia5kJSJJG6oxU4gBX004FJGsxxK"
      merchantIdentifier="merchant.com.quickpay"
      urlScheme="quickpay"
    >
      <PaymentContent route={route} navigation={navigation} />
    </StripeProvider>
  );
}

function PaymentContent({ route, navigation }) {
  const { total = 1999.99, userId = 'guest' } = route.params || {};
  const [address, setAddress] = useState('Av. Principal 123, Ciudad de México');
  const [isProcessing, setIsProcessing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const isFormValid = address.trim().length > 5 && name.trim().length > 2 && email.includes('@');

  const handlePayment = async () => {
    if (!isFormValid) {
      Alert.alert('Error', 'Completa todos los campos obligatorios (*)');
      return;
    }
    
    // Confirmación antes de proceder
    Alert.alert(
      'Confirmar compra',
      `¿Proceder con el pago de $${total.toFixed(2)} MXN?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Continuar', 
          onPress: processPayment,
          style: 'default'
        }
      ]
    );
  };

  const processPayment = async () => {
    setIsProcessing(true);

    try {
      console.log('🔄 Iniciando proceso de pago...');

      // ✅ 1. Crear PaymentIntent en tu servidor
      const response = await fetch(`${API_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: 'mxn',
          userId: userId,
          shippingAddress: address,
          email: email,
          name: name
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('❌ Error parseando respuesta:', jsonError);
        throw new Error('Error en el servidor de pagos');
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error creando el pago');
      }

      console.log('✅ PaymentIntent creado:', result.paymentIntentId);
      console.log('🔑 Client Secret recibido');
      console.log('📦 Número de orden:', result.orderNumber);

      // ✅ 2. Configurar Stripe Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: result.clientSecret,
        merchantDisplayName: 'QuickPay Store',
        returnURL: 'quickpay://stripe-redirect',
        style: 'automatic',
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: name,
          email: email,
          phone: '', // Opcional
          address: {
            line1: address,
            city: 'Ciudad de México',
            country: 'MX'
          }
        }
      });

      if (initError) {
        console.error('❌ Error inicializando Stripe:', initError);
        throw new Error(`Error Stripe: ${initError.message}`);
      }

      // ✅ 3. MOSTRAR LA PASARELA DE PAGO DE STRIPE
      console.log('🎬 Mostrando Payment Sheet...');
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          console.log('⚠️ Pago cancelado por el usuario');
          Alert.alert('Pago cancelado', 'El proceso fue cancelado');
          setIsProcessing(false);
          return;
        } else {
          console.error('❌ Error en Payment Sheet:', paymentError);
          
          // Manejo de errores específicos de Stripe
          let errorMessage = 'Error en el proceso de pago';
          
          if (paymentError.message) {
            errorMessage = paymentError.message;
          } else if (paymentError.code) {
            switch (paymentError.code) {
              case 'Failed':
                errorMessage = 'El pago falló. Verifica los datos de tu tarjeta.';
                break;
              case 'Canceled':
                errorMessage = 'Pago cancelado';
                break;
              case 'Timeout':
                errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.';
                break;
              default:
                errorMessage = `Error: ${paymentError.code}`;
            }
          }
          
          throw new Error(errorMessage);
        }
      }

      // ✅ 4. PAGO EXITOSO - Confirmar en backend
      console.log('✅ Pago procesado exitosamente! Confirmando...');
      
      const confirmResponse = await fetch(`${API_URL}/api/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: result.paymentIntentId
        }),
      });

      const confirmResult = await confirmResponse.json();
      
      if (confirmResult.success) {
        // ✅ 5. NAVEGAR A PANTALLA DE CONFIRMACIÓN
        console.log('✅ Pago confirmado en backend:', confirmResult.orderStatus);
        
        // Esperar un momento para mostrar éxito
        setTimeout(() => {
          Alert.alert(
            '🎉 ¡PAGO EXITOSO!',
            `Tu orden #${result.orderNumber} ha sido procesada.\n\nEstado: ${confirmResult.orderStatus}\nTotal: $${total.toFixed(2)} MXN`,
            [
              {
                text: 'Ver mi orden',
                onPress: () => {
                  navigation.navigate('OrderStatus', {
                    orderId: result.orderNumber,
                    orderData: confirmResult.order,
                    status: confirmResult.orderStatus,
                    total: total,
                    address: address,
                    email: email,
                    name: name,
                    receiptUrl: confirmResult.receipt_url
                  });
                },
              },
            ]
          );
        }, 500);
      } else {
        throw new Error(confirmResult.error || 'Error confirmando el pago');
      }

    } catch (error) {
      console.error('❌ Error completo en proceso de pago:', error);
      
      Alert.alert(
        'Error en el pago',
        error.message || 'No se pudo completar la transacción. Intenta nuevamente.',
        [{ text: 'Entendido' }]
      );
      
    } finally {
      setIsProcessing(false);
    }
  };

  // Pantalla de carga
  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
        <View style={styles.processingContainer}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.processingTitle}>PREPARANDO PAGO</Text>
            <Text style={styles.processingText}>
              Estamos preparando tu transacción...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Título */}
          <View style={styles.welcomeSection}>
            <Text style={styles.mainTitle}>Finalizar Compra</Text>
            <Text style={styles.mainSubtitle}>Completa tu información de pago</Text>
          </View>

          {/* Información personal */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="person" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Información personal</Text>
            </View>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.input}
                placeholder="Nombre completo *"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico *"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Resumen */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumen del pedido</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total a pagar</Text>
              <Text style={styles.totalAmount}>${total.toFixed(2)} MXN</Text>
            </View>
            <Text style={styles.summaryNote}>
              Incluye impuestos y envío gratis
            </Text>
          </View>

          {/* Dirección */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="local-shipping" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Dirección de entrega *</Text>
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
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Método de pago */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="credit-card" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Método de pago</Text>
            </View>
            <View style={styles.paymentMethodCard}>
              <View style={styles.paymentMethodContent}>
                <Icon name="payment" size={24} color="#635BFF" />
                <View style={styles.paymentMethodTexts}>
                  <Text style={styles.paymentMethodTitle}>Tarjeta de crédito/débito</Text>
                  <Text style={styles.paymentMethodSubtitle}>Pago seguro con Stripe</Text>
                </View>
                <Icon name="lock" size={20} color="#10B981" />
              </View>
            </View>
            
            <View style={styles.paymentInstructions}>
              <Icon name="info" size={16} color="#6B7280" />
              <Text style={styles.paymentInstructionsText}>
                Se abrirá la ventana segura de Stripe para ingresar los datos de tu tarjeta
              </Text>
            </View>
          </View>

          {/* Seguridad */}
          <View style={styles.securityCard}>
            <Icon name="verified-user" size={24} color="#10B981" />
            <View style={styles.securityInfo}>
              <Text style={styles.securityTitle}>Pago 100% Seguro</Text>
              <Text style={styles.securityText}>
                Tus datos están protegidos. Nunca almacenamos información de tu tarjeta.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payButton, (!isFormValid || isProcessing) && styles.payButtonDisabled]}
            onPress={handlePayment}
            disabled={!isFormValid || isProcessing}
          >
            <Text style={styles.payButtonText}>Pagar ${total.toFixed(2)} MXN</Text>
            <Icon name="lock" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.footerNoteContainer}>
            <Icon name="security" size={14} color="#6B7280" />
            <Text style={styles.footerNote}>
              Pago procesado por Stripe • Certificado SSL • Garantía de seguridad
            </Text>
          </View>
        </View>
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
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  processingContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  processingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3B82F6",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  processingTitle: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  processingText: {
    color: "#374151",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 5,
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
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  input: {
    fontSize: 15,
    color: '#374151',
    padding: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#6B7280',
    fontSize: 16,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  summaryNote: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressInput: {
    fontSize: 15,
    color: '#374151',
    minHeight: 100,
    lineHeight: 22,
  },
  paymentMethodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentMethodTexts: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodTitle: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  paymentInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  paymentInstructionsText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
    fontSize: 15,
  },
  securityText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    height: 56,
    borderRadius: 14,
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
    fontSize: 17,
  },
  footerNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
    paddingHorizontal: 8,
  },
  footerNote: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    lineHeight: 16,
  },
});