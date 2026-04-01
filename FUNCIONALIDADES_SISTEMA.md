# EPOS — Sistema de Gestión Comercial
## Documentación de Funcionalidades

> Sistema integral de Punto de Venta y Gestión Comercial para el mercado argentino, con soporte multitenant, facturación electrónica AFIP y ecommerce integrado.

---

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Módulos Principales](#módulos-principales)
4. [Flujos de Negocio](#flujos-de-negocio)
5. [Integraciones Externas](#integraciones-externas)
6. [Roles y Permisos](#roles-y-permisos)
7. [Modelo de Datos](#modelo-de-datos)
8. [Multitenant](#multitenant)
9. [Stack Tecnológico](#stack-tecnológico)

---

## Visión General

EPOS es una plataforma SaaS diseñada para empresas argentinas que requieren:

- Gestión completa del ciclo de ventas
- Facturación electrónica con autorización AFIP
- Control de inventario en tiempo real
- Ecommerce con pagos online (MercadoPago)
- Soporte multi-empresa con bases de datos aisladas
- Asistentes de IA para automatización de procesos

```mermaid
mindmap
  root((EPOS))
    Ventas
      Presupuestos
      Facturas Electrónicas
      Pagos
      Entregas
    Inventario
      Artículos
      Categorías y Marcas
      Movimientos de Stock
      Códigos de Barra / QR
    Compras
      Proveedores
      Órdenes de Compra
      Remitos
    Clientes
      Gestión de Cuentas
      Estado de Cuenta
      Portal del Cliente
    Ecommerce
      Catálogo Online
      Carrito
      Checkout MercadoPago
    Administración
      Usuarios y Roles
      Configuración de Empresa
      Log de Actividad
      Reportes
    IA y Automatización
      Asistente de Compras
      Bots de Telegram
      Procesamiento OCR
```

---

## Arquitectura del Sistema

### Arquitectura General

```mermaid
graph TB
    subgraph "Frontend (React + Inertia.js)"
        UI[React 19 + TypeScript]
        UI --> Tailwind[Tailwind CSS 4]
        UI --> Radix[Radix UI Components]
    end

    subgraph "Backend (Laravel 12)"
        API[Controllers]
        Services[Services Layer]
        Models[Eloquent Models]
        API --> Services
        Services --> Models
    end

    subgraph "Base de Datos"
        CentralDB[(Central DB\nTenants + Admin)]
        TenantDB1[(Tenant DB\nEmpresa A)]
        TenantDB2[(Tenant DB\nEmpresa B)]
        TenantDBN[(Tenant DB\nEmpresa N...)]
    end

    subgraph "Integraciones Externas"
        AFIP[AFIP\nWebService]
        MP[MercadoPago\nPayments]
        TG[Telegram\nBots]
        LLM[LLM\nOllama / Groq / OpenAI]
    end

    UI <-->|Inertia.js / SSR| API
    Models --> CentralDB
    Models --> TenantDB1
    Models --> TenantDB2
    Models --> TenantDBN
    Services --> AFIP
    Services --> MP
    Services --> TG
    Services --> LLM
```

### Flujo de Peticiones

```mermaid
sequenceDiagram
    actor Usuario
    participant Browser
    participant Laravel
    participant TenancyMiddleware
    participant Controller
    participant Service
    participant DB

    Usuario->>Browser: Navega a empresa.epos.app
    Browser->>Laravel: HTTP Request
    Laravel->>TenancyMiddleware: Inicializa tenant por dominio
    TenancyMiddleware->>DB: Conecta a DB del tenant
    TenancyMiddleware->>Controller: Despacha request
    Controller->>Service: Lógica de negocio
    Service->>DB: Consulta / Escritura
    DB-->>Service: Resultados
    Service-->>Controller: Datos procesados
    Controller-->>Browser: Inertia Response (JSON/HTML)
    Browser-->>Usuario: Renderiza React
```

---

## Módulos Principales

### 1. Módulo de Ventas

Gestión completa del ciclo de ventas desde el presupuesto hasta la entrega.

```mermaid
stateDiagram-v2
    [*] --> Presupuesto: Cliente solicita cotización
    Presupuesto --> Factura: Conversión a factura
    Presupuesto --> [*]: Cancelado
    Factura --> Pago: Registro de pago
    Factura --> Entrega: Programar entrega
    Pago --> Factura: Pago parcial
    Pago --> Cerrada: Pago total
    Entrega --> Completada: Entrega confirmada
    Cerrada --> [*]
    Completada --> [*]
```

**Funcionalidades:**

| Funcionalidad | Descripción |
|---|---|
| Presupuestos | Crear y enviar cotizaciones a clientes |
| Facturas Electrónicas | Generación de Facturas A/B con autorización CAE AFIP |
| Tipos de Comprobante | Factura A, B, Nota de Débito, Nota de Crédito |
| Pagos Parciales | Registrar abonos sucesivos hasta cancelar la deuda |
| Entregas | Programar y confirmar entregas de mercadería |
| PDF Automático | Generación de comprobantes en PDF con formato AFIP |
| Conversión | Flujo Presupuesto → Factura → Entrega en un clic |

---

### 2. Módulo de Clientes

```mermaid
graph LR
    subgraph "Gestión de Clientes"
        Alta[Alta de Cliente]
        Alta -->|CUIT| AFIP_LKP[Consulta AFIP\nAutocompletado]
        AFIP_LKP --> Perfil[Perfil del Cliente]
        Perfil --> EC[Estado de Cuenta]
        Perfil --> Facturas[Historial de Facturas]
        Perfil --> Pagos[Historial de Pagos]
        EC --> Excel[Exportar Excel]
        EC --> PDF_EC[Exportar PDF]
    end
```

**Funcionalidades:**

| Funcionalidad | Descripción |
|---|---|
| CRUD Completo | Alta, baja, modificación y listado de clientes |
| Consulta AFIP por CUIT | Auto-relleno de datos fiscales desde AFIP |
| Condición IVA | Responsable Inscripto, Consumidor Final, Monotributista, etc. |
| Estado de Cuenta | Saldo, deudas y movimientos por período |
| Exportación | Exportar estado de cuenta a Excel y PDF |
| Portal del Cliente | Acceso limitado para que el cliente vea su cuenta |

---

### 3. Módulo de Artículos e Inventario

```mermaid
graph TD
    Articulo[Artículo]
    Articulo --> Categoria[Categoría]
    Articulo --> Marca[Marca]
    Articulo --> Imagenes[Imágenes Múltiples]
    Articulo --> Inventario[Stock Actual]
    Articulo --> Precios[Listas de Precios]
    Articulo --> Codigos[Código de Barra / QR]

    subgraph "Movimientos de Inventario"
        Inventario --> Entrada[+ Remito de Compra]
        Inventario --> Salida[- Factura de Venta]
        Inventario --> Ajuste[± Ajuste Manual]
    end
```

**Funcionalidades:**

| Funcionalidad | Descripción |
|---|---|
| Catálogo de Artículos | Creación y gestión con descripción, código, precio base |
| Imágenes Múltiples | Soporte para varias fotos por producto con imagen principal |
| Categorías y Marcas | Organización jerárquica del catálogo |
| Control de Stock | Stock actual, mínimo, y alertas de reposición |
| Códigos de Barra | Generación e impresión de etiquetas con barcode/QR |
| Scanner Integrado | Interfaz de escaneo para alta velocidad en ventas |
| Movimientos | Trazabilidad completa de entradas y salidas |

---

### 4. Módulo de Listas de Precios

```mermaid
graph LR
    ListaPrecio1[Lista VIP]
    ListaPrecio2[Lista Mayorista]
    ListaPrecio3[Lista Minorista]

    Articulo1[Artículo A] -->|precio_1| ListaPrecio1
    Articulo1 -->|precio_2| ListaPrecio2
    Articulo1 -->|precio_3| ListaPrecio3

    Articulo2[Artículo B] -->|precio_1| ListaPrecio1
    Articulo2 -->|precio_2| ListaPrecio2

    Cliente1[Cliente Premium] --> ListaPrecio1
    Cliente2[Distribuidor] --> ListaPrecio2
    Cliente3[Público General] --> ListaPrecio3
```

**Funcionalidades:**

| Funcionalidad | Descripción |
|---|---|
| Múltiples Listas | Crear N listas de precios diferenciadas |
| Precio por Artículo | Precio independiente por artículo en cada lista |
| Actualización Masiva | Subir / bajar precios por porcentaje en toda la lista |
| Asignación a Clientes | Vincular una lista de precios a cada cliente |

---

### 5. Módulo de Compras y Proveedores

```mermaid
stateDiagram-v2
    [*] --> Proveedor: Alta de proveedor
    Proveedor --> OrdenCompra: Crear orden de compra
    OrdenCompra --> Remito: Recepción de mercadería
    Remito --> Inventario: Conversión automática a stock
    Remito --> FacturaCompra: Registrar factura del proveedor
    FacturaCompra --> [*]
    Inventario --> [*]
```

**Funcionalidades:**

| Funcionalidad | Descripción |
|---|---|
| Gestión de Proveedores | Alta y mantenimiento de proveedores |
| Órdenes de Compra | Crear y seguir órdenes de compra |
| Remitos | Registrar recepciones de mercadería |
| Stock Automático | El remito actualiza el inventario automáticamente |
| Asistente IA | Extrae datos de facturas PDF del proveedor con OCR |

---

### 6. Módulo de Ecommerce

```mermaid
sequenceDiagram
    actor Cliente
    participant Tienda
    participant Carrito
    participant Checkout
    participant MercadoPago
    participant Sistema

    Cliente->>Tienda: Navega catálogo
    Cliente->>Carrito: Agrega productos
    Cliente->>Checkout: Inicia compra
    Checkout->>Cliente: Formulario datos personales
    Cliente->>Checkout: Completa datos + tarjeta
    Checkout->>MercadoPago: Procesa pago
    MercadoPago-->>Checkout: Pago aprobado
    Checkout->>Sistema: Crea Factura automática
    Checkout->>Sistema: Programa Entrega
    Sistema-->>Cliente: Confirmación por email
```

**Funcionalidades:**

| Funcionalidad | Descripción |
|---|---|
| Tienda Online | Catálogo público de productos con imágenes y precios |
| Carrito de Compras | Carrito persistente por sesión/usuario |
| Checkout Multi-paso | Datos personales → Pago → Confirmación |
| MercadoPago | Tarjetas de crédito/débito con cuotas |
| Auto-registro | Crea al cliente en el sistema si es nuevo |
| Factura Automática | Genera la factura internamente al aprobar el pago |

---

### 7. Módulo de Administración

```mermaid
graph TD
    Admin[Panel Administración]
    Admin --> Dashboard[Dashboard Ejecutivo]
    Admin --> Usuarios[Gestión de Usuarios]
    Admin --> Roles[Roles y Permisos]
    Admin --> Empresa[Datos de Empresa]
    Admin --> AFIP_Config[Certificados AFIP]
    Admin --> ActivityLog[Log de Actividad]
    Admin --> Reportes[Reportes y Exports]

    Dashboard --> Metricas[Métricas de Ventas]
    Dashboard --> TopProductos[Top Productos]
    Dashboard --> Vendedores[Performance Vendedores]
    Dashboard --> Graficos[Gráficos Diarios/Mensuales]
```

**Funcionalidades:**

| Funcionalidad | Descripción |
|---|---|
| Dashboard | KPIs de ventas, productos más vendidos, comparativas |
| Usuarios | Alta, baja y modificación de usuarios del sistema |
| Roles | Asignar permisos por rol (Superadmin/Admin/Vendedor/Cliente) |
| Datos de Empresa | Razón social, CUIT, domicilio, condición fiscal |
| Certificados AFIP | Subir y validar certificados digitales `.pfx` |
| Audit Log | Registro completo de todas las acciones del sistema |
| Exportaciones | Excel con datos de ventas, inventario y cuentas |

---

## Flujos de Negocio

### Ciclo de Venta Completo

```mermaid
flowchart TD
    A([Inicio]) --> B[Cliente solicita presupuesto]
    B --> C[Vendedor crea Presupuesto]
    C --> D{¿Cliente aprueba?}
    D -->|No| E([Cancelado])
    D -->|Sí| F[Convertir a Factura]
    F --> G{¿Tipo de cliente?}
    G -->|Responsable Inscripto| H[Factura A]
    G -->|Consumidor Final / Mono| I[Factura B]
    H --> J[Solicitar CAE a AFIP]
    I --> J
    J --> K[Generar PDF]
    K --> L[Registrar Pago]
    L --> M{¿Pago completo?}
    M -->|Parcial| L
    M -->|Total| N[Factura Cerrada]
    N --> O[Programar Entrega]
    O --> P[Confirmar Entrega]
    P --> Q([Proceso Finalizado])
```

### Flujo de Compra Online

```mermaid
flowchart LR
    A([Visita tienda]) --> B[Navega catálogo]
    B --> C[Agrega al carrito]
    C --> D[Checkout]
    D --> E[Datos personales]
    E --> F[Datos de pago]
    F --> G[MercadoPago procesa]
    G --> H{Resultado}
    H -->|Aprobado| I[Crear Factura]
    H -->|Rechazado| J[Reintentar]
    H -->|Pendiente| K[Esperar confirmación]
    I --> L[Actualizar inventario]
    L --> M[Enviar confirmación]
    M --> N([Compra completada])
```

### Recepción de Mercadería

```mermaid
flowchart TD
    A([Llega mercadería]) --> B[Crear Remito]
    B --> C[Seleccionar proveedor]
    C --> D[Cargar artículos y cantidades]
    D --> E{¿Usar Asistente IA?}
    E -->|Sí| F[Subir factura PDF del proveedor]
    F --> G[OCR extrae datos automáticamente]
    G --> H[Revisar y confirmar datos]
    E -->|No| H
    H --> I[Confirmar remito]
    I --> J[Stock actualizado automáticamente]
    J --> K([Proceso finalizado])
```

---

## Integraciones Externas

```mermaid
graph TB
    EPOS[Sistema EPOS]

    subgraph "AFIP"
        AFIP_CAE[Autorización CAE\nFacturas Electrónicas]
        AFIP_CUIT[Consulta por CUIT\nDatos del contribuyente]
        AFIP_CERT[Certificados Digitales\nPKCS-12 .pfx]
    end

    subgraph "MercadoPago"
        MP_TOKEN[Tokenización de tarjeta]
        MP_PAYMENT[Procesamiento de pago]
        MP_WEBHOOK[Webhooks de estado]
        MP_CUOTAS[Cuotas e intereses]
    end

    subgraph "Telegram"
        TG_ADMIN[Bot Administrador]
        TG_VENDEDOR[Bot Vendedor]
        TG_AUTH[Autenticación por código]
    end

    subgraph "IA / LLM"
        OLLAMA[Ollama\nLocal / Self-hosted]
        GROQ[Groq API\nInferencia rápida]
        OPENAI[OpenAI\nGPT-4o-mini]
    end

    EPOS <--> AFIP_CAE
    EPOS <--> AFIP_CUIT
    EPOS --- AFIP_CERT
    EPOS <--> MP_TOKEN
    EPOS <--> MP_PAYMENT
    MP_WEBHOOK --> EPOS
    EPOS <--> TG_ADMIN
    EPOS <--> TG_VENDEDOR
    TG_AUTH --> EPOS
    EPOS <--> OLLAMA
    EPOS <--> GROQ
    EPOS <--> OPENAI
```

### AFIP

| Funcionalidad | Descripción |
|---|---|
| Autorización CAE | Obtiene el Código de Autorización Electrónica para cada factura |
| Tipos de Factura | Determina automáticamente si emitir Factura A o B |
| Consulta CUIT | Obtiene razón social, domicilio y condición fiscal desde AFIP |
| Certificados | Gestión de certificados digitales `.pfx` para firma electrónica |
| Desglose IVA | Calcula y desglosa correctamente las alícuotas de IVA |
| Modos | Soporte para ambiente de homologación (testing) y producción |

### MercadoPago

| Funcionalidad | Descripción |
|---|---|
| Tokenización | El SDK de MercadoPago tokeniza los datos de tarjeta en el browser |
| Pago Seguro | Los datos de tarjeta nunca pasan por los servidores propios |
| Cuotas | Soporte para pagos en cuotas según el banco emisor |
| Webhooks | Actualización automática del estado del pago |
| Referencias | Cada pago MP está vinculado a la factura interna |

### Telegram Bots + IA

| Funcionalidad | Descripción |
|---|---|
| Bot Admin | Alertas de stock, resúmenes de ventas, aprobaciones pendientes |
| Bot Vendedor | Consultas de clientes, registro rápido de pedidos |
| Autenticación | Vinculación de cuenta con código de verificación |
| Function Calling | Los bots pueden ejecutar acciones reales en el sistema |
| Historial | Conversaciones guardadas con contexto persistente |
| Proveedores LLM | Configurable: Ollama (local), Groq, OpenAI |

---

## Roles y Permisos

```mermaid
graph TD
    SA[Superadmin]
    AD[Admin]
    VE[Vendedor]
    CL[Cliente]

    SA -->|incluye| AD
    AD -->|incluye| VE

    subgraph "Solo Superadmin"
        P1[Gestión de usuarios]
        P2[Configuración de empresa]
        P3[Certificados AFIP]
        P4[Log de actividad]
        P5[Gestión de roles]
        P6[Panel multitenant]
    end

    subgraph "Admin y Superadmin"
        P7[Gestión de artículos]
        P8[Gestión de inventario]
        P9[Gestión de proveedores]
        P10[Órdenes de compra y remitos]
        P11[Listas de precios]
        P12[Generación de códigos/etiquetas]
        P13[Reportes y exportaciones]
    end

    subgraph "Vendedor en adelante"
        P14[Gestión de clientes]
        P15[Crear presupuestos y facturas]
        P16[Registrar pagos]
        P17[Programar entregas]
        P18[Consultar dashboard]
        P19[Asistente de compras]
    end

    subgraph "Solo Cliente"
        P20[Ver sus propias facturas]
        P21[Estado de su cuenta]
        P22[Historial de entregas]
    end

    SA --- P1
    SA --- P2
    SA --- P3
    SA --- P4
    SA --- P5
    SA --- P6
    AD --- P7
    AD --- P8
    AD --- P9
    AD --- P10
    AD --- P11
    AD --- P12
    AD --- P13
    VE --- P14
    VE --- P15
    VE --- P16
    VE --- P17
    VE --- P18
    VE --- P19
    CL --- P20
    CL --- P21
    CL --- P22
```

---

## Modelo de Datos

### Entidades Principales

```mermaid
erDiagram
    CLIENTE {
        int id
        string razon_social
        string cuit
        string condicion_iva
        string email
        string telefono
        int lista_precio_id
    }

    FACTURA {
        int id
        int cliente_id
        string tipo
        string numero
        string cae
        decimal total
        string estado
        date fecha
    }

    FACTURA_DETALLE {
        int id
        int factura_id
        int articulo_id
        int cantidad
        decimal precio_unitario
        decimal alicuota_iva
    }

    ARTICULO {
        int id
        string nombre
        string codigo
        string descripcion
        int categoria_id
        int marca_id
        decimal precio_base
        int stock_actual
        int stock_minimo
    }

    INVENTARIO {
        int id
        int articulo_id
        int cantidad
        string tipo_movimiento
        string referencia
    }

    PAGO {
        int id
        int factura_id
        decimal monto
        string metodo
        date fecha
    }

    ENTREGA {
        int id
        int factura_id
        date fecha_programada
        string estado
        string direccion
    }

    PRESUPUESTO {
        int id
        int cliente_id
        decimal total
        string estado
        date fecha_vencimiento
    }

    SUPPLIER {
        int id
        string razon_social
        string cuit
        string email
    }

    REMITO {
        int id
        int supplier_id
        date fecha
        string estado
    }

    LISTA_PRECIO {
        int id
        string nombre
        string descripcion
    }

    CLIENTE ||--o{ FACTURA : "tiene"
    CLIENTE ||--o{ PRESUPUESTO : "tiene"
    CLIENTE }o--|| LISTA_PRECIO : "usa"
    FACTURA ||--o{ FACTURA_DETALLE : "contiene"
    FACTURA ||--o{ PAGO : "recibe"
    FACTURA ||--o| ENTREGA : "genera"
    ARTICULO ||--o{ FACTURA_DETALLE : "incluido en"
    ARTICULO ||--o{ INVENTARIO : "mueve"
    ARTICULO }o--o{ LISTA_PRECIO : "tiene precio en"
    SUPPLIER ||--o{ REMITO : "envía"
    REMITO ||--o{ INVENTARIO : "genera"
```

---

## Multitenant

Cada empresa utiliza el sistema con datos completamente aislados.

```mermaid
graph TB
    subgraph "Plataforma EPOS (Central)"
        CentralAdmin[Panel de Administración Central]
        CentralDB[(Base de Datos Central\ntenants + dominios)]
        CentralAdmin --> CentralDB
    end

    subgraph "Empresa A — empresa-a.epos.app"
        TenantA_App[Aplicación EPOS]
        TenantA_DB[(DB Empresa A\nclientes, productos, facturas...)]
        TenantA_App --> TenantA_DB
    end

    subgraph "Empresa B — empresa-b.epos.app"
        TenantB_App[Aplicación EPOS]
        TenantB_DB[(DB Empresa B\nclientes, productos, facturas...)]
        TenantB_App --> TenantB_DB
    end

    subgraph "Empresa N — empresa-n.epos.app"
        TenantN_App[Aplicación EPOS]
        TenantN_DB[(DB Empresa N\n...)]
        TenantN_App --> TenantN_DB
    end

    CentralDB -->|registra| TenantA_App
    CentralDB -->|registra| TenantB_App
    CentralDB -->|registra| TenantN_App
```

**Características del modelo multitenant:**

| Característica | Detalle |
|---|---|
| Aislamiento de datos | Cada empresa tiene su propia base de datos MySQL |
| Ruteo por dominio | `empresa.epos.app` determina el tenant activo |
| Configuración independiente | Cada empresa configura sus propios certificados AFIP, logo, etc. |
| Escalabilidad | Se pueden agregar N empresas sin afectar a las otras |
| Administración central | Panel separado para gestión de tenants y facturación SaaS |

---

## Stack Tecnológico

```mermaid
graph LR
    subgraph "Frontend"
        React[React 19]
        TS[TypeScript]
        Tailwind[Tailwind CSS 4]
        Radix[Radix UI]
        Inertia[Inertia.js]
        Vite[Vite]
        Charts[Chart.js]
    end

    subgraph "Backend"
        Laravel[Laravel 12]
        PHP[PHP 8.2+]
        Sanctum[Laravel Sanctum]
        Tenancy[Stancl Tenancy]
        Pest[Pest Tests]
    end

    subgraph "Infraestructura"
        MySQL[(MySQL)]
        Docker[Docker]
        Nginx[Nginx]
    end

    subgraph "Servicios IA"
        Ollama[Ollama\nLocal LLM]
        Groq[Groq API]
        OpenAI[OpenAI]
        Tesseract[Tesseract OCR]
    end

    React --- TS
    React --- Tailwind
    React --- Radix
    React --- Inertia
    React --- Vite

    Laravel --- PHP
    Laravel --- Sanctum
    Laravel --- Tenancy
    Laravel --- Pest

    Laravel --- MySQL
    Docker --- Laravel
    Docker --- MySQL
    Docker --- Nginx

    Laravel --- Ollama
    Laravel --- Groq
    Laravel --- OpenAI
    Laravel --- Tesseract
```

### Resumen de Tecnologías

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework Backend | Laravel | 12 |
| Lenguaje Backend | PHP | 8.2+ |
| Framework Frontend | React | 19 |
| Tipado Frontend | TypeScript | 5.x |
| Bridge SSR | Inertia.js | 2.x |
| CSS | Tailwind CSS | 4.x |
| Componentes UI | Radix UI | latest |
| Base de Datos | MySQL | 8.x |
| Autenticación | Laravel Sanctum | — |
| Multitenant | Stancl/Tenancy | 3.9 |
| Testing PHP | Pest | 3.x |
| Build Tool | Vite | 6.x |
| Contenedores | Docker + Compose | — |

---

## Asistente de Compras (IA)

Módulo que utiliza OCR e Inteligencia Artificial para automatizar la carga de facturas de proveedores.

```mermaid
flowchart LR
    A[Subir PDF\nfactura proveedor] --> B[Extracción de texto\nPDF Parser]
    B --> C{¿Texto extraído\ncorrectamente?}
    C -->|Sí| D[Enviar texto a LLM]
    C -->|No| E[OCR con Tesseract]
    E --> D
    D --> F[LLM estructura datos\nJSON estructurado]
    F --> G[Pre-completar formulario\nde remito automáticamente]
    G --> H[Usuario revisa\ny confirma]
    H --> I[Crear remito\nen el sistema]
```

**Resultado:** Reducción drástica del tiempo de carga de facturas de proveedores, eliminando la digitación manual de líneas de artículos, cantidades y precios.

---

*Documentación generada para EPOS v1.0 — Sistema de Gestión Comercial para el mercado argentino.*
