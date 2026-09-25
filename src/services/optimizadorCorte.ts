import {
  PiezaCorte,
  PiezaVidrio,
  AccesorioTecnico,
  SobranteStock,
  DatosCalculados,
  BarraOptimizada,
  ReglaTecnica,
  ReglaVidrio,
  ReglaAccesorio,
  ItemAbertura,
  TipologiaTecnica
} from '../types';

/**
 * Evaluador seguro de fórmulas algebraicas de catálogo (A = Ancho, H = Alto).
 * Sin uso de eval() arbitrario para garantizar seguridad y robustez milimétrica.
 */
export function evaluarFormulaTecnica(formula: string, anchoMm: number, altoMm: number): number {
  if (!formula || typeof formula !== 'string') return 0;
  
  // Limpiar espacios
  let expr = formula.trim().toUpperCase();

  // Reemplazar A y H como palabras completas
  expr = expr.replace(/\bA\b/g, String(anchoMm));
  expr = expr.replace(/\bH\b/g, String(altoMm));

  // Solo permitir caracteres matemáticos seguros: números, punto, +, -, *, /, (, )
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
    console.warn(`[Evaluador] Fórmula contiene caracteres no permitidos: "${formula}"`);
    return 0;
  }

  try {
    // Evaluación segura mediante Function pura sin acceso al scope
    const fn = new Function(`return (${expr});`);
    const res = fn();
    if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
      return Math.round(res);
    }
  } catch (err) {
    console.error(`[Evaluador] Error evaluando fórmula "${formula}" con A=${anchoMm}, H=${altoMm}:`, err);
  }
  return 0;
}

export interface ResultadoGeneracionTecnica {
  valido: boolean;
  motivoRechazo?: string;
  detallesFaltantes?: string[];
  listaCorte: PiezaCorte[];
  listaVidrios: PiezaVidrio[];
  listaAccesorios: AccesorioTecnico[];
  sobrantesSugeridos: Array<{
    sobrante: SobranteStock;
    piezaAlineada: string;
    perfilCodigo: string;
    longitudMm: number;
    medidaPiezaMm: number;
  }>;
}

/**
 * Valida la existencia estricta de reglas técnicas aprobadas y genera las listas técnicas.
 * "NO inventar reglas técnicas. La lógica de fabricación debe utilizar únicamente datos técnicos cargados y aprobados."
 * "Si faltan reglas: NO SE PUEDE GENERAR ORDEN DE FABRICACIÓN — INFORMACIÓN TÉCNICA INCOMPLETA"
 */
export function generarListasTecnicas(
  item: ItemAbertura,
  todasLasReglas: ReglaTecnica[],
  todasLasReglasVidrios: ReglaVidrio[],
  todasLasReglasAccesorios: ReglaAccesorio[],
  stockSobrantes: SobranteStock[] = [],
  todasLasTipologias: TipologiaTecnica[] = []
): ResultadoGeneracionTecnica {
  const faltantes: string[] = [];

  const tipologiaNombre = (item.tipologia || '').trim().toLowerCase();
  const lineaNombre = (item.linea || '').trim().toLowerCase();

  // Mapa de nombres de tipologías registradas en el sistema
  const mapTipologias = new Map<string, string>();
  for (const t of todasLasTipologias) {
    mapTipologias.set(t.id, t.nombre.toLowerCase());
  }

  // Buscar reglas técnicas asociadas a la tipología del ítem
  // Las reglas aprobadas en el sistema pertenecen a catálogos oficiales homologados (MDT, Aluar)
  const reglasPerfileria = todasLasReglas.filter(r => {
    const tipR = (r.tipologiaNombre || mapTipologias.get(r.tipologiaId) || '').trim().toLowerCase();
    if (!tipR) return false;

    const coincideDirecto = tipR.includes(tipologiaNombre) || tipologiaNombre.includes(tipR);
    const coincideCorrediza2H = (tipologiaNombre.includes('corrediza') && (tipologiaNombre.includes('2') || tipologiaNombre.includes('dos'))) &&
                                (tipR.includes('corrediza') && (tipR.includes('2') || tipR.includes('dos')));

    const coincide = coincideDirecto || coincideCorrediza2H;
    return coincide && (r.estadoRevision === 'Aprobado' || r.estadoRevision === 'Modificado por Mazzola');
  });

  if (reglasPerfileria.length === 0) {
    return {
      valido: false,
      motivoRechazo: 'NO SE PUEDE GENERAR ORDEN DE FABRICACIÓN — INFORMACIÓN TÉCNICA INCOMPLETA',
      detallesFaltantes: [
        `No existen reglas técnicas oficiales cargadas ni aprobadas para "${item.tipologia}" en la base de datos de catálogos.`,
        'El sistema prohíbe inventar medidas o perfiles si el fabricante o la dirección técnica no homologaron la tipología.'
      ],
      listaCorte: [],
      listaVidrios: [],
      listaAccesorios: [],
      sobrantesSugeridos: []
    };
  }

  // Verificar si la abertura corrediza tiene al menos marco y hoja (mínimo 4 funciones de corte esenciales)
  const tieneMarco = reglasPerfileria.some(r => r.funcionNombre.toLowerCase().includes('marco'));
  const tieneHoja = reglasPerfileria.some(r => r.funcionNombre.toLowerCase().includes('hoja') || r.funcionNombre.toLowerCase().includes('zócalo') || r.funcionNombre.toLowerCase().includes('parante'));

  if (!tieneMarco) {
    faltantes.push('Faltan reglas técnicas de marco perimetral para esta tipología.');
  }
  if (!tieneHoja && tipologiaNombre.includes('corrediza')) {
    faltantes.push('Faltan reglas técnicas de hojas corredizas (zócalo y parante) para esta tipología.');
  }

  if (faltantes.length > 0) {
    return {
      valido: false,
      motivoRechazo: 'NO SE PUEDE GENERAR ORDEN DE FABRICACIÓN — INFORMACIÓN TÉCNICA INCOMPLETA',
      detallesFaltantes: faltantes,
      listaCorte: [],
      listaVidrios: [],
      listaAccesorios: [],
      sobrantesSugeridos: []
    };
  }

  const cantidadAberturas = Math.max(1, Number(item.cantidad) || 1);
  const anchoMm = Number(item.anchoMm) || 0;
  const altoMm = Number(item.altoMm) || 0;

  if (anchoMm <= 0 || altoMm <= 0) {
    return {
      valido: false,
      motivoRechazo: 'NO SE PUEDE GENERAR ORDEN DE FABRICACIÓN — INFORMACIÓN TÉCNICA INCOMPLETA',
      detallesFaltantes: ['Las medidas de ancho o alto deben ser superiores a 0 mm para el cálculo milimétrico.'],
      listaCorte: [],
      listaVidrios: [],
      listaAccesorios: [],
      sobrantesSugeridos: []
    };
  }

  // 1. GENERAR LISTA DE CORTE DE PERFILERÍA
  const listaCorte: PiezaCorte[] = [];
  let indexPieza = 1;

  for (const regla of reglasPerfileria) {
    const medidaMm = evaluarFormulaTecnica(regla.formula, anchoMm, altoMm);
    if (medidaMm <= 0) {
      faltantes.push(`La fórmula "${regla.formula}" para "${regla.funcionNombre}" generó una cota inválida (${medidaMm} mm).`);
      continue;
    }

    // Combinación de ángulos estricta: 45/45, 45/90, 90/45, 90/90
    const corteA = regla.corteA?.includes('45') ? '45°' : '90°';
    const corteB = regla.corteB?.includes('45') ? '45°' : '90°';
    const numA = corteA.replace('°', '');
    const numB = corteB.replace('°', '');
    const combinacionCortes = `${numA}/${numB}`;

    const totalPiezas = regla.cantidad * cantidadAberturas;

    listaCorte.push({
      id: `corte-${indexPieza++}`,
      perfilCodigo: regla.perfilCodigo,
      perfilNombre: regla.perfilNombre,
      funcion: regla.funcionNombre,
      pieza: regla.funcionNombre,
      medidaMm,
      formula: regla.formula,
      cantidad: totalPiezas,
      corteA,
      corteB,
      combinacionCortes,
      orientacion: regla.orientacion || 'Horizontal',
      mecanizado: regla.mecanizado || 'Sin mecanizado especial',
      observaciones: regla.notasMazzola || (regla.modificadoPorMazzola ? 'Corte adaptado por taller Mazzola' : 'Dato oficial de catálogo')
    });
  }

  if (faltantes.length > 0) {
    return {
      valido: false,
      motivoRechazo: 'NO SE PUEDE GENERAR ORDEN DE FABRICACIÓN — INFORMACIÓN TÉCNICA INCOMPLETA',
      detallesFaltantes: faltantes,
      listaCorte: [],
      listaVidrios: [],
      listaAccesorios: [],
      sobrantesSugeridos: []
    };
  }

  // 2. GENERAR LISTA DE VIDRIOS APROBADA
  const tipologiaIdRef = reglasPerfileria[0]?.tipologiaId;
  const reglasVidrioTip = todasLasReglasVidrios.filter(rv => rv.tipologiaId === tipologiaIdRef);
  const listaVidrios: PiezaVidrio[] = [];

  for (const rv of reglasVidrioTip) {
    const anchoVidrioMm = evaluarFormulaTecnica(rv.formulaAncho, anchoMm, altoMm);
    const altoVidrioMm = evaluarFormulaTecnica(rv.formulaAlto, anchoMm, altoMm);
    if (anchoVidrioMm > 0 && altoVidrioMm > 0) {
      listaVidrios.push({
        id: `vidrio-${listaVidrios.length + 1}`,
        pieza: rv.pieza,
        anchoMm: anchoVidrioMm,
        altoMm: altoVidrioMm,
        cantidad: rv.cantidadPorAbertura * cantidadAberturas,
        espesorTipo: item.vidrio || rv.espesorTipoSugerido || 'Simple 4mm',
        observaciones: rv.observaciones || 'Corte limpio con escuadra y pulido de aristas',
        fuenteTecnica: rv.fuenteTecnica
      });
    }
  }

  // 3. GENERAR LISTA DE ACCESORIOS APROBADA
  const reglasAccTip = todasLasReglasAccesorios.filter(ra => ra.tipologiaId === tipologiaIdRef);
  const listaAccesorios: AccesorioTecnico[] = [];

  for (const ra of reglasAccTip) {
    listaAccesorios.push({
      id: `acc-${listaAccesorios.length + 1}`,
      codigo: ra.codigo,
      nombre: ra.nombre,
      funcion: ra.funcion,
      cantidad: ra.cantidadPorAbertura * cantidadAberturas,
      unidad: ra.unidad || 'U',
      observaciones: ra.observaciones || 'Montaje según manual técnico',
      fuenteTecnica: ra.fuenteTecnica
    });
  }

  // 4. IDENTIFICAR SOBRANTES COMPATIBLES EN STOCK
  // Sugerir sobrantes cuyo largo sea mayor a la pieza requerida (+ 15mm de margen de refrentado)
  const sobrantesSugeridos: Array<{
    sobrante: SobranteStock;
    piezaAlineada: string;
    perfilCodigo: string;
    longitudMm: number;
    medidaPiezaMm: number;
  }> = [];

  for (const corte of listaCorte) {
    const compatible = stockSobrantes.find(s => 
      s.estado === 'Disponible' &&
      s.perfilCodigo === corte.perfilCodigo &&
      s.longitudMm >= (corte.medidaMm + 15) &&
      !sobrantesSugeridos.some(sug => sug.sobrante.id === s.id)
    );

    if (compatible) {
      sobrantesSugeridos.push({
        sobrante: compatible,
        piezaAlineada: corte.pieza,
        perfilCodigo: corte.perfilCodigo,
        longitudMm: compatible.longitudMm,
        medidaPiezaMm: corte.medidaMm
      });
    }
  }

  return {
    valido: true,
    listaCorte,
    listaVidrios,
    listaAccesorios,
    sobrantesSugeridos
  };
}

/**
 * Optimización de Barras de Aluminio.
 * Soporta dos enfoques conceptuales requeridos:
 * 1. "Optimización de material" (First Fit Decreasing para menor retazo/desperdicio).
 * 2. "Método práctico de Mazzola" (cortes en serie por piezas iguales para menor confusión en taller).
 */
export function calcularOptimizacionBarras(
  listaCorte: PiezaCorte[],
  enfoque: 'material' | 'mazzola',
  sobrantesAsignados: Array<{ sobranteId: string; perfilCodigo: string; longitudMm: number; piezaId: string }> = [],
  largoComercialMm: number = 6000
): DatosCalculados {
  const ESPESOR_DISCO_CORTE_MM = 4; // Espesor de corte estándar (kerf)
  const UMBRAL_SOBRANTE_REUTILIZABLE_MM = 500; // Retazos de 50cm o más van a stock

  // Agrupar piezas por perfil
  const perfilesMap = new Map<string, { perfilNombre: string; piezasIndividuales: Array<{ piezaId: string; pieza: string; medidaMm: number; anguloA: string; anguloB: string }> }>();

  for (const pc of listaCorte) {
    if (!perfilesMap.has(pc.perfilCodigo)) {
      perfilesMap.set(pc.perfilCodigo, {
        perfilNombre: pc.perfilNombre,
        piezasIndividuales: []
      });
    }
    const grp = perfilesMap.get(pc.perfilCodigo)!;
    for (let c = 0; c < pc.cantidad; c++) {
      grp.piezasIndividuales.push({
        piezaId: `${pc.id}-${c + 1}`,
        pieza: pc.pieza,
        medidaMm: pc.medidaMm,
        anguloA: pc.corteA,
        anguloB: pc.corteB
      });
    }
  }

  const barrasOptimizadas: BarraOptimizada[] = [];
  let barraCounter = 1;
  let materialUtilizadoTotalMm = 0;
  let sobranteAprovechableTotalMm = 0;
  let desperdicioTotalMm = 0;

  // Procesar cada perfil por separado (NUNCA mezclar barras de perfiles diferentes)
  perfilesMap.forEach((data, perfilCodigo) => {
    let piezasPendientes = [...data.piezasIndividuales];

    // 1. Extraer piezas que ya tienen un sobrante asignado explícitamente por el usuario
    for (const sob of sobrantesAsignados.filter(s => s.perfilCodigo === perfilCodigo)) {
      const idx = piezasPendientes.findIndex(p => p.piezaId === sob.piezaId || p.medidaMm <= (sob.longitudMm - ESPESOR_DISCO_CORTE_MM));
      if (idx !== -1) {
        const piezaAsignada = piezasPendientes.splice(idx, 1)[0];
        const usado = piezaAsignada.medidaMm;
        const rem = sob.longitudMm - usado - ESPESOR_DISCO_CORTE_MM;
        const esAprovechable = rem >= UMBRAL_SOBRANTE_REUTILIZABLE_MM;

        barrasOptimizadas.push({
          barraNumero: barraCounter++,
          perfilCodigo,
          perfilNombre: data.perfilNombre,
          esSobrante: true,
          sobranteId: sob.sobranteId,
          largoTotalMm: sob.longitudMm,
          cortes: [piezaAsignada],
          utilizadoMm: usado,
          sobranteMm: esAprovechable ? rem : 0,
          desperdicioMm: esAprovechable ? ESPESOR_DISCO_CORTE_MM : rem + ESPESOR_DISCO_CORTE_MM
        });

        materialUtilizadoTotalMm += usado;
        if (esAprovechable) sobranteAprovechableTotalMm += rem;
        else desperdicioTotalMm += rem;
      }
    }

    if (piezasPendientes.length === 0) return;

    if (enfoque === 'material') {
      // Enfoque 1: Optimización de material (First-Fit Decreasing)
      piezasPendientes.sort((a, b) => b.medidaMm - a.medidaMm);

      const barrasPerfil: Array<{
        cortes: typeof piezasPendientes;
        espacioRestante: number;
      }> = [];

      for (const p of piezasPendientes) {
        let colocada = false;
        for (const b of barrasPerfil) {
          const espacioNecesario = p.medidaMm + (b.cortes.length > 0 ? ESPESOR_DISCO_CORTE_MM : 0);
          if (b.espacioRestante >= espacioNecesario) {
            b.cortes.push(p);
            b.espacioRestante -= espacioNecesario;
            colocada = true;
            break;
          }
        }

        if (!colocada) {
          barrasPerfil.push({
            cortes: [p],
            espacioRestante: largoComercialMm - p.medidaMm
          });
        }
      }

      for (const b of barrasPerfil) {
        const util = b.cortes.reduce((acc, c) => acc + c.medidaMm, 0);
        const kerfTotal = (b.cortes.length - 1) * ESPESOR_DISCO_CORTE_MM;
        const rem = largoComercialMm - util - kerfTotal;
        const esAprovechable = rem >= UMBRAL_SOBRANTE_REUTILIZABLE_MM;

        barrasOptimizadas.push({
          barraNumero: barraCounter++,
          perfilCodigo,
          perfilNombre: data.perfilNombre,
          esSobrante: false,
          largoTotalMm: largoComercialMm,
          cortes: b.cortes,
          utilizadoMm: util,
          sobranteMm: esAprovechable ? rem : 0,
          desperdicioMm: esAprovechable ? kerfTotal : rem + kerfTotal
        });

        materialUtilizadoTotalMm += util;
        if (esAprovechable) sobranteAprovechableTotalMm += rem;
        else desperdicioTotalMm += rem + kerfTotal;
      }

    } else {
      // Enfoque 2: Método práctico de Mazzola
      // Agrupa cortes de funciones y medidas idénticas juntas para facilitar la producción en taller
      // agrupados por pieza (ej: todos los cabezales juntos, luego todas las jambas)
      piezasPendientes.sort((a, b) => a.pieza.localeCompare(b.pieza));

      let barraActual: typeof piezasPendientes = [];
      let espacioRestante = largoComercialMm;

      for (const p of piezasPendientes) {
        const espacioRequerido = p.medidaMm + (barraActual.length > 0 ? ESPESOR_DISCO_CORTE_MM : 0);
        if (espacioRestante >= espacioRequerido) {
          barraActual.push(p);
          espacioRestante -= espacioRequerido;
        } else {
          // Cerrar barra anterior
          const util = barraActual.reduce((acc, c) => acc + c.medidaMm, 0);
          const kerfTotal = (barraActual.length - 1) * ESPESOR_DISCO_CORTE_MM;
          const rem = largoComercialMm - util - kerfTotal;
          const esAprovechable = rem >= UMBRAL_SOBRANTE_REUTILIZABLE_MM;

          barrasOptimizadas.push({
            barraNumero: barraCounter++,
            perfilCodigo,
            perfilNombre: data.perfilNombre,
            esSobrante: false,
            largoTotalMm: largoComercialMm,
            cortes: barraActual,
            utilizadoMm: util,
            sobranteMm: esAprovechable ? rem : 0,
            desperdicioMm: esAprovechable ? kerfTotal : rem + kerfTotal
          });

          materialUtilizadoTotalMm += util;
          if (esAprovechable) sobranteAprovechableTotalMm += rem;
          else desperdicioTotalMm += rem + kerfTotal;

          // Iniciar nueva barra con la pieza actual
          barraActual = [p];
          espacioRestante = largoComercialMm - p.medidaMm;
        }
      }

      if (barraActual.length > 0) {
        const util = barraActual.reduce((acc, c) => acc + c.medidaMm, 0);
        const kerfTotal = (barraActual.length - 1) * ESPESOR_DISCO_CORTE_MM;
        const rem = largoComercialMm - util - kerfTotal;
        const esAprovechable = rem >= UMBRAL_SOBRANTE_REUTILIZABLE_MM;

        barrasOptimizadas.push({
          barraNumero: barraCounter++,
          perfilCodigo,
          perfilNombre: data.perfilNombre,
          esSobrante: false,
          largoTotalMm: largoComercialMm,
          cortes: barraActual,
          utilizadoMm: util,
          sobranteMm: esAprovechable ? rem : 0,
          desperdicioMm: esAprovechable ? kerfTotal : rem + kerfTotal
        });

        materialUtilizadoTotalMm += util;
        if (esAprovechable) sobranteAprovechableTotalMm += rem;
        else desperdicioTotalMm += rem + kerfTotal;
      }
    }
  });

  // Asignar a cada pieza de la lista de corte el identificador de su barra asignada
  for (const pc of listaCorte) {
    const barrasQueContienen = barrasOptimizadas.filter(b => 
      b.perfilCodigo === pc.perfilCodigo && b.cortes.some(c => c.pieza === pc.pieza)
    );
    if (barrasQueContienen.length > 0) {
      pc.barraAsignada = barrasQueContienen.map(b => b.esSobrante ? `Sobrante #${b.sobranteId}` : `Barra #${b.barraNumero}`).join(', ');
    }
  }

  const barrasNuevas = barrasOptimizadas.filter(b => !b.esSobrante).length;

  return {
    totalBarras: barrasNuevas,
    materialUtilizadoMm: materialUtilizadoTotalMm,
    sobranteAprovechableMm: sobranteAprovechableTotalMm,
    desperdicioMm: desperdicioTotalMm,
    largoComercialMm,
    enfoque,
    distribucionBarras: barrasOptimizadas
  };
}
