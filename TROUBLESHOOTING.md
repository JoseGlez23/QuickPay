# 🔧 Troubleshooting y Debugging - Stripe Integration

## 🎯 Verificar que Todo Esté Bien

### 1. Verificar Servidor Express

```bash
# Verifica que está corriendo en puerto 4243
curl http://localhost:4243/

# Debería responder algo como:
{
  "service": "QuickPay Payment API",
  "version": "2.0",
  "stripe": "✅",
  "supabase": "✅"
}
```

### 2. Verificar Stripe en Línea

```bash
# Verifica que tu clave secreta funciona
curl -H "Authorization: Bearer sk_test_51SS2vZ3KzYA7b3meNYrMIRasQW033HHoca8JTa9mk0xYOAYW4X24XK0CaSQV8eIEJsap9Thia5kJSJJG6oxU4gBX004FJGsxxK" \
  https://api.stripe.com/v1/charges?limit=1
```

### 3. Verificar Supabase

```bash
# Desde tu servidor Node.js
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

const { data, error } = await supabase.from('orders').select().limit(1);
console.log('✅ Conectado' || '❌ Error:', error);
```

---

## 📊 Logs Importantes a Verificar

### En el CLIENTE (React Native Console)

Deberías ver:

```
💳 Creando PaymentIntent...
📡 Response status: 200
📦 Response data: { success: true, clientSecret: "pi_xxxxx_secret_xxxxx", ... }
✅ PaymentIntent creado: pi_xxxxx
🔐 Confirmando pago con Stripe...
✅ Pago confirmado exitosamente: pi_xxxxx
🔍 Confirmando pago y creando órdenes...
📊 Confirm payment response: { success: true, orders: [...], itemsCount: X }
✅ Pago confirmado y órdenes creadas: { orders: 1, itemsCount: 2 }
```

### En el SERVIDOR (Node.js Console)

Deberías ver:

```
🔄 Creando PaymentIntent y orden temporal...
✅ Orden creada en Supabase: uuid-123
✅ PaymentIntent creado: pi_xxxxx
🔑 Client Secret disponible: true
✅ Pago confirmado en Stripe
✅ Orden actualizada: uuid-123
✅ 2 items creados para orden uuid-123
✅ Stock actualizado para producto X
```

---

## 🚨 Errores Comunes y Soluciones

### Error: `"Network request failed"`

```javascript
// ❌ Problema
const API_URL = "http://localhost:4243"; // No funciona en React Native

// ✅ Solución: Usar IP real o ngrok
const API_URL = "https://semimanneristic-flurried-carolann.ngrok-free.dev";
// O
const API_URL = "http://192.168.1.100:4243"; // IP de tu máquina
```

### Error: `"Invalid client secret"`

```javascript
// ❌ Problema
const { confirmPayment } = useConfirmPayment();
await confirmPayment(null); // clientSecret es null

// ✅ Solución: Verificar que createPaymentIntent devolvió clientSecret
if (!clientSecret) {
  console.error("❌ clientSecret no disponible");
  return;
}
```

### Error: `"Card declined"`

```javascript
// ❌ Problema: Usando tarjeta real o números inválidos

// ✅ Solución: Usar tarjetas de prueba de Stripe
4242 4242 4242 4242  // Éxito
4000 0000 0000 0002  // Rechazada
4000 0025 0000 3155  // 3D Secure
```

### Error: `"Payment intent not found"`

```javascript
// ❌ Problema: El clientSecret expiró (válido por 15 minutos)

// ✅ Solución: Crear nuevo PaymentIntent si pasó mucho tiempo
// Reintenta el proceso desde el inicio
```

### Error: `"Cannot POST /api/create-payment-intent"`

```javascript
// ❌ Problema: Servidor no está corriendo o ruta no existe

// ✅ Solución:
// 1. Verifica que server.js esté corriendo
// 2. Verifica que payments.js esté importado
// 3. Verifica que la ruta sea exacta: /api/create-payment-intent
```

### Error: `"Supabase error: relation 'orders' does not exist"`

```javascript
// ❌ Problema: La tabla orders no existe en Supabase

// ✅ Solución:
// 1. Ve a https://supabase.com/dashboard
// 2. Selecciona tu proyecto
// 3. Tabla: "orders" debe existir con columnas:
//    - id (UUID)
//    - order_number (TEXT)
//    - client_id (UUID)
//    - provider_id (UUID)
//    - total (DECIMAL)
//    - status (TEXT)
//    - payment_status (TEXT)
//    - created_at (TIMESTAMP)
//    - etc.
```

### Error: `"CORS error"`

```javascript
// ❌ Problema: Cliente está en diferente origen que servidor

// ✅ Solución: Agregar CORS en server.js
app.use(
  cors({
    origin: "*", // ⚠️ En producción, usa ['https://tudominio.com']
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

---

## 🧪 Test Completo Paso a Paso

### Paso 1: Verificar Conexión a Supabase

```javascript
// En server.js o en una función de test
const supabase = require("./config/supabase");

async function testSupabase() {
  const { data, error } = await supabase.from("orders").select().limit(1);

  if (error) {
    console.error("❌ Supabase error:", error);
  } else {
    console.log("✅ Supabase conectado. Órdenes:", data.length);
  }
}

testSupabase();
```

### Paso 2: Verificar Stripe API

```javascript
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function testStripe() {
  try {
    const paymentIntents = await stripe.paymentIntents.list({ limit: 1 });
    console.log("✅ Stripe conectado. Pagos:", paymentIntents.data.length);
  } catch (error) {
    console.error("❌ Stripe error:", error.message);
  }
}

testStripe();
```

### Paso 3: Test Completo de Pago (cURL)

```bash
# 1. Crear PaymentIntent
curl -X POST http://localhost:4243/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.50,
    "currency": "mxn",
    "email": "test@example.com",
    "name": "Test User",
    "userId": "test-user-id",
    "phone": "5551234567",
    "shippingAddress": "Test St, Test City",
    "cartItems": [{
      "id": "prod-1",
      "name": "Test Product",
      "price": 100.50,
      "quantity": 1,
      "provider_id": "prov-1"
    }]
  }' > payment_response.json

# Guardará la respuesta en payment_response.json
# Extrae: clientSecret, paymentIntentId, orderId

# 2. Una vez el cliente confirme el pago en Stripe, confirma en backend:
curl -X POST http://localhost:4243/api/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_xxxxx",
    "orderIds": ["uuid-orden-de-arriba"],
    "userId": "test-user-id"
  }'

# Debería responder con success: true
```

---

## 📱 Debug en React Native

### Habilitar Logs Detallados

```javascript
// En PaymentScreen.js
const handlePressContinuar = async () => {
  console.log("🟢 START: handlePressContinuar");
  console.log("Cart:", cart);
  console.log("Total:", totalConImpuestos);
  console.log("Form valid:", isFormValid);

  const success = await createPaymentIntent();

  console.log("🟢 END: handlePressContinuar, success:", success);
};

const createPaymentIntent = async () => {
  try {
    console.log("🔵 START: createPaymentIntent");
    console.log("Enviando:", {
      amount: totalConImpuestos,
      email: user?.email,
      name: form.nombre,
    });

    const response = await fetch(`${API_URL}/api/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: totalConImpuestos,
        currency: "mxn",
        email: user?.email || "",
        name: form.nombre,
        userId: user?.id,
        cartItems: cart,
      }),
    });

    console.log("📡 Response status:", response.status);
    const data = await response.json();
    console.log("📦 Response body:", data);

    if (data.success) {
      console.log("🟢 END: createPaymentIntent - SUCCESS");
      return true;
    } else {
      console.log("🔴 END: createPaymentIntent - ERROR:", data.error);
      return false;
    }
  } catch (error) {
    console.log("🔴 END: createPaymentIntent - EXCEPTION:", error);
    return false;
  }
};
```

### Ver Requests de Red

En React Native, puedes usar:

```javascript
// Instala: npm install fetch-interceptor
import FetchInterceptor from "fetch-interceptor";

FetchInterceptor.register({
  onRequest: (request) => {
    console.log("📤 REQUEST:", request.method, request.url);
    console.log("   Body:", request.body);
    return request;
  },
  onResponse: (response) => {
    console.log("📥 RESPONSE:", response.status, response.url);
    return response;
  },
  onError: (error) => {
    console.log("❌ ERROR:", error);
    return error;
  },
});
```

---

## 🔍 Verificar en Stripe Dashboard

Ve a https://dashboard.stripe.com:

1. **Payments**: Debería haber transacciones
2. **Customers**: Debería haber un cliente con el email usado
3. **Events**: Debería haber eventos de `payment_intent.created` y `payment_intent.succeeded`

---

## 💾 Verificar en Supabase Dashboard

Ve a https://supabase.com/dashboard:

1. **Tabla orders**: Debería tener una orden con:
   - `status: 'paid'`
   - `payment_status: 'paid'`
   - `stripe_payment_id: 'pi_xxxxx'`

2. **Tabla order_items**: Debería tener items relacionados a la orden

3. **Tabla products**: El `stock` debería haber disminuido

---

## 📝 Checklist de Debugging

Cuando algo no funcione, verifica:

- [ ] ¿Servidor Express está corriendo en puerto 4243?
- [ ] ¿ngrok está corriendo y la URL es correcta?
- [ ] ¿STRIPE_SECRET_KEY está en .env del servidor?
- [ ] ¿SUPABASE_SERVICE_KEY está en .env del servidor?
- [ ] ¿La tabla `orders` existe en Supabase?
- [ ] ¿La tabla `products` existe y tiene `stock`?
- [ ] ¿La tabla `order_items` existe?
- [ ] ¿Hay logs en la consola del servidor?
- [ ] ¿Hay logs en la consola del cliente?
- [ ] ¿El clientSecret no es null?
- [ ] ¿Estoy usando tarjeta de prueba (4242...)?
- [ ] ¿La red permite peticiones HTTP/HTTPS?

---

## 🎓 Recursos Útiles

- **Stripe Docs**: https://stripe.com/docs/payments
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Supabase Docs**: https://supabase.com/docs
- **React Native Stripe**: https://github.com/stripe/stripe-react-native
- **Express Docs**: https://expressjs.com/

---

¡Si todo está bien configurado, tu Stripe debe funcionar perfectamente! 🎉
