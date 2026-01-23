import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  Dimensions,
  StatusBar,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useTheme } from "../context/ThemeContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { supabase } from "../utils/supabase";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

// Función para formatear precios con comas y dos decimales
const formatPrice = (price) => {
  if (price == null || isNaN(price)) return "$0.00";

  const num = Number(price);
  const fixed = num.toFixed(2);
  const [integer, decimal] = fixed.split(".");

  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `$${formattedInteger}.${decimal}`;
};

// --- MAPEO DE ICONOS CORREGIDO ---
const getCategoryIcon = (name) => {
  const n = name ? name.toLowerCase().trim() : "";

  switch (n) {
    case "computers":
      return "laptop";
    case "electronics":
      return "cellphone-link";
    case "phones":
      return "cellphone";
    case "home":
      return "home-variant";
    case "toys":
      return "controller-classic";
    case "fashion":
      return "tshirt-crew";
    case "books":
      return "book-open-variant";
    case "sports":
      return "basketball";
    case "all":
    case "todos":
      return "apps";
    default:
      return "tag-outline";
  }
};

export default function ClientDashboard({ navigation }) {
  const { user, cartCount } = useAuth();
  const { products, refreshProducts, loadAllProducts } = useProducts();
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([{ id: "all", name: "Todos" }]);

  useEffect(() => {
    loadAllProducts();
    fetchCategoriesFromDB();
  }, []);

  const fetchCategoriesFromDB = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (error) throw error;
      if (data) {
        setCategories([{ id: "all", name: "Todos" }, ...data]);
      }
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.categoryId === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProducts();
    await fetchCategoriesFromDB();
    setRefreshing(false);
  }, [refreshProducts]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
              Hola,
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name || user?.user_metadata?.name || "Usuario"}
            </Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.iconCircle, { backgroundColor: colors.card }]}
            >
              <Icon
                name={
                  isDarkMode ? "white-balance-sunny" : "moon-waning-crescent"
                }
                size={22}
                color={colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("ClientCart")}
              style={[
                styles.iconCircle,
                { backgroundColor: colors.card, marginLeft: 10 },
              ]}
            >
              <Icon name="cart-outline" size={24} color={colors.text} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[styles.searchContainer, { backgroundColor: colors.card }]}
        >
          <Icon name="magnify" size={22} color={colors.textSecondary} />
          <TextInput
            placeholder="Buscar productos..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* CATEGORÍAS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const iconName = getCategoryIcon(cat.name);

            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setSelectedCategory(cat.id);
                }}
                style={styles.catItem}
              >
                <View
                  style={[
                    styles.catCircle,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.card,
                    },
                  ]}
                >
                  <Icon
                    name={iconName}
                    size={26}
                    color={isSelected ? "#FFF" : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.catLabel,
                    {
                      color: isSelected ? colors.primary : colors.textSecondary,
                      fontWeight: isSelected ? "bold" : "500",
                    },
                  ]}
                >
                  {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* PRODUCTOS - TARJETAS MODIFICADAS */}
        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Catálogo
          </Text>
          <View style={styles.grid}>
            {filteredProducts.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() =>
                  navigation.navigate("ProductDetail", {
                    productId: item.id,
                    productData: item,
                  })
                }
              >
                <Image
                  source={{
                    uri: item.images?.[0] || "https://via.placeholder.com/150",
                  }}
                  style={styles.cardImg}
                  resizeMode="cover"
                />
                <View style={styles.cardInfo}>
                  <Text
                    style={[styles.cardName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[styles.cardDesc, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.description}
                  </Text>
                  <Text style={[styles.price, { color: colors.text }]}>
                    {formatPrice(item.price)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeText: { fontSize: 14 },
  userName: { fontSize: 22, fontWeight: "bold" },
  headerIcons: { flexDirection: "row" },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 12,
  },
  input: { flex: 1, marginLeft: 10 },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "white", fontSize: 10, fontWeight: "bold" },
  catList: { paddingLeft: 20, marginBottom: 20 },
  catItem: { alignItems: "center", marginRight: 18 },
  catCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    elevation: 3,
  },
  catLabel: { fontSize: 11, textAlign: "center" },
  content: { paddingHorizontal: 15 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    marginLeft: 5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  card: {
    width: width * 0.44, // Un poco más ancha
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImg: {
    width: "100%",
    height: 180, // Altura incrementada para resaltar el producto
  },
  cardInfo: { padding: 10 },
  cardName: { fontSize: 14, fontWeight: "bold" },
  cardDesc: { fontSize: 11, marginVertical: 2, height: 16 },
  price: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
});
