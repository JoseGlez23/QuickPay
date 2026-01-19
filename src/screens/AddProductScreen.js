// src/screens/AddProductScreen.js
import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Image, Dimensions, KeyboardAvoidingView, Platform, StatusBar,
  SafeAreaView, ActivityIndicator, Modal, Alert
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../utils/supabase";
import { getCategoriesList } from "../utils/categoryUtils";

import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from "base64-arraybuffer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AddProductScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const { addProduct, refreshProducts } = useProducts();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categories, setCategories] = useState([]);
  const [stock, setStock] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  const [alert, setAlert] = useState({ visible: false, title: "", message: "", type: "info" });

  // Cargar categorías
  useEffect(() => {
    (async () => {
      try {
        const data = await getCategoriesList();
        console.log("📋 Categorías cargadas:", data);
        
        const formatted = data.map(c => ({ 
          id: c.id, 
          name: c.name,
          description: c.description,
          icon: getCategoryIcon(c.name)
        }));
        
        setCategories(formatted);
        
        // Seleccionar primera categoría por defecto
        if (formatted.length > 0) {
          setCategoryId(formatted[0].id);
          setCategoryName(formatted[0].description);
        }
      } catch (error) {
        console.error("Error cargando categorías:", error);
        showAlert("Error", "No se pudieron cargar las categorías", "error");
      }
    })();
  }, []);

  // Iconos para categorías
  const getCategoryIcon = (categoryName) => {
    switch (categoryName?.toLowerCase()) {
      case "computers": return "laptop";
      case "electronics": return "cellphone-link";
      case "phones": return "cellphone";
      case "home": return "home-variant";
      case "toys": return "controller-classic";
      case "fashion": return "tshirt-crew";
      case "books": return "book-open-variant";
      case "sports": return "basketball";
      default: return "tag-outline";
    }
  };

  const showAlert = (title, message, type = "info") => {
    setAlert({ visible: true, title, message, type });
  };

  // Manejar selección de imágenes
  const handlePickerOption = async (type) => {
    setShowPicker(false);
    let result;
    
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert("Permiso denegado", "No tenemos acceso a la cámara", "error");
        return;
      }
      result = await ImagePicker.launchCameraAsync({ 
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1]
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert("Permiso denegado", "No tenemos acceso a la galería", "error");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
        quality: 0.7,
        aspect: [1, 1]
      });
    }
    
    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      if (images.length + newImages.length > 5) {
        showAlert("Límite alcanzado", "Máximo 5 imágenes por producto", "warning");
        setImages([...images, ...newImages.slice(0, 5 - images.length)]);
      } else {
        setImages([...images, ...newImages]);
      }
    }
  };

  // Subir imágenes a Supabase Storage
  const uploadImages = async (productId) => {
    const uploadedUrls = [];
    
    for (const imageUri of images) {
      try {
        console.log(`📤 Subiendo imagen: ${imageUri.substring(0, 50)}...`);
        
        // Convertir imagen a base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, { 
          encoding: FileSystem.EncodingType.Base64 
        });
        
        // Generar nombre único
        const fileName = `products/${user.id}/${productId}/${uuidv4()}.jpg`;
        
        // Subir a Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, decode(base64), { 
            contentType: 'image/jpeg' 
          });
        
        if (uploadError) {
          console.error("Error subiendo imagen:", uploadError);
          throw uploadError;
        }
        
        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(urlData.publicUrl);
        console.log(`✅ Imagen subida: ${urlData.publicUrl}`);
      } catch (error) {
        console.error("Error procesando imagen:", error);
        throw error;
      }
    }
    
    return uploadedUrls;
  };

  // Enviar producto
  const handleSubmit = async () => {
    // Validaciones
    if (!name.trim()) {
      showAlert("Campo requerido", "El nombre es obligatorio", "warning");
      return;
    }
    
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      showAlert("Precio inválido", "Ingresa un precio válido mayor a 0", "warning");
      return;
    }
    
    if (!categoryId) {
      showAlert("Categoría requerida", "Selecciona una categoría", "warning");
      return;
    }
    
    if (!stock || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      showAlert("Stock inválido", "Ingresa una cantidad de stock válida", "warning");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("📝 Creando producto...", {
        name,
        price: parseFloat(price),
        categoryId,
        categoryName,
        stock: parseInt(stock),
        imagesCount: images.length
      });
      
      // Primero crear el producto sin imágenes
      const productData = {
        providerId: user.id,
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: categoryName,
        categoryId: categoryId,
        stock: parseInt(stock),
        images: [] // Se llenará después
      };
      
      // Crear producto
      const result = await addProduct(productData);
      
      if (!result.success) {
        throw new Error(result.error || "Error al crear producto");
      }
      
      const productId = result.product.id;
      console.log(`✅ Producto creado con ID: ${productId}`);
      
      // Si hay imágenes, subirlas y actualizar producto
      if (images.length > 0) {
        console.log("🖼️ Subiendo imágenes...");
        const imageUrls = await uploadImages(productId);
        
        // Actualizar producto con URLs de imágenes
        const updateResult = await supabase
          .from("products")
          .update({ images: imageUrls })
          .eq("id", productId);
        
        if (updateResult.error) {
          throw updateResult.error;
        }
        
        console.log(`✅ ${imageUrls.length} imágenes subidas`);
      }
      
      // Refrescar lista de productos
      await refreshProducts();
      
      // Mostrar éxito y regresar
      Alert.alert(
        "✅ Éxito",
        "Producto creado correctamente",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      console.error("❌ Error creando producto:", error);
      showAlert("Error", error.message || "Error al guardar el producto", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Seleccionar categoría
  const handleSelectCategory = (category) => {
    setCategoryId(category.id);
    setCategoryName(category.description);
    setShowCategoryModal(false);
  };

  const dynamicText = { color: isDarkMode ? "#FFFFFF" : "#1F2937" };
  const dynamicPlaceholder = isDarkMode ? "#9CA3AF" : "#6B7280";

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.mainTitle, { color: colors.text }]}>Nuevo Producto</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* SECCIÓN IMÁGENES */}
          <View style={styles.mediaContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Imágenes del Producto</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {images.length}/5 imágenes • Toque para agregar
            </Text>
            
            {images.length === 0 ? (
              <TouchableOpacity 
                style={[styles.bigUpload, { 
                  backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', 
                  borderColor: colors.primary 
                }]}
                onPress={() => setShowPicker(true)}
              >
                <View style={[styles.uploadIconCircle, { backgroundColor: colors.primary + '20' }]}>
                  <Icon name="image-plus" size={40} color={colors.primary} />
                </View>
                <Text style={[styles.uploadText, { color: colors.text }]}>Agregar Fotos</Text>
                <Text style={[styles.uploadSubtext, { color: colors.textSecondary }]}>
                  Máximo 5 imágenes
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.imageGrid}>
                {images.map((uri, i) => (
                  <View key={i} style={styles.previewBox}>
                    <Image source={{ uri }} style={styles.image} />
                    <TouchableOpacity 
                      style={styles.removeBadge} 
                      onPress={() => setImages(images.filter((_, idx) => idx !== i))}
                    >
                      <Icon name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 5 && (
                  <TouchableOpacity 
                    style={[styles.addMoreBox, { 
                      backgroundColor: colors.card, 
                      borderColor: colors.primary 
                    }]} 
                    onPress={() => setShowPicker(true)}
                  >
                    <Icon name="plus" size={30} color={colors.primary} />
                    <Text style={[styles.addMoreText, { color: colors.primary }]}>Agregar</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* FORMULARIO */}
          <View style={[styles.formCard, { backgroundColor: colors.card }]}>
            
            {/* CATEGORÍA */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>CATEGORÍA</Text>
            <TouchableOpacity 
              style={[styles.categorySelector, { 
                backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                borderColor: colors.border
              }]}
              onPress={() => setShowCategoryModal(true)}
            >
              <View style={styles.categorySelectorContent}>
                <View style={styles.categoryLeft}>
                  <Icon 
                    name={getCategoryIcon(categoryName)} 
                    size={20} 
                    color={colors.primary} 
                    style={styles.categoryIcon}
                  />
                  <Text style={[styles.categoryText, { color: colors.text }]}>
                    {categoryName || "Seleccionar categoría"}
                  </Text>
                </View>
                <Icon name="chevron-down" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>

            {/* NOMBRE */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>NOMBRE DEL PRODUCTO</Text>
            <TextInput
              style={[styles.input, dynamicText, { 
                backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                borderColor: colors.border
              }]}
              placeholder="Ej: iPhone 15 Pro Max 256GB"
              placeholderTextColor={dynamicPlaceholder}
              value={name}
              onChangeText={setName}
            />

            {/* PRECIO Y STOCK */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>PRECIO ($)</Text>
                <TextInput
                  style={[styles.input, dynamicText, { 
                    backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                    borderColor: colors.border
                  }]}
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
                  style={[styles.input, dynamicText, { 
                    backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                    borderColor: colors.border
                  }]}
                  placeholder="10"
                  placeholderTextColor={dynamicPlaceholder}
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>
            </View>

            {/* DESCRIPCIÓN */}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 15 }]}>DESCRIPCIÓN</Text>
            <TextInput
              style={[styles.input, styles.textArea, dynamicText, { 
                backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                borderColor: colors.border,
                height: 100
              }]}
              placeholder="Describe tu producto (características, condición, etc.)"
              placeholderTextColor={dynamicPlaceholder}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* BOTONES */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: colors.primary }]} 
              onPress={handleSubmit} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="check-circle" size={20} color="#fff" />
                  <Text style={styles.submitText}>Publicar Producto</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL SELECCIÓN DE CATEGORÍA */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.categoryModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Seleccionar Categoría</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.categoriesList}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryItem,
                    { 
                      backgroundColor: categoryId === cat.id ? colors.primary + '20' : 'transparent',
                      borderBottomColor: colors.border
                    }
                  ]}
                  onPress={() => handleSelectCategory(cat)}
                >
                  <View style={styles.categoryItemContent}>
                    <Icon 
                      name={cat.icon} 
                      size={24} 
                      color={categoryId === cat.id ? colors.primary : colors.textSecondary} 
                    />
                    <View style={styles.categoryItemText}>
                      <Text style={[styles.categoryItemName, { 
                        color: categoryId === cat.id ? colors.primary : colors.text 
                      }]}>
                        {cat.description}
                      </Text>
                    </View>
                    {categoryId === cat.id && (
                      <Icon name="check" size={20} color={colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL SELECCIÓN DE IMÁGENES */}
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalIndicator} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Agregar Imágenes</Text>
            
            <View style={styles.pickerRow}>
              <TouchableOpacity 
                style={styles.pickerOption} 
                onPress={() => handlePickerOption('camera')}
              >
                <View style={[styles.pickerIcon, { backgroundColor: '#F59E0B' }]}>
                  <Icon name="camera" size={30} color="#fff" />
                </View>
                <Text style={[styles.pickerText, { color: colors.text }]}>Cámara</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.pickerOption} 
                onPress={() => handlePickerOption('library')}
              >
                <View style={[styles.pickerIcon, { backgroundColor: colors.primary }]}>
                  <Icon name="image-multiple" size={30} color="#fff" />
                </View>
                <Text style={[styles.pickerText, { color: colors.text }]}>Galería</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.cancelBtn, { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }]} 
              onPress={() => setShowPicker(false)}
            >
              <Text style={{ color: colors.text, fontWeight: '800' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL ALERTAS */}
      <Modal visible={alert.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.alertContent, { backgroundColor: colors.card }]}>
            <Icon 
              name={alert.type === 'error' ? "close-circle" : 
                    alert.type === 'warning' ? "alert-circle" : "check-circle"} 
              size={60} 
              color={alert.type === 'error' ? '#EF4444' : 
                     alert.type === 'warning' ? '#F59E0B' : colors.primary} 
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
  scrollContent: { paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 40,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  mainTitle: { 
    fontSize: 24, 
    fontWeight: '900',
    textAlign: 'center',
    flex: 1,
  },
  mediaContainer: { 
    paddingHorizontal: 20,
    marginBottom: 25 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 15,
  },
  bigUpload: { 
    width: '100%', 
    height: 160, 
    borderRadius: 16, 
    borderWidth: 2, 
    borderStyle: 'dashed', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  uploadIconCircle: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  uploadText: { 
    fontSize: 16, 
    fontWeight: '800',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
  },
  imageGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
  },
  previewBox: { 
    width: (SCREEN_WIDTH - 60) / 3, 
    height: (SCREEN_WIDTH - 60) / 3, 
    borderRadius: 12, 
    overflow: 'hidden',
    position: 'relative',
  },
  image: { 
    width: '100%', 
    height: '100%' 
  },
  removeBadge: { 
    position: 'absolute', 
    top: 8, 
    right: 8, 
    backgroundColor: 'rgba(239,68,68,0.9)', 
    borderRadius: 12, 
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoreBox: { 
    width: (SCREEN_WIDTH - 60) / 3, 
    height: (SCREEN_WIDTH - 60) / 3, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderStyle: 'dashed', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  addMoreText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
  formCard: { 
    borderRadius: 20, 
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: { 
    fontSize: 12, 
    fontWeight: '800', 
    letterSpacing: 0.5, 
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  categorySelector: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
  },
  categorySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  input: {
    fontSize: 16,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
    fontWeight: '500',
  },
  row: { 
    flexDirection: 'row',
    gap: 10,
  },
  textArea: {
    textAlignVertical: 'top',
  },
  buttonsContainer: {
    paddingHorizontal: 20,
  },
  submitBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end',
  },
  categoryModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  categoriesList: {
    padding: 20,
  },
  categoryItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryItemText: {
    flex: 1,
    marginLeft: 15,
  },
  categoryItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerContent: { 
    width: '100%', 
    borderRadius: 24, 
    padding: 25, 
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalIndicator: { 
    width: 40, 
    height: 5, 
    backgroundColor: '#ddd', 
    borderRadius: 10, 
    marginBottom: 20 
  },
  pickerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    width: '100%', 
    marginBottom: 25 
  },
  pickerOption: { 
    alignItems: 'center' 
  },
  pickerIcon: { 
    width: 70, 
    height: 70, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10,
    elevation: 3,
  },
  pickerText: { 
    fontWeight: '700', 
    fontSize: 14 
  },
  alertContent: { 
    width: '90%', 
    borderRadius: 25, 
    padding: 30, 
    alignItems: 'center' 
  },
  alertTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    marginTop: 15,
    textAlign: 'center',
  },
  alertMsg: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginTop: 10, 
    marginBottom: 25, 
    lineHeight: 22 
  },
  alertBtn: { 
    width: '100%', 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center' 
  },
  alertBtnText: { 
    color: '#fff', 
    fontWeight: '900', 
    fontSize: 14, 
    letterSpacing: 1 
  }
});