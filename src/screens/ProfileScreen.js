// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, StatusBar, TextInput, Modal, Platform, ActivityIndicator, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || 'Cliente');
  const [tempName, setTempName] = useState(name);
  const [updating, setUpdating] = useState(false);
  
  // Simulación de fecha de última edición
  const [lastEditDate, setLastEditDate] = useState(null); 

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ 
    title: '', message: '', icon: 'info', confirmText: 'Aceptar', onConfirm: () => {} 
  });

  // Actualizar el nombre cuando cambie el usuario
  useEffect(() => {
    if (user?.name && user.name !== name) {
      setName(user.name);
    }
  }, [user]);

  const getInitial = () => {
    if (name) return name.charAt(0).toUpperCase();
    return "C";
  };

  const showCustomAlert = (title, message, icon, onConfirm, confirmText = 'Confirmar') => {
    setModalConfig({
      title, message, icon, confirmText,
      onConfirm: () => { setModalVisible(false); if (onConfirm) onConfirm(); },
    });
    setModalVisible(true);
  };

  const handleEditPress = () => {
    if (isEditing) {
      // Si ya está editando y presiona "Guardar"
      if (tempName.trim() === name) {
        setIsEditing(false);
        return;
      }

      // Validar si pasaron 14 días
      const hoy = new Date();
      if (lastEditDate) {
        const diferenciaTiempo = hoy.getTime() - lastEditDate.getTime();
        const diasTranscurridos = diferenciaTiempo / (1000 * 3600 * 24);

        if (diasTranscurridos < 14) {
          const diasRestantes = Math.ceil(14 - diasTranscurridos);
          showCustomAlert(
            "Cambio no disponible",
            `Debes esperar ${diasRestantes} días más para volver a cambiar tu nombre.`,
            "info",
            null,
            "Entendido"
          );
          setTempName(name); // Revertir cambios
          setIsEditing(false);
          return;
        }
      }

      // Confirmar cambio
      showCustomAlert(
        "¿Confirmar cambio?",
        "¿Estás seguro que deseas actualizar tu nombre de usuario?",
        "help",
        () => updateUserName(),
        "Actualizar"
      );
    } else {
      // Iniciar edición
      setTempName(name);
      setIsEditing(true);
    }
  };

  const updateUserName = async () => {
    if (!tempName.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío");
      return;
    }

    setUpdating(true);
    try {
      const result = await updateProfile({ name: tempName.trim() });
      
      if (result.success) {
        setName(tempName.trim());
        setLastEditDate(new Date());
        setIsEditing(false);
        
        Alert.alert(
          "✅ Éxito",
          "Nombre actualizado correctamente",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("❌ Error", result.error || "Error al actualizar el nombre");
        setTempName(name); // Revertir cambios
      }
    } catch (error) {
      console.error("Error actualizando nombre:", error);
      Alert.alert("❌ Error", "Ocurrió un error al actualizar el nombre");
      setTempName(name); // Revertir cambios
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    showCustomAlert(
      "Cerrar sesión",
      "¿Estás seguro que deseas salir? Tendrás que ingresar tus credenciales nuevamente.",
      "logout",
      async () => await logout(),
      "Cerrar Sesión"
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: modalConfig.icon === 'logout' ? (isDarkMode ? '#451a1a' : '#FEF2F2') : (isDarkMode ? '#1e3a8a' : '#EFF6FF') }]}>
              <Icon 
                name={modalConfig.icon} 
                size={40} 
                color={modalConfig.icon === 'logout' ? '#EF4444' : colors.primary} 
              />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{modalConfig.title}</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>{modalConfig.message}</Text>
            
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity 
                style={[styles.modalCancelButton, { backgroundColor: isDarkMode ? '#333' : '#F3F4F6' }]} 
                onPress={() => {
                  setModalVisible(false);
                  if(isEditing) {
                    setTempName(name); // Revertir si cancela el guardado
                    setIsEditing(false);
                  }
                }}
                disabled={updating}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalConfirmButton, 
                  { 
                    backgroundColor: modalConfig.icon === 'logout' ? '#DC2626' : colors.primary,
                    opacity: updating ? 0.7 : 1
                  }
                ]}
                onPress={modalConfig.onConfirm}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>{modalConfig.confirmText}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity 
          onPress={handleEditPress} 
          style={styles.editButton}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.editText}>{isEditing ? 'Guardar' : 'Editar'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.userCard, { backgroundColor: colors.card }]}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.userAvatar, { backgroundColor: colors.primary, borderColor: isDarkMode ? '#444' : '#fff' }]}>
              <Text style={styles.avatarInitial}>{getInitial()}</Text>
            </View>
          </View>

          <View style={styles.userInfo}>
            {isEditing ? (
              <TextInput
                style={[styles.inputActive, { 
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#F3F4F6', 
                    color: colors.text, 
                    borderBottomColor: colors.primary 
                }]}
                value={tempName}
                onChangeText={setTempName}
                autoFocus
                placeholder="Ingresa tu nombre"
                placeholderTextColor={colors.textSecondary}
                maxLength={50}
                editable={!updating}
              />
            ) : (
              <Text style={[styles.userName, { color: colors.text }]}>{name}</Text>
            )}
            
            <View style={styles.emailBadge}>
              <Icon name="email" size={14} color={colors.textSecondary} />
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || 'cliente@ejemplo.com'}</Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: isDarkMode ? '#1e3a8a' : '#EFF6FF' }]}>
              <Text style={[styles.statusText, { color: colors.primary }]}>CUENTA DE CLIENTE</Text>
            </View>
            
            {lastEditDate && !isEditing && (
              <Text style={[styles.lastEditText, { color: colors.textSecondary }]}>
                Última actualización: {lastEditDate.toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Información de la cuenta</Text>
          
          <View style={styles.infoRow}>
            <Icon name="person" size={18} color={colors.textSecondary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Rol:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.role === 'client' ? 'Cliente' : user?.role || 'Cliente'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="calendar-today" size={18} color={colors.textSecondary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Miembro desde:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Fecha no disponible'}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ubicación</Text>
          <View style={styles.locationRow}>
            <Icon name="location-on" size={20} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
              San Luis Río Colorado, Sonora, México.
            </Text>
          </View>
        </View>

        <View style={styles.logoutWrapper}>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: isDarkMode ? '#451a1a' : '#FCA5A5' }]} 
            onPress={handleLogout}
            disabled={updating}
          >
            <Icon name="logout" size={20} color="#DC2626" />
            <Text style={styles.logoutText}>Cerrar sesión de la cuenta</Text>
          </TouchableOpacity>
          <Text style={[styles.footerNote, { color: colors.textSecondary }]}>QuickPay Client v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '90%', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 20 },
  modalIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalMessage: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalButtonsRow: { flexDirection: 'row', width: '100%', gap: 12 },
  modalCancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalCancelText: { fontWeight: '600', fontSize: 15 },
  modalConfirmButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 18,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  backButton: { padding: 4 },
  editButton: { paddingVertical: 4, paddingHorizontal: 10, minWidth: 60, alignItems: 'center' },
  editText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  userCard: { padding: 24, margin: 16, borderRadius: 20, alignItems: 'center', elevation: 3 },
  avatarWrapper: { marginBottom: 16 },
  userAvatar: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 3, elevation: 5 },
  avatarInitial: { fontSize: 42, fontWeight: 'bold', color: '#fff' },
  userInfo: { alignItems: 'center', width: '100%' },
  userName: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  emailBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  userEmail: { fontSize: 14, marginLeft: 6 },
  inputActive: { 
    width: '90%', 
    borderRadius: 8, 
    padding: 12, 
    textAlign: 'center', 
    fontSize: 18, 
    borderBottomWidth: 2,
    marginBottom: 8 
  },
  statusBadge: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '800' },
  lastEditText: { fontSize: 11, marginTop: 8, fontStyle: 'italic' },
  section: { marginHorizontal: 16, marginBottom: 12, padding: 18, borderRadius: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoLabel: { fontSize: 14, marginLeft: 8, width: 100 },
  infoValue: { fontSize: 14, fontWeight: '500', flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { marginLeft: 10, fontSize: 14 },
  logoutWrapper: { marginTop: 24, paddingHorizontal: 16, alignItems: 'center' },
  logoutButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '100%', 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1 
  },
  logoutText: { marginLeft: 8, color: '#DC2626', fontWeight: 'bold', fontSize: 15 },
  footerNote: { marginTop: 12, fontSize: 11 },
});