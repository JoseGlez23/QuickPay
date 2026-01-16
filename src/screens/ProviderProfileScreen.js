// src/screens/ProviderProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING } from '../constants/theme';

const menuItems = [
  { icon: 'store', label: 'Información de la tienda', screen: 'StoreInfo' },
  { icon: 'payment', label: 'Métodos de pago', screen: 'PaymentMethods' },
  { icon: 'analytics', label: 'Estadísticas', screen: 'Analytics' },
  { icon: 'notifications', label: 'Notificaciones', screen: 'Notifications' },
  { icon: 'security', label: 'Seguridad', screen: 'Security' },
  { icon: 'settings', label: 'Configuración', screen: 'Settings' },
  { icon: 'help', label: 'Ayuda y soporte', screen: 'Help' },
  { icon: 'info', label: 'Acerca de QuickPay', screen: 'About' },
];

export default function ProviderProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { products: allProducts } = useProducts();
  const [activeTab, setActiveTab] = useState('profile');

  // Filtrar productos del proveedor actual
  const myProducts = allProducts.filter(p => p.providerId === user?.id);
  
  // Calcular estadísticas del proveedor
  const totalProducts = myProducts.length;
  const estimatedSales = myProducts.reduce((sum, p) => sum + (p.price * 10), 0);
  const averageRating = 4.8;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      navigation.navigate('ProviderDashboard');
    } else if (tab === 'orders') {
      navigation.navigate('ProviderOrders');
    } else if (tab === 'products') {
      navigation.navigate('AddProduct');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Cerrar sesión", 
          style: "destructive",
          onPress: async () => {
            // SOLO llamamos a logout, NO navegamos manualmente
            await logout();
            // El AppNavigator se actualizará automáticamente cuando user sea null
          }
        }
      ]
    );
  };

  const navigateToScreen = (screen) => {
    console.log(`Navegando a: ${screen}`);
    alert(`Navegando a: ${screen}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <Text style={styles.headerSubtitle}>Proveedor</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Icon name="store" size={40} color={COLORS.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Mi Tienda'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'proveedor@quickpay.com'}</Text>
            <View style={styles.userTypeBadge}>
              <Text style={styles.userTypeText}>Cuenta de Proveedor</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="inventory" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{totalProducts}</Text>
            <Text style={styles.statLabel}>Productos</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
              <Icon name="attach-money" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>${estimatedSales.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Ventas</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="star" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{averageRating}</Text>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('AddProduct')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="add-box" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Agregar Producto</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('ProviderOrders')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
              <Icon name="list-alt" size={24} color="#10B981" />
            </View>
            <Text style={styles.actionText}>Ver Pedidos</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Configuración</Text>
          
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index !== menuItems.length - 1 && styles.menuItemBorder
              ]}
              onPress={() => navigateToScreen(item.screen)}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#F3F4F6' }]}>
                  <Icon name={item.icon} size={20} color="#6B7280" />
                </View>
                <Text style={styles.menuItemText}>{item.label}</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <Icon name="logout" size={20} color="#DC2626" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingTop: StatusBar.currentHeight + 10,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  headerRight: {
    width: 40,
  },
  userCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FONT_SIZES.sm,
    color: '#6B7280',
    marginBottom: 8,
  },
  userTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userTypeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: '#6B7280',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    color: '#1F2937',
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#1F2937',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuItemText: {
    fontSize: FONT_SIZES.md,
    color: '#1F2937',
    flex: 1,
  },
  logoutContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: SPACING.sm,
  },
});