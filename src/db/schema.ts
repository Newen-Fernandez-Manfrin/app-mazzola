import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

// ==========================================
// 1. USUARIOS Y AUTENTICACIÓN
// ==========================================
export const usuarios = pgTable('usuarios', {
  id: text('id').primaryKey(),
  usuario: text('usuario').notNull().unique(), // login username: admin, ventas, fabrica
  nombre: text('nombre').notNull(),
  email: text('email'),
  passwordHash: text('password_hash').notNull(), // Hash seguro, nunca texto plano
  rol: text('rol').notNull().default('Ventas'), // Administrador, Ventas, Fábrica
  activo: boolean('activo').notNull().default(true),
  ultimoAcceso: timestamp('ultimo_acceso'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// 2. CLIENTES
// ==========================================
export const clientes = pgTable('clientes', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  telefono: text('telefono'),
  email: text('email'),
  direccion: text('direccion'),
  cuit: text('cuit'),
  condicionIva: text('condicion_iva').default('Consumidor Final'),
  historialCompras: integer('historial_compras').default(0),
  totalGastado: numeric('total_gastado', { precision: 12, scale: 2 }).default('0'),
  notas: text('notas'),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// 3. PRESUPUESTOS (CON PRECIO HISTÓRICO INMUTABLE)
// ==========================================
export const presupuestos = pgTable('presupuestos', {
  id: text('id').primaryKey(),
  numero: text('numero').notNull().unique(),
  clienteId: text('cliente_id'),
  clienteNombre: text('cliente_nombre').notNull(),
  clienteTelefono: text('cliente_telefono'),
  clienteEmail: text('cliente_email'),
  clienteDireccion: text('cliente_direccion'),
  totalVenta: numeric('total_venta', { precision: 12, scale: 2 }).notNull().default('0'),
  descuentoPorcentaje: integer('descuento_porcentaje').default(0),
  costoInterno: numeric('costo_interno', { precision: 12, scale: 2 }).default('0'),
  ganancia: numeric('ganancia', { precision: 12, scale: 2 }).default('0'),
  estado: text('estado').notNull().default('Borrador'),
  validezDias: integer('validez_dias').default(15),
  fecha: text('fecha').notNull(),
  notas: text('notas'),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// 4. ÍTEMS DE PRESUPUESTO
// ==========================================
export const itemsPresupuesto = pgTable('items_presupuesto', {
  id: text('id').primaryKey(),
  presupuestoId: text('presupuesto_id').notNull().references(() => presupuestos.id, { onDelete: 'cascade' }),
  tipologia: text('tipologia').notNull(),
  linea: text('linea').notNull(),
  marca: text('marca'),
  variante: text('variante'),
  anchoMm: integer('ancho_mm').notNull(),
  altoMm: integer('alto_mm').notNull(),
  cantidad: integer('cantidad').notNull().default(1),
  color: text('color'),
  vidrio: text('vidrio').notNull().default('Simple'),
  tieneMosquitero: boolean('tiene_mosquitero').default(false),
  precioMosquitero: numeric('precio_mosquitero', { precision: 10, scale: 2 }).default('0'),
  tieneReja: boolean('tiene_reja').default(false),
  precioReja: numeric('precio_reja', { precision: 10, scale: 2 }).default('0'),
  tieneTransporte: boolean('tiene_transporte').default(false),
  precioTransporte: numeric('precio_transporte', { precision: 10, scale: 2 }).default('0'),
  tieneInstalacion: boolean('tiene_instalacion').default(false),
  precioInstalacion: numeric('precio_instalacion', { precision: 10, scale: 2 }).default('0'),
  otrosAccesorios: text('otros_accesorios'),
  precioOtros: numeric('precio_otros', { precision: 10, scale: 2 }).default('0'),
  precioUnitario: numeric('precio_unitario', { precision: 12, scale: 2 }).notNull().default('0'),
  precioTotalItem: numeric('precio_total_item', { precision: 12, scale: 2 }).notNull().default('0'),
  notasItem: text('notas_item'),
  unidadIngreso: text('unidad_ingreso').default('mm'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 5. PRODUCTOS DE STOCK / ACCESORIOS / PERFILES
// ==========================================
export const productos = pgTable('productos', {
  id: text('id').primaryKey(),
  codigo: text('codigo').notNull(),
  nombre: text('nombre').notNull(),
  categoria: text('categoria').notNull(),
  unidad: text('unidad').notNull().default('u'),
  precioVenta: numeric('precio_venta', { precision: 10, scale: 2 }).notNull().default('0'),
  costo: numeric('costo', { precision: 10, scale: 2 }).notNull().default('0'),
  margen: numeric('margen', { precision: 8, scale: 2 }).default('35'),
  recargoConfigurable: numeric('recargo_configurable', { precision: 8, scale: 2 }).default('0'),
  stock: integer('stock').notNull().default(0),
  descripcion: text('descripcion'),
  activo: boolean('activo').notNull().default(true),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 6. VENTAS RÁPIDAS
// ==========================================
export const ventasRapidas = pgTable('ventas_rapidas', {
  id: text('id').primaryKey(),
  numero: text('numero').notNull().unique(),
  clienteNombre: text('cliente_nombre').notNull(),
  items: jsonb('items').notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
  costo: numeric('costo', { precision: 12, scale: 2 }).notNull().default('0'),
  metodoPago: text('metodo_pago').notNull().default('Efectivo'),
  fecha: text('fecha').notNull(),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 7. REPARACIONES Y TALLER
// ==========================================
export const reparaciones = pgTable('reparaciones', {
  id: text('id').primaryKey(),
  numero: text('numero').notNull().unique(),
  clienteId: text('cliente_id'),
  clienteNombre: text('cliente_nombre').notNull(),
  clienteTelefono: text('cliente_telefono'),
  trabajo: text('trabajo').notNull(),
  tipoFrecuente: text('tipo_frecuente'),
  materialesTexto: text('materiales_texto'),
  materiales: numeric('materiales', { precision: 10, scale: 2 }).notNull().default('0'),
  manoDeObra: numeric('mano_de_obra', { precision: 10, scale: 2 }).notNull().default('0'),
  costo: numeric('costo', { precision: 10, scale: 2 }).notNull().default('0'),
  precioCobrado: numeric('precio_cobrado', { precision: 10, scale: 2 }).notNull().default('0'),
  ganancia: numeric('ganancia', { precision: 10, scale: 2 }).notNull().default('0'),
  estado: text('estado').notNull().default('Pendiente'),
  fecha: text('fecha').notNull(),
  observaciones: text('observaciones'),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 8. MARCAS (FABRICANTES: MDT, ALUAR, ETC.)
// ==========================================
export const marcas = pgTable('marcas', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull().unique(),
  codigo: text('codigo'),
  descripcion: text('descripcion'),
  activo: boolean('activo').notNull().default(true),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 9. LÍNEAS / SISTEMAS DE CARPINTERÍA
// ==========================================
export const lineas = pgTable('lineas', {
  id: text('id').primaryKey(),
  marcaId: text('marca_id').notNull().references(() => marcas.id, { onDelete: 'cascade' }),
  marcaNombre: text('marca_nombre').notNull(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  alias: text('alias'),
  estado: text('estado').notNull().default('Activo'),
  catalogoId: text('catalogo_id'),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 10. CATÁLOGOS TÉCNICOS PROCESADOS
// ==========================================
export const catalogos = pgTable('catalogos', {
  id: text('id').primaryKey(),
  marcaId: text('marca_id').notNull().references(() => marcas.id, { onDelete: 'cascade' }),
  lineaId: text('linea_id').notNull().references(() => lineas.id, { onDelete: 'cascade' }),
  nombreArchivo: text('nombre_archivo').notNull(),
  titulo: text('titulo').notNull(),
  version: text('version').default('1.0'),
  totalPaginas: integer('total_paginas').default(1),
  estado: text('estado').notNull().default('En revisión'), // Aprobado, En revisión, Desactivado
  archivoUrl: text('archivo_url'),
  aprobadoPor: text('aprobado_por'),
  fechaAprobacion: text('fecha_aprobacion'),
  observaciones: text('observaciones'),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 11. TIPOLOGÍAS OFICIALES DE CATÁLOGO
// ==========================================
export const tipologias = pgTable('tipologias', {
  id: text('id').primaryKey(),
  lineaId: text('linea_id').notNull().references(() => lineas.id, { onDelete: 'cascade' }),
  lineaNombre: text('linea_nombre').notNull(),
  catalogoId: text('catalogo_id'),
  nombre: text('nombre').notNull(),
  codigo: text('codigo'),
  descripcion: text('descripcion'),
  paginaOrigen: integer('pagina_origen').notNull(),
  estadoRevision: text('estado_revision').notNull().default('Aprobado'),
  modificadoPorMazzola: boolean('modificado_por_mazzola').default(false),
  notasMazzola: text('notas_mazzola'),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 12. VARIANTES DE TIPOLOGÍA
// ==========================================
export const variantes = pgTable('variantes', {
  id: text('id').primaryKey(),
  tipologiaId: text('tipologia_id').notNull().references(() => tipologias.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  paginaOrigen: integer('pagina_origen').notNull(),
  estadoRevision: text('estado_revision').notNull().default('Aprobado'),
  modificadoPorMazzola: boolean('modificado_por_mazzola').default(false),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 13. PERFILES TÉCNICOS
// ==========================================
export const perfiles = pgTable('perfiles', {
  id: text('id').primaryKey(),
  marcaId: text('marca_id').notNull().references(() => marcas.id, { onDelete: 'cascade' }),
  marcaNombre: text('marca_nombre').notNull(),
  lineaId: text('linea_id').notNull().references(() => lineas.id, { onDelete: 'cascade' }),
  lineaNombre: text('linea_nombre').notNull(),
  catalogoId: text('catalogo_id'),
  codigo: text('codigo').notNull(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  funcion: text('funcion').notNull(),
  largoComercial: numeric('largo_comercial', { precision: 6, scale: 2 }).default('6.00'),
  pesoPorMetro: numeric('peso_por_metro', { precision: 6, scale: 3 }).default('0.000'),
  paginaOrigen: integer('pagina_origen').notNull(),
  estado: text('estado').notNull().default('Activo'),
  estadoRevision: text('estado_revision').notNull().default('Aprobado'),
  modificadoPorMazzola: boolean('modificado_por_mazzola').default(false),
  notasMazzola: text('notas_mazzola'),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 14. REGLAS TÉCNICAS (FÓRMULAS Y CORTES)
// ==========================================
export const reglasTecnicas = pgTable('reglas_tecnicas', {
  id: text('id').primaryKey(),
  tipologiaId: text('tipologia_id').notNull().references(() => tipologias.id, { onDelete: 'cascade' }),
  varianteId: text('variante_id'),
  componenteFuncionId: text('componente_funcion_id'),
  funcionNombre: text('funcion_nombre').notNull(),
  perfilId: text('perfil_id'),
  perfilCodigo: text('perfil_codigo').notNull(),
  perfilNombre: text('perfil_nombre').notNull(),
  cantidad: integer('cantidad').notNull(),
  formula: text('formula').notNull(),
  corteA: text('corte_a').notNull(),
  corteB: text('corte_b').notNull(),
  orientacion: text('orientacion').notNull(),
  mecanizado: text('mecanizado'),
  paginaOrigen: integer('pagina_origen').notNull(),
  estadoRevision: text('estado_revision').notNull().default('Aprobado'),
  modificadoPorMazzola: boolean('modificado_por_mazzola').default(false),
  notasMazzola: text('notas_mazzola'),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 15. VIDRIOS
// ==========================================
export const vidrios = pgTable('vidrios', {
  id: text('id').primaryKey(),
  tipo: text('tipo').notNull(),
  descripcion: text('descripcion'),
  precioM2: numeric('precio_m2', { precision: 10, scale: 2 }).default('0'),
  activo: boolean('activo').notNull().default(true),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 16. ACCESORIOS Y HERRAJES
// ==========================================
export const accesorios = pgTable('accesorios', {
  id: text('id').primaryKey(),
  nombre: text('nombre').notNull(),
  codigo: text('codigo'),
  categoria: text('categoria').notNull(),
  precioUnitario: numeric('precio_unitario', { precision: 10, scale: 2 }).default('0'),
  activo: boolean('activo').notNull().default(true),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 17. ÓRDENES DE FABRICACIÓN
// ==========================================
export const ordenesFabricacion = pgTable('ordenes_fabricacion', {
  id: text('id').primaryKey(),
  numeroOrden: text('numero_orden'),
  presupuestoId: text('presupuesto_id').notNull(),
  numeroPresupuesto: text('numero_presupuesto').notNull(),
  clienteNombre: text('cliente_nombre').notNull(),
  itemIndex: integer('item_index').notNull().default(0),
  itemData: jsonb('item_data').notNull(),
  tipologiaNombre: text('tipologia_nombre'),
  varianteNombre: text('variante_nombre'),
  medidasStr: text('medidas_str'),
  cantidadTotal: integer('cantidad_total').default(1),
  estadoFabrica: text('estado_fabrica').notNull().default('Por Iniciar'),
  prioridad: text('prioridad').notNull().default('Normal'),
  enfoqueOptimizacion: text('enfoque_optimizacion').default('material'),
  datosCalculados: jsonb('datos_calculados'),
  datosReales: jsonb('datos_reales'),
  listaCorte: jsonb('lista_corte'),
  listaVidrios: jsonb('lista_vidrios'),
  listaAccesorios: jsonb('lista_accesorios'),
  sobrantesAsignados: jsonb('sobrantes_asignados'),
  fechaIngreso: text('fecha_ingreso').notNull(),
  observacionesFabrica: text('observaciones_fabrica'),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 18. CORTES DE PERFILERÍA
// ==========================================
export const cortes = pgTable('cortes', {
  id: text('id').primaryKey(),
  ordenFabricacionId: text('orden_fabricacion_id').notNull().references(() => ordenesFabricacion.id, { onDelete: 'cascade' }),
  perfilCodigo: text('perfil_codigo').notNull(),
  perfilNombre: text('perfil_nombre').notNull(),
  longitudMm: integer('longitud_mm').notNull(),
  anguloA: text('angulo_a').notNull().default('90°'),
  anguloB: text('angulo_b').notNull().default('90°'),
  cantidad: integer('cantidad').notNull().default(1),
  estado: text('estado').notNull().default('Pendiente'),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 19. BARRAS DE ALUMINIO
// ==========================================
export const barras = pgTable('barras', {
  id: text('id').primaryKey(),
  perfilCodigo: text('perfil_codigo').notNull(),
  longitudTotalMm: integer('longitud_total_mm').notNull().default(6000),
  longitudUtilizadaMm: integer('longitud_utilizada_mm').notNull().default(0),
  sobranteMm: integer('sobrante_mm').notNull().default(0),
  ubicacionAlmacen: text('ubicacion_almacen'),
  estado: text('estado').notNull().default('Disponible'),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 20. SOBRANTES APROVECHABLES
// ==========================================
export const sobrantes = pgTable('sobrantes', {
  id: text('id').primaryKey(),
  perfilCodigo: text('perfil_codigo').notNull(),
  perfilNombre: text('perfil_nombre'),
  longitudMm: integer('longitud_mm').notNull(),
  cantidad: integer('cantidad').notNull().default(1),
  ubicacion: text('ubicacion').notNull().default('Estantería de Retazos'),
  estado: text('estado').notNull().default('Disponible'), // 'Disponible' | 'Reservado' | 'Utilizado'
  fecha: text('fecha'),
  origenOrdenId: text('origen_orden_id'),
  origenTipo: text('origen_tipo').default('Corte'),
  observaciones: text('observaciones'),
  aprovechable: boolean('aprovechable').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 21. REGLAS DE VIDRIOS (CATÁLOGO TÉCNICO)
// ==========================================
export const reglasVidrios = pgTable('reglas_vidrios', {
  id: text('id').primaryKey(),
  tipologiaId: text('tipologia_id').notNull().references(() => tipologias.id, { onDelete: 'cascade' }),
  pieza: text('pieza').notNull(),
  formulaAncho: text('formula_ancho').notNull(),
  formulaAlto: text('formula_alto').notNull(),
  cantidadPorAbertura: integer('cantidad_por_abertura').notNull().default(1),
  espesorTipoSugerido: text('espesor_tipo_sugerido').default('Float 4mm / DVH'),
  observaciones: text('observaciones'),
  fuenteTecnica: text('fuente_tecnica').notNull(),
  estadoRevision: text('estado_revision').notNull().default('Aprobado'),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 22. REGLAS DE ACCESORIOS (CATÁLOGO TÉCNICO)
// ==========================================
export const reglasAccesorios = pgTable('reglas_accesorios', {
  id: text('id').primaryKey(),
  tipologiaId: text('tipologia_id').notNull().references(() => tipologias.id, { onDelete: 'cascade' }),
  codigo: text('codigo').notNull(),
  nombre: text('nombre').notNull(),
  funcion: text('funcion').notNull(),
  cantidadPorAbertura: integer('cantidad_por_abertura').notNull().default(1),
  unidad: text('unidad').notNull().default('U'),
  observaciones: text('observaciones'),
  fuenteTecnica: text('fuente_tecnica').notNull(),
  estadoRevision: text('estado_revision').notNull().default('Aprobado'),
  creadoPor: text('creado_por').notNull().default('Sistema'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 23. HISTORIAL DE AUDITORÍA Y TRAZABILIDAD
// ==========================================
export const historial = pgTable('historial', {
  id: text('id').primaryKey(),
  usuario: text('usuario').notNull(),
  accion: text('accion').notNull(),
  elementoTipo: text('elemento_tipo').notNull(),
  elementoId: text('elemento_id'),
  detalle: text('detalle').notNull(),
  fecha: text('fecha').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// RELACIONES DRIZZLE
// ==========================================
export const presupuestosRelations = relations(presupuestos, ({ many }) => ({
  items: many(itemsPresupuesto),
}));

export const itemsPresupuestoRelations = relations(itemsPresupuesto, ({ one }) => ({
  presupuesto: one(presupuestos, {
    fields: [itemsPresupuesto.presupuestoId],
    references: [presupuestos.id],
  }),
}));

export const marcasRelations = relations(marcas, ({ many }) => ({
  lineas: many(lineas),
  perfiles: many(perfiles),
}));

export const lineasRelations = relations(lineas, ({ one, many }) => ({
  marca: one(marcas, {
    fields: [lineas.marcaId],
    references: [marcas.id],
  }),
  tipologias: many(tipologias),
  perfiles: many(perfiles),
}));

export const tipologiasRelations = relations(tipologias, ({ one, many }) => ({
  linea: one(lineas, {
    fields: [tipologias.lineaId],
    references: [lineas.id],
  }),
  variantes: many(variantes),
  reglas: many(reglasTecnicas),
}));

export const ordenesFabricacionRelations = relations(ordenesFabricacion, ({ many }) => ({
  cortes: many(cortes),
}));
