import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { View, ActivityIndicator } from "react-native";

// IMPORTANTE: Verifica que los nombres de archivos sean exactos
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

// --- NAVEGACIÓN CLIENTE ---
function ClientTabs() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "ClientHome") iconName = "home";
          else if (route.name === "ClientOrders") iconName = "shopping-bag";
          else if (route.name === "ClientCart") iconName = "shopping-cart";
          else if (route.name === "ClientProfile") iconName = "person";
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
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
        options={{ title: "Mis Pedidos" }}
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

// --- NAVEGACIÓN PROVEEDOR ---
function ProviderTabs() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "ProviderHome") iconName = "home";
          else if (route.name === "ProviderOrders") iconName = "list-alt";
          else if (route.name === "ProviderProducts") iconName = "inventory";
          else if (route.name === "ProviderProfile") iconName = "person";
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="ProviderHome"
        component={ProviderDashboard}
        options={{ title: "Inicio" }}
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

// --- NAVEGADOR PRINCIPAL ---
export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
        headerStyle: {
          backgroundColor: colors.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
      }}
    >
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : user.role === "client" ? (
        <>
          {/* Pantallas del cliente */}
          <Stack.Screen name="ClientTabs" component={ClientTabs} />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{
              headerShown: true,
              title: "Detalle del Producto",
              headerBackTitle: "Atrás",
            }}
          />
          <Stack.Screen
            name="OrderStatus"
            component={OrderStatusScreen}
            options={{
              headerShown: true,
              title: "Estado del Pedido",
              headerBackTitle: "Atrás",
            }}
          />
          <Stack.Screen
            name="Payment"
            component={PaymentScreen}
            options={{
              headerShown: true,
              title: "Finalizar Compra",
              headerBackTitle: "Carrito",
            }}
          />
        </>
      ) : (
        <>
          {/* Pantallas del proveedor */}
          <Stack.Screen name="ProviderTabs" component={ProviderTabs} />
          <Stack.Screen
            name="AddProduct"
            component={AddProductScreen}
            options={{
              headerShown: true,
              title: "Agregar Producto",
              headerBackTitle: "Atrás",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
