import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  FileText, 
  Zap, 
  Wrench, 
  Calendar, 
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  UserCheck,
  RefreshCw,
  Database,
  Eye,
  EyeOff,
  Filter,
  Layers,
  X
} from 'lucide-react';
import { EntradaHistorial, Presupuesto, VentaRapida, Reparacion, AuditoriaHistorial } from '../types';
import { mazzolaApi } from '../services/api';

interface HistorialProps {
  historial: EntradaHistorial[];
  presupuestos: Presupuesto[];
  ventasRapidas: VentaRapida[];
  reparaciones: Reparacion[];
  onVerPresupuesto: (p: Presupuesto) => void;
  esInterno?: boolean;
}

export const HistorialComponent: React.FC<HistorialProps> = ({
  historial,
  presupuestos,
  ventasRapidas,
  reparaciones,
  onVerPresupuesto,
  esInterno = true
}) => {
  const [pestaña, setPestaña] = useState<'comercial' | 'auditoria'>('comercial');
  
  // BÚSQUEDAS REQUERIDAS POR FASE 5:
  // - cliente
  // - fecha
  // - tipo de operación
  // - número
  // - descripción
  const [busquedaGeneral, setBusquedaGeneral] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos'); // 'todos' | 'presupuesto' | 'venta_rapida' | 'reparacion'
  const [filtroNumero, setFiltroNumero] = useState('');
  
  // Toggle Modo Interno (con costos y ganancias) vs Vista Cliente Segura
  const [modoInterno, setModoInterno] = useState(false);

  // Auditoría
  const [auditorias, setAuditorias] = useState<AuditoriaHistorial[]>([]);
  const [cargandoAuditoria, setCargandoAuditoria] = useState(false);

  // Modal para ver detalles completos de una operación
  const [operacionSeleccionada, setOperacionSeleccionada] = useState<{
    tipo: 'presupuesto' | 'venta_rapida' | 'reparacion';
    numero: string;
    fecha: string;
    cliente: string;
    monto: number;
    costo?: number;
    ganancia?: number;
    descripcion: string;
    detalles: any;
  } | null>(null);

  const cargarAuditoria = async () => {
    try {
      setCargandoAuditoria(true);
      const data = await mazzolaApi.getHistorialAuditoria();
      setAuditorias(data);
    } catch (err) {
      console.error('Error cargando auditoría:', err);
    } finally {
      setCargandoAuditoria(false);
    }
  };

  useEffect(() => {
    cargarAuditoria();
  }, []);

  // Construir historial comercial unificado en tiempo real con datos de las 3 tablas
  const operacionesComercialesUnificadas = [
    ...presupuestos.map(p => ({
      id: p.id,
      tipo: 'presupuesto' as const,
      numero: p.numero,
      fecha: p.fechaCreacion ? new Date(p.fechaCreacion).toISOString().slice(0, 10) : '',
      cliente: p.clienteNombre || 'Consumidor',
      descripcion: p.items && Array.isArray(p.items) && p.items.length > 0
        ? p.items.filter(Boolean).map(i => `${i.cantidad || 1}x ${i.tipologia || 'Abertura'}`).join(', ')
        : 'Presupuesto de aberturas',
      monto: p.total || 0,
      costo: undefined as number | undefined, // Los costos técnicos no se muestran al cliente
      ganancia: undefined as number | undefined,
      creadoPor: p.creadoPor || 'Sistema',
      estado: p.estado,
      raw: p
    })),
    ...ventasRapidas.map(v => ({
      id: v.id,
      tipo: 'venta_rapida' as const,
      numero: v.numero,
      fecha: v.fecha || '',
      cliente: v.clienteNombre || 'Consumidor Final',
      descripcion: `${v.producto} (${v.tipologia || 'Directa'}) - ${v.medida || ''}`,
      monto: v.precioVenta || 0,
      costo: v.costo || 0,
      ganancia: v.ganancia || 0,
      creadoPor: v.creadoPor || 'Vendedor',
      estado: 'Completado',
      raw: v
    })),
    ...reparaciones.map(r => ({
      id: r.id,
      tipo: 'reparacion' as const,
      numero: r.numero,
      fecha: r.fecha || '',
      cliente: r.clienteNombre || 'Cliente Taller',
      descripcion: `${r.trabajo} ${r.materialesTexto ? `(${r.materialesTexto})` : ''}`,
      monto: r.precioCobrado || 0,
      costo: r.costo || 0,
      ganancia: r.ganancia || 0,
      creadoPor: r.creadoPor || 'Taller',
      estado: r.estado,
      raw: r
    }))
  ].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  // Filtros combinados sobre el historial comercial
  const operacionesFiltradas = operacionesComercialesUnificadas.filter(op => {
    // Búsqueda general
    if (busquedaGeneral) {
      const q = busquedaGeneral.toLowerCase();
      const coincide = 
        op.numero.toLowerCase().includes(q) ||
        op.cliente.toLowerCase().includes(q) ||
        op.descripcion.toLowerCase().includes(q) ||
        op.creadoPor.toLowerCase().includes(q);
      if (!coincide) return false;
    }

    // Filtro por Cliente
    if (filtroCliente && !op.cliente.toLowerCase().includes(filtroCliente.toLowerCase())) {
      return false;
    }

    // Filtro por Fecha
    if (filtroFecha && !op.fecha.includes(filtroFecha)) {
      return false;
    }

    // Filtro por Tipo de Operación
    if (filtroTipo !== 'todos' && op.tipo !== filtroTipo) {
      return false;
    }

    // Filtro por Número
    if (filtroNumero && !op.numero.toLowerCase().includes(filtroNumero.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Métricas totales del historial filtrado
  const totalMonto = operacionesFiltradas.reduce((acc, op) => acc + op.monto, 0);
  const totalGanancia = operacionesFiltradas.reduce((acc, op) => acc + (op.ganancia || 0), 0);

  const abrirDetalle = (op: typeof operacionesComercialesUnificadas[0]) => {
    if (op.tipo === 'presupuesto') {
      onVerPresupuesto(op.raw as Presupuesto);
    } else {
      setOperacionSeleccionada({
        tipo: op.tipo,
        numero: op.numero,
        fecha: op.fecha,
        cliente: op.cliente,
        monto: op.monto,
        costo: op.costo,
        ganancia: op.ganancia,
        descripcion: op.descripcion,
        detalles: op.raw
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#DFD9CD] border border-[#CCC4B4] rounded-xl p-4 sm:p-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <History className="text-orange-600" />
            Historial Comercial Unificado y Auditoría
          </h2>
          <p className="text-stone-700 text-xs mt-0.5">
            Consulta consolidada de presupuestos, ventas directas y reparaciones de taller con filtros avanzados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Vista Interna vs Vista Cliente */}
          <button
            onClick={() => setModoInterno(!modoInterno)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              modoInterno 
                ? 'bg-amber-600 text-white border-amber-700' 
                : 'bg-emerald-700 text-white border-emerald-800'
            }`}
            title="Alternar vista confidencial interna vs vista cliente segura"
          >
            {modoInterno ? <Eye size={14} /> : <ShieldCheck size={14} />}
            {modoInterno ? 'Vista Interna (Con Costos)' : 'Vista Cliente (Segura)'}
          </button>

          <button
            onClick={cargarAuditoria}
            title="Refrescar auditoría de la base de datos"
            className="p-2 rounded-lg bg-[#D8D2C5] hover:bg-stone-300 border border-[#C5BDAE] text-stone-800 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={cargandoAuditoria ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#CCC4B4] pb-2">
        <button
          id="tab-historial-comercial"
          onClick={() => setPestaña('comercial')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            pestaña === 'comercial'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-[#E5DFD4] text-stone-700 hover:bg-[#DCD5C9]'
          }`}
        >
          <Layers size={15} />
          <span>Historial Comercial Unificado ({operacionesComercialesUnificadas.length})</span>
        </button>

        <button
          id="tab-historial-auditoria"
          onClick={() => setPestaña('auditoria')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            pestaña === 'auditoria'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-[#E5DFD4] text-stone-700 hover:bg-[#DCD5C9]'
          }`}
        >
          <ShieldCheck size={15} />
          <span>Trazabilidad y Auditoría ({auditorias.length})</span>
        </button>
      </div>

      {/* PESTAÑA: HISTORIAL COMERCIAL UNIFICADO */}
      {pestaña === 'comercial' && (
        <div className="space-y-4">
          {/* PANEL DE BÚSQUEDA Y FILTROS REQUERIDOS EN EL PROMPT:
              - cliente
              - fecha
              - tipo de operación
              - número
              - descripción */}
          <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs font-black text-stone-900 border-b border-[#EAE5DC] pb-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Filter size={14} className="text-orange-600" />
                Filtros de Búsqueda Avanzada
              </span>
              <button
                onClick={() => {
                  setBusquedaGeneral('');
                  setFiltroCliente('');
                  setFiltroFecha('');
                  setFiltroTipo('todos');
                  setFiltroNumero('');
                }}
                className="text-[11px] text-orange-700 hover:underline font-bold"
              >
                Limpiar Filtros
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* 1. Tipo de Operación */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">Tipo de Operación:</label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full bg-white border border-[#C5BDAE] rounded-lg px-2.5 py-1.5 font-semibold text-stone-900 outline-none"
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="presupuesto">Presupuestos</option>
                  <option value="venta_rapida">Ventas Rápidas</option>
                  <option value="reparacion">Reparaciones</option>
                </select>
              </div>

              {/* 2. Cliente */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">Cliente:</label>
                <input
                  type="text"
                  placeholder="Filtrar por cliente..."
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                  className="w-full bg-white border border-[#C5BDAE] rounded-lg px-2.5 py-1.5 text-stone-900 outline-none"
                />
              </div>

              {/* 3. Número de Operación */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">Número de Operación:</label>
                <input
                  type="text"
                  placeholder="Ej: PRES-, VR-, REP-"
                  value={filtroNumero}
                  onChange={(e) => setFiltroNumero(e.target.value)}
                  className="w-full bg-white border border-[#C5BDAE] rounded-lg px-2.5 py-1.5 text-stone-900 font-mono outline-none"
                />
              </div>

              {/* 4. Fecha */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">Fecha:</label>
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="w-full bg-white border border-[#C5BDAE] rounded-lg px-2.5 py-1.5 text-stone-900 outline-none"
                />
              </div>

              {/* 5. Descripción o texto general */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">Descripción / Producto:</label>
                <input
                  type="text"
                  placeholder="Buscar por descripción..."
                  value={busquedaGeneral}
                  onChange={(e) => setBusquedaGeneral(e.target.value)}
                  className="w-full bg-white border border-[#C5BDAE] rounded-lg px-2.5 py-1.5 text-stone-900 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Resumen del filtro */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#EAE5DC] px-4 py-2.5 rounded-xl text-xs">
            <span className="font-semibold text-stone-700">
              Mostrando <strong>{operacionesFiltradas.length}</strong> operaciones comerciales
            </span>
            <div className="flex items-center gap-4">
              <span className="font-bold text-stone-800">
                Total Filtrado: <strong className="text-stone-950 font-black">${totalMonto.toLocaleString('es-AR')}</strong>
              </span>
              {modoInterno && (
                <span className="font-bold text-emerald-800">
                  Ganancia Filtrada: <strong className="font-black">${totalGanancia.toLocaleString('es-AR')}</strong>
                </span>
              )}
            </div>
          </div>

          {/* TABLA UNIFICADA */}
          <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#E4DDCF] border-b border-[#CCC4B4] text-stone-700 font-extrabold">
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Número</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Descripción de Operación</th>
                    <th className="py-3 px-4 text-right">Monto Operado</th>
                    {modoInterno && (
                      <>
                        <th className="py-3 px-4 text-right">Costo Interno</th>
                        <th className="py-3 px-4 text-right">Ganancia</th>
                      </>
                    )}
                    <th className="py-3 px-4 text-center">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5DC]">
                  {operacionesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={modoInterno ? 9 : 7} className="py-8 text-center text-stone-500 italic">
                        No se encontraron operaciones con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    operacionesFiltradas.map((op) => {
                      const esPresupuesto = op.tipo === 'presupuesto';
                      const esVenta = op.tipo === 'venta_rapida';
                      const esReparacion = op.tipo === 'reparacion';

                      return (
                        <tr key={`${op.tipo}-${op.id}`} className="hover:bg-[#F3EFE6] transition-colors">
                          <td className="py-3 px-4">
                            {esPresupuesto && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-900 text-[10px]">
                                <FileText size={11} /> Presupuesto
                              </span>
                            )}
                            {esVenta && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold bg-orange-100 text-orange-900 text-[10px]">
                                <Zap size={11} /> Venta Rápida
                              </span>
                            )}
                            {esReparacion && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-900 text-[10px]">
                                <Wrench size={11} /> Reparación
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">
                            {op.numero}
                          </td>
                          <td className="py-3 px-4 text-stone-600 font-medium">
                            {op.fecha}
                          </td>
                          <td className="py-3 px-4 font-semibold text-stone-900">
                            {op.cliente}
                          </td>
                          <td className="py-3 px-4 text-stone-700 max-w-xs">
                            <span className="line-clamp-2">{op.descripcion}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-black text-stone-950 text-sm">
                              ${op.monto.toLocaleString('es-AR')}
                            </span>
                          </td>
                          {modoInterno && (
                            <>
                              <td className="py-3 px-4 text-right text-stone-600 font-medium">
                                {op.costo ? `$${op.costo.toLocaleString('es-AR')}` : '-'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {op.ganancia ? (
                                  <span className="font-black text-emerald-800">
                                    +${op.ganancia.toLocaleString('es-AR')}
                                  </span>
                                ) : (
                                  <span className="text-stone-400">-</span>
                                )}
                              </td>
                            </>
                          )}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => abrirDetalle(op)}
                              className="px-2.5 py-1 rounded bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA: TRAZABILIDAD Y AUDITORÍA */}
      {pestaña === 'auditoria' && (
        <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-[#EAE5DC] border-b border-[#CCC4B4] flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800">
              Registros inmutables de auditoría almacenados en base de datos PostgreSQL
            </span>
            <span className="text-[11px] font-mono text-stone-600">
              Total eventos: {auditorias.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#E4DDCF] border-b border-[#CCC4B4] text-stone-700 font-extrabold">
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Acción</th>
                  <th className="py-3 px-4">Entidad</th>
                  <th className="py-3 px-4">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DC]">
                {auditorias.map((aud) => (
                  <tr key={aud.id} className="hover:bg-[#F3EFE6] transition-colors">
                    <td className="py-2.5 px-4 font-mono text-stone-600 text-[11px]">
                      {new Date(aud.fecha).toLocaleString('es-AR')}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-stone-900">
                      {aud.usuario}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-stone-200 text-stone-800">
                        {aud.accion}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-stone-700">
                      {aud.elementoTipo} {aud.elementoId ? `(${aud.elementoId})` : ''}
                    </td>
                    <td className="py-2.5 px-4 text-stone-600 text-[11px]">
                      {aud.detalle}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE DE OPERACIÓN */}
      {operacionSeleccionada && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#FAF8F5] border border-[#CCC4B4] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="bg-[#E4DDCF] px-5 py-3.5 border-b border-[#CCC4B4] flex items-center justify-between">
              <span className="font-extrabold text-stone-900 text-xs">
                Detalle de Operación {operacionSeleccionada.numero}
              </span>
              <button
                onClick={() => setOperacionSeleccionada(null)}
                className="p-1 rounded text-stone-600 hover:bg-stone-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-white border border-[#D5CEC2] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-2">
                  <span className="font-mono font-black text-stone-900 text-sm">
                    {operacionSeleccionada.numero}
                  </span>
                  <span className="text-[11px] text-stone-500">{operacionSeleccionada.fecha}</span>
                </div>
                <div><strong>Cliente:</strong> {operacionSeleccionada.cliente}</div>
                <div><strong>Descripción:</strong> {operacionSeleccionada.descripcion}</div>
                <div className="pt-2 border-t border-[#EAE5DC] flex items-center justify-between">
                  <span className="font-bold text-stone-800">Total Operación:</span>
                  <span className="font-black text-stone-950 text-base">
                    ${operacionSeleccionada.monto.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* DATOS INTERNOS (SÓLO SI MODO INTERNO ESTÁ ACTIVO, NUNCA EN VISTA CLIENTE) */}
              {modoInterno && (
                <div className="bg-amber-500/10 border-2 border-amber-600/30 p-3.5 rounded-xl text-[11px]">
                  <span className="font-black text-amber-950 block uppercase tracking-wider mb-1">
                    Análisis Interno de Rentabilidad:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-stone-800">
                    <div>Costo Taller: <strong>${(operacionSeleccionada.costo || 0).toLocaleString('es-AR')}</strong></div>
                    <div>Ganancia Neta: <strong className="text-emerald-800">${(operacionSeleccionada.ganancia || 0).toLocaleString('es-AR')}</strong></div>
                  </div>
                </div>
              )}

              <div className="text-right">
                <button
                  onClick={() => setOperacionSeleccionada(null)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-bold text-xs cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
