// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ProductProvider } from './src/context/ProductContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { OrderProvider } from './src/context/OrderContext'; // NUEVO
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ProductProvider>
            <OrderProvider> {/* ENVOLVER CON OrderProvider */}
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </OrderProvider>
          </ProductProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}