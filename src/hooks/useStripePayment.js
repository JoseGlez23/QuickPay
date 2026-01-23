import { useState } from 'react';
import { Alert } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';

const API_URL = 'https://semimanneristic-flurried-carolann.ngrok-free.dev';

export const useSimplePayment = () => {
  const [loading, setLoading] = useState(false);
  const stripe = useStripe();

  // Crear pago
  const createPayment = async (paymentData) => {
    try {
      console.log('📤 Creando pago...');
      
      const response = await fetch(`${API_URL}/api/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error del servidor');
      }

      console.log('✅ Payment creado:', result.paymentIntentId);
      return result;

    } catch (error) {
      console.error('❌ Error creando pago:', error);
      throw error;
    }
  };

  // Procesar pago con PaymentSheet (RECOMENDADO)
  const payWithPaymentSheet = async (paymentData) => {
    setLoading(true);
    
    try {
      console.log('🚀 Iniciando pago con PaymentSheet...');
      
      // 1. Crear PaymentIntent
      const { clientSecret, paymentIntentId, orderId } = await createPayment(paymentData);
      
      // 2. Inicializar PaymentSheet
      const { error: initError } = await stripe.initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'QuickPay',
        returnURL: 'quickpay://stripe-redirect',
        style: 'automatic',
        allowsDelayedPaymentMethods: false,
      });

      if (initError) {
        throw new Error(`Error configurando: ${initError.message}`);
      }

      // 3. Mostrar PaymentSheet
      const { error: presentError } = await stripe.presentPaymentSheet();

      if (presentError) {
        // Usuario canceló
        if (presentError.code === 'Canceled') {
          console.log('👤 Usuario canceló');
          return { success: false, canceled: true };
        }
        throw new Error(presentError.message);
      }

      // 4. Pago exitoso
      console.log('✅ Pago exitoso!');
      
      // Confirmar con backend
      try {
        await fetch(`${API_URL}/api/confirm-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentIntentId, orderId }),
        });
      } catch (confirmError) {
        console.log('⚠️ Error confirmando:', confirmError.message);
        // Continuamos aunque falle la confirmación
      }

      setLoading(false);
      return {
        success: true,
        orderId: orderId,
        paymentIntentId: paymentIntentId,
        message: '¡Pago exitoso!'
      };

    } catch (error) {
      setLoading(false);
      console.error('❌ Error en payWithPaymentSheet:', error);
      
      Alert.alert(
        'Error de Pago', 
        error.message || 'No se pudo completar el pago',
        [{ text: 'OK' }]
      );
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  return {
    payWithPaymentSheet,
    loading
  };
};