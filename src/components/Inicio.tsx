import React from 'react';
import { 
  FileText, 
  Zap, 
  Wrench, 
  Users, 
  Hammer, 
  ArrowRight,
  ShieldCheck,
  Clock,
  Plus
} from 'lucide-react';
import { SeccionPrincipal, Presupuesto, VentaRapida, Reparacion, Cliente } from '../types';

interface InicioProps {
  onNavegar: (seccion: SeccionPrincipal) => void;
  presupuestos: Presupuesto[];
  ventasRapidas: VentaRapida[];
  reparaciones: Reparacion[];
  clientes: Cliente[];
  onCrearPresupuesto: () => void;
  onCrearVentaRapida: () => void;
  onCrearReparacion: () => void;
}

export const Inicio: React.FC<InicioProps> = ({
  onNavegar,
  presupuestos,
  ventasRapidas,
  reparaciones,
  clientes,
  onCrearPresupuesto,
  onCrearVentaRapida,
  onCrearReparacion
}) => {
  // Reparaciones activas
  const reparacionesActivas = reparaciones.filter(r => r.estado !== 'Entregado');
  const presupuestosAprobados = presupuestos.filter(p => p.estado === 'Aprobado');

  return (
    <div className="space-y-6">
      {/* Banner de Bienvenida y Principios Mazzola */}
      <div className="bg-[#DFD9CD] border border-[#CCC4B4] rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-orange-800 border border-amber-600/30">
                <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></span>
                Taller & Fábrica Activo
              </span>
              <span className="text-xs text-stone-600 font-medium">Fase 1 · Base Funcional</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Aberturas Mazzola
            </h1>
            <p className="text-stone-700 text-sm mt-1 max-w-2xl leading-relaxed">
              Sistema interno de cotizaciones manuales, fabricación de aberturas de aluminio, ventas rápidas y reparaciones de taller.
            </p>
          </div>

          {/* Botones de acción directa rápida */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="inicio-btn-nuevo-presupuesto"
              onClick={onCrearPresupuesto}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-sm shadow-xs transition-colors"
            >
              <Plus size={16} strokeWidth={2.5} />
              Nuevo Presupuesto
            </button>
            <button
              id="inicio-btn-nueva-venta"
              onClick={onCrearVentaRapida}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-stone-950 font-bold text-sm shadow-xs transition-colors"
            >
              <Zap size={16} />
              Venta Rápida
            </button>
            <button
              id="inicio-btn-nueva-reparacion"
              onClick={onCrearReparacion}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-stone-700 hover:bg-stone-800 text-stone-100 font-bold text-sm shadow-xs transition-colors"
            >
              <Wrench size={16} />
              Reparación
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas del Taller */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Presupuestos */}
        <div 
          onClick={() => onNavegar('presupuestos')}
          className="bg-[#F4F1EA] hover:bg-[#FAF8F3] border border-[#D8D2C6] rounded-xl p-4.5 cursor-pointer transition-all duration-150 shadow-xs hover:border-amber-500/50 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Presupuestos</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-orange-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-stone-900">{presupuestos.length}</div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
              {presupuestosAprobados.length} aprobados
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1 flex items-center gap-1">
            Precios manuales fijados <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* Ventas Rápidas */}
        <div 
          onClick={() => onNavegar('ventas_rapidas')}
          className="bg-[#F4F1EA] hover:bg-[#FAF8F3] border border-[#D8D2C6] rounded-xl p-4.5 cursor-pointer transition-all duration-150 shadow-xs hover:border-amber-500/50 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Ventas Rápidas</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Zap size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-stone-900">{ventasRapidas.length}</div>
            <span className="text-xs font-semibold text-stone-700">Mostrador directo</span>
          </div>
          <p className="text-xs text-stone-600 mt-1 flex items-center gap-1">
            Registro de venta y ganancia <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* Reparaciones */}
        <div 
          onClick={() => onNavegar('reparaciones')}
          className="bg-[#F4F1EA] hover:bg-[#FAF8F3] border border-[#D8D2C6] rounded-xl p-4.5 cursor-pointer transition-all duration-150 shadow-xs hover:border-amber-500/50 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Reparaciones</span>
            <div className="w-8 h-8 rounded-lg bg-amber-600/15 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wrench size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-stone-900">{reparaciones.length}</div>
            <span className="text-xs font-bold text-orange-800 bg-orange-100/70 px-2 py-0.5 rounded-md">
              {reparacionesActivas.length} en taller
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1 flex items-center gap-1">
            Mallas, ruedas, felpas, vidrios <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* Clientes */}
        <div 
          onClick={() => onNavegar('clientes')}
          className="bg-[#F4F1EA] hover:bg-[#FAF8F3] border border-[#D8D2C6] rounded-xl p-4.5 cursor-pointer transition-all duration-150 shadow-xs hover:border-amber-500/50 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Clientes</span>
            <div className="w-8 h-8 rounded-lg bg-stone-300/60 text-stone-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-stone-900">{clientes.length}</div>
            <span className="text-xs font-semibold text-stone-600">Base de contactos</span>
          </div>
          <p className="text-xs text-stone-600 mt-1 flex items-center gap-1">
            Historial de obras y contacto <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>
      </div>

      {/* Reglas Operativas Activas de Mazzola */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel Izquierdo: Principios del Taller */}
        <div className="lg:col-span-1 bg-[#F4F1EA] border border-[#D8D2C6] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-stone-900 font-extrabold text-base">
            <ShieldCheck size={20} className="text-orange-600" />
            <h3>Reglas Mazzola Activas</h3>
          </div>
          <ul className="space-y-3 text-xs text-stone-700 font-medium">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0"></span>
              <span>
                <strong>Precios manuales fijos:</strong> No se calculan recetas automáticas; los precios de presupuestos no se alteran al cambiar catálogos.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0"></span>
              <span>
                <strong>Datos técnicos reales:</strong> Prohibido inventar códigos o perfiles. Si no hay catálogo cargado, se indica &quot;No disponible&quot;.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0"></span>
              <span>
                <strong>Separación cliente/taller:</strong> El cliente nunca ve costos internos, desperdicios ni ganancias en el presupuesto impreso.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0"></span>
              <span>
                <strong>Medidas milimétricas:</strong> Todas las aberturas se registran en <strong>ancho x alto (mm)</strong>.
              </span>
            </li>
          </ul>

          <div className="pt-2 border-t border-[#D8D2C6] flex items-center justify-between text-xs text-stone-600">
            <span>Secciones internas:</span>
            <button
              onClick={() => onNavegar('datos_tecnicos')}
              className="text-orange-700 hover:text-orange-900 font-bold underline cursor-pointer"
            >
              Ver Catálogos Técnicos
            </button>
          </div>
        </div>

        {/* Panel Derecho: Presupuestos y Reparaciones Recientes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#F4F1EA] border border-[#D8D2C6] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-stone-700" />
                <h3 className="font-extrabold text-stone-900 text-base">Últimos Presupuestos</h3>
              </div>
              <button
                onClick={() => onNavegar('presupuestos')}
                className="text-xs font-bold text-orange-700 hover:text-orange-900 flex items-center gap-1"
              >
                Ver todos ({presupuestos.length}) <ArrowRight size={12} />
              </button>
            </div>

            {presupuestos.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-4 text-center">No hay presupuestos registrados aún.</p>
            ) : (
              <div className="divide-y divide-[#E2DCD0]">
                {presupuestos.slice(0, 3).map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{p.numero}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' :
                          p.estado === 'En Fabricación' ? 'bg-amber-100 text-amber-900' :
                          'bg-stone-200 text-stone-800'
                        }`}>
                          {p.estado}
                        </span>
                      </div>
                      <p className="text-stone-700 font-medium mt-0.5">
                        {p.clienteNombre} · {p.items?.length || 0} abertura(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-stone-900 text-sm">
                        ${(p.total || 0).toLocaleString('es-AR')}
                      </div>
                      <span className="text-[11px] text-stone-500">
                        {p.fechaCreacion ? new Date(p.fechaCreacion).toLocaleDateString('es-AR') : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acceso a Fábrica y Taller */}
          <div className="bg-[#DFD9CD] border border-[#CCC4B4] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
                <Hammer size={20} />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Hoja de Ruta de Fábrica</h4>
                <p className="text-xs text-stone-600">
                  Visualizar órdenes de corte, armado y vidriado sin datos comerciales ni precios.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavegar('fabrica')}
              className="px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-900 text-stone-100 font-semibold text-xs transition-colors shrink-0"
            >
              Ir a Fábrica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
