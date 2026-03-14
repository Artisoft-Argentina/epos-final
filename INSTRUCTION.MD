# INSTRUCTION.MD — Especificación completa del sistema EPOS

> Documento de referencia para construir el sistema EPOS desde cero con **NestJS (backend, arquitectura hexagonal)** y **React (frontend, componentes standalone)**. El backend expone una API REST; el frontend la consume. No usar Inertia.js ni SSR.

---

## 1. DESCRIPCIÓN DEL SISTEMA

**EPOS** es un sistema de gestión comercial (POS + ERP) diseñado para empresas argentinas. Incluye:

- Punto de venta (POS) con soporte de listas de precios y scanner QR
- Facturación electrónica integrada con AFIP (CAE)
- Gestión de stock e inventarios
- Presupuestos, remitos y compras a proveedores
- Estado de cuenta de clientes
- E-commerce con carrito y pago por MercadoPago
- Panel central multi-tenant para administrar múltiples empresas
- Bots de Telegram para consultas rápidas
- Asistente IA integrado
- Dashboard con métricas y gráficos

**Arquitectura multi-tenant:** cada empresa tiene su propia base de datos aislada, identificada por subdominio (ej: `empresa1.epos.com`). El panel central corre en el dominio raíz.

---

## 2. STACK TECNOLÓGICO TARGET

### Backend
- **Runtime:** Node.js 20+
- **Framework:** NestJS 10+
- **Lenguaje:** TypeScript strict
- **ORM:** TypeORM (o Prisma)
- **Base de datos:** PostgreSQL (una BD por tenant + una BD central)
- **Autenticación:** JWT con refresh tokens
- **Validación:** class-validator + class-transformer
- **Documentación:** Swagger / OpenAPI
- **Multi-tenancy:** middleware propio que cambia DataSource según subdominio

### Frontend
- **Framework:** React 19 con TypeScript
- **Router:** React Router v6
- **State server:** TanStack Query (React Query)
- **State UI:** Zustand
- **Forms:** React Hook Form + Zod
- **HTTP:** Axios con interceptores JWT
- **UI:** shadcn/ui + Tailwind CSS
- **Iconos:** Lucide React
- **Gráficos:** Chart.js + react-chartjs-2
- **Notificaciones:** Sonner (toast)
- **QR Scanner:** html5-qrcode
- **Pagos:** MercadoPago SDK React

---

## 3. ARQUITECTURA DEL BACKEND — Hexagonal (Ports & Adapters)

```
backend/
└── src/
    ├── modules/
    │   ├── auth/
    │   │   ├── domain/
    │   │   │   ├── entities/user.entity.ts
    │   │   │   ├── value-objects/email.vo.ts
    │   │   │   └── repositories/user.repository.interface.ts
    │   │   ├── application/
    │   │   │   ├── use-cases/login.use-case.ts
    │   │   │   ├── use-cases/refresh-token.use-case.ts
    │   │   │   └── dtos/login.dto.ts
    │   │   ├── infrastructure/
    │   │   │   ├── persistence/typeorm-user.repository.ts
    │   │   │   └── http/auth.controller.ts
    │   │   └── auth.module.ts
    │   ├── ventas/
    │   │   ├── domain/
    │   │   │   ├── entities/factura.entity.ts
    │   │   │   ├── entities/factura-pago.entity.ts
    │   │   │   └── repositories/factura.repository.interface.ts
    │   │   ├── application/
    │   │   │   ├── use-cases/crear-venta.use-case.ts
    │   │   │   ├── use-cases/autorizar-afip.use-case.ts
    │   │   │   ├── use-cases/registrar-pago.use-case.ts
    │   │   │   └── dtos/
    │   │   ├── infrastructure/
    │   │   │   ├── persistence/
    │   │   │   └── http/venta.controller.ts
    │   │   └── ventas.module.ts
    │   ├── articulos/
    │   ├── clientes/
    │   ├── presupuestos/
    │   ├── entregas/
    │   ├── inventarios/
    │   ├── remitos/
    │   ├── compras/
    │   ├── listas-precios/
    │   ├── empresa/
    │   ├── usuarios/
    │   ├── roles/
    │   ├── dashboard/
    │   ├── afip/
    │   ├── mercadopago/
    │   ├── telegram/
    │   ├── chat-ia/
    │   ├── ecommerce/
    │   └── tenancy/           ← panel central, gestión de tenants
    ├── shared/
    │   ├── domain/
    │   │   ├── value-objects/cuit.vo.ts
    │   │   └── pagination.ts
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts
    │   │   ├── roles.guard.ts
    │   │   └── tenant.guard.ts
    │   ├── decorators/
    │   │   ├── roles.decorator.ts
    │   │   └── current-user.decorator.ts
    │   ├── interceptors/
    │   │   └── tenant.interceptor.ts
    │   └── middleware/
    │       └── tenant-context.middleware.ts
    └── main.ts
```

### Convenciones de arquitectura limpia

**Capa Domain** — no importa nada de NestJS, TypeORM ni librerías externas:
```typescript
// modules/ventas/domain/entities/factura.entity.ts
export class Factura {
  constructor(
    public readonly id: number,
    public ptoventa: number,
    public letracomprobante: string,
    public numfactura: number,
    public total: number,
    public pagada: 'SI' | 'NO',
    public autorizada_afip: boolean,
    // ... demás campos
  ) {}

  calcularTotal(recargo: number, descuento: number, subtotal: number): number {
    return subtotal + recargo - descuento;
  }

  puedeEditarse(): boolean {
    return !this.autorizada_afip;
  }

  estaCompleta(): boolean {
    return this.pagada === 'SI';
  }
}

// modules/ventas/domain/repositories/factura.repository.interface.ts
export interface IFacturaRepository {
  findById(id: number): Promise<Factura | null>;
  findAll(filters: FacturaFilters): Promise<PaginatedResult<Factura>>;
  save(factura: Factura): Promise<Factura>;
  delete(id: number): Promise<void>;
}
```

**Capa Application** — orquesta la lógica, no conoce HTTP ni ORM:
```typescript
// modules/ventas/application/use-cases/crear-venta.use-case.ts
@Injectable()
export class CrearVentaUseCase {
  constructor(
    @Inject('IFacturaRepository') private facturas: IFacturaRepository,
    @Inject('IInventarioRepository') private inventarios: IInventarioRepository,
    @Inject('IInitialSettingRepository') private settings: IInitialSettingRepository,
  ) {}

  async execute(dto: CrearVentaDto, userId: number): Promise<Factura> {
    const setting = await this.settings.findFirst();
    const numfactura = setting.numfactura + 1;
    // ... lógica de negocio
  }
}
```

**Capa Infrastructure** — adaptadores HTTP y persistencia:
```typescript
// modules/ventas/infrastructure/http/venta.controller.ts
@Controller('api/ventas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VentaController {
  constructor(private readonly crearVenta: CrearVentaUseCase) {}

  @Post()
  @Roles('admin', 'superadmin', 'vendedor')
  async create(@Body() dto: CrearVentaHttpDto, @CurrentUser() user: JwtPayload) {
    return this.crearVenta.execute(dto, user.id);
  }
}
```

---

## 4. ARQUITECTURA DEL FRONTEND

```
frontend/
└── src/
    ├── modules/
    │   ├── auth/
    │   │   ├── pages/LoginPage.tsx
    │   │   ├── hooks/useAuth.ts
    │   │   └── services/auth.service.ts
    │   ├── ventas/
    │   │   ├── pages/
    │   │   │   ├── VentasPage.tsx        ← listado
    │   │   │   ├── CrearVentaPage.tsx    ← formulario POS
    │   │   │   └── VentaDetailPage.tsx  ← detalle
    │   │   ├── components/
    │   │   │   ├── ArticuloLineaForm.tsx
    │   │   │   ├── ArticuloBuscador.tsx
    │   │   │   └── FacturaEstadoBadge.tsx
    │   │   ├── hooks/useVentas.ts
    │   │   └── services/ventas.service.ts
    │   ├── articulos/
    │   ├── clientes/
    │   ├── presupuestos/
    │   ├── entregas/
    │   ├── inventarios/
    │   ├── remitos/
    │   ├── compras/
    │   ├── listas-precios/
    │   ├── empresa/
    │   ├── dashboard/
    │   ├── ecommerce/
    │   └── central/           ← panel superadmin multitenancy
    ├── shared/
    │   ├── components/
    │   │   ├── ui/            ← shadcn/ui base
    │   │   ├── layout/
    │   │   │   ├── AppLayout.tsx
    │   │   │   ├── AppSidebar.tsx
    │   │   │   └── CentralLayout.tsx
    │   │   ├── Pagination.tsx
    │   │   ├── DeleteConfirmDialog.tsx
    │   │   ├── DateRangePicker.tsx
    │   │   ├── FileUpload.tsx
    │   │   └── QRScanner.tsx
    │   ├── hooks/
    │   │   ├── useDebounce.ts
    │   │   ├── useMobile.ts
    │   │   └── useAppearance.ts
    │   ├── services/
    │   │   └── api/
    │   │       ├── axios.config.ts    ← interceptores JWT + tenant header
    │   │       └── api.client.ts
    │   └── types/
    │       └── global.types.ts
    ├── router/
    │   └── index.tsx          ← React Router, lazy loading, guards
    └── App.tsx
```

---

## 5. MULTI-TENANCY

### Identificación de tenant
- El frontend envía el header `X-Tenant-Domain: empresa1.epos.com` en cada request
- Alternativamente, el frontend está deployado en el subdominio y la URL base ya contiene el subdominio
- El backend middleware lee ese header, busca en la tabla `domains` (BD central), obtiene el `tenant_id`, cambia el `DataSource` de TypeORM al de ese tenant

### Estructura de bases de datos
- **BD central (`epos_central`):** tablas `tenants`, `domains`, `central_users`
- **BD por tenant (`epos_{tenant_id}`):** todas las tablas de negocio

### Panel central vs panel tenant
- Panel central: accede a `https://epos.com/central/...`, usa guard `CentralJwtGuard`, BD central, `CentralUser` model
- Panel tenant: accede a `https://empresa1.epos.com/...`, usa guard `JwtAuthGuard`, BD del tenant

### Creación de tenant (desde panel central)
Al crear un tenant:
1. Insertar en `tenants` y `domains` (BD central)
2. Crear BD: `epos_{tenant_id}`
3. Correr todas las migraciones de tenant
4. Seed: 4 roles, 24 provincias, marcas iniciales, categorías iniciales, lista de precios base
5. Crear primer usuario con rol `superadmin`
6. Crear registro `InitialSetting` con razonsocial y CUIT del tenant

---

## 6. ENTIDADES DEL DOMINIO

### 6.1 Autenticación (BD central)

#### CentralUser
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| name | varchar(255) | NOT NULL |
| email | varchar(255) | NOT NULL, UNIQUE |
| password | varchar(255) | NOT NULL, bcrypt |
| created_at | timestamp | |
| updated_at | timestamp | |

#### Tenant
| Campo | Tipo | Restricciones |
|---|---|---|
| id | uuid PK | generado automáticamente |
| razonsocial | varchar(255) | NOT NULL |
| cuit | varchar(20) | NOT NULL |
| plan | enum('basic','pro','enterprise') | NOT NULL, DEFAULT 'basic' |
| status | enum('active','inactive') | NOT NULL, DEFAULT 'active' |
| created_at | timestamp | |
| updated_at | timestamp | |

#### Domain
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| tenant_id | uuid FK → tenants.id | NOT NULL, CASCADE DELETE |
| domain | varchar(255) | NOT NULL, UNIQUE |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### 6.2 Autenticación (BD tenant)

#### Role
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| role | text | NOT NULL |
| permission | text | NULLABLE |
| description | text | NULLABLE |
| created_at | timestamp | |
| updated_at | timestamp | |

**Valores del sistema:** `superadmin`, `admin`, `vendedor`, `cliente`

#### User
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| name | varchar(255) | NOT NULL |
| email | varchar(255) | NOT NULL, UNIQUE |
| email_verified_at | timestamp | NULLABLE |
| password | varchar(255) | NOT NULL, bcrypt |
| remember_token | varchar(100) | NULLABLE |
| role_id | bigint FK → roles.id | NULLABLE, SET NULL on delete |
| tour_completed | boolean | DEFAULT false |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### 6.3 Catálogo

#### Marca
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| marca | varchar(255) | NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

#### Categoria
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| categoria | varchar(255) | NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

> Regla: el nombre de categoría se guarda con la primera letra en mayúscula.

#### Articulo
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| codprov | varchar(255) | NULLABLE |
| codarticulo | varchar(255) | NOT NULL |
| codigo_barras | varchar(255) | NULLABLE, UNIQUE |
| codigo_qr | varchar(255) | NULLABLE, UNIQUE |
| articulo | varchar(255) | NOT NULL |
| descripcion | text | NOT NULL |
| medida | varchar(50) | NOT NULL |
| precio | decimal(8,2) | NOT NULL |
| alicuota | decimal(8,2) | NOT NULL |
| stockminimo | integer | NOT NULL, DEFAULT 0 |
| marca_id | bigint FK → marcas.id | NOT NULL |
| categoria_id | bigint FK → categorias.id | NOT NULL |
| supplier_id | bigint FK → suppliers.id | NULLABLE, SET NULL |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | NULLABLE (SoftDelete) |

**Valores de `medida`:** `Unidad`, `Kg`, `Litro`, `Metro`, `Caja`, `Pack`
**Valores de `alicuota`:** `0`, `2.5`, `5`, `10.5`, `21`, `27`

#### ArticuloImagen
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| articulo_id | bigint FK → articulos.id | NOT NULL, CASCADE DELETE |
| nombre_archivo | varchar(255) | NOT NULL |
| ruta | varchar(255) | NOT NULL |
| ruta_thumb | varchar(255) | NULLABLE |
| es_principal | boolean | NOT NULL, DEFAULT false |
| orden | integer | NOT NULL, DEFAULT 0 |
| created_at | timestamp | |
| updated_at | timestamp | |

#### ListaPrecio
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| nombre | varchar(255) | NOT NULL |
| porcentaje | decimal(8,2) | NOT NULL, DEFAULT 0 |
| default_pos | boolean | NOT NULL, DEFAULT false |
| default_ecommerce | boolean | NOT NULL, DEFAULT false |
| created_at | timestamp | |
| updated_at | timestamp | |

#### ArticuloListaPrecio (tabla pivot)
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| articulo_id | bigint FK → articulos.id | NOT NULL, CASCADE DELETE |
| lista_precio_id | bigint FK → listas_precios.id | NOT NULL, CASCADE DELETE |
| precio | decimal(10,2) | NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

> UNIQUE(articulo_id, lista_precio_id)

---

### 6.4 Clientes y Proveedores

#### Cliente
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| razonsocial | varchar(255) | NOT NULL |
| documentounico | bigint | NULLABLE |
| direccion | varchar(255) | NOT NULL |
| telefono | varchar(255) | NULLABLE |
| email | varchar(255) | NULLABLE |
| codigopostal | integer | NOT NULL |
| localidad | varchar(255) | NOT NULL |
| provincia | varchar(255) | NOT NULL |
| condicioniva | varchar(255) | NOT NULL |
| haber | decimal(8,2) | NOT NULL, DEFAULT 0 |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | NULLABLE (SoftDelete) |

**Valores de `condicioniva`:** `Responsable Inscripto`, `Monotributo`, `Exento`, `Consumidor Final`

> Nota: `documentounico` puede ser CUIT (11 dígitos) o DNI (8 dígitos).

#### Supplier (Proveedor)
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| razonsocial | varchar(255) | NOT NULL |
| cuit | bigint | NOT NULL |
| direccion | varchar(255) | NOT NULL |
| telefono | varchar(255) | NOT NULL |
| email | varchar(255) | NULLABLE |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | NULLABLE (SoftDelete) |

---

### 6.5 Ventas y Facturas

#### Factura
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| ptoventa | integer | NOT NULL |
| codcomprobante | integer | NULLABLE |
| letracomprobante | varchar(10) | NOT NULL |
| numfactura | bigint | NOT NULL |
| cuit | bigint | NOT NULL |
| fecha | varchar(20) | NOT NULL |
| bonificacion | decimal(12,2) | NOT NULL, DEFAULT 0 |
| recargo | decimal(12,2) | NOT NULL, DEFAULT 0 |
| descuento | decimal(12,2) | NOT NULL, DEFAULT 0 |
| subtotal | decimal(12,2) | NOT NULL |
| total | decimal(12,2) | NOT NULL |
| pagada | varchar(5) | NOT NULL ('SI' / 'NO') |
| condicionventa | varchar(255) | NOT NULL |
| comprobanteafip | bigint | NULLABLE |
| cae | varchar(50) | NULLABLE |
| fechavto | varchar(20) | NULLABLE |
| vencimiento_cae | varchar(20) | NULLABLE |
| codbarra | varchar(255) | NULLABLE |
| compago | varchar(255) | NULLABLE |
| cliente_id | bigint FK → clientes.id | NOT NULL |
| user_id | bigint FK → users.id | NOT NULL |
| lista_precio_id | bigint FK → listas_precios.id | NULLABLE, SET NULL |
| tipo_venta | enum('pos','ecommerce') | NOT NULL, DEFAULT 'pos' |
| autorizada_afip | boolean | NOT NULL, DEFAULT false |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | NULLABLE (SoftDelete) |

#### ArticuloFactura (tabla pivot con datos de histórico)
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| codprov | varchar(255) | NULLABLE |
| codarticulo | varchar(255) | NOT NULL |
| articulo | varchar(255) | NOT NULL |
| medida | varchar(50) | NOT NULL |
| cantidad | integer | NOT NULL |
| bonificacion | decimal(8,2) | NOT NULL, DEFAULT 0 |
| alicuota | decimal(8,2) | NOT NULL |
| preciounitario | decimal(8,2) | NOT NULL |
| subtotal | decimal(8,2) | NOT NULL |
| articulo_id | bigint FK → articulos.id | NOT NULL |
| factura_id | bigint FK → facturas.id | NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

> Nota: Los campos codarticulo, articulo, medida se copian del artículo al crear la factura para preservar el histórico aunque el artículo cambie.

#### FacturaPago
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| factura_id | bigint FK → facturas.id | NOT NULL |
| monto | decimal(10,2) | NOT NULL |
| metodo_pago | varchar(50) | NOT NULL |
| fecha_pago | date | NOT NULL |
| observaciones | text | NULLABLE |
| created_at | timestamp | |
| updated_at | timestamp | |

**Valores de `metodo_pago`:** `efectivo`, `tarjeta_debito`, `tarjeta_credito`, `transferencia`, `mercadopago`, `cheque`

#### Entrega
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| factura_id | bigint FK → facturas.id | NOT NULL |
| articulo_id | bigint FK → articulos.id | NOT NULL |
| cantidad | integer | NOT NULL |
| fecha_entrega | date | NOT NULL |
| observaciones | text | NULLABLE |
| estado | enum('pendiente','entregada','cancelada') | NOT NULL, DEFAULT 'pendiente' |
| fecha_entrega_real | timestamp | NULLABLE |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### 6.6 Presupuestos

#### Presupuesto
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| ptoventa | integer | NOT NULL |
| letracomprobante | varchar(10) | NOT NULL |
| numpresupuesto | integer | NOT NULL |
| cuit | bigint | NOT NULL |
| fecha | varchar(20) | NOT NULL |
| bonificacion | decimal(8,2) | NOT NULL, DEFAULT 0 |
| recargo | decimal(8,2) | NOT NULL, DEFAULT 0 |
| subtotal | decimal(8,2) | NOT NULL |
| total | decimal(8,2) | NOT NULL |
| vencimiento | varchar(20) | NULLABLE |
| cliente_id | bigint FK → clientes.id | NOT NULL |
| user_id | bigint FK → users.id | NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | NULLABLE (SoftDelete) |

#### ArticuloPresupuesto (tabla pivot)
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| codprov | varchar(255) | NULLABLE |
| codarticulo | varchar(255) | NOT NULL |
| articulo | varchar(255) | NOT NULL |
| medida | varchar(50) | NOT NULL |
| cantidad | integer | NOT NULL |
| preciounitario | decimal(8,2) | NOT NULL |
| bonificacion | decimal(8,2) | NOT NULL, DEFAULT 0 |
| alicuota | decimal(8,2) | NOT NULL |
| subtotal | decimal(8,2) | NOT NULL |
| articulo_id | bigint FK → articulos.id | NOT NULL |
| presupuesto_id | bigint FK → presupuestos.id | NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### 6.7 Remitos y Compras

#### Remito
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| ptoventa | integer | NOT NULL |
| numremito | integer | NOT NULL |
| fecha | varchar(20) | NOT NULL |
| recargo | decimal(15,2) | NOT NULL, DEFAULT 0 |
| bonificacion | decimal(15,2) | NOT NULL, DEFAULT 0 |
| subtotal | decimal(15,2) | NOT NULL |
| total | decimal(15,2) | NOT NULL |
| convertido_inventario | boolean | NOT NULL, DEFAULT false |
| supplier_id | bigint FK → suppliers.id | NOT NULL |
| user_id | bigint FK → users.id | NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

#### ArticuloRemito
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| codprov | varchar(255) | NULLABLE |
| codarticulo | varchar(255) | NOT NULL |
| articulo | varchar(255) | NOT NULL |
| medida | varchar(50) | NOT NULL |
| cantidad | integer | NOT NULL |
| bonificacion | decimal(15,2) | NOT NULL, DEFAULT 0 |
| alicuota | decimal(8,2) | NOT NULL |
| preciounitario | decimal(15,2) | NOT NULL |
| subtotal | decimal(15,2) | NOT NULL |
| lote | integer | NULLABLE |
| articulo_id | bigint FK → articulos.id | NOT NULL |
| remito_id | bigint FK → remitos.id | NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

#### Compra
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| numero_remito | varchar(255) | NOT NULL |
| fecha | date | NOT NULL |
| supplier_id | bigint FK → suppliers.id | NOT NULL, CASCADE DELETE |
| subtotal | decimal(10,2) | NOT NULL, DEFAULT 0 |
| total | decimal(10,2) | NOT NULL, DEFAULT 0 |
| observaciones | text | NULLABLE |
| created_at | timestamp | |
| updated_at | timestamp | |

#### CompraDetalle
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| compra_id | bigint FK → compras.id | NOT NULL, CASCADE DELETE |
| articulo_id | bigint FK → articulos.id | NOT NULL, CASCADE DELETE |
| cantidad | integer | NOT NULL |
| precio_unitario | decimal(10,2) | NOT NULL |
| subtotal | decimal(10,2) | NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### 6.8 Inventario y Movimientos

#### Inventario
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| cantidad | integer | NOT NULL |
| lote | integer | NULLABLE |
| vencimiento | date | NULLABLE |
| articulo_id | bigint FK → articulos.id | NOT NULL |
| supplier_id | bigint FK → suppliers.id | NULLABLE |
| created_at | timestamp | |
| updated_at | timestamp | |

> Un registro de Inventario por artículo. Cuando no existe para un artículo, se crea al primer ingreso de stock.

#### Movimiento
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| tipo | varchar(50) | NOT NULL |
| cantidad | integer | NOT NULL |
| fecha | varchar(20) | NOT NULL |
| inventario_id | bigint FK → inventarios.id | NOT NULL |
| numcomprobante | bigint | NULLABLE |
| user_id | bigint FK → users.id | NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

**Valores de `tipo`:** `entrada`, `salida`, `ajuste`

---

### 6.9 Cuenta Corriente

#### CuentaCorriente
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| factura_id | bigint FK → facturas.id | NOT NULL |
| importe | decimal(8,2) | NOT NULL |
| saldo | decimal(8,2) | NOT NULL |
| alta | varchar(20) | NOT NULL |
| ultimopago | varchar(20) | NULLABLE |
| estado | varchar(50) | NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

#### Pago (cuenta corriente)
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| ctacte_id | bigint FK → cuentacorrientes.id | NOT NULL |
| numpago | integer | NOT NULL |
| importe | decimal(8,2) | NOT NULL |
| fecha | varchar(20) | NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

#### Recibo
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| ctacte_id | bigint FK → cuentacorrientes.id | NOT NULL |
| numrecibo | integer | NOT NULL |
| fecha | varchar(20) | NOT NULL |
| total | decimal(8,2) | NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

#### MovimientoCuenta
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| ctacte_id | bigint FK → cuentacorrientes.id | NOT NULL |
| tipo | varchar(50) | NOT NULL |
| fecha | varchar(20) | NOT NULL |
| importe | float | NOT NULL |
| user_id | bigint FK → users.id | NOT NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### 6.10 Configuración de Empresa

#### InitialSetting
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| cuit | varchar(20) | NULLABLE |
| razonsocial | varchar(255) | NULLABLE |
| direccion | varchar(255) | NULLABLE |
| telefono | varchar(255) | NULLABLE |
| email | varchar(255) | NULLABLE |
| codigopostal | integer | NULLABLE |
| localidad | varchar(255) | NULLABLE |
| provincia | varchar(255) | NULLABLE |
| condicioniva | varchar(255) | NULLABLE |
| iibb | varchar(255) | NULLABLE |
| inicioactividades | varchar(20) | NULLABLE |
| puntoventa | integer | NULLABLE |
| afip_ambiente | varchar(20) | NOT NULL, DEFAULT 'homologacion' |
| nombrefantasia | varchar(255) | NULLABLE |
| domiciliocomercial | varchar(255) | NULLABLE |
| tagline | varchar(255) | NULLABLE |
| logo | varchar(255) | NULLABLE (ruta del archivo) |
| numfactura | bigint | NULLABLE, DEFAULT 0 |
| numremito | bigint | NULLABLE, DEFAULT 0 |
| numpresupuesto | bigint | NULLABLE, DEFAULT 0 |
| numpago | bigint | NULLABLE, DEFAULT 0 |
| numrecibo | bigint | NULLABLE, DEFAULT 0 |
| created_at | timestamp | |
| updated_at | timestamp | |

**Valores de `afip_ambiente`:** `homologacion`, `production`

> Solo hay UN registro de InitialSetting por tenant. Si no existe al acceder, crearlo vacío.

---

### 6.11 Geografía

#### Provincia
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| nombre | varchar(255) | NOT NULL |
| id_afip | integer | NULLABLE |
| created_at | timestamp | |
| updated_at | timestamp | |

#### Localidad
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| nombre | varchar(255) | NOT NULL |
| provincia_id | bigint FK → provincias.id | NOT NULL, CASCADE DELETE |
| id_afip | integer | NULLABLE |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### 6.12 E-Commerce

#### Cart
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| user_id | bigint | NULLABLE |
| articulo_id | bigint | NOT NULL |
| quantity | integer | NOT NULL, DEFAULT 1 |
| session_id | varchar(255) | NULLABLE |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### 6.13 Telegram

#### TelegramUser
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| user_id | bigint FK → users.id | NOT NULL, CASCADE DELETE |
| telegram_id | bigint | NOT NULL, UNIQUE |
| telegram_username | varchar(255) | NULLABLE |
| telegram_first_name | varchar(255) | NULLABLE |
| telegram_last_name | varchar(255) | NULLABLE |
| bot_type | enum('admin','vendedor') | NOT NULL |
| verification_code | varchar(6) | NULLABLE |
| is_verified | boolean | NOT NULL, DEFAULT false |
| is_active | boolean | NOT NULL, DEFAULT true |
| last_interaction_at | timestamp | NULLABLE |
| created_at | timestamp | |
| updated_at | timestamp | |

#### TelegramConversation
| Campo | Tipo | Restricciones |
|---|---|---|
| id | bigint PK autoincrement | |
| telegram_user_id | bigint FK → telegram_users.id | NOT NULL, CASCADE DELETE |
| message_id | bigint | NULLABLE |
| user_message | text | NOT NULL |
| bot_response | text | NULLABLE |
| context | json | NULLABLE |
| function_called | varchar(255) | NULLABLE |
| function_result | json | NULLABLE |
| tokens_used | integer | NULLABLE |
| response_time_ms | integer | NULLABLE |
| created_at | timestamp | INDEX |
| updated_at | timestamp | |

---

## 7. RELACIONES ENTRE ENTIDADES

```
User ────────────────── N:1 ── Role
Articulo ──────────────  N:1 ── Marca
Articulo ──────────────  N:1 ── Categoria
Articulo ──────────────  N:1 ── Supplier (nullable)
Articulo ──────────────  1:N ── ArticuloImagen
Articulo ──────────────  1:1 ── Inventario
Articulo ──────────────  N:M ── ListaPrecio  [pivot: articulo_lista_precio (precio)]

Factura ────────────────  N:1 ── Cliente
Factura ────────────────  N:1 ── User
Factura ────────────────  N:1 ── ListaPrecio (nullable)
Factura ────────────────  N:M ── Articulo   [pivot: articulo_factura (historico)]
Factura ────────────────  1:N ── FacturaPago
Factura ────────────────  1:N ── Entrega
Factura ────────────────  1:1 ── CuentaCorriente

Presupuesto ──────────── N:1 ── Cliente
Presupuesto ──────────── N:1 ── User
Presupuesto ──────────── N:M ── Articulo   [pivot: articulo_presupuesto]

Remito ─────────────────  N:1 ── Supplier
Remito ─────────────────  N:1 ── User
Remito ─────────────────  1:N ── ArticuloRemito
ArticuloRemito ──────────  N:1 ── Articulo

Compra ─────────────────  N:1 ── Supplier
Compra ─────────────────  1:N ── CompraDetalle
CompraDetalle ───────────  N:1 ── Articulo

Inventario ─────────────  1:1 ── Articulo
Inventario ─────────────  N:1 ── Supplier (nullable)
Inventario ─────────────  1:N ── Movimiento

CuentaCorriente ─────────  1:1 ── Factura
CuentaCorriente ─────────  1:N ── Pago
CuentaCorriente ─────────  1:N ── Recibo
CuentaCorriente ─────────  1:N ── MovimientoCuenta

Entrega ────────────────  N:1 ── Factura
Entrega ────────────────  N:1 ── Articulo

Provincia ──────────────  1:N ── Localidad

TelegramUser ───────────  N:1 ── User
TelegramUser ───────────  1:N ── TelegramConversation

Cart ───────────────────  N:1 ── Articulo
Cart ───────────────────  N:1 ── User (nullable)

Domain ─────────────────  N:1 ── Tenant
```

---

## 8. REGLAS DE NEGOCIO

### 8.1 Flujo de Venta (POS)

```
1. Obtener numfactura = InitialSetting.numfactura + 1
2. Calcular:
   subtotal = SUM(linea.cantidad × linea.precio)
   total    = subtotal + recargo - descuento
3. Crear Factura con ptoventa=3, letracomprobante='B', pagada='NO'
4. Adjuntar artículos en articulo_factura (copiar nombre, código, medida)
5. Actualizar InitialSetting.numfactura = numfactura
6. Si auto_delivery = true:
   → Decrementar Inventario.cantidad por cada artículo
   → Crear Movimiento tipo='salida'
   → Crear Entrega con estado='entregada', fecha_entrega_real=now()
7. Si auto_delivery = false:
   → Crear Entrega con estado='pendiente', sin descontar stock
8. Si monto_pago > 0:
   → Crear FacturaPago
   → Si monto_pago >= total: factura.pagada = 'SI'
```

### 8.2 Flujo Presupuesto → Venta

```
1. Presupuesto: ptoventa=1, letracomprobante='P', numpresupuesto autoincrementable
2. Acción "Convertir a Venta":
   → Crear Factura con artículos copiados del presupuesto
   → letracomprobante='B', condicionventa='CUENTA CORRIENTE'
   → NO descuenta stock al convertir
   → El presupuesto NO se elimina (queda como referencia)
```

### 8.3 Cálculo de IVA para AFIP

```
Para cada línea de la factura:
  neto = (cantidad × preciounitario) / (1 + alicuota/100)
  iva  = (cantidad × preciounitario) - neto

Mapeo alícuota AFIP:
  0%    → id=3
  2.5%  → id=9
  5%    → id=8
  10.5% → id=4
  21%   → id=5
  27%   → id=6

Agrupar por alícuota:
  [{Id: 5, BaseImp: sum_netos_21, Importe: sum_iva_21}, ...]
```

### 8.4 Tipo de Comprobante AFIP

```
Si condicioniva del cliente es:
  'Responsable Inscripto' o 'Monotributo' → CbteTipo=1  (Factura A)
  'Exento' o 'Consumidor Final'           → CbteTipo=6  (Factura B)

Tipo de documento:
  11 dígitos → DocTipo=80 (CUIT)
  8 dígitos  → DocTipo=96 (DNI)
  otro       → DocTipo=99 (Sin identificación)
```

### 8.5 Gestión de Stock

```
ENTRADA (suma a Inventario.cantidad):
  - Remito → convertirAInventario(): suma cantidad por artículo
  - Compra: similar a remito
  - Inventario manual: CRUD directo

SALIDA (resta de Inventario.cantidad):
  - Venta con auto_delivery=true: resta INMEDIATAMENTE al crear la factura
  - Entrega: resta al marcar como 'entregada'
  - Si artículo sin Inventario: crear registro con cantidad resultante (puede quedar negativo)

RESTAURACIÓN:
  - Eliminar Factura (si tenía auto_delivery): restaurar stock sumando cantidad
  - Eliminar Entrega entregada: restaurar stock sumando cantidad
  - Cancelar Entrega: NO modifica stock
```

### 8.6 Listas de Precios

```
PrecioEnLista = precio_base_articulo × (1 + porcentaje/100)

Al crear/actualizar ListaPrecio:
  → Calcular y guardar precio para TODOS los artículos en articulo_lista_precio

Al cambiar porcentaje:
  → Regenerar todos los precios de esa lista

Regla de default:
  - Solo UNA lista puede tener default_pos=true
  - Solo UNA lista puede tener default_ecommerce=true
  - Al marcar una como default, desmarcar las demás
```

### 8.7 Factura: Estado y Edición

```
factura.pagada:
  'SI' → total_pagado >= total
  'NO' → total_pagado < total

total_pagado = SUM(factura_pagos.monto)
saldo_pendiente = total - total_pagado

Edición bloqueada si: autorizada_afip = true (tiene CAE)
Eliminación bloqueada si: autorizada_afip = true
```

### 8.8 Entregas

```
Estado: pendiente → entregada | cancelada

marcarEntregada():
  1. Si estado = 'entregada': error (ya entregada)
  2. Decrementar Inventario.cantidad
  3. Crear Movimiento tipo='salida'
  4. estado = 'entregada', fecha_entrega_real = now()

cancelar():
  1. Si estado = 'entregada': error (no se puede cancelar)
  2. estado = 'cancelada'

Validación al crear:
  cantidad <= (total_vendido_del_articulo - total_ya_entregado_del_articulo)
```

### 8.9 E-Commerce

```
Carrito:
  - Anónimo: identificado por session_id (cookie/localStorage)
  - Autenticado: identificado por user_id
  - Al hacer login: merge carrito anónimo → carrito del usuario

Checkout con MercadoPago:
  1. Frontend obtiene token de tarjeta via MercadoPago SDK
  2. POST /api/checkout/payment { token, payment_method_id, installments, payer }
  3. Backend cobra a MercadoPago
  4. Si aprobado:
     → Crear Factura tipo_venta='ecommerce', pagada='SI'
     → Crear FacturaPago
     → Crear Entrega estado='pendiente', fecha_entrega=now()+3días
     → Limpiar carrito
  5. Si rechazado: retornar error sin crear factura
```

### 8.10 Consulta AFIP (datos fiscales)

```
Al consultar CUIT de un cliente:
  1. Intentar API pública: GET https://soa.afip.gob.ar/sr-padron/v2/persona/{cuit}
     → Extraer razonsocial, domicilio, localidad, codigopostal
     → Determinar condicioniva desde datosMonotributo/datosRegimenGeneral
  2. Si falla: usar WSR5 de AFIP (requiere certificado)
  3. Retornar: { razonsocial, direccion, localidad, provincia, codigopostal, condicioniva }
```

### 8.11 Numeración automática de comprobantes

```
Al crear:
  - Factura: numfactura = InitialSetting.numfactura + 1, luego actualizar setting
  - Remito: numremito = InitialSetting.numremito + 1
  - Presupuesto: numpresupuesto = InitialSetting.numpresupuesto + 1
  - Pago (ctacte): numpago = InitialSetting.numpago + 1
  - Recibo: numrecibo = InitialSetting.numrecibo + 1
```

---

## 9. VALIDACIONES POR ENDPOINT

### Artículo
```typescript
{
  codarticulo: string, required, unique por tenant
  articulo: string, required, max 255
  descripcion: string, required
  medida: enum(['Unidad','Kg','Litro','Metro','Caja','Pack']), required
  precio: number, required, > 0
  alicuota: enum([0, 2.5, 5, 10.5, 21, 27]), required
  stockminimo: integer, required, >= 0
  marca_id: integer, required, exists
  categoria_id: integer, required, exists
  supplier_id: integer, optional, exists
  codigo_barras: string, optional, unique
  codigo_qr: string, optional, unique
  imagenes: File[], optional, max 5 archivos, max 5MB c/u, types [jpg,png,webp]
}
```

### Cliente
```typescript
{
  razonsocial: string, required, max 255
  documentounico: string, optional, numeric, 8 u 11 dígitos
  direccion: string, required, max 255
  telefono: string, optional
  email: string, optional, email format
  codigopostal: integer, required
  localidad: string, required
  provincia: string, required
  condicioniva: enum(['Responsable Inscripto','Monotributo','Exento','Consumidor Final']), required
}
```

### Factura / Venta
```typescript
{
  cliente_id: integer, required, exists
  articulos: array, required, minLength 1
  articulos[].articulo_id: integer, required, exists
  articulos[].cantidad: integer, required, > 0
  articulos[].precio: number, required, > 0
  recargo: number, optional, >= 0, default 0
  descuento: number, optional, >= 0, default 0
  metodo_pago: enum(['efectivo','tarjeta_debito','tarjeta_credito','transferencia','mercadopago','cheque']), required
  monto_pago: number, required, >= 0, <= total calculado
  auto_payment: boolean, optional, default true
  auto_delivery: boolean, optional, default true
  lista_precio_id: integer, optional, exists
}
```

### Pago (FacturaPago)
```typescript
{
  monto: number, required, > 0, <= factura.saldo_pendiente
  metodo_pago: enum (mismo que factura), required
  fecha_pago: date, required
  observaciones: string, optional
}
```

### Entrega
```typescript
{
  entregas: array, required, minLength 1
  entregas[].articulo_id: integer, required, exists en la factura
  entregas[].cantidad: integer, required, > 0, <= pendiente del artículo en esa factura
  fecha_entrega: date, required
  observaciones: string, optional
}
```

### Presupuesto
```typescript
{
  cliente_id: integer, required, exists
  articulos: array, required, minLength 1
  articulos[].articulo_id: integer, required, exists
  articulos[].cantidad: integer, required, > 0
  articulos[].precio: number, required, > 0
  recargo: number, optional, default 0
  vencimiento: date, optional
}
```

### Lista de Precios
```typescript
{
  nombre: string, required, max 255
  porcentaje: number, required
  default_pos: boolean, optional, default false
  default_ecommerce: boolean, optional, default false
}
```

### Remito
```typescript
{
  supplier_id: integer, required, exists
  fecha: date, required
  detalles: array, required, minLength 1
  detalles[].articulo_id: integer, required, exists
  detalles[].cantidad: integer, required, > 0
  detalles[].preciounitario: number, required, > 0
  detalles[].bonificacion: number, optional, default 0
  detalles[].alicuota: number, optional, default 21
}
```

### Compra
```typescript
{
  numero_remito: string, required
  fecha: date, required
  supplier_id: integer, required, exists
  observaciones: string, optional
  detalles: array, required, minLength 1
  detalles[].articulo_id: integer, required, exists
  detalles[].cantidad: integer, required, > 0
  detalles[].precio_unitario: number, required, > 0
}
```

### InitialSetting (Empresa)
```typescript
{
  cuit: string, optional, 11 dígitos numéricos si presente
  razonsocial: string, optional
  puntoventa: integer, optional, 1..9999
  afip_ambiente: enum(['homologacion','production']), optional
  // ... demás campos opcionales
}
```

### Usuario
```typescript
{
  name: string, required
  email: string, required, email, unique
  password: string, required, min 8 chars
  role_id: integer, required, exists
}
```

### Tenant (panel central)
```typescript
{
  razonsocial: string, required
  cuit: string, required, 11 dígitos
  slug: string, required, lowercase, regex /^[a-z0-9-]+$/, unique como dominio
  plan: enum(['basic','pro','enterprise']), required
  admin_name: string, required
  admin_email: string, required, email
  admin_password: string, required, min 8
}
```

---

## 10. API ENDPOINTS COMPLETOS

Todas las rutas de tenant llevan el header `X-Tenant-Domain` o se infieren del subdominio.
Las rutas `/api/central/...` usan guard central separado.

### Autenticación

| Método | Endpoint | Body | Roles | Descripción |
|---|---|---|---|---|
| POST | /api/auth/login | email, password | público | Login tenant |
| POST | /api/auth/logout | — | autenticado | Logout |
| GET | /api/auth/me | — | autenticado | Usuario actual |
| POST | /api/auth/refresh | refresh_token | público | Renovar JWT |
| POST | /api/central/auth/login | email, password | público | Login central |
| POST | /api/central/auth/logout | — | central | Logout central |

### Artículos

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | /api/articulos | autenticado | Listar (`?search=&page=&per_page=`) |
| POST | /api/articulos | admin,superadmin | Crear |
| GET | /api/articulos/:id | autenticado | Obtener |
| PUT | /api/articulos/:id | admin,superadmin | Editar |
| DELETE | /api/articulos/:id | admin,superadmin | Eliminar (soft) |
| POST | /api/articulos/:id/imagenes | admin,superadmin | Subir imágenes |
| DELETE | /api/articulos/:id/imagenes/:imgId | admin,superadmin | Eliminar imagen |
| PUT | /api/articulos/:id/imagenes/:imgId/principal | admin,superadmin | Marcar principal |
| PUT | /api/articulos/:id/imagenes/orden | admin,superadmin | Reordenar |
| GET | /api/articulos/:id/codigo-barras | autenticado | PNG del código barras |
| GET | /api/articulos/:id/codigo-qr | autenticado | SVG del QR |
| POST | /api/codigos/buscar | autenticado | `{ codigo }` → Buscar por código |
| POST | /api/codigos/etiquetas | admin,superadmin | `{ ids[] }` → Generar etiquetas |

### Categorías, Marcas, Proveedores

| Método | Endpoint | Roles |
|---|---|---|
| GET/POST | /api/categorias | GET: autenticado, POST: admin+ |
| GET/PUT/DELETE | /api/categorias/:id | GET: autenticado, resto: admin+ |
| GET/POST | /api/marcas | ídem |
| GET/PUT/DELETE | /api/marcas/:id | ídem |
| GET/POST | /api/suppliers | ídem |
| GET/PUT/DELETE | /api/suppliers/:id | ídem |

### Clientes

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | /api/clientes | autenticado | Listar (`?search=&page=`) |
| POST | /api/clientes | autenticado | Crear |
| GET | /api/clientes/:id | autenticado | Obtener |
| PUT | /api/clientes/:id | autenticado | Editar |
| DELETE | /api/clientes/:id | admin,superadmin | Eliminar (soft) |
| GET | /api/clientes/:id/estado-cuenta | autenticado | Estado cuenta del cliente |
| GET | /api/clientes/estados-cuenta | autenticado | Todos con saldo pendiente |
| POST | /api/afip/consultar-cuit | autenticado | `{ cuit }` → Datos fiscales AFIP |

### Ventas / Facturas

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | /api/ventas | autenticado | Listar (paginado, con filtros fecha/estado) |
| POST | /api/ventas | autenticado | Crear venta completa |
| GET | /api/ventas/:id | autenticado | Obtener con artículos, pagos, entregas |
| PUT | /api/ventas/:id | autenticado | Editar (solo si no autorizada AFIP) |
| DELETE | /api/ventas/:id | admin,superadmin | Eliminar (solo si no autorizada AFIP) |
| POST | /api/ventas/:id/autorizar-afip | autenticado | Enviar a AFIP → obtener CAE |
| GET | /api/ventas/:id/pdf | autenticado | Generar PDF de la factura |

### Presupuestos

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | /api/presupuestos | autenticado | Listar |
| POST | /api/presupuestos | autenticado | Crear |
| GET | /api/presupuestos/:id | autenticado | Obtener |
| PUT | /api/presupuestos/:id | autenticado | Editar |
| DELETE | /api/presupuestos/:id | admin,superadmin | Eliminar |
| POST | /api/presupuestos/:id/convertir-venta | autenticado | Crear factura desde presupuesto |

### Pagos

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | /api/facturas/:facturaId/pagos | autenticado | Listar pagos de una factura |
| POST | /api/facturas/:facturaId/pagos | autenticado | Registrar pago |
| DELETE | /api/facturas/:facturaId/pagos/:pagoId | admin,superadmin | Eliminar pago |

### Entregas

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | /api/entregas | autenticado | Listar (`?estado=pendiente`) |
| POST | /api/facturas/:facturaId/entregas | autenticado | Registrar entrega |
| PUT | /api/entregas/:id/marcar-entregada | autenticado | Marcar entregada (descuenta stock) |
| PUT | /api/entregas/:id/cancelar | autenticado | Cancelar (no modifica stock) |
| DELETE | /api/entregas/:id | admin,superadmin | Eliminar (restaura stock si entregada) |

### Inventarios

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | /api/inventarios | autenticado | Listar stock (`?search=&page=`) |
| POST | /api/inventarios | admin,superadmin | Crear registro |
| PUT | /api/inventarios/:id | admin,superadmin | Editar |
| GET | /api/inventarios/:id/movimientos | autenticado | Historial movimientos |

### Remitos

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | /api/remitos | admin,superadmin | Listar |
| POST | /api/remitos | admin,superadmin | Crear |
| GET | /api/remitos/:id | admin,superadmin | Obtener |
| PUT | /api/remitos/:id | admin,superadmin | Editar (si no convertido) |
| DELETE | /api/remitos/:id | admin,superadmin | Eliminar |
| POST | /api/remitos/:id/convertir-inventario | admin,superadmin | Agregar al stock |

### Compras

| Método | Endpoint | Roles |
|---|---|---|
| GET/POST | /api/compras | admin,superadmin |
| GET/PUT/DELETE | /api/compras/:id | admin,superadmin |

### Listas de Precios

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | /api/listas-precios | autenticado | Listar |
| POST | /api/listas-precios | admin,superadmin | Crear (genera precios automáticamente) |
| GET | /api/listas-precios/:id | autenticado | Obtener con artículos y precios |
| PUT | /api/listas-precios/:id | admin,superadmin | Editar |
| DELETE | /api/listas-precios/:id | admin,superadmin | Eliminar |
| POST | /api/listas-precios/:id/regenerar | admin,superadmin | Recalcular todos los precios |

### Dashboard

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | /api/dashboard | admin,superadmin | Métricas (`?fecha_inicio=&fecha_fin=`) |
| GET | /api/dashboard/export | admin,superadmin | Exportar Excel |

**Respuesta de `/api/dashboard`:**
```typescript
{
  totalVentas: number,          // suma total facturas en rango
  clientesNuevos: number,       // clientes creados en rango
  ventasDelMes: number,         // suma total mes actual
  saldoImpagas: number,         // suma saldo_pendiente de facturas no pagadas
  productosVendidos: [          // top 5 por cantidad
    { articulo: string, total_vendido: number }
  ],
  ventasPorDia: [               // para gráfico de línea
    { dia: string, total_dia: number }
  ],
  ventasPorVendedor: [          // por usuario
    { name: string, total_ventas: number, monto_total: number }
  ]
}
```

### Empresa

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | /api/empresa | autenticado | Obtener configuración |
| PUT | /api/empresa | superadmin | Actualizar datos |
| POST | /api/empresa/logo | superadmin | Subir logo (multipart) |
| POST | /api/empresa/certificados | superadmin | Subir cert.pem + key.pem |

### AFIP

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | /api/afip/health | superadmin | Estado de servicios AFIP |

### Usuarios y Roles

| Método | Endpoint | Roles |
|---|---|---|
| GET/POST | /api/users | GET: admin+, POST: superadmin |
| GET/PUT/DELETE | /api/users/:id | superadmin |
| GET/POST | /api/roles | admin+ |
| GET/PUT/DELETE | /api/roles/:id | superadmin |

### Actividad

| Método | Endpoint | Roles |
|---|---|---|
| GET | /api/activity-log | superadmin |

### E-Commerce

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | /api/shop | público | Catálogo (`?categoria=&marca=&search=&page=`) |
| GET | /api/shop/:id | público | Detalle artículo |
| GET | /api/cart | público | Obtener carrito |
| POST | /api/cart | público | Agregar al carrito |
| PUT | /api/cart/:itemId | público | Actualizar cantidad |
| DELETE | /api/cart/:itemId | público | Quitar del carrito |
| DELETE | /api/cart | autenticado | Vaciar carrito |
| POST | /api/checkout/payment | autenticado | Procesar pago MercadoPago |
| GET | /api/checkout/status/:paymentId | autenticado | Estado del pago |

### Telegram

| Método | Endpoint | Descripción |
|---|---|---|
| POST | /api/telegram/webhook/:token | Recibir mensajes del bot |
| POST | /api/telegram/link | Vincular usuario con Telegram |

### Chat IA

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| POST | /api/chat | autenticado | `{ messages: [{role,content}] }` → respuesta IA |

### Panel Central

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | /api/central/dashboard | central | Stats generales |
| GET | /api/central/tenants | central | Listar empresas |
| POST | /api/central/tenants | central | Crear empresa (crea DB, migra, seed) |
| GET | /api/central/tenants/:id | central | Obtener empresa + stats |
| PUT | /api/central/tenants/:id | central | Editar (sincroniza InitialSetting) |
| DELETE | /api/central/tenants/:id | central | Eliminar empresa + DB |
| POST | /api/central/tenants/:id/activate | central | Activar empresa |
| POST | /api/central/tenants/:id/deactivate | central | Desactivar empresa |

---

## 11. PERMISOS POR ROL

| Módulo / Acción | superadmin | admin | vendedor | cliente |
|---|:---:|:---:|:---:|:---:|
| Dashboard métricas | ✓ | ✓ | ✗ | ✗ |
| CRUD Usuarios | ✓ | ✗ | ✗ | ✗ |
| CRUD Roles | ✓ | ✗ | ✗ | ✗ |
| Configuración empresa | ✓ | ✗ | ✗ | ✗ |
| Activity log | ✓ | ✗ | ✗ | ✗ |
| CRUD Artículos | ✓ | ✓ | ✗ | ✗ |
| CRUD Categorías/Marcas | ✓ | ✓ | ✗ | ✗ |
| CRUD Remitos/Compras | ✓ | ✓ | ✗ | ✗ |
| Gestión Inventario | ✓ | ✓ | ✗ | ✗ |
| CRUD Listas de Precios | ✓ | ✓ | ✗ | ✗ |
| Crear Ventas/Facturas | ✓ | ✓ | ✓ | ✗ |
| Crear Presupuestos | ✓ | ✓ | ✓ | ✗ |
| Registrar Pagos/Entregas | ✓ | ✓ | ✓ | ✗ |
| Ver Clientes | ✓ | ✓ | ✓ | ✗ |
| Eliminar Facturas | ✓ | ✓ | ✗ | ✗ |
| Ver mis facturas | ✓ | ✓ | ✓ | ✓ |
| E-commerce | todos | | | |

---

## 12. PÁGINAS FRONTEND

### Autenticación
- `/login` — formulario email + password + remember
- `/forgot-password` — solicitar reset por email
- `/reset-password` — formulario con token
- `/central/login` — login separado para superadmin central

### Dashboard (`/dashboard`)
- Selector de rango de fechas
- 4 tarjetas KPI: Total Ventas, Clientes Nuevos, Ventas del Mes, Saldo Impago
- Gráfico de línea: Ventas por día
- Gráfico de torta/barra: Top 5 productos más vendidos
- Tabla: Ventas por vendedor
- Botón: Exportar Excel

### Artículos
- `/articulos` — tabla paginada, búsqueda, checkbox para selección múltiple, botón "Imprimir Etiquetas", acciones por fila
- `/articulos/create` — form con upload imágenes con drag&drop, ordenamiento
- `/articulos/:id/edit` — igual que create
- `/articulos/:id` — galería de imágenes, datos completos, stock actual
- `/codigos/scanner` — cámara QR
- `/codigos/etiquetas` — preview e impresión de etiquetas

### Catálogo (CRUD simple)
- `/categorias`, `/categorias/create`, `/categorias/:id/edit`
- `/marcas`, `/marcas/create`, `/marcas/:id/edit`
- `/suppliers`, `/suppliers/create`, `/suppliers/:id/edit`

### Clientes
- `/clientes` — tabla con búsqueda debounce, paginación
- `/clientes/create` — form con botón "Consultar AFIP" para autocompletar, dropdowns provincia/localidad dependientes
- `/clientes/:id/edit`
- `/clientes/:id/estado-cuenta` — tabla de facturas, pagos, saldo total
- `/estados-cuenta` — todos los clientes con facturas impagas

### Ventas (Facturas)
- `/ventas` — tabla con filtros (fecha inicio/fin, estado pagada, cliente), paginación
- `/ventas/create` — **formulario principal POS:**
  - Dropdown cliente
  - Dropdown lista de precios (pre-selecciona la default_pos)
  - Búsqueda de artículos con dropdown de resultados (muestra imagen, código, nombre, precio). Soporta scanner QR con botón de cámara
  - Tabla dinámica de líneas: imagen, nombre artículo, cantidad (editable), precio (editable), subtotal (calculado), botón eliminar
  - Recargo (editable)
  - Descuento (editable)
  - Total (calculado en tiempo real)
  - Método de pago (select)
  - Monto a pagar (pre-llena con total, editable)
  - Checkbox "Crear pago automático"
  - Checkbox "Crear entrega automática"
  - Muestra alerta si pago parcial (saldo pendiente)
- `/ventas/:id` — detalle completo con:
  - Info cliente y vendedor
  - Tabla artículos con histórico de precios
  - Estado de pago con badge
  - CAE si está autorizada (con fecha de vencimiento)
  - Lista de pagos registrados (monto, método, fecha, botón eliminar)
  - Lista de entregas (estado, fecha, botón marcar entregada)
  - Botones: "Registrar Pago", "Registrar Entrega", "Autorizar AFIP", "Descargar PDF"
- `/ventas/:id/edit` — editar recargo/descuento (bloqueado si tiene CAE)

### Presupuestos
- `/presupuestos` — listado
- `/presupuestos/create` — similar a ventas sin campos de pago
- `/presupuestos/:id` — con botón "Convertir a Venta"

### Pagos (`/facturas/:id/pagos/create`)
- Muestra: total factura, total pagado, saldo pendiente
- Campos: monto (pre-llena saldo), método de pago, fecha, observaciones

### Entregas
- `/entregas` — listado solo pendientes, con fecha y cliente
- `/facturas/:id/entregas/create` — form: tabla de artículos con cantidades pendientes calculadas, fecha, observaciones

### Inventarios
- `/inventarios` — stock actual: artículo, código, cantidad, stock mínimo, alerta si bajo mínimo
- `/inventarios/create` — seleccionar artículo, ingresar cantidad, lote, vencimiento, proveedor
- `/inventarios/:id/edit`

### Remitos
- `/remitos` — listado con estado "convertido a inventario" o no
- `/remitos/create` — form: proveedor, fecha, líneas de artículos (cantidad, precio, bonificación)
- `/remitos/:id` — detalle con botón "Convertir a Inventario" (visible si convertido_inventario=false)

### Compras
- `/compras`, `/compras/create`, `/compras/:id` — similar a remitos

### Listas de Precios
- `/listas-precios` — listado
- `/listas-precios/create`
- `/listas-precios/:id` — tabla de artículos con precio base, porcentaje, precio calculado, precio actual guardado
- Botón "Regenerar Precios"

### Usuarios y Roles
- `/users` — tabla: nombre, email, rol, acciones
- `/users/create` — nombre, email, password, rol
- `/users/:id/edit`
- `/roles` — tabla: nombre, permisos, descripción
- `/roles/create`, `/roles/:id/edit`

### Empresa (`/empresa`)
Form con secciones:
- **Datos de la empresa:** CUIT, razón social, nombre de fantasía, domicilio comercial, dirección, localidad, provincia, código postal, teléfono, email, condición IVA, IIBB, inicio de actividades, tagline
- **Logo:** Subir imagen, preview
- **AFIP:** Punto de venta, ambiente (radio: homologación / producción), subir cert.pem, subir key.pem, indicador si existen
- **Numeración:** Próximo número de factura, remito, presupuesto, pago, recibo (editables directamente)

### Configuración Personal
- `/settings/profile` — nombre, email
- `/settings/password` — cambiar contraseña
- `/settings/appearance` — tema: light / dark / system

### AFIP Health Check (`/settings/afip`)
- Verificar API pública AFIP (WSFE, Padrón)
- Estado de certificados
- Botón: subir certificados
- Botón: probar conexión

### E-Commerce
- `/shop` — grid de artículos con imagen, nombre, precio, botón "Agregar al carrito". Filtros categoría/marca, búsqueda, paginación
- `/shop/:id` — galería imágenes, descripción, precio, botón carrito
- `/cart` — items del carrito con cantidad editable, subtotal, total, botón "Ir al Checkout"
- `/checkout` — form pago MercadoPago, resumen del pedido
- `/checkout/success`, `/checkout/failure`, `/checkout/pending`
- `/my-purchases` — mis facturas e-commerce

### Chat IA
- `/chat` — interfaz de chat: historial de mensajes, input, botón enviar, scroll automático

### Panel Central
- `/central` — dashboard: total empresas, activas, inactivas, recientes
- `/central/tenants` — tabla: empresa, CUIT, plan, estado (activo/inactivo), dominio, acciones
- `/central/tenants/create` — form: razón social, CUIT, slug (subdominio), plan, datos admin (nombre, email, password)
- `/central/tenants/:id` — stats (usuarios, clientes, facturas, artículos) + info del tenant
- `/central/tenants/:id/edit` — razón social, CUIT, plan

### Activity Log
- `/activity-log` — tabla: usuario, acción, entidad, fecha

---

## 13. COMPONENTES UI REQUERIDOS

### Base (shadcn/ui)
`Button`, `Input`, `Label`, `Select`, `Card` (Header, Content, Title), `Dialog`, `Checkbox`, `Badge`, `Avatar`, `DropdownMenu`, `Popover`, `Skeleton`, `Textarea`, `Toggle`, `Tooltip`, `Separator`, `Alert`, `Breadcrumb`, `Collapsible`, `Pagination`, `Table`

### Específicos del dominio

| Componente | Descripción |
|---|---|
| `AppSidebar` | Sidebar con navegación completa, colapsable, responsive |
| `StatsCard` | Tarjeta de KPI con ícono, valor, delta, color |
| `ArticuloBuscador` | Input con dropdown: muestra imagen, código, nombre, precio. Soporta teclado y click |
| `ArticuloLineaForm` | Fila de artículo en factura: imagen, selector, cantidad, precio, subtotal, eliminar |
| `QRScanner` | Abre cámara y devuelve el código escaneado |
| `FacturaEstadoBadge` | Badge: pagada/parcial/impaga, con color |
| `EntregaEstadoBadge` | Badge: pendiente/entregada/cancelada |
| `AfipAutorizadaBadge` | Badge: autorizada con CAE / pendiente |
| `PagoForm` | Form inline de registro de pago, con saldo pre-cargado |
| `EntregaForm` | Form inline de entrega, calcula cantidades pendientes |
| `DeleteConfirmDialog` | Modal de confirmación con texto personalizable |
| `FileUpload` | Drag & drop para archivos, preview de imágenes |
| `ImageGallery` | Grid de imágenes con drag&drop para reordenar, marcar principal, eliminar |
| `DateRangePicker` | Selector de fecha inicio y fin |
| `DataTable` | Tabla con sorting, búsqueda, paginación, selección |
| `AfipHealthPanel` | Indicadores de estado de servicios AFIP |
| `CartItem` | Ítem del carrito con cantidad editable y precio |
| `TenantStatusBadge` | Badge: active/inactive para el panel central |

---

## 14. SEED DATA INICIAL (por tenant)

### Roles (insertar al crear tenant)
```json
[
  { "role": "superadmin", "permission": "*", "description": "Super Administrador" },
  { "role": "admin", "permission": "*", "description": "Administrador" },
  { "role": "vendedor", "permission": "", "description": "Vendedor" },
  { "role": "cliente", "permission": "", "description": "Cliente" }
]
```

### Provincias argentinas (24 provincias con id_afip)
```json
[
  { "nombre": "CIUDAD AUTONOMA BUENOS AIRES", "id_afip": 0 },
  { "nombre": "BUENOS AIRES", "id_afip": 1 },
  { "nombre": "CATAMARCA", "id_afip": 2 },
  { "nombre": "CORDOBA", "id_afip": 3 },
  { "nombre": "CORRIENTES", "id_afip": 4 },
  { "nombre": "ENTRE RIOS", "id_afip": 5 },
  { "nombre": "JUJUY", "id_afip": 6 },
  { "nombre": "MENDOZA", "id_afip": 7 },
  { "nombre": "LA RIOJA", "id_afip": 8 },
  { "nombre": "SALTA", "id_afip": 9 },
  { "nombre": "SAN JUAN", "id_afip": 10 },
  { "nombre": "SAN LUIS", "id_afip": 11 },
  { "nombre": "SANTA FE", "id_afip": 12 },
  { "nombre": "SANTIAGO DEL ESTERO", "id_afip": 13 },
  { "nombre": "TUCUMAN", "id_afip": 14 },
  { "nombre": "CHACO", "id_afip": 16 },
  { "nombre": "CHUBUT", "id_afip": 17 },
  { "nombre": "FORMOSA", "id_afip": 18 },
  { "nombre": "MISIONES", "id_afip": 19 },
  { "nombre": "NEUQUEN", "id_afip": 20 },
  { "nombre": "LA PAMPA", "id_afip": 21 },
  { "nombre": "RIO NEGRO", "id_afip": 22 },
  { "nombre": "SANTA CRUZ", "id_afip": 23 },
  { "nombre": "TIERRA DEL FUEGO", "id_afip": 24 }
]
```

### Marcas iniciales (20)
Mattel, Hasbro, LEGO, Fisher-Price, Barbie, Hot Wheels, Playmobil, Melissa & Doug, VTech, LeapFrog, Crayola, Play-Doh, Nerf, Transformers, Disney, Marvel, Paw Patrol, Peppa Pig, Frozen, Toy Story

### Categorías iniciales (10)
Didácticos, Peluches, Muñecas, Autos y Vehículos, Construcción, Juegos de Mesa, Deportes, Electrónicos, Arte y Manualidades, Bebés

### Lista de precios (1)
```json
{ "nombre": "Lista General", "porcentaje": 0, "default_pos": true, "default_ecommerce": false }
```

### InitialSetting (1)
```json
{
  "razonsocial": "<razonsocial del tenant>",
  "cuit": "<cuit del tenant>",
  "puntoventa": 1,
  "afip_ambiente": "homologacion",
  "numfactura": 0,
  "numremito": 0,
  "numpresupuesto": 0,
  "numpago": 0,
  "numrecibo": 0
}
```

---

## 15. INTEGRACIÓN AFIP

### Servicios usados
| Servicio | URL Homologación | URL Producción | Propósito |
|---|---|---|---|
| WSAA | wsaahomo.afip.gov.ar/ws/services/LoginCms | wsaa.afip.gov.ar/ws/services/LoginCms | Autenticación, obtiene Token+Sign |
| WSFE | wswhomo.afip.gov.ar/wsfev1/service.asmx | servicios1.afip.gov.ar/wsfev1/service.asmx | Factura electrónica, obtiene CAE |
| WSR5 | awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA5 | aws.afip.gov.ar/sr-padron/webservices/personaServiceA5 | Padrón AFIP, consulta CUIT |
| API Pública | soa.afip.gob.ar/sr-padron/v2/persona/{cuit} | ídem | Sin certificado, solo consulta |

### Flujo de autorización
```
1. Obtener Token + Sign via WSAA (usar cert.pem + key.pem)
   - Cachear el token por 12 horas
   - Invalidar si cambia CUIT o ambiente
2. Llamar WSFE con Token, Sign, CUIT
3. Enviar comprobante:
   {
     PtoVta: InitialSetting.puntoventa,
     CbteTipo: (según condición IVA cliente),
     Concepto: 1,  // Productos
     DocTipo: (según CUIT/DNI),
     DocNro: cliente.documentounico,
     CbteDesde/Hasta: numfactura,
     CbteFch: fecha,
     ImpTotal: factura.total,
     ImpTotConc: 0,
     ImpNeto: suma_netos,
     ImpOpEx: 0,
     ImpIVA: suma_iva,
     ImpTrib: 0,
     MonId: 'PES',
     MonCotiz: 1,
     Iva: [{ Id, BaseImp, Importe }]
   }
4. Respuesta con CAE y FchVtoCae
5. Guardar en factura: cae, vencimiento_cae, autorizada_afip=true
```

### Librería recomendada
Usar `afip.js` (npm) o implementación SOAP directa con `soap` npm package.

---

## 16. INTEGRACIÓN MERCADOPAGO

```
1. Frontend carga SDK: <script src="https://sdk.mercadopago.com/js/v2"></script>
2. Frontend crea CardForm con public_key del backend
3. Usuario ingresa datos de tarjeta → SDK genera token
4. Frontend envía al backend: { token, payment_method_id, installments, payer: {email} }
5. Backend llama MP API:
   POST https://api.mercadopago.com/v1/payments
   {
     transaction_amount: total,
     token: token,
     description: "Compra EPOS",
     installments: installments,
     payment_method_id: payment_method_id,
     payer: { email: payer.email }
   }
6. Resultado:
   - status: 'approved' → crear factura pagada + limpiar carrito
   - status: 'pending' → crear factura sin pagar, esperar webhook
   - status: 'rejected' → no crear factura, retornar error
```

### Webhook de MercadoPago
```
POST /api/mercadopago/webhook
- Recibir notificación de pago aprobado/rechazado
- Actualizar estado de factura correspondiente
```

---

## 17. VARIABLES DE ENTORNO

```env
# Servidor
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Base de datos central
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=epos_user
DB_PASSWORD=secret
DB_NAME=epos_central

# Multi-tenancy
CENTRAL_DOMAIN=epos.test
TENANT_DB_PREFIX=epos_
TENANT_DB_HOST=localhost
TENANT_DB_PORT=5432
TENANT_DB_USERNAME=epos_user
TENANT_DB_PASSWORD=secret

# JWT
JWT_SECRET=change_me_in_production
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=change_me_refresh
JWT_REFRESH_EXPIRATION=30d
JWT_CENTRAL_SECRET=change_me_central

# AFIP
AFIP_CUIT=
AFIP_ENVIRONMENT=homologacion

# MercadoPago
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=

# Telegram
TELEGRAM_ADMIN_BOT_TOKEN=
TELEGRAM_VENDEDOR_BOT_TOKEN=

# AI
ANTHROPIC_API_KEY=
# o: OPENAI_API_KEY=

# Storage
STORAGE_PATH=./storage
PUBLIC_URL=http://localhost:3000
```

---

## 18. SEGURIDAD

- **JWT:** Access token (7d) + Refresh token (30d) en cookie httpOnly
- **Tenant isolation:** middleware valida que el JWT pertenece al tenant del request
- **Roles:** decorador `@Roles()` en cada endpoint, guard verifica `user.role.role`
- **Upload de archivos:** validar MIME real (no solo extensión), tamaño máximo, nombres UUID
- **Certificados AFIP:** almacenar en directorio fuera de `public/` (ej: `storage/private/afip/`)
- **CUIT en logs:** nunca loggear CUITs completos en producción
- **Rate limiting:** aplicar en endpoints de login y consulta AFIP
- **CORS:** solo permitir dominios del tenant y panel central

---

## 19. CONVENCIONES DE CÓDIGO

### Backend (NestJS)
- Un módulo por dominio de negocio
- Use Cases: una clase = una operación (Single Responsibility)
- Repository interfaces en `domain/`, implementaciones en `infrastructure/`
- DTOs con class-validator para request, interfaces para response
- No usar `any` (TypeScript strict)
- Errores: lanzar excepciones del dominio, mapear a HTTP en infrastructure
- Nombres: `PascalCase` clases, `camelCase` métodos, `kebab-case` archivos

### Frontend (React)
- Un módulo por página principal
- Custom hooks para lógica de datos (`useVentas`, `useArticulos`)
- Services para llamadas HTTP (`ventas.service.ts`)
- Zod schemas para validación de formularios (compartibles con backend)
- Props tipadas con interfaces TypeScript
- No `any`
- Nombres: `PascalCase` componentes, `camelCase` hooks y funciones

---

## 20. VERIFICACIÓN — Checklist de implementación

```
□ Health check: GET /api/health → 200
□ Login central: POST /api/central/auth/login → token
□ Crear tenant desde panel central → BD creada, seed aplicado
□ Login tenant: POST /api/auth/login → token con role
□ CRUD artículo: create, list, edit, delete (soft)
□ Upload imagen artículo → guardada en storage, URL accesible
□ CRUD cliente con consulta AFIP: autocompletar datos fiscales
□ Flujo venta completo:
  □ Crear cliente
  □ Crear artículo con stock (inventario cantidad > 0)
  □ POST /api/ventas con auto_delivery=true
  □ Verificar: inventario.cantidad decrementó
  □ Verificar: entrega.estado = 'entregada'
  □ Verificar: factura_pago creado
  □ GET /api/ventas/:id → muestra artículos, pagos, entregas
□ Presupuesto → convertir a venta → factura creada
□ Autorización AFIP (homologación):
  □ Subir cert.pem + key.pem
  □ Configurar CUIT y punto de venta
  □ POST /api/ventas/:id/autorizar-afip → obtiene CAE
  □ Factura con CAE no puede editarse
□ E-commerce:
  □ GET /api/shop → artículos con imágenes
  □ Agregar al carrito (anónimo)
  □ Login → carrito persiste
  □ Checkout MercadoPago sandbox → factura creada
□ Multi-tenancy:
  □ Artículo en tenant A → no visible en tenant B
  □ Tenant desactivado → 503 en todas sus rutas
□ Roles:
  □ Vendedor puede crear ventas
  □ Vendedor NO puede acceder a /api/users
  □ Superadmin tiene acceso total
□ Dashboard métricas → valores correctos con filtro de fechas
```

---

> **Nota final:** Este documento es la fuente de verdad para implementar EPOS desde cero. Toda decisión de implementación no cubierta aquí debe resolverse con el enfoque más simple que cumpla las reglas de negocio documentadas.
