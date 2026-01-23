# 🖥️ Guía Completa del Servidor Express

Este documento te guía en cómo configurar tu servidor para que Stripe funcione correctamente.

## 📁 Estructura de Carpetas Recomendada

```
servidor/
├── config/
│   └── supabase.js        (Conexión a Supabase)
├── routes/
│   └── payments.js        (Rutas de pago con Stripe)
├── server.js              (Archivo principal)
├── .env                   (Variables de entorno - NO commitear)
├── .env.example           (Ejemplo de .env)
├── package.json
└── README.md
```

## 🔧 Instalación Paso a Paso

### 1. Crear carpeta del servidor

```bash
mkdir servidor
cd servidor
npm init -y
```

### 2. Instalar dependencias

```bash
npm install express cors stripe dotenv @supabase/supabase-js
npm install -D nodemon  # Para desarrollo
```

### 3. Crear estructura de carpetas

```bash
mkdir config routes
```

### 4. Crear archivo .env

```env
PORT=4243
STRIPE_SECRET_KEY=sk_test_51SS2vZ3KzYA7b3meNYrMIRasQW033HHoca8JTa9mk0xYOAYW4X24XK0CaSQV8eIEJsap9Thia5kJSJJG6oxU4gBX004FJGsxxK
STRIPE_WEBHOOK_SECRET=whsec_9ebfab68b8ebe97f55c56d291b209bc1cd45bbb8c14629f5abeedd54eb6bc239
SUPABASE_URL=https://yxnbpsssmojpvgryjyof.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmJwc3NzbW9qcHZncnlqeW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI3NDg0OCwiZXhwIjoyMDgzODUwODQ4fQ.jDMhewcFTlMNxgcC3-QeySSZ04MLAhWeM6oj4FOvdR0
NGROK_URL=https://semimanneristic-flurried-carolann.ngrok-free.dev
```

## 📝 Archivos Necesarios

### `config/supabase.js`

```javascript
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl =
  process.env.SUPABASE_URL || "https://yxnbpsssmojpvgryjyof.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmJwc3NzbW9qcHZncnlqeW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI3NDg0OCwiZXhwIjoyMDgzODUwODQ4fQ.jDMhewcFTlMNxgcC3-QeySSZ04MLAhWeM6oj4FOvdR0";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Faltan variables de Supabase");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
});

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.error("❌ Error conectando a Supabase:", error.message);
      return false;
    }

    console.log("✅ Conectado a Supabase correctamente");
    return true;
  } catch (error) {
    console.error("❌ Error en test de conexión:", error.message);
    return false;
  }
}

testConnection();

module.exports = supabase;
```

### `routes/payments.js`

Tu archivo que compartiste está 100% correcto. Solo verifica que:

1. Importe Supabase correctamente
2. Tenga los endpoints:
   - `POST /api/create-payment-intent`
   - `POST /api/confirm-payment`
   - `GET /api/order/:orderId`
   - `GET /api/health`

### `server.js`

```javascript
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const paymentsRouter = require("./routes/payments");

const app = express();
const PORT = process.env.PORT || 4243;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// Rutas
app.use("/api", paymentsRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "QuickPay Payment API" });
});

// Iniciar
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(
    `🌐 Ngrok: ${process.env.NGROK_URL || "Configura NGROK_URL en .env"}`,
  );
});
```

### `package.json`

```json
{
  "name": "quickpay-payment-server",
  "version": "1.0.0",
  "description": "Servidor de pagos para QuickPay",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "stripe": "^14.0.0",
    "dotenv": "^16.3.1",
    "@supabase/supabase-js": "^2.38.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## 🚀 Ejecutar el Servidor

### Desarrollo (con auto-reload):

```bash
npm run dev
```

### Producción:

```bash
npm start
```

Deberías ver:

```
🚀 Servidor corriendo en puerto 4243
🌐 Local: http://localhost:4243
💳 Stripe: ✅ Conectado
🗄️ Supabase: ✅ Conectado
```

## 🔄 Flujo de Pago en el Servidor

### 1. Cliente hace POST a `/api/create-payment-intent`

El servidor:

1. ✅ Recibe el monto, email, nombre, items del carrito
2. ✅ Genera número de orden único
3. ✅ Crea orden temporal en Supabase
4. ✅ Crea PaymentIntent en Stripe
5. ✅ Responde con `clientSecret` y `orderId`

### 2. Cliente confirma pago con Stripe

El cliente:

1. Usa `CardField` para capturar datos de tarjeta
2. Llama a `confirmPayment(clientSecret)`
3. Stripe procesa el pago

### 3. Cliente hace POST a `/api/confirm-payment`

El servidor:

1. ✅ Verifica el pago en Stripe
2. ✅ Actualiza orden a `status: 'paid'`
3. ✅ Crea items de la orden
4. ✅ Actualiza stock de productos
5. ✅ Responde con confirmación

### 4. Cliente limpia carrito y recarga órdenes

¡Compra completada! ✨

## 📊 Estructura de Datos en Supabase

### Tabla `orders`

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  client_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES users(id),
  total DECIMAL,
  status TEXT ('pending', 'paid', 'shipped', 'delivered'),
  payment_status TEXT ('pending', 'paid', 'failed'),
  payment_method TEXT,
  stripe_payment_id TEXT,
  shipping_address TEXT,
  notes TEXT,
  cancelable_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Tabla `order_items`

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER,
  unit_price DECIMAL,
  subtotal DECIMAL GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMP DEFAULT now()
);
```

### Tabla `products`

```sql
-- Debe tener:
-- id, name, price, stock, provider_id, ...
-- El servidor actualiza: stock = stock - quantity
```

## 🧪 Testing con cURL

### Crear PaymentIntent

```bash
curl -X POST http://localhost:4243/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "mxn",
    "email": "test@example.com",
    "name": "Juan Pérez",
    "userId": "uuid-usuario",
    "cartItems": []
  }'
```

### Confirmar Pago

```bash
curl -X POST http://localhost:4243/api/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_xxxxx",
    "orderIds": ["uuid-orden"],
    "userId": "uuid-usuario"
  }'
```

### Health Check

```bash
curl http://localhost:4243/api/health
```

## ✅ Checklist de Configuración

- [ ] Node.js instalado
- [ ] Carpeta `servidor` creada
- [ ] `npm install` ejecutado
- [ ] `.env` con credenciales correctas
- [ ] `config/supabase.js` creado
- [ ] `routes/payments.js` creado
- [ ] `server.js` creado
- [ ] `package.json` configurado
- [ ] ngrok instalado y corriendo
- [ ] URL de ngrok actualizada en cliente

## 🆘 Troubleshooting

| Problema                              | Solución                              |
| ------------------------------------- | ------------------------------------- |
| `Cannot find module 'stripe'`         | `npm install stripe`                  |
| `ECONNREFUSED 127.0.0.1:4243`         | Servidor no está corriendo            |
| `Error: Faltan variables de Supabase` | Verifica `.env`                       |
| `❌ Supabase: Error`                  | Verifica que la tabla `orders` exista |
| `CORS error`                          | El servidor necesita `cors()`         |
| `Invalid API Key`                     | Verifica `STRIPE_SECRET_KEY`          |

---

¡Tu servidor está listo para recibir pagos! 🎉
