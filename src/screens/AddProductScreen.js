// src/screens/AddProductScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import {
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AddProductScreen({ navigation }) {
  const { addProduct } = useProducts();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');

  const MAX_IMAGES = 5;
  const categories = ['Comida', 'Bebidas', 'Postres', 'Snacks', 'Otros'];

  const handleAddImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Límite alcanzado', `Máximo ${MAX_IMAGES} imágenes`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...newUris]);
    }
  };

  const handleRemoveImage = (uri) => {
    setImages(prev => prev.filter(img => img !== uri));
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && images.length < MAX_IMAGES) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleSubmit = () => {
    // Validaciones
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Precio inválido');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Debes estar logueado para agregar productos');
      return;
    }

    const stockNum = stock ? parseInt(stock) : 0;

    addProduct({
      providerId: user.id,
      name: name.trim(),
      price: priceNum,
      description: description.trim(),
      category: category || 'General',
      stock: stockNum,
      images,
    });

    // Limpieza
    setName('');
    setPrice('');
    setDescription('');
    setCategory('');
    setStock('');
    setImages([]);

    Alert.alert(
      '¡Éxito!',
      'Producto agregado correctamente',
      [
        {
          text: 'Ver productos',
          onPress: () => navigation.goBack(),
        },
        {
          text: 'Agregar otro',
          style: 'cancel',
        }
      ]
    );
  };

  const ImagePreviewGrid = () => (
    <View style={styles.imagesGrid}>
      {images.map((uri, index) => (
        <View key={index} style={styles.imageContainer}>
          <Image source={{ uri }} style={styles.image} />
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemoveImage(uri)}
          >
            <Icon name="close" size={16} color="#fff" />
          </TouchableOpacity>
          <View style={styles.imageNumber}>
            <Text style={styles.imageNumberText}>{index + 1}</Text>
          </View>
        </View>
      ))}
      {images.length < MAX_IMAGES && (
        <TouchableOpacity 
          style={styles.addImageContainer}
          onPress={handleAddImage}
        >
          <View style={styles.addImageCircle}>
            <Icon name="add" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.addImageText}>Agregar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color={COLORS.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuevo Producto</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sección de Imágenes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="photo-library" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Imágenes del Producto</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Máximo {MAX_IMAGES} imágenes ({images.length}/{MAX_IMAGES})
            </Text>
            
            {images.length === 0 ? (
              <View style={styles.emptyImagesContainer}>
                <View style={styles.imagePlaceholder}>
                  <Icon name="photo-camera" size={48} color={COLORS.mutedForeground} />
                  <Text style={styles.imagePlaceholderText}>
                    Sin imágenes aún
                  </Text>
                </View>
                <View style={styles.imageButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.imageButton, styles.galleryButton]}
                    onPress={handleAddImage}
                  >
                    <Icon name="photo-library" size={20} color="#fff" />
                    <Text style={styles.imageButtonText}>Galería</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.imageButton, styles.cameraButton]}
                    onPress={handleTakePhoto}
                  >
                    <Icon name="camera-alt" size={20} color="#fff" />
                    <Text style={styles.imageButtonText}>Cámara</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <ImagePreviewGrid />
                {images.length < MAX_IMAGES && (
                  <View style={styles.addMoreContainer}>
                    <TouchableOpacity 
                      style={styles.addMoreButton}
                      onPress={handleAddImage}
                    >
                      <Icon name="add" size={20} color={COLORS.primary} />
                      <Text style={styles.addMoreText}>Agregar más imágenes</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Formulario */}
          <View style={styles.formSection}>
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Icon name="badge" size={18} color={COLORS.mutedForeground} />
                <Text style={styles.label}>Nombre del producto *</Text>
              </View>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej: Tacos de Asada"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.sm }]}>
                <View style={styles.labelContainer}>
                  <Icon name="attach-money" size={18} color={COLORS.mutedForeground} />
                  <Text style={styles.label}>Precio *</Text>
                </View>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currency}>$</Text>
                  <TextInput
                    style={[styles.input, styles.priceInput]}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={COLORS.mutedForeground}
                  />
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                <View style={styles.labelContainer}>
                  <Icon name="inventory" size={18} color={COLORS.mutedForeground} />
                  <Text style={styles.label}>Stock</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="numeric"
                  placeholder="Cantidad"
                  placeholderTextColor={COLORS.mutedForeground}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Icon name="category" size={18} color={COLORS.mutedForeground} />
                <Text style={styles.label}>Categoría</Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScroll}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.categoryChipActive
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <Icon name="description" size={18} color={COLORS.mutedForeground} />
                <Text style={styles.label}>Descripción</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholder="Describe tu producto..."
                placeholderTextColor={COLORS.mutedForeground}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {description.length}/500 caracteres
              </Text>
            </View>
          </View>

          {/* Botones de acción */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={!name || !price}
            >
              <Icon name="check" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.submitButtonText}>
                {!name || !price ? 'Completa los campos' : 'Publicar Producto'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
    ...SHADOWS.sm,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.foreground,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  section: {
    margin: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.foreground,
    marginLeft: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedForeground,
    marginBottom: SPACING.lg,
  },
  emptyImagesContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginBottom: SPACING.lg,
  },
  imagePlaceholderText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedForeground,
    marginTop: SPACING.sm,
  },
  imageButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 120,
    justifyContent: 'center',
  },
  galleryButton: {
    backgroundColor: COLORS.primary,
  },
  cameraButton: {
    backgroundColor: COLORS.success,
  },
  imageButtonText: {
    color: '#fff',
    fontWeight: FONT_WEIGHTS.medium,
    marginLeft: SPACING.xs,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  imageContainer: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md * 2) / 3,
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.muted,
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNumber: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNumberText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addImageContainer: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md * 2) / 3,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
  },
  addImageCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  addImageText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedForeground,
  },
  addMoreContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addMoreText: {
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontWeight: FONT_WEIGHTS.medium,
  },
  formSection: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.mutedForeground,
    marginLeft: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.foreground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSecondary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currency: {
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.mutedForeground,
  },
  priceInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0,
  },
  categoriesScroll: {
    marginTop: SPACING.xs,
  },
  categoryChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardSecondary,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.mutedForeground,
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: FONT_WEIGHTS.medium,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.mutedForeground,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  cancelButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.mutedForeground,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.muted,
  },
  buttonIcon: {
    marginRight: SPACING.xs,
  },
  submitButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#fff',
  },
});