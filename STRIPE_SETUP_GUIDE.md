# 🚀 Guía de Integración Stripe - QuickPay# 🔧 Guía de Configuración de Stripe en QuickPay

¡Ahora deberías tener Stripe 100% funcional! 🎉---- **Supabase Dashboard**: https://supabase.com → ve a tu proyecto para ver las órdenes- **Stripe Dashboard**: https://dashboard.stripe.com → ve a "Payments" para ver tus transacciones- **Red**: Abre DevTools (F12) → Network para ver requests- **Logs**: Mira tanto la consola del servidor como la del cliente## 📞 TIPS IMPORTANTES---5. **Verifica en Supabase** que los datos se estén guardando4. **Revisa los logs** en consola del servidor y cliente3. **Prueba con tarjeta 4242 4242 4242 4242**2. **Verifica que ngrok esté corriendo** y actualiza la URL en PaymentScreen1. **Asegúrate que el servidor esté corriendo** con `node server.js`## 🚀 PRÓXIMOS PASOS---`Usuario ve "Pago Exitoso"    ↓Muestra Modal de éxito    ↓refreshOrders() → Recarga órdenes    ↓clearCart() → Limpia el carrito    ↓handleSuccess()    ↓CLIENTE    ↓Responde al cliente    ↓Actualiza stock en products    ↓Crea order_items    ↓Actualiza orden: status='paid'    ↓Verifica pago en Stripe    ↓SERVIDOR (Express)    ↓confirmAndCreateOrders(paymentIntentId) → POST /api/confirm-payment    ↓    ↓ (Stripe procesa el pago)confirmPayment(clientSecret) → Stripe API    ↓handleProcessPayment()    ↓Usuario ingresa tarjeta    ↓Mostrar CardField Modal    ↓    ↓ (recibe clientSecret y orderId)createPaymentIntent() → POST /api/create-payment-intent    ↓PaymentScreen.handlePressContinuar()    ↓CLIENTE (React Native)`## 📊 FLUJO COMPLETO DE DATOS---- Los `product_id` en `order_items` deben existir en `products`- Verifica que el campo `stock` en `products` exista### **❌ "Stock no actualiza"**- Revisa logs del servidor para ver errores de Supabase- La tabla `orders` debe existir con las columnas correctas- Verifica que `SUPABASE_SERVICE_KEY` sea correcto### **❌ "Orden no aparece en Supabase"**- El CVC debe ser 3 dígitos- Verifica que la fecha no esté vencida- Usa tarjetas de prueba válidas (ver tabla arriba)### **❌ "Tarjeta rechazada"**- Verifica que estés usando el mismo `clientSecret` en `confirmPayment`- El `clientSecret` puede estar expirado (validad 15 minutos)### **❌ "PaymentIntent inválido"**- Comprueba que la URL de ngrok sea la correcta (cambia cada vez que reinicies)- Verifica que el servidor Express esté en puerto 4243- Verifica que ngrok esté corriendo### **❌ "Error al conectar con el servidor"**## ⚠️ POSIBLES PROBLEMAS Y SOLUCIONES--- - Tabla `products`: Stock debería haber disminuido - Tabla `order_items`: Items asociados a la orden - Tabla `orders`: Debería haber una orden con `status: 'paid'`4. **Verifica en Supabase:** - Verifica en Stripe Dashboard que aparezca el pago - Usa tarjeta 4242 4242 4242 4242 - Rellena datos de envío - Ve a checkout - Agrega productos al carrito3. **Prueba el flujo:** `   npm start   `bash2. **Inicia tu app React Native:** `   🗄️ Supabase: ✅ Conectado   💳 Stripe: ✅ Conectado   🚀 Servidor corriendo en puerto 4243   ` Deberías ver: `   npm start   npm install   cd servidor  # o donde tengas tu server   `bash1. **Inicia tu servidor Express:**### **Probar Localmente**| 3D Secure | 4000 0025 0000 3155 | 12/26 | 123 | ⚠️ Requiere autenticación || Rechazo | 4000 0000 0000 0002 | 12/26 | 123 | ❌ Rechazo || Éxito | 4242 4242 4242 4242 | 12/26 | 123 | ✅ Pago exitoso ||---------|--------|-----|-----|-----------|| Tarjeta | Número | Exp | CVC | Resultado |### **Tarjetas de Prueba Stripe**## 🧪 PRUEBAS---`SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmJwc3NzbW9qcHZncnlqeW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI3NDg0OCwiZXhwIjoyMDgzODUwODQ4fQ.jDMhewcFTlMNxgcC3-QeySSZ04MLAhWeM6oj4FOvdR0SUPABASE_URL=https://yxnbpsssmojpvgryjyof.supabase.coSTRIPE_WEBHOOK_SECRET=whsec_9ebfab68b8ebe97f55c56d291b209bc1cd45bbb8c14629f5abeedd54eb6bc239STRIPE_SECRET_KEY=sk_test_51SS2vZ3KzYA7b3meNYrMIRasQW033HHoca8JTa9mk0xYOAYW4X24XK0CaSQV8eIEJsap9Thia5kJSJJG6oxU4gBX004FJGsxxKPORT=4243`env### **Servidor (.env)**`API_URL=https://semimanneristic-flurried-carolann.ngrok-free.dev# En PaymentScreen.js:STRIPE_PUBLISHABLE_KEY=pk_test_51SS2vZ3KzYA7b3meGlOMBZVejIl9r9dY66aJ4WlRV8qPZupdr8pV6T5ck5n90Y0SFf1MTtKLfIrf2NGtMsfqOxKk00RIsmS3QN# Ya está en App.js:`env### **Cliente (.env o hardcoded en App.js)**## 🔧 CONFIGURACIÓN NECESARIA---Verifica que tanto Stripe como Supabase estén conectados correctamente.### **GET /api/health**`}  "message": "Pago exitoso. 1 orden(es) creada(s)."  "paymentIntentId": "pi_xxxxx",  "itemsCount": 2,  "orders": [...],  "status": "succeeded",  "success": true,{Response:}  "cartItems": [...]  "shippingAddress": "...",  "userId": "uuid-usuario",  "orderIds": ["uuid-orden"],  "paymentIntentId": "pi_xxxxx",{Request:`javascript### **POST /api/confirm-payment**`}  "message": "PaymentIntent creado exitosamente"  "amount": 115,  "orderNumber": "ORD-1234567890-123",  "orderId": "uuid-orden",  "paymentIntentId": "pi_xxxxx",  "clientSecret": "pi_xxxxx_secret_xxxxx",  "success": true,{Response:}  ]    }      "provider_id": "prov-uuid"      "quantity": 2,      "price": 50,      "name": "Producto",      "id": "prod-uuid",    {  "cartItems": [  "shippingAddress": "Colonia, Ciudad, Estado, CP",  "phone": "5512345678",  "userId": "uuid-usuario",  "name": "Juan Pérez",  "email": "user@example.com",  "currency": "mxn",  "amount": 115.00,           // Total con impuestos{Request:`javascript### **POST /api/create-payment-intent**Tu servidor está en puerto **4243** con los endpoints:## 🖥️ LADO DEL SERVIDOR (Express)---- Usuario puede ver sus pedidos- Se recargan las órdenes- Se limpia el carrito- Se muestra Modal de éxito#### **Paso 6: Mostrar Éxito** - Actualiza el stock - Crea los items de la orden - Actualiza la orden a "paid" - Verifica el pago en Stripe- El servidor:- Si Stripe confirma, se envía POST a `/api/confirm-payment`#### **Paso 5: Confirmar en Backend**- Stripe devuelve el resultado (success/error)- El cliente confirma el pago con Stripe usando `confirmPayment(clientSecret)`#### **Paso 4: Procesar Pago**- Usuario ingresa datos de la tarjeta (4242 4242 4242 4242 para pruebas)- Se abre un Modal con el `CardField` de Stripe#### **Paso 3: Mostrar Formulario de Tarjeta**`}  "orderNumber": "ORD-timestamp-random"  "orderId": "uuid-de-la-orden",  "paymentIntentId": "pi_xxxxx",  "clientSecret": "pi_xxxxx_secret_xxxxx",  "success": true,{`jsonRespuesta esperada: - Un **PaymentIntent** en Stripe (con el `clientSecret`) - Una **orden temporal** en Supabase- El servidor crea:- El cliente envía una solicitud POST a: `/api/create-payment-intent`#### **Paso 2: Crear Payment Intent** - Datos de contacto (Nombre, Teléfono) - Dirección (CP, Estado, Municipio, Colonia)- En `PaymentScreen`, el usuario rellena:#### **Paso 1: Usuario completa datos de envío**### 2. **Cómo Funciona**`CartScreen → PaymentScreen → Stripe API → Backend Express → Supabase`### 1. **Estructura del Flujo de Pago**## 📱 LADO DEL CLIENTE (React Native App)---Tu integración de Stripe está **casi completamente configurada**. Aquí está todo lo que necesitas saber:## ✅ Estado Actual

## Paso 1: Obtener Credenciales de Stripe

1. Ve a [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Inicia sesión o crea una cuenta
3. En el panel izquierdo, ve a **Developers** → **API Keys**
4. Encontrarás dos claves:
   - **Publishable key** (Clave Pública) - comienza con `pk_test_` o `pk_live_`
   - **Secret key** (Clave Secreta) - comienza con `sk_test_` o `sk_live_`

## Paso 2: Actualizar la Configuración de Stripe

### En `src/utils/stripe.js`:

Reemplaza `STRIPE_PUBLIC_KEY` con tu clave pública:

```javascript
const STRIPE_PUBLIC_KEY = "pk_test_tu_clave_publica_aqui";
```

## Paso 3: Configurar el Backend (Node.js/Express)

Necesitas crear un endpoint en tu backend para crear payment intents. Ejemplo:

```javascript
// Tu archivo backend (por ej: routes/payments.js)
const stripe = require("stripe")("sk_test_tu_secret_key");

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency, clientId, description } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // en centavos
      currency: currency || "mxn",
      metadata: {
        clientId,
      },
      description,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## Paso 4: Actualizar PaymentScreen.js

En el archivo `src/screens/PaymentScreen.js`, reemplaza:

```javascript
const response = await fetch("YOUR_BACKEND_URL/create-payment-intent", {
```

Con tu URL real del backend (ej: `https://tu-backend.com/create-payment-intent`)

## Paso 5: Crear la Tabla de Pagos en Supabase

1. Ve a tu panel de Supabase
2. Abre el SQL Editor
3. Ejecuta el contenido del archivo `STRIPE_DATABASE_SETUP.sql`

Esto creará las tablas:

- `payments` - para guardar información de pagos
- `payment_logs` - para auditoría (opcional)

## Paso 6: Instalar Paquetes Necesarios

```bash
npm install @stripe/stripe-react-native stripe
```

## Paso 7: Configurar la App.js o tu archivo raíz

Asegúrate de inicializar Stripe al iniciar la app:

```javascript
import { initializeStripe } from "./src/utils/stripe";

useEffect(() => {
  const setupStripe = async () => {
    await initializeStripe();
  };
  setupStripe();
}, []);
```

## 🧪 Pruebas con Tarjetas de Prueba

Stripe proporciona tarjetas de prueba para testear:

### Pago Exitoso:

- Número: `4242 4242 4242 4242`
- Expiración: Cualquier fecha futura (ej: 12/25)
- CVC: Cualquier número de 3 dígitos (ej: 123)

### Pago Rechazado:

- Número: `4000 0000 0000 0002`
- Expiración: Cualquier fecha futura
- CVC: Cualquier número de 3 dígitos

## 📋 Flujo Completado

1. ✅ Usuario completa datos de envío
2. ✅ Usuario hace clic en "Continuar"
3. ✅ Modal muestra formulario de tarjeta (CardField de Stripe)
4. ✅ Usuario completa datos de tarjeta
5. ✅ Usuario confirma el pago
6. ✅ Se procesa pago con Stripe
7. ✅ Se crea la orden en la base de datos
8. ✅ Se guarda información del pago en tabla `payments`
9. ✅ Se actualiza estado de pago en la orden
10. ✅ Se muestra confirmación al usuario

## 🔐 Seguridad

- **Nunca** guardes la clave secreta en el cliente (React Native)
- **Siempre** procesa los pagos desde tu backend
- Usa HTTPS en producción
- Mantén las claves en variables de entorno

## 🐛 Solución de Problemas

### Error: "Payment method required"

- Asegúrate de que el CardField esté completo antes de procesar

### Error: "No application found"

- Verifica que la clave pública sea correcta
- Asegúrate de usar claves de prueba (pk*test*) en desarrollo

### Error: "Could not find a payment method"

- El endpoint de crear payment intent no está funcionando
- Verifica la URL del backend
- Revisa los logs del servidor

## 📧 Soporte

Para más información:

- [Documentación oficial de Stripe](https://stripe.com/docs)
- [Documentación @stripe/stripe-react-native](https://stripe.com/docs/stripe-js/react)

---

**¡Stripe está configurado! Ahora puedes procesar pagos de verdad.** 🎉
