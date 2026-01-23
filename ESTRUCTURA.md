# 📂 Estructura Completa de Proyecto + Documentación

## 🗂️ Estructura de Carpetas (CLIENTE - React Native)

```
proyecto-quickpay/
│
├── 📱 App.js (App.js)
│   └── ✅ Stripe PublishableKey en StripeProvider
│
├── 📂 src/
│   │
│   ├── 📂 components/
│   │   ├── BottomNav.js
│   │   ├── Button.js
│   │   ├── OrderItem.js
│   │   ├── ProductCard.js
│   │   └── ProviderBottomNav.js
│   │
│   ├── 📂 context/
│   │   ├── AuthContext.js ✅ (con cart methods)
│   │   ├── OrderContext.js ✅ (con refreshOrders)
│   │   ├── ProductContext.js
│   │   └── ThemeContext.js
│   │
│   ├── 📂 hooks/
│   │   ├── useProviderNavigation.js
│   │   └── useStripePayment.js ✨ NUEVO (Tu hook de Stripe)
│   │
│   ├── 📂 screens/
│   │   ├── AddProductScreen.js
│   │   ├── AuthScreen.js
│   │   ├── CartScreen.js
│   │   ├── ClientDashboard.js
│   │   ├── OrderHistoryScreen.js
│   │   ├── OrderStatusScreen.js
│   │   ├── PaymentScreen.js ✅ MODIFICADO (import correcto)
│   │   ├── ProductDetailScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── ProviderDashboard.js
│   │   ├── ProviderOrders.js
│   │   └── ProviderProductsScreen.js
│   │
│   ├── 📂 utils/
│   │   ├── categoryUtils.js
│   │   ├── imageUtils.js
│   │   ├── supabase.js ✅ (cliente, anon key)
│   │   └── validations.js
│   │
│   ├── 📂 constants/
│   │   └── theme.js
│   │
│   ├── 📂 navigation/
│   │   └── AppNavigator.js
│   │
│   └── 📂 mocks/
│       └── data.js
│
├── 📂 assets/
│   └── 📂 images/
│
├── 📋 package.json
├── 📋 app.json
├── 📋 index.js
│
└── 📚 .env.example ✨ NUEVO (plantilla de variables)
```

---

## 🖥️ Estructura de Carpetas (SERVIDOR - Express)

```
servidor-quickpay/
│
├── 📂 config/
│   └── supabase.js ✅ (service key en .env)
│
├── 📂 routes/
│   └── payments.js ✅ (POST create-payment-intent, POST confirm-payment)
│
├── 🔧 server.js ✅ (express, cors, rutas)
│
├── 📋 package.json
│   └── dependencies: express, cors, stripe, dotenv, @supabase/supabase-js
│
├── 🔐 .env (NO COMMITEAR)
│   ├── PORT=4243
│   ├── STRIPE_SECRET_KEY=sk_test_...
│   ├── SUPABASE_URL=https://...
│   └── SUPABASE_SERVICE_KEY=eyJ...
│
└── 📋 .env.example ✅ (plantilla, seguro de commitear)
```

---

## 📚 Documentación (NUEVA)

```
proyecto-quickpay/
│
├── 📖 README_STRIPE.md ✨ NUEVO
│   └── Resumen ejecutivo (THIS is what you read first)
│
├── 📖 INICIO_RAPIDO.md ✨ NUEVO
│   └── Instrucciones rápidas (5 pasos para empezar)
│
├── 📖 STRIPE_SETUP_GUIDE.md ✨ NUEVO
│   └── Guía detallada (flujo completo, tarjetas de prueba)
│
├── 📖 SERVIDOR_SETUP_GUIDE.md ✨ NUEVO
│   └── Configuración del servidor (instalación paso a paso)
│
├── 📖 QUICK_REFERENCE.md ✨ NUEVO
│   └── Referencia rápida (endpoints, requests/responses)
│
└── 📖 TROUBLESHOOTING.md ✨ NUEVO
    └── Solución de problemas (errores comunes, debugging)
```

---

## 🔄 Flujo de Datos

### 1️⃣ Cliente (App) → Servidor

```
PaymentScreen
    ↓
handlePressContinuar()
    ↓
createPaymentIntent()
    ↓
POST /api/create-payment-intent
{
  amount: 115.00,
  currency: 'mxn',
  email: 'user@example.com',
  name: 'Juan Pérez',
  userId: 'uuid',
  phone: '5551234567',
  shippingAddress: '...',
  cartItems: [...]
}
    ↓
SERVIDOR recibe request
```

### 2️⃣ Servidor → Supabase + Stripe

```
SERVIDOR (server.js)
    ↓
routes/payments.js (POST /api/create-payment-intent)
    ↓
Insertar orden temporal en Supabase
    ↓
Crear PaymentIntent en Stripe API
    ↓
Responder al cliente:
{
  clientSecret: 'pi_xxx_secret_xxx',
  paymentIntentId: 'pi_xxx',
  orderId: 'uuid-orden',
  orderNumber: 'ORD-...'
}
```

### 3️⃣ Cliente → Stripe (Pago)

```
PaymentScreen (Modal abierto)
    ↓
CardField captura tarjeta
    ↓
handleProcessPayment()
    ↓
confirmPayment(clientSecret) ← useStripePayment hook
    ↓
Stripe API procesa pago
    ↓
Devuelve paymentIntent.id y status
```

### 4️⃣ Cliente → Servidor (Confirmación)

```
PaymentScreen
    ↓
confirmAndCreateOrders(paymentIntentId)
    ↓
POST /api/confirm-payment
{
  paymentIntentId: 'pi_xxx',
  orderIds: ['uuid-orden'],
  userId: 'uuid',
  cartItems: [...]
}
    ↓
SERVIDOR recibe request
```

### 5️⃣ Servidor → Supabase (Finalización)

```
SERVIDOR (server.js)
    ↓
routes/payments.js (POST /api/confirm-payment)
    ↓
Verifica pago en Stripe
    ↓
SI status === 'succeeded':
  - Actualiza orden: status='paid'
  - Crea order_items
  - Actualiza stock en products
  - Devuelve success: true
    ↓
Cliente recibe respuesta
    ↓
handleSuccess()
    ↓
clearCart() + refreshOrders()
    ↓
Alert: "¡Pago Exitoso!"
```

---

## 🔐 Variables de Entorno

### Cliente (React Native)

En `App.js`:

```javascript
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51SS2vZ3KzYA7b3meGlOMBZVejIl9r9dY66aJ4WlRV8qPZupdr8pV6T5ck5n90Y0SFf1MTtKLfIrf2NGtMsfqOxKk00RIsmS3QN";
```

En `PaymentScreen.js`:

```javascript
const API_URL = "https://semimanneristic-flurried-carolann.ngrok-free.dev";
```

### Servidor (Node.js)

En `.env`:

```env
PORT=4243
STRIPE_SECRET_KEY=sk_test_51SS2vZ3KzYA7b3meNYrMIRasQW033HHoca8JTa9mk0xYOAYW4X24XK0CaSQV8eIEJsap9Thia5kJSJJG6oxU4gBX004FJGsxxK
SUPABASE_URL=https://yxnbpsssmojpvgryjyof.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmJwc3NzbW9qcHZncnlqeW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI3NDg0OCwiZXhwIjoyMDgzODUwODQ4fQ.jDMhewcFTlMNxgcC3-QeySSZ04MLAhWeM6oj4FOvdR0
```

### Supabase

- **URL**: https://yxnbpsssmojpvgryjyof.supabase.co (pública)
- **Anon Key**: eyJ... (pública, para cliente)
- **Service Key**: eyJ... (privada, solo servidor)

### Stripe

- **Publishable Key**: pk*test*... (pública, para cliente)
- **Secret Key**: sk*test*... (privada, solo servidor)
- **Webhook Secret**: whsec\_... (privada, solo servidor)

---

## 📊 Tablas Supabase Necesarias

### orders

```
id (UUID) - PRIMARY KEY
order_number (TEXT) - UNIQUE
client_id (UUID) - FOREIGN KEY users(id)
provider_id (UUID) - FOREIGN KEY users(id)
total (DECIMAL)
status (TEXT) - 'pending', 'paid', 'shipped', 'delivered'
payment_status (TEXT) - 'pending', 'paid', 'failed'
payment_method (TEXT) - 'stripe', etc
stripe_payment_id (TEXT)
shipping_address (TEXT)
notes (TEXT)
cancelable_until (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### order_items

```
id (UUID) - PRIMARY KEY
order_id (UUID) - FOREIGN KEY orders(id)
product_id (UUID) - FOREIGN KEY products(id)
quantity (INTEGER)
unit_price (DECIMAL)
subtotal (DECIMAL) - GENERATED
created_at (TIMESTAMP)
```

### products

```
id (UUID) - PRIMARY KEY
name (TEXT)
description (TEXT)
price (DECIMAL)
discount_price (DECIMAL)
stock (INTEGER) ← SE ACTUALIZA AQUÍ
images (JSON[])
provider_id (UUID) - FOREIGN KEY users(id)
category_id (UUID)
is_active (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

---

## 🎯 Puntos Clave de Integración

### 1. Hook de Stripe

**Archivo**: `src/hooks/useStripePayment.js`

```javascript
export const useConfirmPayment = () => {
  const confirmPayment = async (clientSecret, options) => {
    // Confirma con Stripe
  };
  return { confirmPayment, paymentLoading, paymentError };
};
```

### 2. PaymentScreen

**Archivo**: `src/screens/PaymentScreen.js`

```javascript
const { confirmPayment } = useConfirmPayment(); // ✅ CORRECTO

const handleProcessPayment = async () => {
  const { error, paymentIntent } = await confirmPayment(clientSecret);
  if (!error) {
    // Confirmar en servidor
  }
};
```

### 3. Servidor - Crear PaymentIntent

**Archivo**: `server.js` o `routes/payments.js`

```javascript
POST /api/create-payment-intent
- Inserta orden en Supabase
- Crea PaymentIntent en Stripe
- Devuelve clientSecret
```

### 4. Servidor - Confirmar Pago

**Archivo**: `server.js` o `routes/payments.js`

```javascript
POST /api/confirm-payment
- Verifica pago en Stripe
- Actualiza orden en Supabase
- Crea order_items
- Actualiza stock
```

---

## ✅ Checklist de Archivos

### Cliente

- [x] `src/hooks/useStripePayment.js` - Creado
- [x] `src/screens/PaymentScreen.js` - Actualizado
- [x] `App.js` - Stripe ProviderKey correcto
- [x] `.env.example` - Plantilla creada

### Servidor

- [x] `config/supabase.js` - Configuración
- [x] `routes/payments.js` - Rutas de Stripe
- [x] `server.js` - Servidor Express
- [x] `.env` - Variables privadas
- [x] `.env.example` - Plantilla segura

### Documentación

- [x] `README_STRIPE.md` - Resumen
- [x] `INICIO_RAPIDO.md` - Quick start
- [x] `STRIPE_SETUP_GUIDE.md` - Guía detallada
- [x] `SERVIDOR_SETUP_GUIDE.md` - Setup servidor
- [x] `QUICK_REFERENCE.md` - Referencia
- [x] `TROUBLESHOOTING.md` - Problemas
- [x] `ESTRUCTURA.md` - Este archivo

---

## 🚀 Ejecución

### Terminal 1 - Cliente

```bash
cd proyecto-quickpay
npm start
```

### Terminal 2 - Servidor

```bash
cd servidor-quickpay
node server.js
```

### Terminal 3 - ngrok

```bash
ngrok http 4243
```

### Resultado en Consola Servidor

```
🚀 Servidor corriendo en puerto 4243
🌐 Local: http://localhost:4243
🌐 Ngrok: https://abc123def456.ngrok-free.dev
💳 Stripe: ✅ Conectado
🗄️ Supabase: ✅ Conectado
```

---

## 📖 Orden de Lectura Recomendado

1. **Este archivo** (ESTRUCTURA.md) - 5 min
   └─ Entender estructura general

2. **[INICIO_RAPIDO.md](./INICIO_RAPIDO.md)** - 5 min
   └─ Empezar rápido

3. **[STRIPE_SETUP_GUIDE.md](./STRIPE_SETUP_GUIDE.md)** - 15 min
   └─ Entender flujo completo

4. **[SERVIDOR_SETUP_GUIDE.md](./SERVIDOR_SETUP_GUIDE.md)** - 10 min
   └─ Configurar servidor si es necesario

5. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Consulta cuando necesites
   └─ Endpoints exactos, ejemplos

6. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Si algo falla
   └─ Solucionar problemas

---

## 🎉 ¡Listo!

Tu integración de Stripe está 100% configurada.
Solo necesitas ejecutar el servidor y probar.

**Sigue [INICIO_RAPIDO.md](./INICIO_RAPIDO.md) para empezar en 5 minutos.**
