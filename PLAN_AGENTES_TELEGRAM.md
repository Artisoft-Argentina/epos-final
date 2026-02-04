# 📱 PLAN: Agentes IA con Telegram para EPOS-Final

## 🎯 OBJETIVO
Implementar 2 bots de Telegram con IA (OpenAI) integrados a EPOS-Final:
- **Bot Administrador**: Reportes, inventario, análisis financiero, configuración sistema
- **Bot Vendedor**: Ventas, clientes, presupuestos, consultas stock

---

## 📦 STACK TECNOLÓGICO
- **Backend**: Laravel 12 + PHP 8.3
- **IA**: OpenAI API (gpt-4o-mini con function calling)
- **Mensajería**: Telegram Bot API
- **Base de datos**: MySQL (tablas adicionales para vincular usuarios y conversaciones)

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Tabla: telegram_users
```sql
CREATE TABLE telegram_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL REFERENCES users(id),
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username VARCHAR(255),
    telegram_first_name VARCHAR(255),
    telegram_last_name VARCHAR(255),
    bot_type ENUM('admin', 'vendedor') NOT NULL,
    verification_code VARCHAR(6),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_interaction_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX idx_telegram_id (telegram_id),
    INDEX idx_user_id (user_id)
);
```

### Tabla: telegram_conversations
```sql
CREATE TABLE telegram_conversations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    telegram_user_id BIGINT REFERENCES telegram_users(id),
    message_id BIGINT,
    user_message TEXT,
    bot_response TEXT,
    context JSON,
    function_called VARCHAR(255),
    function_result JSON,
    tokens_used INT,
    response_time_ms INT,
    created_at TIMESTAMP,
    INDEX idx_telegram_user (telegram_user_id),
    INDEX idx_created_at (created_at)
);
```

### Tabla: telegram_notifications
```sql
CREATE TABLE telegram_notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    telegram_user_id BIGINT REFERENCES telegram_users(id),
    notification_type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    data JSON,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP,
    INDEX idx_telegram_user (telegram_user_id),
    INDEX idx_sent_at (sent_at)
);
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
app/
├── Models/
│   ├── TelegramUser.php
│   ├── TelegramConversation.php
│   └── TelegramNotification.php
├── Services/
│   ├── Telegram/
│   │   ├── TelegramBotService.php          # Manejo webhooks, envío mensajes
│   │   ├── TelegramAuthService.php         # Vinculación cuentas
│   │   └── TelegramNotificationService.php # Notificaciones proactivas
│   ├── AI/
│   │   ├── OpenAIService.php               # Integración OpenAI
│   │   ├── AgentAdminService.php           # Lógica agente admin
│   │   └── AgentVendedorService.php        # Lógica agente vendedor
│   └── Functions/
│       ├── SalesReportFunction.php
│       ├── InventoryFunction.php
│       ├── ClientSearchFunction.php
│       ├── ProductSearchFunction.php
│       ├── CreateBudgetFunction.php
│       └── CreateSaleFunction.php
├── Http/
│   └── Controllers/
│       ├── TelegramWebhookController.php
│       └── TelegramAuthController.php
└── Console/
    └── Commands/
        ├── SetupTelegramWebhooks.php
        └── SendTelegramNotifications.php

config/
└── telegram-agents.php                     # Configuración agentes

database/
└── migrations/
    ├── 2026_02_04_000001_create_telegram_users_table.php
    ├── 2026_02_04_000002_create_telegram_conversations_table.php
    └── 2026_02_04_000003_create_telegram_notifications_table.php

resources/
└── js/
    └── pages/
        └── Settings/
            └── TelegramIntegration.tsx     # UI para vincular cuenta
```

---

## ⚙️ VARIABLES DE ENTORNO

```env
# Telegram Bots
TELEGRAM_BOT_ADMIN_TOKEN=
TELEGRAM_BOT_VENDEDOR_TOKEN=
TELEGRAM_WEBHOOK_SECRET=

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
```

---

## 🔧 DEPENDENCIAS PHP

```bash
composer require telegram-bot/api
composer require openai-php/laravel
```

---

## 🤖 CAPACIDADES DEL AGENTE ADMINISTRADOR

### Reportes de Ventas
- "¿Cuánto vendimos hoy?"
- "Reporte de ventas del mes"
- "Top 10 productos más vendidos"
- "Comparativa ventas mes anterior"

### Gestión de Inventario
- "¿Cuánto stock tenemos de [producto]?"
- "Productos con stock bajo"
- "Alertas de inventario crítico"
- "Movimientos de stock del día"

### Análisis Financiero
- "Estado de cuenta corriente general"
- "Facturas pendientes de cobro"
- "Flujo de caja del mes"
- "Clientes con deuda mayor a $X"

### Gestión de Usuarios
- "Listar usuarios activos"
- "Actividad de vendedores hoy"
- "Rendimiento por vendedor"

### Configuración y Sistema
- "Verificar certificados AFIP"
- "Estado del sistema"
- "Logs de errores recientes"
- "Backup de base de datos"

---

## 🤖 CAPACIDADES DEL AGENTE VENDEDOR

### Gestión de Clientes
- "Buscar cliente [nombre/CUIT]"
- "Crear nuevo cliente"
- "Estado de cuenta de [cliente]"
- "Datos fiscales de [cliente]"

### Consultas de Productos
- "Precio de [producto]"
- "Stock disponible de [producto]"
- "Buscar productos por categoría [categoría]"
- "Productos de la marca [marca]"

### Creación de Presupuestos
- "Crear presupuesto para [cliente]"
- "Agregar [cantidad] [producto] al presupuesto"
- "Calcular total del presupuesto"
- "Enviar presupuesto por email"

### Ventas Rápidas
- "Registrar venta de [producto] a [cliente]"
- "Convertir presupuesto #123 en factura"
- "Facturar presupuesto #123"

### Consultas de Ventas
- "Mis ventas de hoy"
- "Mis ventas del mes"
- "Facturas pendientes de entrega"
- "Entregas programadas para hoy"

---

## 🔌 FUNCIONES DISPONIBLES (Function Calling)

### Agente Administrador

```php
// config/telegram-agents.php
'admin' => [
    'functions' => [
        'get_sales_report' => [
            'description' => 'Obtiene reporte de ventas por período',
            'parameters' => ['start_date', 'end_date', 'group_by'],
            'handler' => SalesReportFunction::class,
        ],
        'get_inventory_status' => [
            'description' => 'Consulta estado de inventario',
            'parameters' => ['product_id', 'low_stock_threshold'],
            'handler' => InventoryFunction::class,
        ],
        'get_financial_report' => [
            'description' => 'Genera reporte financiero',
            'parameters' => ['report_type', 'start_date', 'end_date'],
            'handler' => FinancialReportFunction::class,
        ],
        'check_afip_status' => [
            'description' => 'Verifica estado de certificados AFIP',
            'parameters' => [],
            'handler' => AfipStatusFunction::class,
        ],
        'get_user_activity' => [
            'description' => 'Obtiene actividad de usuarios',
            'parameters' => ['user_id', 'date'],
            'handler' => UserActivityFunction::class,
        ],
    ],
],
```

### Agente Vendedor

```php
'vendedor' => [
    'functions' => [
        'search_client' => [
            'description' => 'Busca clientes por nombre o CUIT',
            'parameters' => ['query'],
            'handler' => ClientSearchFunction::class,
        ],
        'create_client' => [
            'description' => 'Crea un nuevo cliente',
            'parameters' => ['nombre', 'cuit', 'email', 'telefono'],
            'handler' => CreateClientFunction::class,
        ],
        'get_client_account' => [
            'description' => 'Obtiene estado de cuenta de cliente',
            'parameters' => ['client_id'],
            'handler' => ClientAccountFunction::class,
        ],
        'search_product' => [
            'description' => 'Busca productos por nombre o código',
            'parameters' => ['query'],
            'handler' => ProductSearchFunction::class,
        ],
        'get_product_stock' => [
            'description' => 'Consulta stock de producto',
            'parameters' => ['product_id'],
            'handler' => ProductStockFunction::class,
        ],
        'create_budget' => [
            'description' => 'Crea un nuevo presupuesto',
            'parameters' => ['client_id', 'items', 'notes'],
            'handler' => CreateBudgetFunction::class,
        ],
        'add_budget_item' => [
            'description' => 'Agrega item a presupuesto',
            'parameters' => ['budget_id', 'product_id', 'quantity'],
            'handler' => AddBudgetItemFunction::class,
        ],
        'convert_budget_to_invoice' => [
            'description' => 'Convierte presupuesto en factura',
            'parameters' => ['budget_id'],
            'handler' => ConvertBudgetFunction::class,
        ],
        'get_my_sales' => [
            'description' => 'Obtiene ventas del vendedor',
            'parameters' => ['start_date', 'end_date'],
            'handler' => MySalesFunction::class,
        ],
    ],
],
```

---

## 🔐 FLUJO DE AUTENTICACIÓN

### 1. Vinculación de Cuenta

**En Telegram:**
```
Usuario: /start
Bot: ¡Hola! Para usar este bot necesitas vincular tu cuenta de EPOS.
     Tu código de verificación es: ABC123
     Ingresa este código en EPOS → Configuración → Telegram
```

**En EPOS Web:**
```tsx
// Página: /settings/telegram
- Input para código de 6 dígitos
- Botón "Vincular cuenta"
- Al vincular: telegram_users.is_verified = true
```

### 2. Verificación de Permisos

```php
// Antes de ejecutar cualquier función
if (!$telegramUser->is_verified) {
    return "Debes vincular tu cuenta primero. Usa /start";
}

if ($telegramUser->bot_type === 'vendedor' && $function === 'get_financial_report') {
    return "No tienes permisos para esta acción";
}
```

---

## 📨 FLUJO DE PROCESAMIENTO DE MENSAJES

```
1. Usuario envía mensaje a Telegram
   ↓
2. Telegram envía webhook a Laravel
   POST /api/telegram/webhook/{admin|vendedor}
   ↓
3. TelegramWebhookController recibe mensaje
   ↓
4. Identifica usuario (telegram_id)
   ↓
5. Verifica autenticación y permisos
   ↓
6. Recupera contexto de últimas 5 conversaciones
   ↓
7. Envía a OpenAI:
   - System prompt (según rol)
   - Contexto de conversación
   - Mensaje del usuario
   - Funciones disponibles
   ↓
8. OpenAI procesa y decide:
   a) Responder directamente
   b) Llamar función(es)
   ↓
9. Si llama función:
   - Ejecutar función en Laravel
   - Obtener resultado
   - Enviar resultado a OpenAI
   - OpenAI genera respuesta final
   ↓
10. Enviar respuesta a Telegram
    ↓
11. Guardar conversación en BD
    ↓
12. Actualizar last_interaction_at
```

---

## 🎨 COMANDOS Y UX

### Comandos Básicos
```
/start - Iniciar bot y obtener código de vinculación
/help - Mostrar ayuda y ejemplos de uso
/menu - Mostrar menú de acciones rápidas
/cancel - Cancelar operación actual
/stats - Ver mis estadísticas (vendedor) o del sistema (admin)
```

### Teclados Inline (Menú Vendedor)
```php
[
    [
        ['text' => '👥 Clientes', 'callback_data' => 'menu_clientes'],
        ['text' => '📦 Productos', 'callback_data' => 'menu_productos'],
    ],
    [
        ['text' => '🧾 Presupuestos', 'callback_data' => 'menu_presupuestos'],
        ['text' => '💰 Ventas', 'callback_data' => 'menu_ventas'],
    ],
    [
        ['text' => '📊 Mis Estadísticas', 'callback_data' => 'menu_stats'],
    ],
]
```

### Teclados Inline (Menú Admin)
```php
[
    [
        ['text' => '📈 Reportes', 'callback_data' => 'menu_reportes'],
        ['text' => '📦 Inventario', 'callback_data' => 'menu_inventario'],
    ],
    [
        ['text' => '💰 Finanzas', 'callback_data' => 'menu_finanzas'],
        ['text' => '👥 Usuarios', 'callback_data' => 'menu_usuarios'],
    ],
    [
        ['text' => '⚙️ Sistema', 'callback_data' => 'menu_sistema'],
        ['text' => '🔐 AFIP', 'callback_data' => 'menu_afip'],
    ],
]
```

---

## 🔔 NOTIFICACIONES PROACTIVAS

### Eventos que Disparan Notificaciones

```php
// app/Observers/VentaObserver.php
public function created(Venta $venta)
{
    // Notificar a admin sobre nueva venta
    TelegramNotificationService::notifyAdmins(
        'Nueva Venta',
        "💰 Venta #{$venta->id} - {$venta->cliente->nombre}\nTotal: ${$venta->total}"
    );
}

// app/Observers/InventarioObserver.php
public function updated(Inventario $inventario)
{
    if ($inventario->stock < $inventario->stock_minimo) {
        TelegramNotificationService::notifyAdmins(
            'Stock Bajo',
            "⚠️ {$inventario->articulo->nombre}\nStock: {$inventario->stock}"
        );
    }
}

// app/Console/Commands/CheckAfipCertificates.php
if ($certificateExpiresSoon) {
    TelegramNotificationService::notifyAdmins(
        'Certificado AFIP por Vencer',
        "🔐 El certificado AFIP vence en {$days} días"
    );
}
```

---

## 🧪 TESTING

### Tests Unitarios
```php
// tests/Unit/Services/OpenAIServiceTest.php
test('can process message with function calling')
test('handles function execution correctly')
test('maintains conversation context')

// tests/Unit/Services/TelegramBotServiceTest.php
test('can send message to telegram')
test('can send inline keyboard')
test('handles webhook correctly')
```

### Tests de Integración
```php
// tests/Feature/TelegramAgentTest.php
test('admin can get sales report')
test('vendedor can search client')
test('vendedor cannot access admin functions')
test('unverified user cannot use bot')
```

---

## 🚀 DEPLOYMENT

### 1. Crear Bots en Telegram
```bash
# Hablar con @BotFather
/newbot
# Nombre: EPOS Admin Bot
# Username: epos_admin_bot
# Copiar TOKEN

/newbot
# Nombre: EPOS Vendedor Bot
# Username: epos_vendedor_bot
# Copiar TOKEN
```

### 2. Configurar Variables de Entorno
```bash
# En VPS
nano /var/www/epos-final/.env
# Agregar tokens de Telegram y OpenAI
```

### 3. Ejecutar Migraciones
```bash
php artisan migrate
```

### 4. Configurar Webhooks
```bash
php artisan telegram:setup-webhooks
# Este comando registra los webhooks en Telegram API
```

### 5. Probar Bots
```bash
# En Telegram, buscar @epos_admin_bot y @epos_vendedor_bot
# Enviar /start
```

---

## 📊 ESTIMACIÓN DE COSTOS

### OpenAI API (gpt-4o-mini)
- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens
- Estimado: 100 conversaciones/día × 1000 tokens = **$0.75/día = $22.50/mes**

### Telegram Bot API
- **Gratis** (sin límites)

### Total Estimado
- **~$25/mes** (puede variar según uso)

---

## 📅 ROADMAP DE IMPLEMENTACIÓN

### Semana 1: Infraestructura
- [ ] Crear bots en Telegram
- [ ] Instalar dependencias PHP
- [ ] Crear migraciones de BD
- [ ] Configurar variables de entorno

### Semana 2: Backend Base
- [ ] Crear modelos (TelegramUser, TelegramConversation)
- [ ] Implementar TelegramBotService
- [ ] Implementar OpenAIService
- [ ] Crear controlador de webhooks
- [ ] Configurar rutas API

### Semana 3: Autenticación
- [ ] Implementar TelegramAuthService
- [ ] Crear página de vinculación en React
- [ ] Implementar comando /start
- [ ] Sistema de códigos de verificación

### Semana 4: Funciones Agente Vendedor
- [ ] search_client
- [ ] search_product
- [ ] get_product_stock
- [ ] create_budget
- [ ] get_my_sales

### Semana 5: Funciones Agente Admin
- [ ] get_sales_report
- [ ] get_inventory_status
- [ ] get_financial_report
- [ ] check_afip_status
- [ ] get_user_activity

### Semana 6: UX y Comandos
- [ ] Implementar menús inline
- [ ] Comandos /help, /menu, /stats
- [ ] Mejorar respuestas con formato
- [ ] Agregar emojis y estructura

### Semana 7: Notificaciones
- [ ] Sistema de notificaciones proactivas
- [ ] Observers para eventos
- [ ] Command para envío programado
- [ ] Configuración de preferencias

### Semana 8: Testing y Deploy
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Configurar webhooks en producción
- [ ] Documentación de uso
- [ ] Capacitación a usuarios

---

## 🎯 CRITERIOS DE ÉXITO

- ✅ Usuarios pueden vincular cuenta desde Telegram
- ✅ Agente vendedor responde consultas de productos y clientes
- ✅ Agente vendedor puede crear presupuestos por chat
- ✅ Agente admin genera reportes de ventas
- ✅ Agente admin alerta sobre stock bajo
- ✅ Sistema mantiene contexto de conversación
- ✅ Respuestas en menos de 3 segundos
- ✅ Tasa de error < 5%

---

## 📚 RECURSOS Y REFERENCIAS

- Telegram Bot API: https://core.telegram.org/bots/api
- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
- Laravel Telegram Bot: https://github.com/telegram-bot-sdk/telegram-bot-sdk
- OpenAI PHP: https://github.com/openai-php/laravel

---

## 🔄 PRÓXIMOS PASOS

1. Aprobar plan completo
2. Crear bots en Telegram (@BotFather)
3. Obtener API key de OpenAI
4. Comenzar con Semana 1 del roadmap
5. Iterar y mejorar según feedback

---

**NOTA**: Este plan es flexible y puede ajustarse según necesidades específicas o feedback durante la implementación.
