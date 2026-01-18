import React, { useState, useEffect, useMemo } from "react";
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useTheme } from "../context/ThemeContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import { supabase } from "../utils/supabase";

const { width } = Dimensions.get("window");

const CONSTANTS = {
  primaryBlue: "#3B82F6",
  successGreen: "#00A650",
  discountRed: "#EF4444",
};

export default function ClientDashboard({ navigation }) {
  const { user, cartCount } = useAuth();
  const { products, loading, refreshProducts, loadAllProducts } = useProducts();
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([
    { id: "all", name: "Todos", icon: "grid-view" },
  ]);

  useEffect(() => {
    loadAllProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (data) {
        const formatted = [
          { id: "all", name: "Todos", icon: "grid-view" },
          ...data.map((cat) => ({
            id: cat.id,
            name: cat.name,
            icon: getCategoryIcon(cat.name.toLowerCase()),
          })),
        ];
        setCategories(formatted);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryIcon = (name) => {
    if (name.includes("elect")) return "smartphone";
    if (name.includes("compu")) return "computer";
    if (name.includes("hogar")) return "home";
    if (name.includes("moda")) return "checkroom";
    return "category";
  };

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" ||
        item.category_id === selectedCategory ||
        item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProducts();
    setRefreshing(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={isDarkMode ? colors.card : CONSTANTS.primaryBlue}
      />

      {/* HEADER AZUL */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDarkMode ? colors.card : CONSTANTS.primaryBlue },
        ]}
      >
        <View style={styles.headerTop}>
          <View
            style={[styles.searchBox, { backgroundColor: colors.background }]}
          >
            <Icon name="search" size={20} color={colors.textSecondary} />
            <TextInput
              placeholder="Buscar productos..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
            <Icon
              name={isDarkMode ? "wb-sunny" : "brightness-2"}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate("ClientCart")}
          >
            <Icon name="shopping-cart" size={24} color="#FFF" />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
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
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={styles.catItem}
              >
                <View
                  style={[
                    styles.catCircle,
                    {
                      backgroundColor: isSelected
                        ? isDarkMode
                          ? CONSTANTS.primaryBlue
                          : "#FFF"
                        : colors.card,
                    },
                  ]}
                >
                  <Icon
                    name={cat.icon}
                    size={24}
                    color={
                      isSelected
                        ? CONSTANTS.primaryBlue
                        : isDarkMode
                          ? "#FFF"
                          : colors.textSecondary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.catLabel,
                    {
                      color: isDarkMode ? "#FFF" : colors.text,
                      fontWeight: isSelected ? "bold" : "normal",
                    },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {selectedCategory === "all"
              ? "Sugeridos para ti"
              : "Resultados de la categoría"}
          </Text>

          {/* VALIDACIÓN DE PRODUCTOS VACÍOS */}
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon
                name="sentiment-very-dissatisfied"
                size={80}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No hay productos
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                No encontramos lo que buscas en esta sección.
              </Text>
            </View>
          ) : (
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
                  <View style={styles.imageBox}>
                    <Image
                      source={{
                        uri:
                          item.images?.[0] || "https://via.placeholder.com/150",
                      }}
                      style={styles.cardImg}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text
                      style={[styles.cardName, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>

                    <View style={styles.priceContainer}>
                      <Text style={[styles.price, { color: colors.text }]}>
                        $ {item.price.toLocaleString()}
                      </Text>
                      {item.discountPrice && (
                        <Text style={styles.discountText}>
                          {Math.round(
                            100 - (item.discountPrice * 100) / item.price,
                          )}
                          % OFF
                        </Text>
                      )}
                    </View>

                    <View style={styles.deliveryRow}>
                      <Icon
                        name="local-shipping"
                        size={14}
                        color={CONSTANTS.successGreen}
                      />
                      <Text style={styles.deliveryText}>Envío gratis</Text>
                    </View>

                    <Text
                      style={[
                        styles.sellerText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Vendido por {item.providerName || "Tienda Oficial"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 15, paddingBottom: 15, paddingTop: 10 },
  headerTop: { flexDirection: "row", alignItems: "center" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 15,
    elevation: 1,
  },
  input: { flex: 1, marginLeft: 8, fontSize: 14, padding: 0 },
  iconBtn: { marginLeft: 15 },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFF",
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  catList: { paddingLeft: 15, paddingVertical: 15 },
  catItem: { alignItems: "center", marginRight: 18 },
  catCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
  },
  catLabel: { fontSize: 11, marginTop: 6, textAlign: "center" },
  content: { paddingHorizontal: 10 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    marginLeft: 5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: width / 2 - 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    overflow: "hidden",
  },
  imageBox: { width: "100%", height: 160, backgroundColor: "#FFF", padding: 5 },
  cardImg: { width: "100%", height: "100%" },
  cardInfo: { padding: 12 },
  cardName: { fontSize: 13, height: 36, marginBottom: 5, lineHeight: 18 },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  price: { fontSize: 18, fontWeight: "bold", marginRight: 8 },
  discountText: {
    color: CONSTANTS.successGreen,
    fontSize: 12,
    fontWeight: "bold",
  },
  deliveryRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  deliveryText: {
    fontSize: 12,
    color: CONSTANTS.successGreen,
    fontWeight: "bold",
    marginLeft: 4,
  },
  sellerText: { fontSize: 11, marginTop: 6, fontStyle: "italic" },
  // ESTILOS ESTADO VACÍO
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: "bold", marginTop: 20 },
  emptySubtitle: { fontSize: 14, textAlign: "center", marginTop: 8 },
});
