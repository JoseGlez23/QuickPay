// src/screens/AddProductScreen.js
import React, { useState, useRef, useEffect } from "react";
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
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabase";

// Agregar estos imports
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from "base64-arraybuffer";
import { getCategoriesList } from "../utils/categoryUtils";

console.log("FileSystem disponible?", !!FileSystem);
console.log("FileSystem.EncodingType?", FileSystem?.EncodingType);
console.log(
  "FileSystem.EncodingType.Base64?",
  FileSystem?.EncodingType?.Base64
);

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const THEME = {
  primary: "#2563eb",
  secondary: "#10b981",
  background: "#f8fafc",
  card: "#ffffff",
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  danger: "#ef4444",
  success: "#10b981",
  muted: "#e2e8f0",
  border: "#cbd5e1",
};

export default function AddProductScreen({ navigation }) {
  const { addProduct, refreshProducts } = useProducts();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Animaciones
  const bgAnim1 = useRef(new Animated.Value(0)).current;
  const bgAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = (anim, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    float(bgAnim1, 5000);
    float(bgAnim2, 8000);
  }, []);

  // Cargar categorías desde la base de datos
  useEffect(() => {
    const loadCategoriesData = async () => {
      try {
        setLoadingCategories(true);
        const categoriesData = await getCategoriesList();

        // Mapear las categorías para el frontend
        const formattedCategories = categoriesData.map((cat) => ({
          id: cat.name, // Usar el nombre como ID (electronics, computers, etc.)
          name: cat.description || cat.name, // Usar description o name
        }));

        setCategories(formattedCategories);

        // Seleccionar primera categoría por defecto si hay
        if (formattedCategories.length > 0 && !category) {
          setCategory(formattedCategories[0].id);
        }
      } catch (error) {
        console.error("Error cargando categorías:", error);
        // Categorías por defecto si falla
        const defaultCategories = [
          { id: "electronics", name: "Electrónicos" },
          { id: "computers", name: "Computadoras" },
          { id: "phones", name: "Teléfonos" },
          { id: "home", name: "Hogar" },
          { id: "toys", name: "Juguetes" },
          { id: "fashion", name: "Moda" },
          { id: "books", name: "Libros" },
          { id: "sports", name: "Deportes" },
        ];
        setCategories(defaultCategories);
        if (!category) setCategory("electronics");
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategoriesData();
  }, []);

  const MAX_IMAGES = 5;

  // Función para subir imagen - Versión corregida
  // REEMPLAZA la función uploadImage en tu AddProductScreen.js:
  const uploadImage = async (uri) => {
    try {
      console.log("Subiendo imagen:", uri);

      if (uri.startsWith("http")) {
        console.log("Es URL web, usando directamente");
        return uri;
      }

      console.log("Es imagen local, subiendo a Supabase...");

      // DETERMINAR EL ENCODING CORRECTO
      let encodingType;

      if (FileSystem.EncodingType && FileSystem.EncodingType.Base64) {
        // Si está disponible usar la propiedad
        encodingType = FileSystem.EncodingType.Base64;
      } else if (
        FileSystem.EncodingType &&
        typeof FileSystem.EncodingType === "object"
      ) {
        // Buscar Base64 en el objeto
        encodingType =
          "Base64" in FileSystem.EncodingType
            ? FileSystem.EncodingType.Base64
            : "base64";
      } else {
        // Usar string directamente
        encodingType = "base64";
      }

      console.log("Usando encoding:", encodingType);

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: encodingType,
      });

      const fileExt = uri.split(".").pop() || "jpg";
      const fileName = `products/${user.id}/${uuidv4()}.${fileExt}`;

      console.log("Subiendo archivo:", fileName);

      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) {
        console.error("Error subiendo imagen a Supabase:", error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      console.log("✅ Imagen subida exitosamente:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error en uploadImage:", error);

      // Si FileSystem falla, intentar con método alternativo
      console.log("Falló FileSystem, intentando método alternativo...");
      return await uploadImageAlternative(uri);
    }
  };

  // Agrega esta función alternativa si FileSystem falla
  const uploadImageAlternative = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result;
          // Extraer solo el base64 (remover "data:image/jpeg;base64,")
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const fileExt = uri.split(".").pop() || "jpg";
      const fileName = `products/${user.id}/${uuidv4()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) {
        console.error("Error subiendo imagen (método alternativo):", error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      console.log("✅ Imagen subida (método alternativo):", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error en uploadImageAlternative:", error);
      return null;
    }
  };

  // Manejar selección de imágenes - Versión actualizada para Expo
  const handleAddImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Límite alcanzado", `Máximo ${MAX_IMAGES} imágenes`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUris = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...newUris]);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu cámara.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && images.length < MAX_IMAGES) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Guardar producto en Supabase - Versión optimizada
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Error", "Precio inválido");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "Debes estar logueado para agregar productos");
      return;
    }

    if (!category) {
      Alert.alert("Error", "Debes seleccionar una categoría");
      return;
    }

    const stockNum = stock ? parseInt(stock) : 10;

    setIsSubmitting(true);

    try {
      let imageUrls = [];

      // 1. Subir imágenes si existen
      if (images.length > 0) {
        console.log(`Subiendo ${images.length} imágenes...`);

        // Mostrar alerta si hay muchas imágenes
        if (images.length > 2) {
          Alert.alert("Subiendo imágenes", "Por favor espera...");
        }

        // Subir todas las imágenes en paralelo para mejor performance
        const uploadPromises = images.map((imageUri) => uploadImage(imageUri));
        const uploadedResults = await Promise.allSettled(uploadPromises);

        // Filtrar solo las exitosas
        imageUrls = uploadedResults
          .filter((result) => result.status === "fulfilled" && result.value)
          .map((result) => result.value);

        console.log(
          `Imágenes subidas exitosamente: ${imageUrls.length} de ${images.length}`
        );
      }

      // 2. Si no hay imágenes subidas, usar placeholder
      if (imageUrls.length === 0) {
        console.log("No se subieron imágenes, usando placeholder");
        // Crear un placeholder SVG base64 (sin URLs externas)
        const svgString = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#f0f0f0"/>
          <text x="200" y="150" font-family="Arial" font-size="24" 
                text-anchor="middle" fill="#999">Sin Imagen</text>
        </svg>`;

        const placeholderImage = `data:image/svg+xml;base64,${btoa(svgString)}`;
        imageUrls = [placeholderImage];
      }

      // 3. Preparar datos del producto
      const productData = {
        providerId: user.id,
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        category: category, // Esto debe ser el nombre (electronics, computers, etc.)
        stock: stockNum,
        images: imageUrls,
      };

      console.log("Creando producto con datos:", productData);

      // 4. Usar el contexto para agregar el producto
      const result = await addProduct(productData);

      if (result.success) {
        console.log("Producto creado exitosamente:", result.product);

        // 5. Refrescar productos
        await refreshProducts();

        // 6. Éxito - Mostrar alerta
        Alert.alert(
          "¡Éxito!",
          "Producto creado y guardado en la base de datos",
          [
            {
              text: "Ver mis productos",
              onPress: () => {
                navigation.navigate("ProviderTabs", {
                  screen: "ProviderProducts",
                });
              },
            },
            {
              text: "Agregar otro producto",
              style: "cancel",
              onPress: () => {
                // Limpiar formulario
                setName("");
                setPrice("");
                setDescription("");
                if (categories.length > 0) setCategory(categories[0].id);
                setStock("10");
                setImages([]);
              },
            },
          ]
        );
      } else {
        console.error("Error al crear producto:", result.error);
        Alert.alert("Error", result.error || "No se pudo crear el producto");
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      Alert.alert(
        "Error",
        "Ocurrió un error inesperado: " + (error.message || "Error desconocido")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const ImagePreviewGrid = () => (
    <View style={styles.imagesGrid}>
      {images.map((uri, index) => (
        <View key={index} style={styles.imageContainer}>
          <Image source={{ uri }} style={styles.image} />
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemoveImage(index)}
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
            <Icon name="add" size={32} color={THEME.primary} />
          </View>
          <Text style={styles.addImageText}>Agregar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.mainWrapper}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Fondo Animado */}
      <Animated.View
        style={[
          styles.bgCircle,
          {
            transform: [
              {
                translateY: bgAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 50],
                }),
              },
            ],
            top: 50,
            left: -40,
            backgroundColor: THEME.primary,
            opacity: 0.12,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircle,
          {
            transform: [
              {
                translateX: bgAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 60],
                }),
              },
            ],
            bottom: 150,
            right: -60,
            backgroundColor: THEME.secondary,
            opacity: 0.12,
          },
        ]}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Sección de Imágenes */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Icon name="photo-library" size={22} color={THEME.primary} />
                <Text style={styles.sectionTitle}>Imágenes del Producto</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Máximo {MAX_IMAGES} imágenes ({images.length}/{MAX_IMAGES})
              </Text>

              {images.length === 0 ? (
                <View style={styles.emptyImagesContainer}>
                  <View style={styles.imagePlaceholder}>
                    <Icon
                      name="photo-camera"
                      size={48}
                      color={THEME.textSecondary}
                    />
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
                        <Icon name="add" size={20} color={THEME.primary} />
                        <Text style={styles.addMoreText}>
                          Agregar más imágenes
                        </Text>
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
                  <Icon name="badge" size={20} color={THEME.textSecondary} />
                  <Text style={styles.label}>Nombre del producto *</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ej: iPhone 15 Pro Max 256GB"
                  placeholderTextColor={THEME.textSecondary}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <View style={styles.labelContainer}>
                    <Icon
                      name="attach-money"
                      size={20}
                      color={THEME.textSecondary}
                    />
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
                      placeholderTextColor={THEME.textSecondary}
                    />
                  </View>
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                  <View style={styles.labelContainer}>
                    <Icon
                      name="inventory"
                      size={20}
                      color={THEME.textSecondary}
                    />
                    <Text style={styles.label}>Stock</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="numeric"
                    placeholder="Cantidad"
                    placeholderTextColor={THEME.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Icon name="category" size={20} color={THEME.textSecondary} />
                  <Text style={styles.label}>Categoría *</Text>
                </View>
                {loadingCategories ? (
                  <ActivityIndicator size="small" color={THEME.primary} />
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesScroll}
                    contentContainerStyle={styles.categoriesContent}
                  >
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          category === cat.id && styles.categoryChipActive,
                        ]}
                        onPress={() => setCategory(cat.id)}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            category === cat.id && styles.categoryTextActive,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Icon
                    name="description"
                    size={20}
                    color={THEME.textSecondary}
                  />
                  <Text style={styles.label}>Descripción</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  placeholder="Describe tu producto..."
                  placeholderTextColor={THEME.textSecondary}
                  textAlignVertical="top"
                  maxLength={500}
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
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  (!name || !price || !category || isSubmitting) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!name || !price || !category || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon
                      name="check"
                      size={22}
                      color="#fff"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.submitButtonText}>
                      Publicar Producto
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  bgCircle: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 20,
    elevation: 3,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.textPrimary,
    marginLeft: 10,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginBottom: 20,
  },
  emptyImagesContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: THEME.border,
    borderStyle: "dashed",
    marginBottom: 25,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 10,
  },
  imageButtonsRow: {
    flexDirection: "row",
    gap: 15,
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
    minWidth: 120,
    justifyContent: "center",
  },
  galleryButton: {
    backgroundColor: THEME.primary,
  },
  cameraButton: {
    backgroundColor: THEME.success,
  },
  imageButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 8,
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageContainer: {
    width: (SCREEN_WIDTH - 64) / 3,
    aspectRatio: 1,
    borderRadius: 15,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: THEME.muted,
  },
  removeBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  imageNumber: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: THEME.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  imageNumberText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  addImageContainer: {
    width: (SCREEN_WIDTH - 64) / 3,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: THEME.border,
    borderStyle: "dashed",
    borderRadius: 15,
  },
  addImageCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  addImageText: {
    fontSize: 12,
    color: THEME.textSecondary,
  },
  addMoreContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: THEME.primary,
    backgroundColor: "#eff6ff",
  },
  addMoreText: {
    color: THEME.primary,
    marginLeft: 8,
    fontWeight: "700",
    fontSize: 14,
  },
  formSection: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 20,
    elevation: 3,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.textSecondary,
    marginLeft: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: THEME.textPrimary,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  row: {
    flexDirection: "row",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  currency: {
    paddingHorizontal: 15,
    fontSize: 15,
    color: THEME.textSecondary,
  },
  priceInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0,
  },
  categoriesScroll: {
    marginTop: 8,
  },
  categoriesContent: {
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: "#f1f5f9",
    marginRight: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  categoryChipActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  categoryText: {
    fontSize: 14,
    color: THEME.textSecondary,
    fontWeight: "700",
  },
  categoryTextActive: {
    color: "#fff",
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: THEME.textSecondary,
    textAlign: "right",
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 15,
    marginTop: 10,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 15,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.textSecondary,
  },
  submitButton: {
    backgroundColor: THEME.primary,
  },
  submitButtonDisabled: {
    backgroundColor: THEME.muted,
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
