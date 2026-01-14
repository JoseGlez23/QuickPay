import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

const menuItems = [
  { icon: 'person', label: 'Información personal', screen: 'ProfileInfo' },
  { icon: 'location-on', label: 'Direcciones', screen: 'Addresses' },
  { icon: 'credit-card', label: 'Métodos de pago', screen: 'PaymentMethods' },
  { icon: 'notifications', label: 'Notificaciones', screen: 'Notifications' },
  { icon: 'security', label: 'Privacidad y seguridad', screen: 'Privacy' },
  { icon: 'settings', label: 'Configuración', screen: 'Settings' },
  { icon: 'help', label: 'Ayuda y soporte', screen: 'Help' },
  { icon: 'info', label: 'Acerca de', screen: 'About' },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Cerrar sesión", 
          style: "destructive",
          onPress: () => {
            logout();
            navigation.replace('Auth');
          }
        }
      ]
    );
  };

  const navigateToScreen = (screen) => {
    // Aquí puedes manejar la navegación a diferentes pantallas
    Alert.alert("Próximamente", `Pantalla ${screen} en desarrollo`);
  };

  const navigateToOrders = () => {
    navigation.navigate('Orders');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <Text style={styles.headerSubtitle}>Administra tu cuenta</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'C'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Cliente'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'cliente@ejemplo.com'}</Text>
            <Text style={styles.userRole}>Cliente Premium</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Icon name="edit" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <TouchableOpacity style={styles.statItem} onPress={navigateToOrders}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>En proceso</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>$2,450</Text>
            <Text style={styles.statLabel}>Total gastado</Text>
          </View>
        </View>

        {/* Membership Card */}
        <View style={styles.membershipCard}>
          <View style={styles.membershipHeader}>
            <Icon name="workspace-premium" size={24} color="#F59E0B" />
            <Text style={styles.membershipTitle}>Miembro Premium</Text>
          </View>
          <Text style={styles.membershipText}>
            Disfruta de envío gratis, descuentos exclusivos y atención prioritaria
          </Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeText}>Actualizar membresía</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
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
                <View style={styles.menuIconContainer}>
                  <Icon name={item.icon} size={22} color="#3B82F6" />
                </View>
                <Text style={styles.menuItemText}>{item.label}</Text>
              </View>
              <Icon name="chevron-right" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Promo Section */}
        <View style={styles.promoCard}>
          <View style={styles.promoContent}>
            <Icon name="card-giftcard" size={28} color="#8B5CF6" />
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoTitle}>Tienes un cupón disponible</Text>
              <Text style={styles.promoCode}>DESCUENTO20</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.promoButton}>
            <Text style={styles.promoButtonText}>Usar</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={20} color="#DC2626" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Versión 1.0.0</Text>
          <Text style={styles.appRights}>© 2023 MiTienda. Todos los derechos reservados.</Text>
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
    paddingTop: 20,
  },
  header: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  userCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 25,
    marginTop: 0,
    marginHorizontal: 20,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 6,
  },
  userRole: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  editButton: {
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  statsCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 25,
    paddingVertical: 25,
    marginTop: 15,
    marginHorizontal: 20,
    borderRadius: 20,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  membershipCard: {
    backgroundColor: '#FFF7ED',
    marginTop: 15,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  membershipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
    marginLeft: 10,
  },
  membershipText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 15,
  },
  upgradeButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  upgradeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 20,
    marginHorizontal: 20,
    overflow: 'hidden',
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  promoCard: {
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    elevation: 3,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  promoTextContainer: {
    marginLeft: 15,
  },
  promoTitle: {
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 5,
  },
  promoCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  promoButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  promoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutContainer: {
    padding: 20,
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 10,
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
  },
  appVersion: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 5,
  },
  appRights: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});