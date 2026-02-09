# EPOS-Final - Casos de Uso y Criterios de Aceptación para Testing E2E

## 📋 Datos de Prueba (Seeders)

### 👤 Usuarios de Prueba
- **Superadmin**: `superadmin@mail.com` / `asdf1234`
- **Admin**: `admin@mail.com` / `asdf1234`
- **Vendedor**: `vendedor@mail.com` / `asdf1234`
- **Cliente**: `resp.inscripto@test.com` / `asdf1234`

### 🏢 Clientes de Prueba
- **Consumidor Final**: CUIT 0
- **Responsable Inscripto**: CUIT 20000000001
- **Monotributista**: CUIT 20000000002
- **Exento**: CUIT 20000000003
- **Empresa Test SA**: CUIT 30000000001

### 📦 Productos de Prueba
- **LEGO001**: LEGO Classic ($15,999.99)
- **BAR001**: Barbie Fashionista ($8,999.99)
- **HW001**: Hot Wheels Pack 5 Autos ($4,999.99)
- **PEL001**: Peluche Oso Teddy ($12,999.99)
- **DID001**: Rompecabezas Números y Letras ($6,999.99)

---

## 🔐 Epic 1: Autenticación y Autorización

### TC001: Login Exitoso
**Precondiciones**: Usuario registrado en el sistema
**Pasos**:
1. Navegar a `/login`
2. Ingresar email: `superadmin@mail.com`
3. Ingresar password: `asdf1234`
4. Hacer clic en "Iniciar Sesión"

**Criterios de Aceptación**:
- ✅ Redirección a `/dashboard`
- ✅ Mostrar nombre de usuario en header
- ✅ Menú lateral visible según rol

### TC002: Login con Credenciales Incorrectas
**Pasos**:
1. Navegar a `/login`
2. Ingresar email: `admin@mail.com`
3. Ingresar password: `wrongpassword`
4. Hacer clic en "Iniciar Sesión"

**Criterios de Aceptación**:
- ❌ Permanecer en `/login`
- ❌ Mostrar mensaje de error
- ❌ No redireccionar

### TC003: Acceso por Roles
**Pasos**:
1. Login como `vendedor@mail.com`
2. Intentar acceder a `/users`

**Criterios de Aceptación**:
- ❌ Acceso denegado o redirección
- ✅ Solo acceso a funciones de ventas

---

## 👥 Epic 2: Gestión de Clientes

### TC004: Crear Cliente Nuevo
**Precondiciones**: Login como admin o superadmin
**Pasos**:
1. Navegar a `/clientes`
2. Hacer clic en "Nuevo Cliente"
3. Completar formulario:
   - Razón Social: "Test Cliente E2E"
   - CUIT: 20123456789
   - Email: "test@e2e.com"
   - Dirección: "Av. Test 123"
   - Teléfono: "011-1234-5678"
4. Hacer clic en "Guardar"

**Criterios de Aceptación**:
- ✅ Redirección a listado de clientes
- ✅ Toast de éxito visible
- ✅ Cliente aparece en la lista
- ✅ Datos guardados correctamente

### TC005: Consultar CUIT en AFIP
**Pasos**:
1. En formulario de cliente nuevo
2. Ingresar CUIT: 20000000001
3. Hacer clic en botón "Consultar AFIP"

**Criterios de Aceptación**:
- ✅ Campos se completan automáticamente
- ✅ Condición IVA se actualiza
- ✅ Datos fiscales correctos

### TC006: Exportar Estado de Cuenta
**Precondiciones**: Cliente con movimientos
**Pasos**:
1. Ir a `/clientes`
2. Hacer clic en "Ver" en cliente "AFIP Test - Responsable Inscripto"
3. Hacer clic en "Estado de Cuenta"
4. Hacer clic en "Exportar PDF"

**Criterios de Aceptación**:
- ✅ Descarga de archivo PDF
- ✅ PDF contiene datos del cliente
- ✅ Movimientos listados correctamente

---

## 📦 Epic 3: Gestión de Productos

### TC007: Crear Producto Nuevo
**Precondiciones**: Login como admin
**Pasos**:
1. Navegar a `/articulos`
2. Hacer clic en "Nuevo Artículo"
3. Completar formulario:
   - Código: "TEST001"
   - Nombre: "Producto Test E2E"
   - Descripción: "Producto para testing automatizado"
   - Precio: 1000.00
   - Categoría: "Didácticos"
   - Marca: "Mattel"
4. Hacer clic en "Crear"

**Criterios de Aceptación**:
- ✅ Redirección a listado
- ✅ Toast de éxito
- ✅ Producto visible en lista
- ✅ Códigos QR y barras generados automáticamente

### TC008: Generar Códigos QR y Barras
**Precondiciones**: Producto existente
**Pasos**:
1. Ir a `/articulos`
2. Hacer clic en "Ver Detalles" en "LEGO Classic"
3. En panel lateral, hacer clic en "Generar Códigos"
4. Verificar códigos generados
5. Hacer clic en "Imprimir Etiqueta"

**Criterios de Aceptación**:
- ✅ Códigos QR y barras visibles
- ✅ Códigos únicos generados
- ✅ Ventana de impresión se abre
- ✅ Etiqueta con formato correcto

### TC009: Búsqueda de Productos
**Pasos**:
1. Ir a `/articulos`
2. En campo de búsqueda escribir "LEGO"
3. Verificar resultados filtrados

**Criterios de Aceptación**:
- ✅ Solo productos con "LEGO" visibles
- ✅ Búsqueda en tiempo real
- ✅ Resultados actualizados dinámicamente

### TC010: Selección Múltiple e Impresión Masiva
**Pasos**:
1. Ir a `/articulos`
2. Seleccionar checkbox de 3 productos
3. Hacer clic en "Imprimir Etiquetas (3)"
4. Verificar página de impresión

**Criterios de Aceptación**:
- ✅ Botón aparece con contador
- ✅ Página de etiquetas se abre
- ✅ 3 etiquetas visibles
- ✅ Formato optimizado para impresión

---

## 🛒 Epic 4: Proceso de Ventas

### TC011: Crear Venta Completa
**Precondiciones**: Login como vendedor, productos y clientes existentes
**Pasos**:
1. Navegar a `/ventas/create`
2. Seleccionar cliente: "AFIP Test - Responsable Inscripto"
3. Agregar producto usando búsqueda rápida: "LEGO"
4. Seleccionar "LEGO Classic"
5. Verificar precio y cantidad (1)
6. Agregar segundo producto: "Barbie Fashionista"
7. Verificar total calculado
8. Seleccionar método de pago: "Efectivo"
9. Verificar "Crear pago automático"
10. Hacer clic en "Guardar Venta"

**Criterios de Aceptación**:
- ✅ Redirección a listado de ventas
- ✅ Toast de éxito
- ✅ Venta aparece en lista
- ✅ Total calculado correctamente
- ✅ Pago automático creado
- ✅ Stock actualizado

### TC012: Escáner QR en Ventas (Móvil)
**Precondiciones**: Dispositivo móvil o simulación, productos con códigos
**Pasos**:
1. Ir a `/ventas/create` en móvil
2. Hacer clic en botón de cámara (solo visible en móvil)
3. Simular escaneo de código QR de "LEGO001"
4. Verificar producto agregado automáticamente

**Criterios de Aceptación**:
- ✅ Botón cámara visible solo en móvil
- ✅ Escáner se abre correctamente
- ✅ Producto se agrega automáticamente
- ✅ Precio según lista seleccionada
- ✅ Escáner se cierra tras escaneo

### TC013: Conversión Presupuesto a Venta
**Precondiciones**: Presupuesto existente
**Pasos**:
1. Ir a `/presupuestos`
2. Hacer clic en "Ver" en presupuesto existente
3. Hacer clic en "Convertir a Venta"
4. Confirmar conversión

**Criterios de Aceptación**:
- ✅ Redirección a nueva venta
- ✅ Datos copiados correctamente
- ✅ Presupuesto marcado como convertido
- ✅ Venta creada con mismos items

---

## 📊 Epic 5: Gestión de Inventario

### TC014: Crear Entrada de Inventario
**Precondiciones**: Login como admin, productos existentes
**Pasos**:
1. Navegar a `/inventarios/create`
2. Seleccionar artículo: "LEGO Classic"
3. Ingresar cantidad: 50
4. Seleccionar proveedor: "Distribuidora LEGO Argentina"
5. Hacer clic en "Crear"

**Criterios de Aceptación**:
- ✅ Redirección a listado inventarios
- ✅ Toast de éxito (no error)
- ✅ Entrada visible en lista
- ✅ Stock actualizado correctamente

### TC015: Actualizar Stock Existente
**Precondiciones**: Inventario existente
**Pasos**:
1. Ir a `/inventarios`
2. Hacer clic en "Editar" en entrada de "LEGO Classic"
3. Cambiar cantidad de 50 a 75
4. Hacer clic en "Actualizar"

**Criterios de Aceptación**:
- ✅ Toast de éxito correcto
- ✅ Cantidad actualizada en lista
- ✅ Stock reflejado en producto

---

## 🤖 Epic 6: Asistente de Compras IA

### TC016: Procesar PDF con IA
**Precondiciones**: Login como admin, archivo PDF de factura
**Pasos**:
1. Navegar a `/asistente-compras`
2. Hacer clic en "Seleccionar archivo"
3. Subir PDF de factura de prueba
4. Hacer clic en "Procesar Archivo"
5. Esperar procesamiento IA
6. Verificar datos extraídos
7. Hacer clic en "Agregar al Inventario"

**Criterios de Aceptación**:
- ✅ Archivo se sube correctamente
- ✅ IA extrae datos estructurados
- ✅ Items identificados correctamente
- ✅ Productos encontrados marcados en verde
- ✅ Inventario actualizado tras agregar

### TC017: Procesar Foto con OCR
**Precondiciones**: Imagen de factura/remito
**Pasos**:
1. Ir a `/asistente-compras`
2. Hacer clic en "Tomar foto"
3. Subir imagen de factura
4. Procesar con IA
5. Verificar extracción OCR

**Criterios de Aceptación**:
- ✅ OCR extrae texto de imagen
- ✅ IA procesa texto extraído
- ✅ Datos estructurados correctamente
- ✅ Información del proveedor identificada

---

## 🔍 Epic 7: Escáner de Códigos

### TC018: Escáner Independiente
**Pasos**:
1. Navegar a `/scanner`
2. Hacer clic en "Iniciar Escáner"
3. Simular escaneo de código QR "QR00000001"
4. Verificar producto encontrado
5. Hacer clic en "Agregar a Venta"

**Criterios de Aceptación**:
- ✅ Escáner se abre correctamente
- ✅ Código reconocido
- ✅ Producto mostrado con detalles
- ✅ Redirección a crear venta
- ✅ Producto pre-cargado

### TC019: Búsqueda Manual por Código
**Pasos**:
1. Ir a `/scanner`
2. En "Búsqueda Manual" ingresar: "LEGO001"
3. Hacer clic en "Buscar"
4. Verificar resultado

**Criterios de Aceptación**:
- ✅ Producto encontrado por código
- ✅ Detalles completos mostrados
- ✅ Stock actual visible
- ✅ Botones de acción disponibles

---

## 📱 Epic 8: E-commerce (Cliente)

### TC020: Navegación Tienda
**Pasos**:
1. Navegar a `/shop` (sin login)
2. Verificar productos visibles
3. Hacer clic en producto "LEGO Classic"
4. Verificar página de detalle

**Criterios de Aceptación**:
- ✅ Productos listados correctamente
- ✅ Imágenes y precios visibles
- ✅ Página de detalle funcional
- ✅ Información completa del producto

### TC021: Proceso de Compra
**Precondiciones**: Productos en catálogo
**Pasos**:
1. Ir a `/shop`
2. Agregar "LEGO Classic" al carrito
3. Agregar "Barbie Fashionista" al carrito
4. Ir a `/cart`
5. Verificar productos y total
6. Hacer clic en "Proceder al Pago"
7. Login como cliente: `resp.inscripto@test.com`
8. Completar checkout

**Criterios de Aceptación**:
- ✅ Productos se agregan al carrito
- ✅ Total calculado correctamente
- ✅ Proceso de checkout fluido
- ✅ Orden creada exitosamente

---

## ⚙️ Epic 9: Configuración y Administración

### TC022: Gestión de Usuarios (Superadmin)
**Precondiciones**: Login como superadmin
**Pasos**:
1. Navegar a `/users`
2. Hacer clic en "Nuevo Usuario"
3. Completar formulario:
   - Nombre: "Usuario Test E2E"
   - Email: "test.user@e2e.com"
   - Rol: "Vendedor"
4. Hacer clic en "Crear"

**Criterios de Aceptación**:
- ✅ Usuario creado exitosamente
- ✅ Rol asignado correctamente
- ✅ Email único validado
- ✅ Usuario visible en lista

### TC023: Configuración Empresa
**Pasos**:
1. Ir a `/empresa`
2. Actualizar datos de la empresa
3. Subir logo
4. Guardar cambios

**Criterios de Aceptación**:
- ✅ Datos actualizados
- ✅ Logo subido correctamente
- ✅ Cambios reflejados en facturas

---

## 📊 Epic 10: Reportes y Exportaciones

### TC024: Dashboard Métricas
**Precondiciones**: Datos de ventas existentes
**Pasos**:
1. Ir a `/dashboard`
2. Verificar métricas mostradas
3. Hacer clic en "Exportar Dashboard"

**Criterios de Aceptación**:
- ✅ Métricas calculadas correctamente
- ✅ Gráficos visibles
- ✅ Exportación Excel funcional
- ✅ Datos coherentes

### TC025: Reporte de Ventas
**Pasos**:
1. Ir a `/ventas`
2. Aplicar filtros de fecha
3. Verificar resultados filtrados
4. Exportar reporte

**Criterios de Aceptación**:
- ✅ Filtros funcionan correctamente
- ✅ Datos filtrados precisos
- ✅ Exportación exitosa
- ✅ Formato correcto

---

## 🔧 Epic 11: Funcionalidades Móviles

### TC026: Responsividad General
**Pasos**:
1. Acceder desde dispositivo móvil
2. Navegar por diferentes secciones
3. Verificar usabilidad

**Criterios de Aceptación**:
- ✅ Layout adaptado a móvil
- ✅ Menú hamburguesa funcional
- ✅ Botones accesibles
- ✅ Texto legible

### TC027: Funciones Específicas Móvil
**Pasos**:
1. Usar escáner QR en ventas
2. Tomar foto en asistente compras
3. Verificar funcionalidad cámara

**Criterios de Aceptación**:
- ✅ Cámara se activa correctamente
- ✅ Permisos solicitados apropiadamente
- ✅ Funcionalidad específica móvil

---

## 🚨 Epic 12: Manejo de Errores

### TC028: Validaciones de Formularios
**Pasos**:
1. Intentar crear cliente sin datos obligatorios
2. Verificar mensajes de error
3. Completar campos y reenviar

**Criterios de Aceptación**:
- ❌ Formulario no se envía
- ❌ Errores mostrados claramente
- ✅ Validación en tiempo real
- ✅ Envío exitoso tras corrección

### TC029: Manejo de Errores de Red
**Pasos**:
1. Simular pérdida de conexión
2. Intentar operación
3. Verificar mensaje de error
4. Restaurar conexión y reintentar

**Criterios de Aceptación**:
- ❌ Error de red mostrado
- ❌ Operación no completada
- ✅ Reintento exitoso tras restaurar conexión

---

## 📋 Configuración para Testing E2E

### Variables de Entorno
```env
APP_URL=http://localhost:3000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=epos_test
DB_USERNAME=root
DB_PASSWORD=
```

### Comandos de Preparación
```bash
# Preparar base de datos de testing
php artisan migrate:fresh --seed --env=testing

# Limpiar cache
php artisan config:clear
php artisan cache:clear

# Generar códigos para productos existentes
php artisan tinker
>>> App\Models\Articulo::all()->each(fn($a) => app(App\Services\CodigoService::class)->generarEtiquetaCompleta($a))
```

### Datos de Prueba Específicos
- **URL Base**: `http://localhost:3000`
- **Timeout**: 30 segundos para operaciones IA
- **Archivos de Prueba**: Incluir PDFs y imágenes de facturas en `/tests/fixtures/`
- **Códigos QR de Prueba**: Generar automáticamente al ejecutar seeders

### Consideraciones Especiales
1. **AFIP Testing**: Usar CUITs de homologación
2. **IA/OCR**: Mockear respuestas para testing consistente
3. **Archivos**: Usar fixtures predefinidos
4. **Cámara**: Simular con archivos de prueba
5. **Timeouts**: Ajustar para operaciones de IA

---

## 🎯 Métricas de Éxito

- **Cobertura**: 100% de funcionalidades críticas
- **Tiempo de Ejecución**: < 15 minutos suite completa
- **Estabilidad**: 95% de tests pasan consistentemente
- **Compatibilidad**: Chrome, Firefox, Safari, Mobile

Este documento proporciona una base sólida para implementar testing E2E automatizado con Playwright, cubriendo todos los flujos críticos del sistema EPOS-Final.