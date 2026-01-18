// src/screens/AddProductScreen.js
import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Image, Dimensions, KeyboardAvoidingView, Platform, StatusBar,
  SafeAreaView, ActivityIndicator, Modal
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../utils/supabase";

import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from "base64-arraybuffer";
import { getCategoriesList } from "../utils/categoryUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AddProductScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const { addProduct, refreshProducts } = useProducts();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("10");
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  
  // Estado para el Pop-up estilizado
  const [alert, setAlert] = useState({ visible: false, title: "", message: "", type: "info" });

  useEffect(() => {
    (async () => {
      const data = await getCategoriesList();
      const formatted = data.map(c => ({ id: c.name, name: c.description || c.name }));
      setCategories(formatted);
      if (formatted.length > 0) setCategory(formatted[0].id);
    })();
  }, []);

  const showAlert = (title, message, type = "info") => {
    setAlert({ visible: true, title, message, type });
  };

  const handlePickerOption = async (type) => {
    setShowPicker(false);
    let result;
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return showAlert("Permiso denegado", "No tenemos acceso a la cámara", "error");
      result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
        quality: 0.6,
      });
    }
    if (!result.canceled) setImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
  };

  const handleSubmit = async () => {
    if (!name || !price) return showAlert("Cuidado", "El nombre y el precio son obligatorios", "warning");
    setIsSubmitting(true);
    try {
      const uploadPromises = images.map(async (uri) => {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        const fileName = `products/${user.id}/${uuidv4()}.jpg`;
        await supabase.storage.from("product-images").upload(fileName, decode(base64), { contentType: 'image/jpeg' });
        return supabase.storage.from("product-images").getPublicUrl(fileName).data.publicUrl;
      });
      const urls = await Promise.all(uploadPromises);
      const res = await addProduct({ providerId: user.id, name, description, price: parseFloat(price), category, stock: parseInt(stock), images: urls });
      if (res.success) {
        await refreshProducts();
        navigation.goBack();
      }
    } catch (e) { showAlert("Error", "No se pudo guardar el producto", "error"); }
    finally { setIsSubmitting(false); }
  };

  // Estilos de texto dinámicos para Modo Oscuro
  const dynamicText = { color: isDarkMode ? "#FFFFFF" : "#1F2937" };
  const dynamicPlaceholder = isDarkMode ? "#9CA3AF" : "#6B7280";

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* HEADER IGUAL AL DE MIS PEDIDOS */}
      <View style={[styles.headerSafe, { backgroundColor: colors.card }]}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="chevron-left" size={32} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Nuevo Producto</Text>
            <View style={{ width: 40 }} /> 
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* SECCIÓN SUBIR FOTOS CENTRADA */}
          <View style={styles.mediaContainer}>
            {images.length === 0 ? (
              <TouchableOpacity 
                style={[styles.bigUpload, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}
                onPress={() => setShowPicker(true)}
              >
                <View style={[styles.uploadIconCircle, { backgroundColor: colors.primary + '20' }]}>
                  <Icon name="cloud-upload" size={40} color={colors.primary} />
                </View>
                <Text style={[styles.uploadText, { color: colors.text }]}>Toca para subir fotos</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Máximo 5 imágenes</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.imageGrid}>
                {images.map((uri, i) => (
                  <View key={i} style={styles.previewBox}>
                    <Image source={{ uri }} style={styles.image} />
                    <TouchableOpacity style={styles.removeBadge} onPress={() => setImages(images.filter((_, idx) => idx !== i))}>
                      <Icon name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 5 && (
                  <TouchableOpacity style={[styles.addMoreBox, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowPicker(true)}>
                    <Icon name="plus" size={30} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* FORMULARIO CON TEXTOS CORREGIDOS */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>NOMBRE DEL PRODUCTO</Text>
            <TextInput
              style={[styles.input, dynamicText, { borderBottomColor: colors.border }]}
              placeholder="Aquí agrega el nombre del producto"
              placeholderTextColor={dynamicPlaceholder}
              value={name}
              onChangeText={setName}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 15 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>PRECIO</Text>
                <TextInput
                  style={[styles.input, dynamicText, { borderBottomColor: colors.border }]}
                  placeholder="0.00"
                  placeholderTextColor={dynamicPlaceholder}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>STOCK</Text>
                <TextInput
                  style={[styles.input, dynamicText, { borderBottomColor: colors.border }]}
                  placeholder="10"
                  placeholderTextColor={dynamicPlaceholder}
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 15 }]}>DESCRIPCIÓN</Text>
            <TextInput
              style={[styles.input, styles.textArea, dynamicText, { borderBottomColor: colors.border }]}
              placeholder="Escribe aquí los detalles..."
              placeholderTextColor={dynamicPlaceholder}
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Publicar Producto</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* POP-UP DE SELECCIÓN DE IMAGEN */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalIndicator} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Añadir Imagen</Text>
            <View style={styles.pickerRow}>
              <TouchableOpacity style={styles.pickerOption} onPress={() => handlePickerOption('camera')}>
                <View style={[styles.pickerIcon, { backgroundColor: '#F59E0B' }]}><Icon name="camera" size={30} color="#fff" /></View>
                <Text style={[styles.pickerText, { color: colors.text }]}>Cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerOption} onPress={() => handlePickerOption('library')}>
                <View style={[styles.pickerIcon, { backgroundColor: colors.primary }]}><Icon name="image-multiple" size={30} color="#fff" /></View>
                <Text style={[styles.pickerText, { color: colors.text }]}>Galería</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }]} onPress={() => setShowPicker(false)}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* POP-UP DE ALERTAS ESTILIZADO */}
      <Modal visible={alert.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.alertContent, { backgroundColor: colors.card }]}>
            <Icon 
              name={alert.type === 'error' ? "close-circle" : "information"} 
              size={60} 
              color={alert.type === 'error' ? '#EF4444' : colors.primary} 
            />
            <Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title}</Text>
            <Text style={[styles.alertMsg, { color: colors.textSecondary }]}>{alert.message}</Text>
            <TouchableOpacity 
              style={[styles.alertBtn, { backgroundColor: colors.primary }]} 
              onPress={() => setAlert({ ...alert, visible: false })}
            >
              <Text style={styles.alertBtnText}>ENTENDIDO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  // ESTILO DE HEADER COPIADO
  headerSafe: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4, zIndex: 10, paddingBottom: 15 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  backBtn: { padding: 5 },
  
  scrollContent: { padding: 20 },
  mediaContainer: { alignItems: 'center', marginBottom: 25 },
  bigUpload: { width: '100%', height: 160, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  uploadIconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  uploadText: { fontSize: 16, fontWeight: '800' },
  
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  previewBox: { width: (SCREEN_WIDTH - 70) / 3, aspectRatio: 1, borderRadius: 15, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  removeBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, padding: 3 },
  addMoreBox: { width: (SCREEN_WIDTH - 70) / 3, aspectRatio: 1, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  
  formCard: { borderRadius: 24, padding: 20, borderWidth: 1, elevation: 2 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 5 },
  input: { fontSize: 16, paddingVertical: 12, borderBottomWidth: 1, marginBottom: 20, fontWeight: '500' },
  row: { flexDirection: 'row' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 25, elevation: 4 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  
  // MODALES & POP-UPS ESTILIZADOS
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  pickerContent: { width: '100%', borderRadius: 30, padding: 20, alignItems: 'center', position: 'absolute', bottom: 40 },
  modalIndicator: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 10, marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 25 },
  pickerOption: { alignItems: 'center' },
  pickerIcon: { width: 65, height: 65, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 3 },
  pickerText: { fontWeight: '700', fontSize: 14 },
  cancelBtn: { width: '100%', padding: 16, borderRadius: 15, alignItems: 'center' },
  
  alertContent: { width: '90%', borderRadius: 25, padding: 25, alignItems: 'center' },
  alertTitle: { fontSize: 22, fontWeight: '900', marginTop: 15 },
  alertMsg: { fontSize: 16, textAlign: 'center', marginTop: 10, marginBottom: 25, lineHeight: 22 },
  alertBtn: { width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  alertBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});