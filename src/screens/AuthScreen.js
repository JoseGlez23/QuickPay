// src/screens/AuthScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  Dimensions,
  StatusBar,
  Easing,
  Vibration,
  Image,
  Alert,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext"; // IMPORTADO

const COLORS = {
  primaryBlue: "#3B82F6",
  primaryBlueLight: "#60A5FA",
  primaryGreen: "#10B981",
  primaryGreenLight: "#34D399",
  error: "#EF4444",
  success: "#10B981",
};

// --- FONDO ANIMADO ---
const AnimatedBackground = ({ themeColors }) => {
  const moveX1 = useRef(new Animated.Value(0)).current;
  const moveY1 = useRef(new Animated.Value(0)).current;
  const moveX2 = useRef(new Animated.Value(0)).current;
  const moveY2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = (anim, to, dur) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: to,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    float(moveX1, 40, 8000);
    float(moveY1, 60, 10000);
    float(moveX2, -50, 9000);
    float(moveY2, -80, 13000);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={{ flex: 1, backgroundColor: themeColors.background }} />
      <Animated.View
        style={[
          styles.blob,
          {
            backgroundColor: COLORS.primaryBlueLight,
            top: "5%",
            left: "-10%",
            width: 400,
            height: 400,
            opacity: 0.15,
            transform: [{ translateX: moveX1 }, { translateY: moveY1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          {
            backgroundColor: COLORS.primaryGreenLight,
            bottom: "5%",
            right: "-10%",
            width: 450,
            height: 450,
            opacity: 0.15,
            transform: [{ translateX: moveX2 }, { translateY: moveY2 }],
          },
        ]}
      />
    </View>
  );
};

export default function AuthScreen() {
  const { colors, isDarkMode } = useTheme(); // USO DE THEMECONTEXT
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState("client");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- LÓGICA DE NOTIFICACIÓN ---
  const [notif, setNotif] = useState({ msg: "", type: "error" });
  const notifAnim = useRef(new Animated.Value(-150)).current;
  const timerRef = useRef(null);

  const { signUp, signIn, loading: authLoading } = useAuth();

  const showPopup = (msg, type = "error") => {
    if (timerRef.current) clearTimeout(timerRef.current);

    notifAnim.stopAnimation();
    setNotif({ msg, type });
    Vibration.vibrate(type === "error" ? [0, 50, 50, 50] : 20);

    Animated.spring(notifAnim, {
      toValue: Platform.OS === "ios" ? 60 : 30,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    timerRef.current = setTimeout(() => {
      Animated.timing(notifAnim, {
        toValue: -150,
        duration: 500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, 3000);
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isRegister]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.email || !formData.password) {
      showPopup("DEBES RELLENAR TODOS LOS CAMPOS");
      return;
    }

    if (isRegister) {
      if (!formData.name) {
        showPopup("INGRESA TU NOMBRE COMPLETO");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showPopup("LAS CONTRASEÑAS NO COINCIDEN");
        return;
      }
      if (formData.password.length < 6) {
        showPopup("LA CONTRASEÑA DEBE TENER AL MENOS 6 CARACTERES");
        return;
      }
    }

    try {
      let result;
      
      if (isRegister) {
        console.log(`📝 Registrando como ${role}...`);
        result = await signUp(
          formData.email,
          formData.password,
          formData.name,
          role
        );
      } else {
        console.log("🔐 Intentando login...");
        result = await signIn(formData.email, formData.password);
      }

      if (result.success) {
        showPopup(result.message || "¡Operación exitosa!", "success");
        
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          name: "",
        });
        
        if (result.needsEmailVerification) {
          Alert.alert(
            "Verificación requerida",
            "Por favor revisa tu correo electrónico y confirma tu cuenta antes de iniciar sesión.",
            [{ text: "OK" }]
          );
        }
      } else {
        showPopup(`ERROR: ${result.error}`);
      }
    } catch (error) {
      showPopup("ERROR INESPERADO, INTENTA DE NUEVO");
      console.error("Auth error:", error);
    }
  };

  const renderInput = (
    field,
    icon,
    placeholder,
    isPassword = false,
    showState,
    setShowState
  ) => (
    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons
        name={icon}
        size={20}
        color={isRegister ? COLORS.primaryGreen : COLORS.primaryBlue}
      />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={isDarkMode ? "#6B7280" : "#94A3B8"}
        secureTextEntry={isPassword && !showState}
        value={formData[field]}
        onChangeText={(v) => handleInputChange(field, v)}
        autoCapitalize="none"
        autoComplete={isPassword ? "password" : "email"}
        keyboardType={field === "email" ? "email-address" : "default"}
      />
      {isPassword && (
        <TouchableOpacity
          onPress={() => setShowState(!showState)}
          style={{ padding: 5 }}
        >
          <Ionicons
            name={showState ? "eye" : "eye-off"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <AnimatedBackground themeColors={colors} />

      {/* POP-UP */}
      <Animated.View
        style={[
          styles.popup,
          {
            transform: [{ translateY: notifAnim }],
            backgroundColor:
              notif.type === "error" ? COLORS.error : COLORS.success,
          },
        ]}
      >
        <Ionicons
          name={notif.type === "error" ? "close-circle" : "checkmark-circle"}
          size={22}
          color="#FFF"
        />
        <Text style={styles.popupText}>{notif.msg}</Text>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim }]}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              { 
                opacity: fadeAnim, 
                transform: [{ scale: cardScale }],
                backgroundColor: colors.card,
                borderColor: colors.border 
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                {
                  color: isRegister ? COLORS.primaryGreen : COLORS.primaryBlue,
                },
              ]}
            >
              {isRegister ? "Registro" : "Bienvenido"}
            </Text>

            {isRegister &&
              renderInput("name", "person-outline", "Nombre completo")}
            {renderInput("email", "mail-outline", "Email")}
            {renderInput(
              "password",
              "lock-closed-outline",
              "Contraseña",
              true,
              showPassword,
              setShowPassword
            )}
            {isRegister &&
              renderInput(
                "confirmPassword",
                "shield-checkmark-outline",
                "Confirmar clave",
                true,
                showConfirmPassword,
                setShowConfirmPassword
              )}

            {isRegister && (
              <View style={styles.roleSection}>
                <Text style={[styles.roleTitle, { color: colors.textSecondary }]}>¿Qué rol prefieres?</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[
                      styles.roleBtn,
                      { borderColor: colors.border },
                      role === "client" && {
                        borderColor: COLORS.primaryBlue,
                        backgroundColor: isDarkMode ? "#1E293B" : "#EFF6FF",
                      },
                    ]}
                    onPress={() => setRole("client")}
                  >
                    <FontAwesome5
                      name="shopping-cart"
                      size={14}
                      color={
                        role === "client"
                          ? COLORS.primaryBlue
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.roleBtnText,
                        {
                          color:
                            role === "client"
                              ? COLORS.primaryBlue
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      Comprar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleBtn,
                      { borderColor: colors.border },
                      role === "provider" && {
                        borderColor: COLORS.primaryGreen,
                        backgroundColor: isDarkMode ? "#064E3B" : "#F0FDF4",
                      },
                    ]}
                    onPress={() => setRole("provider")}
                  >
                    <FontAwesome5
                      name="store"
                      size={14}
                      color={
                        role === "provider"
                          ? COLORS.primaryGreen
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.roleBtnText,
                        {
                          color:
                            role === "provider"
                              ? COLORS.primaryGreen
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      Vender
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSubmit}
              disabled={authLoading}
            >
              <LinearGradient
                colors={
                  isRegister
                    ? [COLORS.primaryGreenLight, COLORS.primaryGreen]
                    : [COLORS.primaryBlueLight, COLORS.primaryBlue]
                }
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>
                  {authLoading
                    ? "Procesando..."
                    : isRegister
                    ? "CREAR CUENTA"
                    : "ENTRAR"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsRegister(!isRegister);
                setFormData({
                  email: "",
                  password: "",
                  confirmPassword: "",
                  name: "",
                });
              }}
              style={styles.switchMode}
            >
              <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                {isRegister ? "¿Ya tienes cuenta? " : "¿Nuevo por aquí? "}
                <Text
                  style={{
                    color: isRegister
                      ? COLORS.primaryGreen
                      : COLORS.primaryBlue,
                    fontWeight: "800",
                  }}
                >
                  {isRegister ? "Inicia Sesión" : "Regístrate"}
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blob: { position: "absolute", borderRadius: 1000 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingBottom: 40,
    paddingTop: 10,
  },
  logoWrapper: { alignItems: "center", marginBottom: 5 },
  logo: { width: 250, height: 250 },
  card: {
    borderRadius: 30,
    padding: 25,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    borderWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 58,
    marginBottom: 15,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  popup: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 9999,
    padding: 18,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  popupText: {
    color: "#FFF",
    fontWeight: "800",
    marginLeft: 12,
    fontSize: 14,
    flex: 1,
    letterSpacing: 0.5,
  },
  roleSection: { marginVertical: 10 },
  roleTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  roleButtons: { flexDirection: "row", gap: 10 },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 2,
    gap: 8,
  },
  roleBtnText: { fontWeight: "800", fontSize: 13 },
  actionButton: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 20,
    elevation: 5,
  },
  buttonGradient: { paddingVertical: 18, alignItems: "center" },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  switchMode: { marginTop: 25, alignItems: "center" },
  switchText: { fontSize: 15 },
});