# 📋 Referencia Rápida - Endpoints y Respuestas

## 🔗 Endpoints del Servidor

### 1. POST `/api/create-payment-intent`

**Propósito**: Crear un PaymentIntent en Stripe y una orden temporal en Supabase

#### Request

```json
{
  "amount": 115.0,
  "currency": "mxn",
  "email": "juan@example.com",
  "name": "Juan Pérez",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "phone": "5551234567",
  "shippingAddress": "Avenida Paseo 123, Apto 4B, Monterrey, Nuevo León, CP: 64000",
  "cartItems": [
    {
      "id": "prod-uuid-1",
      "name": "Laptop Gaming",
      "price": 50.0,
      "quantity": 2,
      "provider_id": "prov-uuid-1",
      "images": ["https://..."]
    },
    {
      "id": "prod-uuid-2",
      "name": "Mouse Gamer",
      "price": 15.0,
      "quantity": 1,
      "provider_id": "prov-uuid-2",
      "images": ["https://..."]
    }
  ]
}
```

#### Response (Success)

```json
{
  "success": true,
  "clientSecret": "pi_1SS2vZ3KzYA7b3me_secret_1234567890abcdefg",
  "paymentIntentId": "pi_1SS2vZ3KzYA7b3me",
  "orderId": "550e8400-e29b-41d4-a716-446655440001",
  "orderNumber": "ORD-1706900000000-542",
  "amount": 115.0,
  "currency": "mxn",
  "message": "PaymentIntent creado exitosamente"
}
```

#### Response (Error)

```json
{
  "success": false,
  "error": "Monto inválido"
}
```

---

### 2. POST `/api/confirm-payment`

**Propósito**: Confirmar el pago en Stripe y completar la orden en Supabase

#### Request

```json
{
  "paymentIntentId": "pi_1SS2vZ3KzYA7b3me",
  "orderIds": ["550e8400-e29b-41d4-a716-446655440001"],
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "shippingAddress": "Avenida Paseo 123, Apto 4B, Monterrey, Nuevo León, CP: 64000",
  "notes": "Teléfono: 5551234567, Nombre: Juan Pérez, Tipo: Residencial",
  "cartItems": [
    {
      "id": "prod-uuid-1",
      "name": "Laptop Gaming",
      "price": 50.0,
      "quantity": 2,
      "provider_id": "prov-uuid-1",
      "stock": 10
    }
  ]
}
```

#### Response (Success)

```json
{
  "success": true,
  "status": "succeeded",
  "orders": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "order_number": "ORD-1706900000000-542",
      "client_id": "550e8400-e29b-41d4-a716-446655440000",
      "provider_id": "prov-uuid-1",
      "total": "100.00",
      "status": "paid",
      "payment_status": "paid",
      "stripe_payment_id": "pi_1SS2vZ3KzYA7b3me",
      "shipping_address": "Avenida Paseo 123, Apto 4B, Monterrey, Nuevo León, CP: 64000",
      "created_at": "2026-01-21T10:30:00Z",
      "updated_at": "2026-01-21T10:30:45Z"
    }
  ],
  "itemsCount": 2,
  "paymentIntentId": "pi_1SS2vZ3KzYA7b3me",
  "message": "Pago exitoso. 1 orden(es) creada(s)."
}
```

#### Response (Error - Pago no completado)

```json
{
  "success": false,
  "status": "processing",
  "message": "Pago no completado: processing"
}
```

---

### 3. GET `/api/order/:orderId`

**Propósito**: Obtener detalles completos de una orden

#### Request

```
GET /api/order/550e8400-e29b-41d4-a716-446655440001
```

#### Response

```json
{
  "success": true,
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "order_number": "ORD-1706900000000-542",
    "client_id": "550e8400-e29b-41d4-a716-446655440000",
    "provider_id": "prov-uuid-1",
    "total": "100.00",
    "status": "paid",
    "payment_status": "paid",
    "stripe_payment_id": "pi_1SS2vZ3KzYA7b3me",
    "items": [
      {
        "id": "item-uuid-1",
        "order_id": "550e8400-e29b-41d4-a716-446655440001",
        "product_id": "prod-uuid-1",
        "quantity": 2,
        "unit_price": "50.00",
        "subtotal": "100.00",
        "products": {
          "id": "prod-uuid-1",
          "name": "Laptop Gaming",
          "price": "50.00",
          "images": ["https://..."]
        }
      }
    ]
  }
}
```

---

### 4. GET `/api/health`

**Propósito**: Verificar estado de conexiones

#### Request

```
GET /api/health
```

#### Response

```json
{
  "status": "OK",
  "service": "QuickPay Payment API",
  "stripe": "connected",
  "supabase": "connected",
  "orders_count": 42,
  "timestamp": "2026-01-21T10:30:00Z",
  "ngrok_url": "https://semimanneristic-flurried-carolann.ngrok-free.dev"
}
```

---

## 🔄 Flujo de Estados

### Estados de Orden

```
pending (cuando se crea)
   ↓
paid (después de confirmar pago)
   ↓
shipped (cuando el proveedor envía)
   ↓
delivered (cuando llega al cliente)
```

### Estados de Pago

```
pending (cuando se crea PaymentIntent)
   ↓
processing (Stripe está procesando)
   ↓
succeeded (pago completado exitosamente)
   ✗ failed (si hubo error)
```

---

## 💳 Tarjetas de Prueba

| Resultado        | Número                | Exp   | CVC  |
| ---------------- | --------------------- | ----- | ---- |
| ✅ Éxito         | `4242 4242 4242 4242` | 12/26 | 123  |
| ❌ Rechazo       | `4000 0000 0000 0002` | 12/26 | 123  |
| ⚠️ Autenticación | `4000 0025 0000 3155` | 12/26 | 123  |
| ✅ Débito        | `5555 5555 5555 4444` | 12/26 | 123  |
| ✅ Amex          | `3782 822463 10005`   | 12/26 | 1234 |

---

## 🔐 Headers Requeridos

```javascript
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

No necesitas Authorization header para estas rutas.

---

## 📱 Ejemplo en React Native (Código Completo)

```javascript
// 1. Crear PaymentIntent
const createPaymentIntent = async () => {
  try {
    const response = await fetch(`${API_URL}/api/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 115.0,
        currency: "mxn",
        email: "juan@example.com",
        name: "Juan Pérez",
        userId: user?.id,
        phone: "5551234567",
        shippingAddress: "Dirección completa",
        cartItems: cart,
      }),
    });

    const data = await response.json();

    if (data.success) {
      setClientSecret(data.clientSecret);
      setOrderIds([data.orderId]);
      return true;
    }
  } catch (error) {
    console.error("Error:", error);
  }
  return false;
};

// 2. Procesar pago (cuando usuario presiona "Pagar")
const handleProcessPayment = async () => {
  const { confirmPayment } = useConfirmPayment();

  const { error, paymentIntent } = await confirmPayment(clientSecret, {
    paymentMethodType: "Card",
  });

  if (!error && paymentIntent) {
    // 3. Confirmar en backend
    const response = await fetch(`${API_URL}/api/confirm-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentIntentId: paymentIntent.id,
        orderIds,
        userId: user?.id,
        cartItems: cart,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // ¡Pago exitoso!
      clearCart();
      refreshOrders();
      Alert.alert("¡Éxito!", "Pago completado");
    }
  }
};
```

---

## 🐛 Códigos de Error Comunes

| Error                 | Significado                | Solución                         |
| --------------------- | -------------------------- | -------------------------------- |
| `card_declined`       | La tarjeta fue rechazada   | Usar tarjeta de prueba válida    |
| `invalid_expiry_year` | Año de expiración inválido | Verificar fecha en formato MM/YY |
| `invalid_cvc`         | CVC inválido               | Verificar 3-4 dígitos atrás      |
| `insufficient_funds`  | Sin fondos                 | Usar tarjeta de prueba exitosa   |
| `timeout`             | Tiempo de espera agotado   | Reintentar                       |
| `invalid_api_key`     | API Key inválida           | Verificar STRIPE_SECRET_KEY      |
| `missing_auth`        | Autenticación requerida    | Verificar headers                |

---

## 📊 Estructura de Base de Datos

### Tabla: `orders`

```sql
id                  UUID PRIMARY KEY
order_number        TEXT UNIQUE
client_id           UUID (referencias a users)
provider_id         UUID (referencias a users)
total               DECIMAL
status              TEXT ('pending', 'paid', 'shipped', 'delivered')
payment_status      TEXT ('pending', 'paid', 'failed')
payment_method      TEXT ('stripe', 'cash', etc)
stripe_payment_id   TEXT (ID del PaymentIntent)
shipping_address    TEXT
notes               TEXT
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### Tabla: `order_items`

```sql
id                  UUID PRIMARY KEY
order_id            UUID (referencias a orders)
product_id          UUID (referencias a products)
quantity            INTEGER
unit_price          DECIMAL
subtotal            DECIMAL (calculado automáticamente)
created_at          TIMESTAMP
```

### Tabla: `products`

```sql
id                  UUID PRIMARY KEY
name                TEXT
price               DECIMAL
discount_price      DECIMAL
stock               INTEGER  ← SE ACTUALIZA AQUÍ
images              JSON[]
provider_id         UUID (referencias a users)
category_id         UUID
is_active           BOOLEAN
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

---

## ✅ Checklist Final

- [ ] ¿Servidor Express corriendo en puerto 4243?
- [ ] ¿ngrok activo y URL actualizada?
- [ ] ¿.env del servidor tiene credenciales correctas?
- [ ] ¿App puede conectar a servidor? (GET /api/health)
- [ ] ¿Puede crear PaymentIntent? (logs del servidor)
- [ ] ¿Tarjeta 4242... es aceptada por CardField?
- [ ] ¿confirmPayment() devuelve paymentIntent.id?
- [ ] ¿confirm-payment actualiza orden en Supabase?
- [ ] ¿Stock se actualiza en productos?
- [ ] ¿Modal de éxito aparece?

---

**¡Si todo funciona, ¡felicidades! 🎉**
