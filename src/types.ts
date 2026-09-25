/**
 * Tipos de datos para Aberturas Mazzola
 * Fase 1 - Base Funcional
 */

export type SeccionPrincipal = 
  | 'inicio'
  | 'presupuestos'
  | 'ventas_rapidas'
  | 'reparaciones'
  | 'precios'
  | 'clientes'
  | 'datos_tecnicos'
  | 'fabrica'
  | 'historial';

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  observaciones?: string;
  fechaCreacion: string;
  creadoPor: string;
  modificadoPor?: string;
  fechaModificacion?: string;
}

export type TipoVidrio = 
  | 'Simple'
  | 'DVH'
  | 'Laminado 3+3'
  | 'Fantasía'
  | 'Sin vidrio'
  | 'Otro';

export interface AccesoriosItem {
  mosquitero: boolean;
  reja: boolean;
  transporte: boolean;
  instalacion: boolean;
  otros: string;
  // Regla Mazzola: no asignar precios automáticos
  precioMosquitero?: number;
  precioReja?: number;
  precioTransporte?: number;
  precioInstalacion?: number;
  precioOtros?: number;
}

export interface ItemAbertura {
  id: string;
  tipologia: string; // ej: Ventana corrediza, Puerta de abrir, Paño fijo, etc.
  linea?: string; // ej: Herrero, Módena, etc. (o sin especificar)
  marca?: string;
  variante?: string;
  anchoMm: number; // Ancho normalizado en mm
  altoMm: number;  // Alto normalizado en mm
  unidadIngreso?: 'mm' | 'cm' | 'm';
  anchoIngresado?: number;
  altoIngresado?: number;
  cantidad: number;
  color?: string; // Blanco, Negro, Anodizado natural, etc.
  vidrio: TipoVidrio | string;
  accesorios: AccesoriosItem;
  // Precio manual cargado por el usuario (Regla Mazzola: NO autocalcular por receta)
  precioUnitarioManual: number;
  precioTotalItem: number; // precioUnitarioManual * cantidad + adicionales manuales
  notasItem?: string;
}

export type TipoEstructuraAbertura = 
  | 'corrediza_2h'
  | 'corrediza_3h'
  | 'corrediza_4h'
  | 'abrir_1h'
  | 'abrir_2h'
  | 'pano_fijo'
  | 'proyectante'
  | 'banderola'
  | 'guillotina'
  | 'puerta_abrir_1h'
  | 'puerta_abrir_2h'
  | 'puerta_balcon_2h'
  | 'generico';

export interface EstructuraVisualTipologia {
  tipoEstructura: TipoEstructuraAbertura;
  cantidadHojas: number;
  divisionesVerticales: number;
  divisionesHorizontales: number;
  aperturaSentido?: 'izquierda_a_derecha' | 'derecha_a_izquierda' | 'hacia_adentro' | 'hacia_afuera' | 'fijo';
  tieneMosquitero?: boolean;
  tieneReja?: boolean;
}

export type EstadoPresupuesto = 'Pendiente' | 'Aprobado' | 'Señado' | 'Rechazado' | 'En Fabricación' | 'Entregado';

export interface Presupuesto {
  id: string;
  numero: string; // ej: PRE-2026-001
  clienteId?: string;
  clienteNombre: string;
  clienteTelefono?: string;
  clienteDireccion?: string;
  items: ItemAbertura[];
  // Precios manuales
  subtotal: number;
  descuentoManual?: number;
  total: number;
  costoEstimadoInterno?: number; // Sólo visible para personal interno
  notas?: string;
  estado: EstadoPresupuesto;
  fechaCreacion: string;
  creadoPor: string;
  modificadoPor?: string;
  fechaModificacion?: string;
}

export interface VentaRapida {
  id: string;
  numero: string; // ej: VR-2026-001
  clienteId?: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  producto: string; // ej: Ventana Herrero
  tipologia?: string; // ej: Corrediza 2 hojas
  medida?: string; // ej: 1200x1000 mm
  caracteristicas?: string; // ej: Módena, Anodizado natural
  vidrio?: string; // ej: Simple 4mm, DVH 4/9/4
  accesorios?: string; // ej: Mosquitero, falleba, guía
  anchoMm?: number;
  altoMm?: number;
  color?: string;
  precioVenta: number; // Ingresado manualmente
  costo: number;
  ganancia: number; // precioVenta - costo
  metodoPago?: string;
  fecha: string;
  observaciones?: string;
  notas?: string;
  creadoPor: string;
  modificadoPor?: string;
  fechaModificacion?: string;
}

export type TipoReparacionFrecuente = 
  | 'cambio de malla'
  | 'cambio de rueda'
  | 'cambio de felpa'
  | 'cambio de vidrio'
  | 'cambio de manija'
  | 'reparación general'
  | 'otro';

export type EstadoReparacion = 'Pendiente' | 'En taller' | 'Listo' | 'Entregado';

export interface Reparacion {
  id: string;
  numero: string; // ej: REP-2026-001
  clienteId?: string;
  clienteNombre: string;
  clienteTelefono?: string;
  trabajo: string;
  tipoFrecuente?: TipoReparacionFrecuente | string;
  materialesTexto?: string; // Detalle/descripción de materiales
  materiales: number; // Costo de materiales
  manoDeObra: number;
  costo: number; // costo total = materiales + manoDeObra
  precioCobrado: number;
  ganancia: number; // precioCobrado - costo
  estado: EstadoReparacion;
  fecha: string;
  observaciones?: string;
  creadoPor: string;
  modificadoPor?: string;
  fechaModificacion?: string;
}

export interface ProductoComercial {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  unidad?: string;
  costo: number; // costo / precio de compra
  precioVenta: number; // precio de venta sugerido
  margen: number; // margen % sobre costo
  recargoConfigurable: number; // recargo adicional %
  stock?: number;
  descripcion?: string;
  activo?: boolean;
  creadoPor?: string;
  createdAt?: string;
}

export interface CatalogoTecnicoAprobado {
  id: string;
  linea: string; // ej: Herrero
  proveedor?: string;
  estadoAprobacion: 'Aprobado por Mazzola' | 'En revisión' | 'No disponible';
  descripcion: string;
  perfilesDisponibles?: string[];
  accesoriosCompatibles?: string[];
  notasTecnicasOficiales?: string;
  fechaAprobacion?: string;
  aprobadoPor?: string;
}

/**
 * FASE 2: ESTRUCTURA TÉCNICA MULTI-FABRICANTE
 * MARCA -> LÍNEA/SISTEMA -> TIPOLOGÍA -> VARIANTE -> COMPONENTES -> PERFILES -> REGLAS TÉCNICAS
 */

export type EstadoRevision = 
  | 'Pendiente de revisión'
  | 'Aprobado'
  | 'Rechazado'
  | 'Modificado por Mazzola';

export interface Marca {
  id: string;
  nombre: string; // ej: "MDT", "Aluar", "Flamia", "Hydro", "Otras marcas"
  codigo?: string; // ej: "MDT", "ALU"
  descripcion?: string;
  activo: boolean;
  fechaCreacion: string;
  creadoPor: string;
}

export interface LineaSistema {
  id: string;
  marcaId: string;
  marcaNombre: string;
  nombre: string; // ej: "MDT 52", "Módena", "Herrero", "A30 New"
  descripcion?: string;
  alias?: string[]; // Para no fusionar sistemas diferentes que se parezcan
  estado: 'Activo' | 'Inactivo' | 'En revisión';
  catalogoId?: string;
  fechaCreacion: string;
}

export interface PaginaRevision {
  pagina: number;
  motivo: string;
  revisado: boolean;
  observaciones?: string;
}

export interface CatalogoDocumento {
  id: string;
  marcaId: string;
  marcaNombre: string;
  lineaId?: string;
  lineaNombre?: string;
  titulo: string;
  nombreArchivoOriginal: string;
  archivoUrl?: string;
  totalPaginas: number;
  estado: 'Cargado' | 'Procesando' | 'Revisión Pendiente' | 'Aprobado' | 'Rechazado' | 'Desactivado';
  estadoRevision: EstadoRevision;
  progresoProcesamiento: {
    porcentaje: number;
    paginaActual: number;
    totalPaginas: number;
    checkpoint?: string;
    estadoChunk?: string;
    chunksTotal?: number;
    chunkActual?: number;
  };
  fechaCarga: string;
  cargadoPor: string;
  fechaRevision?: string;
  revisadoPor?: string;
  notasRevision?: string;
  paginasParaRevision?: PaginaRevision[];
  // Datos estadísticos reales
  cantidadTipologias?: number;
  cantidadPerfiles?: number;
  cantidadReglas?: number;
}

export interface TipologiaTecnica {
  id: string;
  marcaId: string;
  marcaNombre: string;
  lineaId: string;
  lineaNombre: string;
  catalogoId: string;
  nombre: string; // ej: "Ventana Corrediza 2 Hojas", "Paño Fijo"
  codigo?: string;
  descripcion?: string;
  paginaOrigen: number;
  estadoRevision: EstadoRevision;
  datoOriginal?: {
    nombre: string;
    codigo?: string;
    descripcion?: string;
    paginaOrigen: number;
  };
  modificadoPorMazzola?: boolean;
  notasMazzola?: string;
  variantes?: VarianteTipologia[];
}

export interface VarianteTipologia {
  id: string;
  tipologiaId: string;
  nombre: string; // ej: "Vidrio Simple (4mm)", "DVH (hasta 20mm)"
  descripcion?: string;
  paginaOrigen: number;
  estadoRevision: EstadoRevision;
  datoOriginal?: {
    nombre: string;
    descripcion?: string;
  };
  modificadoPorMazzola?: boolean;
}

export interface ComponenteFuncion {
  id: string;
  tipologiaId: string;
  varianteId?: string;
  funcion: string; // Marco superior, Marco inferior, Parante central, Hoja lateral, etc.
  descripcion?: string;
  perfilId?: string;
  perfilCodigo?: string;
  paginaOrigen: number;
  estadoRevision: EstadoRevision;
}

export interface PerfilTecnico {
  id: string;
  marcaId: string;
  marcaNombre: string;
  lineaId: string;
  lineaNombre: string;
  catalogoId: string;
  codigo: string; // Nunca inventar un código
  nombre: string;
  descripcion?: string;
  funcion: string; // Relacionado con su función
  largoComercial?: number; // ej: 6.00 m
  pesoPorMetro?: number; // ej: 0.742 kg/m
  paginaOrigen: number;
  imagenSeccionUrl?: string; // Dibujo o sección si existe
  estado: 'Activo' | 'Inactivo' | 'En revisión';
  estadoRevision: EstadoRevision;
  datoOriginal?: {
    codigo: string;
    nombre: string;
    funcion: string;
    largoComercial?: number;
    pesoPorMetro?: number;
    paginaOrigen: number;
  };
  modificadoPorMazzola?: boolean;
  notasMazzola?: string;
}

export interface ReglaTecnica {
  id: string;
  tipologiaId: string;
  tipologiaNombre: string;
  varianteId?: string;
  varianteNombre?: string;
  componenteFuncionId?: string;
  funcionNombre: string;
  perfilId?: string;
  perfilCodigo: string; // Guardado como dato exacto
  perfilNombre: string;
  cantidad: number;
  formula: string; // Guardada como dato, ej: "A - 42", "H - 56", "A / 2 + 10"
  corteA: string; // ej: "90°", "45°"
  corteB: string; // ej: "90°", "45°"
  orientacion: 'Horizontal' | 'Vertical' | 'Diagonal' | 'Perimetral';
  mecanizado?: string; // ej: "Desagüe en umbral", "Punzón cierres", etc.
  paginaOrigen: number;
  estadoRevision: EstadoRevision;
  datoOriginal?: {
    cantidad: number;
    formula: string;
    corteA: string;
    corteB: string;
    orientacion: string;
    mecanizado?: string;
    paginaOrigen: number;
  };
  modificadoPorMazzola?: boolean;
  notasMazzola?: string;
}

export interface PiezaCorte {
  id: string;
  perfilCodigo: string;
  perfilNombre: string;
  funcion: string;
  pieza: string;
  medidaMm: number;
  formula: string;
  cantidad: number;
  barraAsignada?: string;
  corteA: string; // '90°' | '45°'
  corteB: string; // '90°' | '45°'
  combinacionCortes: string; // '45/45' | '45/90' | '90/45' | '90/90'
  orientacion: 'Horizontal' | 'Vertical' | 'Diagonal' | 'Perimetral';
  mecanizado?: string;
  observaciones?: string;
}

export interface PiezaVidrio {
  id: string;
  pieza: string;
  anchoMm: number;
  altoMm: number;
  cantidad: number;
  espesorTipo: string;
  observaciones?: string;
  fuenteTecnica: string;
}

export interface AccesorioTecnico {
  id: string;
  codigo: string;
  nombre: string;
  funcion: string;
  cantidad: number;
  unidad: string;
  observaciones?: string;
  fuenteTecnica: string;
}

export interface SobranteStock {
  id: string;
  perfilCodigo: string;
  perfilNombre?: string;
  longitudMm: number;
  cantidad: number;
  ubicacion: string;
  estado: 'Disponible' | 'Reservado' | 'Utilizado';
  fecha: string;
  origenOrdenId?: string;
  origenTipo?: string;
  observaciones?: string;
  aprovechable: boolean;
}

export interface BarraOptimizada {
  barraNumero: number;
  perfilCodigo: string;
  perfilNombre: string;
  esSobrante?: boolean;
  sobranteId?: string;
  largoTotalMm: number;
  cortes: Array<{
    piezaId: string;
    pieza: string;
    medidaMm: number;
    anguloA: string;
    anguloB: string;
  }>;
  utilizadoMm: number;
  sobranteMm: number;
  desperdicioMm: number;
}

export interface DatosCalculados {
  totalBarras: number;
  materialUtilizadoMm: number;
  sobranteAprovechableMm: number;
  desperdicioMm: number;
  largoComercialMm: number;
  enfoque: 'material' | 'mazzola';
  distribucionBarras: BarraOptimizada[];
}

export interface DatosReales {
  barrasCompradas?: number;
  barrasUtilizadas?: number;
  sobrantesReales?: number;
  desperdicioRealMm?: number;
  observaciones?: string;
  registrado?: boolean;
  fechaRegistro?: string;
  registradoPor?: string;
}

export interface ReglaVidrio {
  id: string;
  tipologiaId: string;
  pieza: string;
  formulaAncho: string;
  formulaAlto: string;
  cantidadPorAbertura: number;
  espesorTipoSugerido?: string;
  observaciones?: string;
  fuenteTecnica: string;
  estadoRevision: EstadoRevision;
}

export interface ReglaAccesorio {
  id: string;
  tipologiaId: string;
  codigo: string;
  nombre: string;
  funcion: string;
  cantidadPorAbertura: number;
  unidad: string;
  observaciones?: string;
  fuenteTecnica: string;
  estadoRevision: EstadoRevision;
}

export interface OrdenFabricacion {
  id: string;
  numeroOrden?: string;
  presupuestoId: string;
  numeroPresupuesto: string;
  clienteNombre: string;
  item: ItemAbertura;
  itemIndex: number;
  tipologiaNombre?: string;
  varianteNombre?: string;
  medidasStr?: string;
  cantidadTotal?: number;
  estadoFabrica: 'Por Iniciar' | 'Corte' | 'Armado' | 'Vidriado' | 'Listo para Entrega' | 'Finalizado';
  prioridad: 'Normal' | 'Urgente';
  enfoqueOptimizacion?: 'material' | 'mazzola';
  datosCalculados?: DatosCalculados;
  datosReales?: DatosReales;
  listaCorte?: PiezaCorte[];
  listaVidrios?: PiezaVidrio[];
  listaAccesorios?: AccesorioTecnico[];
  sobrantesAsignados?: Array<{
    sobranteId: string;
    perfilCodigo: string;
    longitudMm: number;
    piezaId: string;
  }>;
  fechaIngreso: string;
  observacionesFabrica?: string;
}

export type TipoHistorial = 'presupuesto' | 'venta_rapida' | 'reparacion';

export interface EntradaHistorial {
  id: string;
  tipo: TipoHistorial;
  referenciaId: string;
  codigo: string;
  cliente: string;
  descripcionResumen: string;
  montoVenta: number;
  costoInterno?: number;
  gananciaInterna?: number;
  fecha: string;
  creadoPor: string;
  estado?: string;
  detallesCompletos?: any;
}

export type RolUsuario = 'Administrador' | 'Ventas' | 'Fábrica';

export interface Usuario {
  id: string;
  usuario: string;
  nombre: string;
  email?: string;
  rol: RolUsuario;
  activo: boolean;
  ultimoAcceso?: string;
  createdAt?: string;
}

export interface AuditoriaHistorial {
  id: string;
  usuario: string;
  accion: string;
  elementoTipo: string;
  elementoId?: string;
  detalle: string;
  fecha: string;
  createdAt?: string;
}
