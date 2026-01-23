// App.js - Versión simplificada para Android
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StripeProvider } from "@stripe/stripe-react-native";
import { AuthProvider } from "./src/context/AuthContext";
import { ProductProvider } from "./src/context/ProductContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import { OrderProvider } from "./src/context/OrderContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { CartProvider } from "./src/context/CartContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <StripeProvider
        publishableKey="pk_test_51SHfQCEJmmqziTyLShhDhG4ubMVUdUdPoZhxMw0J5kH1mmUSVs88Cp1xrcEFvnXe1JMHni9KJbJutu8IO9GSvzNJ00Ign5TdVx"
        // Solo usa estas opciones si desarrollas para iOS
        // merchantIdentifier="merchant.com.quickpay"
        // urlScheme="quickpay"
      >
        <ThemeProvider>
          <AuthProvider>
            <ProductProvider>
              <OrderProvider>
                <CartProvider>
                  <NavigationContainer>
                    <AppNavigator />
                  </NavigationContainer>
                </CartProvider>
              </OrderProvider>
            </ProductProvider>
          </AuthProvider>
        </ThemeProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
