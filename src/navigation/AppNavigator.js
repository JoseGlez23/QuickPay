// src/navigation/AppNavigator.js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import { COLORS } from "../constants/theme";
import { View, ActivityIndicator } from "react-native";

// Import screens
import AuthScreen from "../screens/AuthScreen";
import ClientDashboard from "../screens/ClientDashboard";
import ProviderDashboard from "../screens/ProviderDashboard";
import CartScreen from "../screens/CartScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import OrderHistoryScreen from "../screens/OrderHistoryScreen";
import OrderStatusScreen from "../screens/OrderStatusScreen";
import PaymentScreen from "../screens/PaymentScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AddProductScreen from "../screens/AddProductScreen";
import ProviderOrders from "../screens/ProviderOrders";
import ProviderProfileScreen from "../screens/ProviderProfileScreen";
import ProviderProductsScreen from "../screens/ProviderProductsScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Client Tabs Navigator
function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "ClientHome") {
            iconName = "home";
          } else if (route.name === "ClientOrders") {
            iconName = "shopping-bag";
          } else if (route.name === "ClientCart") {
            iconName = "shopping-cart";
          } else if (route.name === "ClientProfile") {
            iconName = "person";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.mutedForeground,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="ClientHome" 
        component={ClientDashboard}
        options={{ title: "Inicio" }}
      />
      <Tab.Screen 
        name="ClientOrders" 
        component={OrderHistoryScreen}
        options={{ title: "Pedidos" }}
      />
      <Tab.Screen 
        name="ClientCart" 
        component={CartScreen}
        options={{ title: "Carrito" }}
      />
      <Tab.Screen 
        name="ClientProfile" 
        component={ProfileScreen}
        options={{ title: "Perfil" }}
      />
    </Tab.Navigator>
  );
}

// Provider Tabs Navigator
function ProviderTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "ProviderHome") {
            iconName = "dashboard";
          } else if (route.name === "ProviderOrders") {
            iconName = "list-alt";
          } else if (route.name === "ProviderProducts") {
            iconName = "inventory";
          } else if (route.name === "ProviderProfile") {
            iconName = "person";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.mutedForeground,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="ProviderHome" 
        component={ProviderDashboard}
        options={{ title: "Dashboard" }}
      />
      <Tab.Screen 
        name="ProviderOrders" 
        component={ProviderOrders}
        options={{ title: "Pedidos" }}
      />
      <Tab.Screen 
        name="ProviderProducts" 
        component={ProviderProductsScreen}
        options={{ title: "Productos" }}
      />
      <Tab.Screen 
        name="ProviderProfile" 
        component={ProviderProfileScreen}
        options={{ title: "Perfil" }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  const { user, loading } = useAuth();

  // Mostrar loading mientras se verifica la sesión
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!user ? (
        // Usuario NO autenticado
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen}
        />
      ) : user.role === "client" ? (
        // Usuario autenticado como CLIENTE
        <Stack.Group>
          <Stack.Screen 
            name="ClientTabs" 
            component={ClientTabs}
          />
          {/* Pantallas adicionales para clientes (fuera de tabs) */}
          <Stack.Screen 
            name="ProductDetail" 
            component={ProductDetailScreen}
            options={{
              headerShown: true,
              title: "Detalle del Producto",
            }}
          />
          <Stack.Screen 
            name="OrderStatus" 
            component={OrderStatusScreen}
            options={{
              headerShown: true,
              title: "Estado del Pedido",
            }}
          />
          <Stack.Screen 
            name="Payment" 
            component={PaymentScreen}
            options={{
              headerShown: true,
              title: "Pago",
            }}
          />
        </Stack.Group>
      ) : (
        // Usuario autenticado como PROVEEDOR
        <Stack.Group>
          <Stack.Screen 
            name="ProviderTabs" 
            component={ProviderTabs}
          />
          {/* Pantallas adicionales para proveedores (fuera de tabs) */}
          <Stack.Screen 
            name="AddProduct" 
            component={AddProductScreen}
            options={{
              headerShown: true,
              title: "Agregar Producto",
            }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}