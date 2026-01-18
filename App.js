// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { ProductProvider } from './src/context/ProductContext';
import { ThemeProvider } from './src/context/ThemeContext'; // Importa el nuevo contexto
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/constants/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      {/* Envolvemos todo con ThemeProvider */}
      <ThemeProvider>
        <AuthProvider>
          <ProductProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </ProductProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}