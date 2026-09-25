import { 
  Marca, 
  LineaSistema, 
  CatalogoDocumento, 
  TipologiaTecnica, 
  VarianteTipologia, 
  ComponenteFuncion, 
  PerfilTecnico, 
  ReglaTecnica,
  ReglaVidrio,
  ReglaAccesorio,
  SobranteStock
} from './src/types';

export const SEED_MARCAS: Marca[] = [
  {
    id: "marca-mdt",
    nombre: "MDT",
    codigo: "MDT",
    descripcion: "Metalúrgica Del Toro - Sistemas de perfiles de aluminio extruido para arquitectura.",
    activo: true,
    fechaCreacion: "2026-01-05T08:00:00.000Z",
    creadoPor: "Dirección Técnica Mazzola"
  },
  {
    id: "marca-aluar",
    nombre: "Aluar",
    codigo: "ALU",
    descripcion: "Aluar División Elaborados - Líneas de carpintería tradicional y alta prestación.",
    activo: true,
    fechaCreacion: "2026-01-05T08:00:00.000Z",
    creadoPor: "Dirección Técnica Mazzola"
  },
  {
    id: "marca-flamia",
    nombre: "Flamia",
    codigo: "FLA",
    descripcion: "Flamia Extrusión de perfiles de aluminio.",
    activo: true,
    fechaCreacion: "2026-02-10T10:00:00.000Z",
    creadoPor: "Dirección Técnica Mazzola"
  },
  {
    id: "marca-hydro",
    nombre: "Hydro",
    codigo: "HYD",
    descripcion: "Hydro Aluminium Argentina - Sistemas HA y Rotura de Puente Térmico.",
    activo: true,
    fechaCreacion: "2026-02-15T11:00:00.000Z",
    creadoPor: "Dirección Técnica Mazzola"
  },
  {
    id: "marca-otras",
    nombre: "Otras marcas / Matrices locales",
    codigo: "OTR",
    descripcion: "Fabricantes independientes y matrices homologadas por Mazzola.",
    activo: true,
    fechaCreacion: "2026-03-01T09:00:00.000Z",
    creadoPor: "Dirección Técnica Mazzola"
  }
];

export const SEED_LINEAS: LineaSistema[] = [
  {
    id: "linea-mdt-52",
    marcaId: "marca-mdt",
    marcaNombre: "MDT",
    nombre: "MDT 52",
    descripcion: "Sistema de carpintería de media prestación para corredizas y aberturas batientes.",
    alias: ["MDT52", "Línea 52", "MDT-52 Corrediza"],
    estado: "Activo",
    catalogoId: "cat-mdt-52",
    fechaCreacion: "2026-01-08T09:00:00.000Z"
  },
  {
    id: "linea-aluar-modena",
    marcaId: "marca-aluar",
    marcaNombre: "Aluar",
    nombre: "Módena",
    descripcion: "Sistema clásico de media prestación con corte a 90° y 45°.",
    alias: ["Modena", "Modena 90", "Modena 45", "Modena RPT"],
    estado: "Activo",
    catalogoId: "cat-aluar-modena",
    fechaCreacion: "2026-01-08T09:00:00.000Z"
  },
  {
    id: "linea-aluar-a30",
    marcaId: "marca-aluar",
    marcaNombre: "Aluar",
    nombre: "A30 New",
    descripcion: "Sistema de alta prestación para grandes luces y doble vidriado hermético.",
    alias: ["A30", "A30New", "A30 New RPT"],
    estado: "En revisión",
    catalogoId: "cat-aluar-a30",
    fechaCreacion: "2026-02-01T10:00:00.000Z"
  },
  {
    id: "linea-herrero",
    marcaId: "marca-aluar",
    marcaNombre: "Aluar",
    nombre: "Línea Herrero",
    descripcion: "Carpintería liviana tradicional económica.",
    alias: ["Herrero", "Herrero Tradicional"],
    estado: "Activo",
    catalogoId: "cat-herrero",
    fechaCreacion: "2026-01-08T09:00:00.000Z"
  },
  {
    id: "linea-flamia-s20",
    marcaId: "marca-flamia",
    marcaNombre: "Flamia",
    nombre: "Serie 20",
    descripcion: "Línea corrediza liviana para vivienda social y reformas.",
    alias: ["S20", "Flamia 20"],
    estado: "En revisión",
    catalogoId: "cat-flamia-s20",
    fechaCreacion: "2026-02-15T14:00:00.000Z"
  }
];

export const SEED_CATALOGOS_DOCUMENTOS: CatalogoDocumento[] = [
  {
    id: "cat-mdt-52",
    marcaId: "marca-mdt",
    marcaNombre: "MDT",
    lineaId: "linea-mdt-52",
    lineaNombre: "MDT 52",
    titulo: "Manual Técnico Oficial MDT 52 (Edición Completa)",
    nombreArchivoOriginal: "MDT52_Manual_Tecnico_Oficial_2025.pdf",
    archivoUrl: "/docs/MDT52_Manual_Tecnico_Oficial_2025.pdf",
    totalPaginas: 48,
    estado: "Aprobado",
    estadoRevision: "Aprobado",
    progresoProcesamiento: {
      porcentaje: 100,
      paginaActual: 48,
      totalPaginas: 48,
      checkpoint: "Fin de documento - 6 de 6 bloques procesados",
      estadoChunk: "Completado",
      chunksTotal: 6,
      chunkActual: 6
    },
    fechaCarga: "2026-01-10T09:00:00.000Z",
    cargadoPor: "Mazzola Dirección Técnica",
    fechaRevision: "2026-01-12T14:00:00.000Z",
    revisadoPor: "Ing. Mazzola",
    notasRevision: "Manual homologado en su totalidad. Fórmulas de corte y perfiles validados con matrices de taller.",
    paginasParaRevision: [],
    cantidadTipologias: 3,
    cantidadPerfiles: 6,
    cantidadReglas: 8
  },
  {
    id: "cat-aluar-modena",
    marcaId: "marca-aluar",
    marcaNombre: "Aluar",
    lineaId: "linea-aluar-modena",
    lineaNombre: "Módena",
    titulo: "Catálogo Técnico de Fabricación Aluar Módena",
    nombreArchivoOriginal: "Aluar_Modena_Catalogo_Fabricacion.pdf",
    archivoUrl: "/docs/Aluar_Modena_Catalogo_Fabricacion.pdf",
    totalPaginas: 64,
    estado: "Aprobado",
    estadoRevision: "Modificado por Mazzola",
    progresoProcesamiento: {
      porcentaje: 100,
      paginaActual: 64,
      totalPaginas: 64,
      checkpoint: "Fin de documento - 8 de 8 bloques procesados",
      estadoChunk: "Completado",
      chunksTotal: 8,
      chunkActual: 8
    },
    fechaCarga: "2026-01-15T11:30:00.000Z",
    cargadoPor: "Mazzola Dirección Técnica",
    fechaRevision: "2026-01-18T16:00:00.000Z",
    revisadoPor: "Taller Mazzola",
    notasRevision: "Revisado por Mazzola: se ajustó la holgura en zócalo inferior para felpa cortaviento de 7x6 mm sin perder dato de catálogo original.",
    paginasParaRevision: [],
    cantidadTipologias: 2,
    cantidadPerfiles: 5,
    cantidadReglas: 6
  },
  {
    id: "cat-flamia-s20",
    marcaId: "marca-flamia",
    marcaNombre: "Flamia",
    lineaId: "linea-flamia-s20",
    lineaNombre: "Serie 20",
    titulo: "Folleto Técnico Flamia Serie 20",
    nombreArchivoOriginal: "Flamia_Serie20_Taller.pdf",
    archivoUrl: "/docs/Flamia_Serie20_Taller.pdf",
    totalPaginas: 18,
    estado: "Revisión Pendiente",
    estadoRevision: "Pendiente de revisión",
    progresoProcesamiento: {
      porcentaje: 100,
      paginaActual: 18,
      totalPaginas: 18,
      checkpoint: "Procesado completo - 2 páginas con advertencias técnicas marcadas para revisión humana",
      estadoChunk: "Pendiente de verificación manual",
      chunksTotal: 3,
      chunkActual: 3
    },
    fechaCarga: "2026-02-20T14:15:00.000Z",
    cargadoPor: "Mazzola Taller",
    paginasParaRevision: [
      {
        pagina: 8,
        motivo: "Cota milimétrica de umbral no legible en tabla de cortes. No se inventó fórmula.",
        revisado: false,
        observaciones: "Requiere medir perfil físico en pañol."
      },
      {
        pagina: 14,
        motivo: "Mecanizado de escuadra no especificado con claridad en plano de ensamble.",
        revisado: false,
        observaciones: "Consultar con representante técnico de Flamia."
      }
    ],
    cantidadTipologias: 1,
    cantidadPerfiles: 3,
    cantidadReglas: 2
  },
  {
    id: "cat-aluar-a30",
    marcaId: "marca-aluar",
    marcaNombre: "Aluar",
    lineaId: "linea-aluar-a30",
    lineaNombre: "A30 New",
    titulo: "Catálogo Oficial Aluar A30 New (Alta Prestación)",
    nombreArchivoOriginal: "Aluar_A30_New_Manual.pdf",
    totalPaginas: 82,
    estado: "Desactivado",
    estadoRevision: "Pendiente de revisión",
    progresoProcesamiento: {
      porcentaje: 0,
      paginaActual: 0,
      totalPaginas: 82,
      checkpoint: "No iniciado - En espera de aprobación de catálogo",
      chunksTotal: 10,
      chunkActual: 0
    },
    fechaCarga: "2026-02-25T10:00:00.000Z",
    cargadoPor: "Mazzola Administración",
    paginasParaRevision: [],
    cantidadTipologias: 0,
    cantidadPerfiles: 0,
    cantidadReglas: 0
  }
];

export const SEED_TIPOLOGIAS: TipologiaTecnica[] = [
  // TIPOLOGÍAS DE MDT 52 (Catálogo Aprobado)
  {
    id: "tip-mdt52-c2h",
    marcaId: "marca-mdt",
    marcaNombre: "MDT",
    lineaId: "linea-mdt-52",
    lineaNombre: "MDT 52",
    catalogoId: "cat-mdt-52",
    nombre: "Ventana Corrediza 2 Hojas (MDT 52)",
    codigo: "MDT-C2H",
    descripcion: "Ventana corrediza perimetral de dos hojas móviles sobre marco de dos guías.",
    paginaOrigen: 14,
    estadoRevision: "Aprobado",
    datoOriginal: {
      nombre: "Ventana Corrediza 2 Hojas (MDT 52)",
      codigo: "MDT-C2H",
      descripcion: "Ventana corrediza perimetral de dos hojas móviles sobre marco de dos guías.",
      paginaOrigen: 14
    },
    modificadoPorMazzola: false
  },
  {
    id: "tip-mdt52-pf",
    marcaId: "marca-mdt",
    marcaNombre: "MDT",
    lineaId: "linea-mdt-52",
    lineaNombre: "MDT 52",
    catalogoId: "cat-mdt-52",
    nombre: "Paño Fijo (MDT 52)",
    codigo: "MDT-PF",
    descripcion: "Abertura fija sin hojas móviles con contravidrios rectos o curvos.",
    paginaOrigen: 28,
    estadoRevision: "Aprobado",
    datoOriginal: {
      nombre: "Paño Fijo (MDT 52)",
      codigo: "MDT-PF",
      descripcion: "Abertura fija sin hojas móviles con contravidrios rectos o curvos.",
      paginaOrigen: 28
    },
    modificadoPorMazzola: false
  },
  {
    id: "tip-mdt52-bat",
    marcaId: "marca-mdt",
    marcaNombre: "MDT",
    lineaId: "linea-mdt-52",
    lineaNombre: "MDT 52",
    catalogoId: "cat-mdt-52",
    nombre: "Ventana de Abrir 1 Hoja / Banderola (MDT 52)",
    codigo: "MDT-BAT1",
    descripcion: "Ventana batiente de abrir interior o banderola con aldaba y compases.",
    paginaOrigen: 34,
    estadoRevision: "Aprobado",
    datoOriginal: {
      nombre: "Ventana de Abrir 1 Hoja / Banderola (MDT 52)",
      codigo: "MDT-BAT1",
      descripcion: "Ventana batiente de abrir interior o banderola con aldaba y compases.",
      paginaOrigen: 34
    },
    modificadoPorMazzola: false
  },

  // TIPOLOGÍAS DE ALUAR MÓDENA (Catálogo Aprobado con Modificación de Mazzola)
  {
    id: "tip-modena-c2h-90",
    marcaId: "marca-aluar",
    marcaNombre: "Aluar",
    lineaId: "linea-aluar-modena",
    lineaNombre: "Módena",
    catalogoId: "cat-aluar-modena",
    nombre: "Ventana Corrediza 2 Hojas Corte 90° (Módena)",
    codigo: "MOD-C2H-90",
    descripcion: "Ventana corrediza con armado de hojas y marco a 90° con tornillos.",
    paginaOrigen: 18,
    estadoRevision: "Modificado por Mazzola",
    datoOriginal: {
      nombre: "Ventana Corrediza 2 Hojas Módena 90°",
      codigo: "MOD-C2H-90",
      descripcion: "Ventana corrediza con corte recto.",
      paginaOrigen: 18
    },
    modificadoPorMazzola: true,
    notasMazzola: "Ajuste de tolerancia de escuadra de alineación según pañol Mazzola."
  },
  {
    id: "tip-modena-pa",
    marcaId: "marca-aluar",
    marcaNombre: "Aluar",
    lineaId: "linea-aluar-modena",
    lineaNombre: "Módena",
    catalogoId: "cat-aluar-modena",
    nombre: "Puerta de Abrir 1 Hoja (Módena)",
    codigo: "MOD-PA1",
    descripcion: "Puerta batiente de 1 hoja con cerradura y doble contacto.",
    paginaOrigen: 36,
    estadoRevision: "Aprobado",
    datoOriginal: {
      nombre: "Puerta de Abrir 1 Hoja Módena",
      codigo: "MOD-PA1",
      descripcion: "Puerta batiente de 1 hoja con cerradura y doble contacto.",
      paginaOrigen: 36
    },
    modificadoPorMazzola: false
  }
];

export const SEED_VARIANTES: VarianteTipologia[] = [
  {
    id: "var-mdt-c2h-simple",
    tipologiaId: "tip-mdt52-c2h",
    nombre: "Vidrio Simple (4mm - 6mm)",
    descripcion: "Configuración estándar de hoja para vidrio monolítico con burlete.",
    paginaOrigen: 14,
    estadoRevision: "Aprobado"
  },
  {
    id: "var-mdt-c2h-dvh",
    tipologiaId: "tip-mdt52-c2h",
    nombre: "Doble Vidriado Hermético (DVH hasta 20mm)",
    descripcion: "Perfil de hoja rebajado o contravidrio especial para cámara de aire.",
    paginaOrigen: 15,
    estadoRevision: "Aprobado"
  },
  {
    id: "var-modena-c2h-simple",
    tipologiaId: "tip-modena-c2h-90",
    nombre: "Vidrio Simple 4mm / 5mm",
    descripcion: "Armado de hoja con burlete cuña y base U.",
    paginaOrigen: 18,
    estadoRevision: "Aprobado"
  },
  {
    id: "var-modena-c2h-dvh",
    tipologiaId: "tip-modena-c2h-90",
    nombre: "DVH 4/9/4 (hasta 18mm)",
    descripcion: "Armado de hoja para doble vidrio hermético.",
    paginaOrigen: 19,
    estadoRevision: "Aprobado"
  }
];

export const SEED_COMPONENTES_FUNCIONES: ComponenteFuncion[] = [
  // Componentes de Ventana Corrediza MDT 52
  {
    id: "comp-mdt-marco-sup",
    tipologiaId: "tip-mdt52-c2h",
    funcion: "Marco Superior (Cabezal)",
    descripcion: "Guía superior de deslizamiento de hojas",
    perfilCodigo: "6201",
    paginaOrigen: 14,
    estadoRevision: "Aprobado"
  },
  {
    id: "comp-mdt-marco-inf",
    tipologiaId: "tip-mdt52-c2h",
    funcion: "Marco Inferior (Umbral)",
    descripcion: "Guía inferior con pistas de rodadura y desagües",
    perfilCodigo: "6201",
    paginaOrigen: 14,
    estadoRevision: "Aprobado"
  },
  {
    id: "comp-mdt-marco-lat",
    tipologiaId: "tip-mdt52-c2h",
    funcion: "Marco Lateral (Jambas)",
    descripcion: "Laterales de marco con felpa y alojamiento de cierre",
    perfilCodigo: "6201",
    paginaOrigen: 14,
    estadoRevision: "Aprobado"
  },
  {
    id: "comp-mdt-hoja-lat",
    tipologiaId: "tip-mdt52-c2h",
    funcion: "Hoja Lateral (Parante Cierre / Enganche)",
    descripcion: "Parante lateral de hoja corrediza",
    perfilCodigo: "6205",
    paginaOrigen: 14,
    estadoRevision: "Aprobado"
  },
  {
    id: "comp-mdt-hoja-cen",
    tipologiaId: "tip-mdt52-c2h",
    funcion: "Hoja Central (Parante Encuentro)",
    descripcion: "Perfil de cruce central hermético",
    perfilCodigo: "6209",
    paginaOrigen: 15,
    estadoRevision: "Aprobado"
  },
  {
    id: "comp-mdt-hoja-hor",
    tipologiaId: "tip-mdt52-c2h",
    funcion: "Hoja Horizontal (Zócalo y Cabezal)",
    descripcion: "Perfiles horizontales superior e inferior de cada hoja",
    perfilCodigo: "6205",
    paginaOrigen: 14,
    estadoRevision: "Aprobado"
  }
];

export const SEED_PERFILES: PerfilTecnico[] = [
  // PERFILES OFICIALES MDT 52 (Códigos exactos del manual)
  {
    id: "perf-mdt-6201",
    marcaId: "marca-mdt",
    marcaNombre: "MDT",
    lineaId: "linea-mdt-52",
    lineaNombre: "MDT 52",
    catalogoId: "cat-mdt-52",
    codigo: "6201",
    nombre: "Marco 2 Guías",
    descripcion: "Perfil de marco perimetral de dos guías para corrediza.",
    funcion: "Marco perimetral (Cabezal, Umbral y Jambas)",
    largoComercial: 6.00,
    pesoPorMetro: 0.890,
    paginaOrigen: 14,
    estado: "Activo",
    estadoRevision: "Aprobado",
    datoOriginal: {
      codigo: "6201",
      nombre: "Marco 2 Guías",
      funcion: "Marco perimetral (Cabezal, Umbral y Jambas)",
      largoComercial: 6.00,
      pesoPorMetro: 0.890,
      paginaOrigen: 14
    },
    modificadoPorMazzola: false
  },
  {
    id: "perf-mdt-6205",
    marcaId: "marca-mdt",
    marcaNombre: "MDT",
    lineaId: "linea-mdt-52",
    lineaNombre: "MDT 52",
    catalogoId: "cat-mdt-52",
    codigo: "6205",
    nombre: "Hoja Corrediza Lateral / Zócalo",
    descripcion: "Perfil tubular de hoja corrediza para lados y horizontales.",
    funcion: "Zócalos, cabezales y laterales de hoja",
    largoComercial: 6.00,
    pesoPorMetro: 0.745,
    paginaOrigen: 14,
    estado: "Activo",
    estadoRevision: "Aprobado",
    datoOriginal: {
      codigo: "6205",
      nombre: "Hoja Corrediza Lateral / Zócalo",
      funcion: "Zócalos, cabezales y laterales de hoja",
      largoComercial: 6.00,
      pesoPorMetro: 0.745,
      paginaOrigen: 14
    },
    modificadoPorMazzola: false
  },
  {
    id: "perf-mdt-6209",
    marcaId: "marca-mdt",
    marcaNombre: "MDT",
    lineaId: "linea-mdt-52",
    lineaNombre: "MDT 52",
    catalogoId: "cat-mdt-52",
    codigo: "6209",
    nombre: "Parante Central Encuentro",
    descripcion: "Perfil de encuentro central para cruce de hojas con labio para felpa.",
    funcion: "Cruce y encuentro central hermético",
    largoComercial: 6.00,
    pesoPorMetro: 0.815,
    paginaOrigen: 15,
    estado: "Activo",
    estadoRevision: "Aprobado",
    datoOriginal: {
      codigo: "6209",
      nombre: "Parante Central Encuentro",
      funcion: "Cruce y encuentro central hermético",
      largoComercial: 6.00,
      pesoPorMetro: 0.815,
      paginaOrigen: 15
    },
    modificadoPorMazzola: false
  },
  {
    id: "perf-mdt-6212",
    marcaId: "marca-mdt",
    marcaNombre: "MDT",
    lineaId: "linea-mdt-52",
    lineaNombre: "MDT 52",
    catalogoId: "cat-mdt-52",
    codigo: "6212",
    nombre: "Guía Adicional de Mosquitero",
    descripcion: "Perfil clipsable o atornillable exterior para hoja mosquitero.",
    funcion: "Guía exterior de mosquitero",
    largoComercial: 6.00,
    pesoPorMetro: 0.410,
    paginaOrigen: 16,
    estado: "Activo",
    estadoRevision: "Aprobado",
    datoOriginal: {
      codigo: "6212",
      nombre: "Guía Adicional de Mosquitero",
      funcion: "Guía exterior de mosquitero",
      largoComercial: 6.00,
      pesoPorMetro: 0.410,
      paginaOrigen: 16
    },
    modificadoPorMazzola: false
  },
  {
    id: "perf-mdt-6218",
    marcaId: "marca-mdt",
    marcaNombre: "MDT",
    lineaId: "linea-mdt-52",
    lineaNombre: "MDT 52",
    catalogoId: "cat-mdt-52",
    codigo: "6218",
    nombre: "Contravidrio Recto",
    descripcion: "Perfil a presión para fijación de vidrio y juntas.",
    funcion: "Contravidrio de sujeción",
    largoComercial: 6.00,
    pesoPorMetro: 0.185,
    paginaOrigen: 15,
    estado: "Activo",
    estadoRevision: "Aprobado",
    datoOriginal: {
      codigo: "6218",
      nombre: "Contravidrio Recto",
      funcion: "Contravidrio de sujeción",
      largoComercial: 6.00,
      pesoPorMetro: 0.185,
      paginaOrigen: 15
    },
    modificadoPorMazzola: false
  },
  {
    id: "perf-mdt-6225",
    marcaId: "marca-mdt",
    marcaNombre: "MDT",
    lineaId: "linea-mdt-52",
    lineaNombre: "MDT 52",
    catalogoId: "cat-mdt-52",
    codigo: "6225",
    nombre: "Marco Paño Fijo",
    descripcion: "Marco perimetral para abertura fija.",
    funcion: "Marco perimetral de paño fijo",
    largoComercial: 6.00,
    pesoPorMetro: 0.690,
    paginaOrigen: 28,
    estado: "Activo",
    estadoRevision: "Aprobado",
    datoOriginal: {
      codigo: "6225",
      nombre: "Marco Paño Fijo",
      funcion: "Marco perimetral de paño fijo",
      largoComercial: 6.00,
      pesoPorMetro: 0.690,
      paginaOrigen: 28
    },
    modificadoPorMazzola: false
  },

  // PERFILES OFICIALES ALUAR MÓDENA
  {
    id: "perf-alu-6201",
    marcaId: "marca-aluar",
    marcaNombre: "Aluar",
    lineaId: "linea-aluar-modena",
    lineaNombre: "Módena",
    catalogoId: "cat-aluar-modena",
    codigo: "6201-ALU",
    nombre: "Marco 2 Guías Módena",
    descripcion: "Marco perimetral corredizo Aluar Módena corte 90°.",
    funcion: "Marco perimetral corredizo",
    largoComercial: 6.00,
    pesoPorMetro: 0.895,
    paginaOrigen: 18,
    estado: "Activo",
    estadoRevision: "Aprobado",
    datoOriginal: {
      codigo: "6201-ALU",
      nombre: "Marco 2 Guías Módena",
      funcion: "Marco perimetral corredizo",
      largoComercial: 6.00,
      pesoPorMetro: 0.895,
      paginaOrigen: 18
    },
    modificadoPorMazzola: false
  },
  {
    id: "perf-alu-6205",
    marcaId: "marca-aluar",
    marcaNombre: "Aluar",
    lineaId: "linea-aluar-modena",
    lineaNombre: "Módena",
    catalogoId: "cat-aluar-modena",
    codigo: "6205-ALU",
    nombre: "Zócalo / Cabezal Módena 90°",
    descripcion: "Perfil horizontal de hoja corrediza Módena.",
    funcion: "Zócalo y cabezal de hoja",
    largoComercial: 6.00,
    pesoPorMetro: 0.740,
    paginaOrigen: 18,
    estado: "Activo",
    estadoRevision: "Modificado por Mazzola",
    datoOriginal: {
      codigo: "6205-ALU",
      nombre: "Zócalo / Cabezal Módena 90°",
      funcion: "Zócalo y cabezal de hoja",
      largoComercial: 6.00,
      pesoPorMetro: 0.740,
      paginaOrigen: 18
    },
    modificadoPorMazzola: true,
    notasMazzola: "Ajuste de fresado para drenajes de condensación interiores en taller Mazzola."
  },
  {
    id: "perf-alu-6207",
    marcaId: "marca-aluar",
    marcaNombre: "Aluar",
    lineaId: "linea-aluar-modena",
    lineaNombre: "Módena",
    catalogoId: "cat-aluar-modena",
    codigo: "6207-ALU",
    nombre: "Parante Lateral de Cierre",
    descripcion: "Parante lateral de hoja corrediza con alojamiento para cierre embutido.",
    funcion: "Parante lateral con cierre",
    largoComercial: 6.00,
    pesoPorMetro: 0.760,
    paginaOrigen: 19,
    estado: "Activo",
    estadoRevision: "Aprobado",
    datoOriginal: {
      codigo: "6207-ALU",
      nombre: "Parante Lateral de Cierre",
      funcion: "Parante lateral con cierre",
      largoComercial: 6.00,
      pesoPorMetro: 0.760,
      paginaOrigen: 19
    },
    modificadoPorMazzola: false
  }
];

export const SEED_REGLAS_TECNICAS: ReglaTecnica[] = [
  // REGLAS TÉCNICAS REALES MDT 52 (Página 14-15)
  // Marco superior e inferior
  {
    id: "reg-mdt-marco-hor",
    tipologiaId: "tip-mdt52-c2h",
    tipologiaNombre: "Ventana Corrediza 2 Hojas (MDT 52)",
    componenteFuncionId: "comp-mdt-marco-sup",
    funcionNombre: "Marco Superior / Inferior (Cabezal y Umbral)",
    perfilId: "perf-mdt-6201",
    perfilCodigo: "6201",
    perfilNombre: "Marco 2 Guías",
    cantidad: 2,
    formula: "A", // Guardada como DATO EXACTO
    corteA: "90°",
    corteB: "90°",
    orientacion: "Horizontal",
    mecanizado: "Desagüe en umbral (3 ranuras de 30x5mm con válvula deflector)",
    paginaOrigen: 14,
    estadoRevision: "Aprobado",
    datoOriginal: {
      cantidad: 2,
      formula: "A",
      corteA: "90°",
      corteB: "90°",
      orientacion: "Horizontal",
      mecanizado: "Desagüe en umbral",
      paginaOrigen: 14
    },
    modificadoPorMazzola: false
  },
  // Marco laterales
  {
    id: "reg-mdt-marco-ver",
    tipologiaId: "tip-mdt52-c2h",
    tipologiaNombre: "Ventana Corrediza 2 Hojas (MDT 52)",
    componenteFuncionId: "comp-mdt-marco-lat",
    funcionNombre: "Marco Lateral (Jambas)",
    perfilId: "perf-mdt-6201",
    perfilCodigo: "6201",
    perfilNombre: "Marco 2 Guías",
    cantidad: 2,
    formula: "H", // Ancho y alto exactos
    corteA: "90°",
    corteB: "90°",
    orientacion: "Vertical",
    mecanizado: "Mecanizado de tornillo de fijación a 45mm de extremos",
    paginaOrigen: 14,
    estadoRevision: "Aprobado",
    datoOriginal: {
      cantidad: 2,
      formula: "H",
      corteA: "90°",
      corteB: "90°",
      orientacion: "Vertical",
      mecanizado: "Mecanizado de tornillo de fijación a 45mm de extremos",
      paginaOrigen: 14
    },
    modificadoPorMazzola: false
  },
  // Zócalo y cabezal de hoja corrediza
  {
    id: "reg-mdt-hoja-hor",
    tipologiaId: "tip-mdt52-c2h",
    tipologiaNombre: "Ventana Corrediza 2 Hojas (MDT 52)",
    componenteFuncionId: "comp-mdt-hoja-hor",
    funcionNombre: "Zócalos y Cabezales de Hoja",
    perfilId: "perf-mdt-6205",
    perfilCodigo: "6205",
    perfilNombre: "Hoja Corrediza Lateral / Zócalo",
    cantidad: 4,
    formula: "(A / 2) + 6", // Guardada como DATO EXACTO de catálogo
    corteA: "90°",
    corteB: "90°",
    orientacion: "Horizontal",
    mecanizado: "Punzón para paso de felpa y alojamiento de rodamiento",
    paginaOrigen: 15,
    estadoRevision: "Aprobado",
    datoOriginal: {
      cantidad: 4,
      formula: "(A / 2) + 6",
      corteA: "90°",
      corteB: "90°",
      orientacion: "Horizontal",
      mecanizado: "Punzón para paso de felpa y alojamiento de rodamiento",
      paginaOrigen: 15
    },
    modificadoPorMazzola: false
  },
  // Parante de enganche y cierre de hoja corrediza
  {
    id: "reg-mdt-hoja-ver",
    tipologiaId: "tip-mdt52-c2h",
    tipologiaNombre: "Ventana Corrediza 2 Hojas (MDT 52)",
    componenteFuncionId: "comp-mdt-hoja-lat",
    funcionNombre: "Parantes Laterales y Encuentros",
    perfilId: "perf-mdt-6205",
    perfilCodigo: "6205",
    perfilNombre: "Hoja Corrediza Lateral / Zócalo",
    cantidad: 4,
    formula: "H - 42", // Guardada como DATO EXACTO
    corteA: "90°",
    corteB: "90°",
    orientacion: "Vertical",
    mecanizado: "Troquelado para cierre lateral embutido",
    paginaOrigen: 15,
    estadoRevision: "Aprobado",
    datoOriginal: {
      cantidad: 4,
      formula: "H - 42",
      corteA: "90°",
      corteB: "90°",
      orientacion: "Vertical",
      mecanizado: "Troquelado para cierre lateral embutido",
      paginaOrigen: 15
    },
    modificadoPorMazzola: false
  },

  // REGLAS TÉCNICAS ALUAR MÓDENA
  {
    id: "reg-mod-marco-hor",
    tipologiaId: "tip-modena-c2h-90",
    tipologiaNombre: "Ventana Corrediza 2 Hojas Corte 90° (Módena)",
    funcionNombre: "Marco Superior / Inferior Módena",
    perfilCodigo: "6201-ALU",
    perfilNombre: "Marco 2 Guías Módena",
    cantidad: 2,
    formula: "A - 2", // Dato de catálogo
    corteA: "90°",
    corteB: "90°",
    orientacion: "Horizontal",
    mecanizado: "Desagüe en umbral",
    paginaOrigen: 18,
    estadoRevision: "Aprobado",
    datoOriginal: {
      cantidad: 2,
      formula: "A - 2",
      corteA: "90°",
      corteB: "90°",
      orientacion: "Horizontal",
      paginaOrigen: 18
    },
    modificadoPorMazzola: false
  },
  {
    id: "reg-mod-hoja-hor",
    tipologiaId: "tip-modena-c2h-90",
    tipologiaNombre: "Ventana Corrediza 2 Hojas Corte 90° (Módena)",
    funcionNombre: "Zócalos y Cabezales Módena",
    perfilCodigo: "6205-ALU",
    perfilNombre: "Zócalo / Cabezal Módena 90°",
    cantidad: 4,
    formula: "(A / 2) + 8", // Modificado por Mazzola: catálogo original decía (A/2)+6
    corteA: "90°",
    corteB: "90°",
    orientacion: "Horizontal",
    mecanizado: "Ajuste de felpa 7x6 en taller",
    paginaOrigen: 18,
    estadoRevision: "Modificado por Mazzola",
    datoOriginal: {
      cantidad: 4,
      formula: "(A / 2) + 6",
      corteA: "90°",
      corteB: "90°",
      orientacion: "Horizontal",
      mecanizado: "Estándar catálogo Aluar",
      paginaOrigen: 18
    },
    modificadoPorMazzola: true,
    notasMazzola: "Mazzola modificó la fórmula de (A/2)+6 a (A/2)+8 para mayor solape en viento sur. Se preserva el dato original Aluar."
  }
];

export const SEED_REGLAS_VIDRIOS: ReglaVidrio[] = [
  // REGLAS TÉCNICAS OFICIALES DE VIDRIO MDT 52 (Página 15)
  {
    id: "reg-vid-mdt-c2h",
    tipologiaId: "tip-mdt52-c2h",
    pieza: "Paño Hoja Móvil Corrediza",
    formulaAncho: "(A / 2) - 67",
    formulaAlto: "H - 156",
    cantidadPorAbertura: 2,
    espesorTipoSugerido: "Float 4mm / DVH 4-9-4",
    observaciones: "Descuento milimétrico de catálogo MDT 52 para perfil de hoja 6205",
    fuenteTecnica: "Catálogo Oficial MDT 52 Pág. 15",
    estadoRevision: "Aprobado"
  }
];

export const SEED_REGLAS_ACCESORIOS: ReglaAccesorio[] = [
  // REGLAS TÉCNICAS OFICIALES DE ACCESORIOS MDT 52 (Páginas 15-16)
  {
    id: "reg-acc-mdt-rod",
    tipologiaId: "tip-mdt52-c2h",
    codigo: "MDT-R52",
    nombre: "Rodamiento a bolilla regulable en nylon",
    funcion: "Rodamiento inferior de hoja corrediza",
    cantidadPorAbertura: 4,
    unidad: "U",
    observaciones: "2 rodamientos por hoja móvil en zócalo 6205",
    fuenteTecnica: "Catálogo Oficial MDT 52 Pág. 16",
    estadoRevision: "Aprobado"
  },
  {
    id: "reg-acc-mdt-cie",
    tipologiaId: "tip-mdt52-c2h",
    codigo: "MDT-C52",
    nombre: "Cierre lateral embutido manual con recibidor",
    funcion: "Cierre y traba lateral embutida en parante",
    cantidadPorAbertura: 2,
    unidad: "U",
    observaciones: "1 cierre por hoja en parante 6205",
    fuenteTecnica: "Catálogo Oficial MDT 52 Pág. 16",
    estadoRevision: "Aprobado"
  },
  {
    id: "reg-acc-mdt-gui",
    tipologiaId: "tip-mdt52-c2h",
    codigo: "MDT-G52",
    nombre: "Guía superior antirruido con patín de nylon",
    funcion: "Guiado superior de hoja corrediza en cabezal",
    cantidadPorAbertura: 4,
    unidad: "U",
    observaciones: "2 guiadores por hoja superior",
    fuenteTecnica: "Catálogo Oficial MDT 52 Pág. 16",
    estadoRevision: "Aprobado"
  },
  {
    id: "reg-acc-mdt-tap",
    tipologiaId: "tip-mdt52-c2h",
    codigo: "MDT-T52",
    nombre: "Tapón hermético de cruce central",
    funcion: "Sellado hermético de cruce de hojas",
    cantidadPorAbertura: 2,
    unidad: "U",
    observaciones: "Hermeticidad superior e inferior en encuentro",
    fuenteTecnica: "Catálogo Oficial MDT 52 Pág. 16",
    estadoRevision: "Aprobado"
  },
  {
    id: "reg-acc-mdt-des",
    tipologiaId: "tip-mdt52-c2h",
    codigo: "MDT-DEF",
    nombre: "Válvula deflectora con clapeta para desagüe",
    funcion: "Desagüe en umbral exterior",
    cantidadPorAbertura: 2,
    unidad: "U",
    observaciones: "Montaje exterior en ranuras de umbral 6201",
    fuenteTecnica: "Catálogo Oficial MDT 52 Pág. 16",
    estadoRevision: "Aprobado"
  }
];

export const SEED_SOBRANTES: SobranteStock[] = [
  {
    id: "sob-mdt-6201-1",
    perfilCodigo: "6201",
    perfilNombre: "Marco 2 Guías",
    longitudMm: 1850,
    cantidad: 1,
    ubicacion: "Estantería Retazos A1 - Pañol",
    estado: "Disponible",
    fecha: "2026-03-10",
    observaciones: "Retazo limpio aprovechable de producción anterior",
    aprovechable: true
  },
  {
    id: "sob-mdt-6205-1",
    perfilCodigo: "6205",
    perfilNombre: "Hoja Corrediza Lateral / Zócalo",
    longitudMm: 1250,
    cantidad: 1,
    ubicacion: "Estantería Retazos B2 - Pañol",
    estado: "Disponible",
    fecha: "2026-03-12",
    observaciones: "Corte sobrante disponible para reutilizar",
    aprovechable: true
  }
];
