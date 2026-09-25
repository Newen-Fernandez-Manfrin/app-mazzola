import React, { useMemo } from 'react';
import { 
  Maximize2, 
  Layers, 
  Shield, 
  Sparkles, 
  Info,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { TipoEstructuraAbertura } from '../types';

interface DisenadorTipologiaProps {
  tipologiaNombre: string;
  varianteNombre?: string;
  lineaNombre?: string;
  marcaNombre?: string;
  anchoMm: number;
  altoMm: number;
  color?: string;
  vidrio?: string;
  cantidad?: number;
  tieneMosquitero?: boolean;
  tieneReja?: boolean;
  unidadVisual?: 'mm' | 'cm' | 'm';
  anchoOriginal?: number;
  altoOriginal?: number;
}

export const DisenadorTipologia: React.FC<DisenadorTipologiaProps> = ({
  tipologiaNombre,
  varianteNombre,
  lineaNombre,
  marcaNombre,
  anchoMm,
  altoMm,
  color = 'Blanco',
  vidrio = 'Simple',
  cantidad = 1,
  tieneMosquitero = false,
  tieneReja = false,
  unidadVisual = 'mm',
  anchoOriginal,
  altoOriginal
}) => {
  // Detección de estructura según tipología oficial de catálogo
  const estructura = useMemo<{
    tipo: TipoEstructuraAbertura;
    hojas: number;
    divisionesV: number;
    divisionesH: number;
    apertura: 'corrediza' | 'batiente' | 'fijo' | 'proyectante' | 'guillotina';
    descripcionEstructural: string;
  }>(() => {
    const nom = (tipologiaNombre || '').toLowerCase();
    
    if (nom.includes('corrediza 3') || nom.includes('3 hojas')) {
      return {
        tipo: 'corrediza_3h',
        hojas: 3,
        divisionesV: 3,
        divisionesH: 1,
        apertura: 'corrediza',
        descripcionEstructural: 'Corrediza 3 hojas sobre guías independientes'
      };
    }
    if (nom.includes('corrediza 4') || nom.includes('4 hojas')) {
      return {
        tipo: 'corrediza_4h',
        hojas: 4,
        divisionesV: 4,
        divisionesH: 1,
        apertura: 'corrediza',
        descripcionEstructural: 'Corrediza 4 hojas con encuentro central'
      };
    }
    if (nom.includes('corrediza') || nom.includes('c2h') || nom.includes('balcon') || nom.includes('balcón')) {
      return {
        tipo: 'corrediza_2h',
        hojas: 2,
        divisionesV: 2,
        divisionesH: 1,
        apertura: 'corrediza',
        descripcionEstructural: 'Corrediza 2 hojas con cruce y solape central'
      };
    }
    if (nom.includes('paño fijo') || nom.includes('fijo') || nom.includes('pf')) {
      return {
        tipo: 'pano_fijo',
        hojas: 1,
        divisionesV: 1,
        divisionesH: 1,
        apertura: 'fijo',
        descripcionEstructural: 'Paño fijo hermético sin hojas móviles'
      };
    }
    if (nom.includes('puerta de abrir 2') || nom.includes('abrir 2')) {
      return {
        tipo: 'puerta_abrir_2h',
        hojas: 2,
        divisionesV: 2,
        divisionesH: 1,
        apertura: 'batiente',
        descripcionEstructural: 'Puerta batiente 2 hojas con falleba central'
      };
    }
    if (nom.includes('puerta') || nom.includes('abrir 1') || nom.includes('batiente')) {
      return {
        tipo: 'puerta_abrir_1h',
        hojas: 1,
        divisionesV: 1,
        divisionesH: 1,
        apertura: 'batiente',
        descripcionEstructural: 'Hoja batiente de abrir sobre bisagras laterales'
      };
    }
    if (nom.includes('banderola') || nom.includes('proyectante') || nom.includes('ventiluz')) {
      return {
        tipo: 'proyectante',
        hojas: 1,
        divisionesV: 1,
        divisionesH: 1,
        apertura: 'proyectante',
        descripcionEstructural: 'Ventana proyectante / banderola con compás'
      };
    }
    if (nom.includes('guillotina')) {
      return {
        tipo: 'guillotina',
        hojas: 2,
        divisionesV: 1,
        divisionesH: 2,
        apertura: 'guillotina',
        descripcionEstructural: 'Ventana guillotina compensada vertical'
      };
    }

    return {
      tipo: 'corrediza_2h',
      hojas: 2,
      divisionesV: 2,
      divisionesH: 1,
      apertura: 'corrediza',
      descripcionEstructural: 'Estructura estándar de 2 hojas proporcionales'
    };
  }, [tipologiaNombre]);

  // CÁLCULO DE ESCALA VISUAL Y PROPORCIONES
  // Bounding box del canvas SVG:
  // ViewBox: 0 0 460 320
  // Área máxima para la abertura (dejando margen para cotas y anotaciones):
  const SVG_VIEW_WIDTH = 460;
  const SVG_VIEW_HEIGHT = 320;
  const MARGIN_LEFT = 38;
  const MARGIN_RIGHT = 48;
  const MARGIN_TOP = 32;
  const MARGIN_BOTTOM = 28;

  const MAX_DRAW_W = SVG_VIEW_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 374 px
  const MAX_DRAW_H = SVG_VIEW_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM; // 260 px

  // Asegurar valores válidos y no nulos
  const safeW = Math.max(50, Number(anchoMm) || 1200);
  const safeH = Math.max(50, Number(altoMm) || 1000);
  const aspectRatio = safeW / safeH;

  // Escala visual adaptativa (mantiene la proporción exacta sin deformar):
  const { frameW, frameH, offsetX, offsetY, escalaRatio } = useMemo(() => {
    let w = MAX_DRAW_W;
    let h = w / aspectRatio;

    if (h > MAX_DRAW_H) {
      h = MAX_DRAW_H;
      w = h * aspectRatio;
    }

    // Límites mínimos visuales (nunca colapsar a menos de 50px de ancho o alto)
    const MIN_W = 60;
    const MIN_H = 60;
    if (w < MIN_W) {
      w = MIN_W;
      h = Math.min(MAX_DRAW_H, w / aspectRatio);
    }
    if (h < MIN_H) {
      h = MIN_H;
      w = Math.min(MAX_DRAW_W, h * aspectRatio);
    }

    // Centrar en el área de dibujo
    const ox = MARGIN_LEFT + (MAX_DRAW_W - w) / 2;
    const oy = MARGIN_TOP + (MAX_DRAW_H - h) / 2;

    const factorEscala = Math.max(safeW / w, safeH / h);

    return {
      frameW: w,
      frameH: h,
      offsetX: ox,
      offsetY: oy,
      escalaRatio: factorEscala.toFixed(1)
    };
  }, [safeW, safeH, aspectRatio, MAX_DRAW_W, MAX_DRAW_H]);

  // Color de perfiles según selección
  const coloresAluminio: Record<string, { fill: string; stroke: string; innerFill: string }> = {
    'Blanco': { fill: '#F8F9FA', stroke: '#C8CFD6', innerFill: '#EFF2F5' },
    'Negro': { fill: '#23272A', stroke: '#121416', innerFill: '#2F3336' },
    'Anodizado natural': { fill: '#D3D8DE', stroke: '#9AA0A6', innerFill: '#BCC2C8' },
    'Bronce': { fill: '#4E3A2F', stroke: '#33241C', innerFill: '#5D4639' },
  };
  const estiloColor = coloresAluminio[color] || coloresAluminio['Blanco'];

  // Espesores proporcionales de marco y hoja
  const marcoThickness = Math.max(7, Math.min(13, Math.min(frameW, frameH) * 0.055));
  const hojaThickness = Math.max(6, Math.min(11, Math.min(frameW, frameH) * 0.045));

  // Tonalidad del vidrio según tipo
  const estiloVidrio = useMemo(() => {
    const v = (vidrio || '').toLowerCase();
    if (v.includes('dvh')) {
      return { fill: 'url(#gradVidrioDVH)', stroke: '#60A5FA', label: 'DVH' };
    }
    if (v.includes('laminado')) {
      return { fill: 'url(#gradVidrioLaminado)', stroke: '#38BDF8', label: '3+3 Lam' };
    }
    if (v.includes('fantasía') || v.includes('fantasia')) {
      return { fill: 'url(#gradVidrioFantasia)', stroke: '#CBD5E1', label: 'Fantasía' };
    }
    if (v.includes('sin vidrio')) {
      return { fill: 'transparent', stroke: '#E2E8F0', label: 'Sin vidrio' };
    }
    return { fill: 'url(#gradVidrioSimple)', stroke: '#93C5FD', label: 'Simple' };
  }, [vidrio]);

  return (
    <div className="bg-[#FAF8F5] border-2 border-[#D5CEC2] rounded-2xl p-4 space-y-3 shadow-xs">
      {/* Barra superior de encabezado técnico */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2DDD3] pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse" />
          <span className="font-black text-stone-900 uppercase tracking-wider">
            Diseñador Visual de Abertura
          </span>
          {marcaNombre && (
            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-black text-[10px]">
              {marcaNombre} {lineaNombre ? `• ${lineaNombre}` : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-stone-600 font-semibold">
          <span>Proporción: <strong>{aspectRatio.toFixed(2)} : 1</strong></span>
          <span className="text-stone-400">|</span>
          <span>Escala aprox: <strong>1:{escalaRatio}</strong></span>
        </div>
      </div>

      {/* ÁREA DE VISUALIZACIÓN / CANVAS SVG PROPORCIONAL */}
      <div 
        id="contenedor-dibujo-abertura"
        className="w-full bg-linear-to-b from-[#F2EFE8] to-[#EAE6DD] border border-[#DBD5C8] rounded-xl p-2 relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: '230px', maxHeight: '330px' }}
      >
        <svg
          viewBox={`0 0 ${SVG_VIEW_WIDTH} ${SVG_VIEW_HEIGHT}`}
          className="w-full h-auto max-h-[300px] select-none"
          style={{ maxWidth: '440px' }}
        >
          <defs>
            {/* Gradientes para vidrios */}
            <linearGradient id="gradVidrioSimple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DBEAFE" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#EFF6FF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#BFDBFE" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="gradVidrioDVH" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#E0F2FE" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="gradVidrioLaminado" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C7D2FE" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#EEF2FF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="gradVidrioFantasia" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F1F5F9" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#E2E8F0" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.9" />
            </linearGradient>

            {/* Malla mosquitero técnica */}
            <pattern id="patronMosquitero" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M 0 2 L 4 2 M 2 0 L 2 4" stroke="#475569" strokeWidth="0.5" strokeOpacity="0.5" />
            </pattern>

            {/* Marcadores de flechas para cotas */}
            <marker id="arrowStart" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 10 1 L 0 5 L 10 9 z" fill="#EA580C" />
            </marker>
            <marker id="arrowEnd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#EA580C" />
            </marker>

            {/* Sombra suave perimetral */}
            <filter id="sombrasMarco" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* COTA SUPERIOR: ANCHO NORMALIZADO */}
          <g className="cotas-ancho">
            {/* Líneas de extensión vertical */}
            <line 
              x1={offsetX} 
              y1={offsetY} 
              x2={offsetX} 
              y2={MARGIN_TOP - 14} 
              stroke="#EA580C" 
              strokeWidth="0.8" 
              strokeDasharray="2,2" 
            />
            <line 
              x1={offsetX + frameW} 
              y1={offsetY} 
              x2={offsetX + frameW} 
              y2={MARGIN_TOP - 14} 
              stroke="#EA580C" 
              strokeWidth="0.8" 
              strokeDasharray="2,2" 
            />
            {/* Línea horizontal de cota con flechas */}
            <line 
              x1={offsetX} 
              y1={MARGIN_TOP - 10} 
              x2={offsetX + frameW} 
              y2={MARGIN_TOP - 10} 
              stroke="#EA580C" 
              strokeWidth="1.2" 
              markerStart="url(#arrowStart)" 
              markerEnd="url(#arrowEnd)" 
            />
            {/* Texto de ancho */}
            <rect 
              x={offsetX + frameW / 2 - 42} 
              y={MARGIN_TOP - 20} 
              width={84} 
              height={18} 
              rx="3" 
              fill="#FAF8F5" 
              stroke="#EA580C" 
              strokeWidth="0.8" 
            />
            <text 
              x={offsetX + frameW / 2} 
              y={MARGIN_TOP - 7} 
              textAnchor="middle" 
              fill="#7C2D12" 
              fontSize="10" 
              fontWeight="800"
              fontFamily="sans-serif"
            >
              {safeW} mm
            </text>
          </g>

          {/* COTA LATERAL DERECHA: ALTO NORMALIZADO */}
          <g className="cotas-alto">
            {/* Líneas de extensión horizontal */}
            <line 
              x1={offsetX + frameW} 
              y1={offsetY} 
              x2={offsetX + frameW + 18} 
              y2={offsetY} 
              stroke="#EA580C" 
              strokeWidth="0.8" 
              strokeDasharray="2,2" 
            />
            <line 
              x1={offsetX + frameW} 
              y1={offsetY + frameH} 
              x2={offsetX + frameW + 18} 
              y2={offsetY + frameH} 
              stroke="#EA580C" 
              strokeWidth="0.8" 
              strokeDasharray="2,2" 
            />
            {/* Línea vertical de cota con flechas */}
            <line 
              x1={offsetX + frameW + 14} 
              y1={offsetY} 
              x2={offsetX + frameW + 14} 
              y2={offsetY + frameH} 
              stroke="#EA580C" 
              strokeWidth="1.2" 
              markerStart="url(#arrowStart)" 
              markerEnd="url(#arrowEnd)" 
            />
            {/* Texto de alto rotado */}
            <g transform={`translate(${offsetX + frameW + 28}, ${offsetY + frameH / 2}) rotate(90)`}>
              <rect 
                x={-38} 
                y={-9} 
                width={76} 
                height={17} 
                rx="3" 
                fill="#FAF8F5" 
                stroke="#EA580C" 
                strokeWidth="0.8" 
              />
              <text 
                x="0" 
                y="3" 
                textAnchor="middle" 
                fill="#7C2D12" 
                fontSize="10" 
                fontWeight="800"
                fontFamily="sans-serif"
              >
                {safeH} mm
              </text>
            </g>
          </g>

          {/* CUERPO PRINCIPAL DE LA ABERTURA */}
          <g id="abertura-dibujo" filter="url(#sombrasMarco)">
            {/* MARCO EXTERIOR PERIMETRAL */}
            <rect
              x={offsetX}
              y={offsetY}
              width={frameW}
              height={frameH}
              fill={estiloColor.fill}
              stroke={estiloColor.stroke}
              strokeWidth="2.5"
              rx="2"
            />

            {/* Vano interior después de marco exterior */}
            {(() => {
              const innerX = offsetX + marcoThickness;
              const innerY = offsetY + marcoThickness;
              const innerW = Math.max(10, frameW - 2 * marcoThickness);
              const innerH = Math.max(10, frameH - 2 * marcoThickness);

              // 1. ESTRUCTURA: CORREDIZA DE 2 HOJAS (con solape central)
              if (estructura.tipo === 'corrediza_2h') {
                const hojaW = innerW / 2 + (hojaThickness * 0.6); // solape central
                const hoja1X = innerX;
                const hoja2X = innerX + innerW - hojaW;

                return (
                  <g id="hojas-corrediza-2h">
                    {/* Hoja 1 (Fondo / Izquierda) */}
                    <g id="hoja-1">
                      <rect
                        x={hoja1X}
                        y={innerY}
                        width={hojaW}
                        height={innerH}
                        fill={estiloColor.innerFill}
                        stroke={estiloColor.stroke}
                        strokeWidth="1.8"
                      />
                      {/* Vidrio Hoja 1 */}
                      <rect
                        x={hoja1X + hojaThickness}
                        y={innerY + hojaThickness}
                        width={Math.max(4, hojaW - 2 * hojaThickness)}
                        height={Math.max(4, innerH - 2 * hojaThickness)}
                        fill={estiloVidrio.fill}
                        stroke={estiloVidrio.stroke}
                        strokeWidth="0.8"
                      />
                      {/* Reflejo diagonal de vidrio */}
                      <line
                        x1={hoja1X + hojaThickness + 8}
                        y1={innerY + hojaThickness + 8}
                        x2={hoja1X + hojaW - hojaThickness - 16}
                        y2={innerY + innerH - hojaThickness - 20}
                        stroke="#FFFFFF"
                        strokeWidth="1.2"
                        strokeOpacity="0.45"
                        strokeLinecap="round"
                      />
                      {/* Indicador de apertura corrediza hacia la derecha */}
                      <path
                        d={`M ${hoja1X + hojaW / 2 - 12} ${innerY + innerH / 2} L ${hoja1X + hojaW / 2 + 10} ${innerY + innerH / 2}`}
                        stroke="#EA580C"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <polygon
                        points={`${hoja1X + hojaW / 2 + 12},${innerY + innerH / 2} ${hoja1X + hojaW / 2 + 6},${innerY + innerH / 2 - 4} ${hoja1X + hojaW / 2 + 6},${innerY + innerH / 2 + 4}`}
                        fill="#EA580C"
                      />
                    </g>

                    {/* Hoja 2 (Frente / Derecha con cruce central) */}
                    <g id="hoja-2">
                      <rect
                        x={hoja2X}
                        y={innerY}
                        width={hojaW}
                        height={innerH}
                        fill={estiloColor.fill}
                        stroke={estiloColor.stroke}
                        strokeWidth="2"
                      />
                      {/* Vidrio Hoja 2 */}
                      <rect
                        x={hoja2X + hojaThickness}
                        y={innerY + hojaThickness}
                        width={Math.max(4, hojaW - 2 * hojaThickness)}
                        height={Math.max(4, innerH - 2 * hojaThickness)}
                        fill={estiloVidrio.fill}
                        stroke={estiloVidrio.stroke}
                        strokeWidth="0.8"
                      />
                      {/* Reflejo diagonal */}
                      <line
                        x1={hoja2X + hojaThickness + 8}
                        y1={innerY + hojaThickness + 8}
                        x2={hoja2X + hojaW - hojaThickness - 16}
                        y2={innerY + innerH - hojaThickness - 20}
                        stroke="#FFFFFF"
                        strokeWidth="1.2"
                        strokeOpacity="0.45"
                        strokeLinecap="round"
                      />
                      {/* Indicador de apertura corrediza hacia la izquierda */}
                      <path
                        d={`M ${hoja2X + hojaW / 2 + 12} ${innerY + innerH / 2} L ${hoja2X + hojaW / 2 - 10} ${innerY + innerH / 2}`}
                        stroke="#EA580C"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <polygon
                        points={`${hoja2X + hojaW / 2 - 12},${innerY + innerH / 2} ${hoja2X + hojaW / 2 - 6},${innerY + innerH / 2 - 4} ${hoja2X + hojaW / 2 - 6},${innerY + innerH / 2 + 4}`}
                        fill="#EA580C"
                      />
                    </g>

                    {/* Línea vertical de cruce / solape central */}
                    <line
                      x1={innerX + innerW / 2}
                      y1={innerY}
                      x2={innerX + innerW / 2}
                      y2={innerY + innerH}
                      stroke="#4B5563"
                      strokeWidth="1.5"
                      strokeDasharray="3,1"
                    />

                    {/* Capa de mosquitero si está activo */}
                    {tieneMosquitero && (
                      <g id="overlay-mosquitero">
                        <rect
                          x={hoja1X + hojaThickness}
                          y={innerY + hojaThickness}
                          width={Math.max(4, hojaW - 2 * hojaThickness)}
                          height={Math.max(4, innerH - 2 * hojaThickness)}
                          fill="url(#patronMosquitero)"
                        />
                        <rect
                          x={hoja1X + 4}
                          y={innerY + 4}
                          width={66}
                          height={14}
                          rx="2"
                          fill="#1E293B"
                          opacity="0.85"
                        />
                        <text
                          x={hoja1X + 37}
                          y={innerY + 14}
                          fill="#FFFFFF"
                          fontSize="8"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          Mosquitero
                        </text>
                      </g>
                    )}
                  </g>
                );
              }

              // 2. ESTRUCTURA: CORREDIZA DE 3 HOJAS
              if (estructura.tipo === 'corrediza_3h') {
                const subW = innerW / 3;
                return (
                  <g id="hojas-corrediza-3h">
                    {[0, 1, 2].map((idx) => {
                      const hX = innerX + idx * subW;
                      return (
                        <g key={idx}>
                          <rect
                            x={hX}
                            y={innerY}
                            width={subW}
                            height={innerH}
                            fill={idx % 2 === 0 ? estiloColor.fill : estiloColor.innerFill}
                            stroke={estiloColor.stroke}
                            strokeWidth="1.8"
                          />
                          <rect
                            x={hX + hojaThickness}
                            y={innerY + hojaThickness}
                            width={Math.max(4, subW - 2 * hojaThickness)}
                            height={Math.max(4, innerH - 2 * hojaThickness)}
                            fill={estiloVidrio.fill}
                            stroke={estiloVidrio.stroke}
                            strokeWidth="0.8"
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              }

              // 3. ESTRUCTURA: PAÑO FIJO
              if (estructura.tipo === 'pano_fijo') {
                const contraVidrio = hojaThickness * 0.7;
                return (
                  <g id="pano-fijo">
                    <rect
                      x={innerX}
                      y={innerY}
                      width={innerW}
                      height={innerH}
                      fill={estiloColor.innerFill}
                      stroke={estiloColor.stroke}
                      strokeWidth="1.5"
                    />
                    {/* Contravidrio y Paño de vidrio entero */}
                    <rect
                      x={innerX + contraVidrio}
                      y={innerY + contraVidrio}
                      width={Math.max(4, innerW - 2 * contraVidrio)}
                      height={Math.max(4, innerH - 2 * contraVidrio)}
                      fill={estiloVidrio.fill}
                      stroke={estiloVidrio.stroke}
                      strokeWidth="1"
                    />
                    {/* Reflejos diagonales */}
                    <line
                      x1={innerX + 16}
                      y1={innerY + 16}
                      x2={innerX + innerW - 32}
                      y2={innerY + innerH - 32}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      strokeOpacity="0.5"
                      strokeLinecap="round"
                    />
                    {/* Indicador de Paño Fijo */}
                    <circle
                      cx={innerX + innerW / 2}
                      cy={innerY + innerH / 2}
                      r="10"
                      fill="#FAF8F5"
                      stroke="#94A3B8"
                      strokeWidth="1.2"
                    />
                    <text
                      x={innerX + innerW / 2}
                      y={innerY + innerH / 2 + 3}
                      textAnchor="middle"
                      fill="#64748B"
                      fontSize="9"
                      fontWeight="900"
                    >
                      PF
                    </text>
                  </g>
                );
              }

              // 4. ESTRUCTURA: VENTANA / PUERTA DE ABRIR (BATIENTE 1 HOJA)
              if (estructura.tipo === 'puerta_abrir_1h' || estructura.tipo === 'abrir_1h') {
                const sashW = innerW;
                const sashH = innerH;
                const isPuerta = estructura.tipo === 'puerta_abrir_1h' || safeH >= 1900;
                const zocaloH = isPuerta ? Math.min(innerH * 0.22, 45) : hojaThickness;

                return (
                  <g id="hoja-abrir-1h">
                    <rect
                      x={innerX}
                      y={innerY}
                      width={sashW}
                      height={sashH}
                      fill={estiloColor.fill}
                      stroke={estiloColor.stroke}
                      strokeWidth="2"
                    />
                    {/* Vidrio principal */}
                    <rect
                      x={innerX + hojaThickness}
                      y={innerY + hojaThickness}
                      width={Math.max(4, sashW - 2 * hojaThickness)}
                      height={Math.max(4, sashH - hojaThickness - zocaloH)}
                      fill={estiloVidrio.fill}
                      stroke={estiloVidrio.stroke}
                      strokeWidth="1"
                    />
                    {/* Zócalo inferior si es puerta */}
                    {isPuerta && (
                      <rect
                        x={innerX + hojaThickness}
                        y={innerY + sashH - zocaloH}
                        width={Math.max(4, sashW - 2 * hojaThickness)}
                        height={zocaloH - 2}
                        fill={estiloColor.innerFill}
                        stroke={estiloColor.stroke}
                        strokeWidth="1"
                      />
                    )}
                    {/* Líneas punteadas técnicas de apertura batiente (triángulo hacia bisagras) */}
                    <path
                      d={`M ${innerX + hojaThickness} ${innerY + hojaThickness} L ${innerX + sashW - hojaThickness} ${innerY + (sashH - zocaloH) / 2} L ${innerX + hojaThickness} ${innerY + sashH - zocaloH}`}
                      fill="none"
                      stroke="#EA580C"
                      strokeWidth="1.2"
                      strokeDasharray="4,3"
                    />
                    {/* Picaporte / Manija técnica */}
                    <circle
                      cx={innerX + sashW - hojaThickness - 8}
                      cy={innerY + sashH / 2}
                      r="4"
                      fill="#EA580C"
                    />
                    <line
                      x1={innerX + sashW - hojaThickness - 8}
                      y1={innerY + sashH / 2}
                      x2={innerX + sashW - hojaThickness - 18}
                      y2={innerY + sashH / 2}
                      stroke="#EA580C"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </g>
                );
              }

              // 5. ESTRUCTURA: VENTANA PROYECTANTE / BANDEROLA
              if (estructura.tipo === 'proyectante' || estructura.tipo === 'banderola') {
                return (
                  <g id="hoja-proyectante">
                    <rect
                      x={innerX}
                      y={innerY}
                      width={innerW}
                      height={innerH}
                      fill={estiloColor.fill}
                      stroke={estiloColor.stroke}
                      strokeWidth="2"
                    />
                    <rect
                      x={innerX + hojaThickness}
                      y={innerY + hojaThickness}
                      width={Math.max(4, innerW - 2 * hojaThickness)}
                      height={Math.max(4, innerH - 2 * hojaThickness)}
                      fill={estiloVidrio.fill}
                      stroke={estiloVidrio.stroke}
                      strokeWidth="1"
                    />
                    {/* Triángulo de apertura hacia abajo/arriba */}
                    <path
                      d={`M ${innerX + hojaThickness} ${innerY + hojaThickness} L ${innerX + innerW / 2} ${innerY + innerH - hojaThickness} L ${innerX + innerW - hojaThickness} ${innerY + hojaThickness}`}
                      fill="none"
                      stroke="#EA580C"
                      strokeWidth="1.2"
                      strokeDasharray="4,3"
                    />
                    {/* Aldaba central */}
                    <rect
                      x={innerX + innerW / 2 - 6}
                      y={innerY + innerH - hojaThickness - 6}
                      width={12}
                      height={5}
                      fill="#EA580C"
                      rx="1"
                    />
                  </g>
                );
              }

              // ESTRUCTURA GENÉRICA DE RESPALDO (2 paños simétricos)
              return (
                <g id="hoja-generica">
                  <rect
                    x={innerX}
                    y={innerY}
                    width={innerW / 2}
                    height={innerH}
                    fill={estiloColor.fill}
                    stroke={estiloColor.stroke}
                    strokeWidth="1.5"
                  />
                  <rect
                    x={innerX + innerW / 2}
                    y={innerY}
                    width={innerW / 2}
                    height={innerH}
                    fill={estiloColor.innerFill}
                    stroke={estiloColor.stroke}
                    strokeWidth="1.5"
                  />
                  <line
                    x1={innerX + innerW / 2}
                    y1={innerY}
                    x2={innerX + innerW / 2}
                    y2={innerY + innerH}
                    stroke="#475569"
                    strokeWidth="2"
                  />
                </g>
              );
            })()}

            {/* CAPA DE REJAS DE SEGURIDAD (SI ESTÁ ACTIVA) */}
            {tieneReja && (
              <g id="overlay-reja">
                {(() => {
                  const cantBarrotes = Math.max(3, Math.min(10, Math.round(frameW / 28)));
                  const paso = frameW / (cantBarrotes + 1);
                  return (
                    <>
                      {/* Barrotes verticales */}
                      {Array.from({ length: cantBarrotes }).map((_, bIdx) => (
                        <line
                          key={bIdx}
                          x1={offsetX + (bIdx + 1) * paso}
                          y1={offsetY}
                          x2={offsetX + (bIdx + 1) * paso}
                          y2={offsetY + frameH}
                          stroke="#1E293B"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      ))}
                      {/* Travesaños horizontales de unión */}
                      <line
                        x1={offsetX}
                        y1={offsetY + frameH * 0.25}
                        x2={offsetX + frameW}
                        y2={offsetY + frameH * 0.25}
                        stroke="#1E293B"
                        strokeWidth="2"
                      />
                      <line
                        x1={offsetX}
                        y1={offsetY + frameH * 0.75}
                        x2={offsetX + frameW}
                        y2={offsetY + frameH * 0.75}
                        stroke="#1E293B"
                        strokeWidth="2"
                      />
                    </>
                  );
                })()}
              </g>
            )}
          </g>
        </svg>

        {/* Badges superpuestos sobre el dibujo técnico */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
          {varianteNombre && (
            <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
              {varianteNombre}
            </span>
          )}
          <span className="bg-orange-600/90 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs w-max">
            {vidrio} {color}
          </span>
        </div>

        {/* Accesorios activos reflejados */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 pointer-events-none">
          {tieneMosquitero && (
            <span className="bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              + Mosquitero
            </span>
          )}
          {tieneReja && (
            <span className="bg-stone-800/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              + Reja
            </span>
          )}
          {cantidad > 1 && (
            <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded">
              {cantidad} unidades
            </span>
          )}
        </div>
      </div>

      {/* DESCRIPCIÓN ESTRUCTURAL DE LA TIPOLOGÍA */}
      <div className="bg-[#FAF8F5] border border-[#DBD5C8] rounded-xl px-3 py-2 text-xs flex items-center justify-between gap-3 text-stone-700">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-orange-600 shrink-0" />
          <span className="font-bold text-stone-900">{estructura.descripcionEstructural}</span>
        </div>
        <span className="text-[11px] text-stone-500 font-medium shrink-0">
          Escala visual adaptativa
        </span>
      </div>
    </div>
  );
};
