import React, { useState, useEffect } from 'react';
import { 
  Hammer, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search,
  Filter,
  Scissors,
  Boxes,
  Maximize2,
  FileText,
  Printer,
  Plus,
  Trash2,
  Check,
  X,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info,
  Calendar,
  User,
  Package,
  Eye,
  RefreshCw
} from 'lucide-react';
import { 
  OrdenFabricacion, 
  Presupuesto, 
  ItemAbertura, 
  SobranteStock, 
  PiezaCorte, 
  PiezaVidrio, 
  AccesorioTecnico,
  DatosCalculados,
  DatosReales
} from '../types';
import { mazzolaApi } from '../services/api';

interface FabricaProps {
  ordenes: OrdenFabricacion[];
  presupuestos: Presupuesto[];
  onActualizarEstadoOrden: (id: string, nuevoEstado: OrdenFabricacion['estadoFabrica']) => void;
  onOrdenCreada?: () => void;
  contextoInicial?: { presupuestoId?: string; itemIndex?: number } | null;
  onLimpiarContexto?: () => void;
}

export const FabricaComponent: React.FC<FabricaProps> = ({
  ordenes,
  presupuestos,
  onActualizarEstadoOrden,
  onOrdenCreada,
  contextoInicial,
  onLimpiarContexto
}) => {
  // Pestañas del módulo
  type TabFabrica = 'ordenes' | 'presupuestos_confirmados' | 'sobrantes' | 'planilla';
  const [tabActiva, setTabActiva] = useState<TabFabrica>('ordenes');

  // Filtros y búsquedas
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Orden seleccionada para ver su Planilla de Fábrica
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenFabricacion | null>(null);

  // Stock de Sobrantes
  const [sobrantes, setSobrantes] = useState<SobranteStock[]>([]);
  const [cargandoSobrantes, setCargandoSobrantes] = useState(false);
  const [mostrarModalNuevoSobrante, setMostrarNuevoSobrante] = useState(false);

  // Formulario nuevo sobrante
  const [nuevoSobrante, setNuevoSobrante] = useState({
    perfilCodigo: '6201',
    perfilNombre: 'Marco 2 Guías',
    longitudMm: 1500,
    cantidad: 1,
    ubicacion: 'Estantería Retazos A1',
    observaciones: 'Retazo limpio para reutilización'
  });

  // Flujo explícito de generación de Orden de Producción
  const [modalGeneracionAbierto, setModalGeneracionAbierto] = useState(false);
  const [presupuestoOrigen, setPresupuestoOrigen] = useState<Presupuesto | null>(null);
  const [itemSeleccionado, setItemSeleccionado] = useState<ItemAbertura | null>(null);
  const [itemIndexSeleccionado, setItemIndexSeleccionado] = useState<number>(1);
  
  // Configuración de optimización en modal
  const [enfoqueOptimizacion, setEnfoqueOptimizacion] = useState<'material' | 'mazzola'>('material');
  const [sobrantesAsignados, setSobrantesAsignados] = useState<Array<{ sobranteId: string; perfilCodigo: string; longitudMm: number; piezaId: string }>>([]);
  const [resultadoPreflight, setResultadoPreflight] = useState<any>(null);
  const [calculandoPreflight, setCalculandoPreflight] = useState(false);
  const [generandoOrden, setGenerandoOrden] = useState(false);

  // Modal de registro de datos reales
  const [modalDatosRealesAbierto, setModalDatosRealesAbierto] = useState(false);
  const [ordenParaDatosReales, setOrdenParaDatosReales] = useState<OrdenFabricacion | null>(null);
  const [formDatosReales, setFormDatosReales] = useState({
    barrasCompradas: 0,
    barrasUtilizadas: 0,
    sobrantesReales: 0,
    desperdicioRealMm: 0,
    observaciones: ''
  });

  // Cargar sobrantes desde backend
  const recargarSobrantes = async () => {
    try {
      setCargandoSobrantes(true);
      const data = await mazzolaApi.getSobrantes();
      setSobrantes(data);
    } catch (err) {
      console.error('Error al cargar sobrantes:', err);
    } finally {
      setCargandoSobrantes(false);
    }
  };

  useEffect(() => {
    recargarSobrantes();
  }, []);

  // Manejo de contexto inicial si el usuario viene de "Ver en fábrica" desde Presupuestos
  useEffect(() => {
    if (contextoInicial?.presupuestoId) {
      const pres = presupuestos.find(p => p.id === contextoInicial.presupuestoId);
      if (pres) {
        setPresupuestoOrigen(pres);
        const idx = (contextoInicial.itemIndex || 1) - 1;
        const it = pres.items?.[idx] || pres.items?.[0];
        if (it) {
          iniciarGeneracionOrden(pres, it, idx + 1);
        }
      }
      if (onLimpiarContexto) onLimpiarContexto();
    }
  }, [contextoInicial, presupuestos]);

  // Ejecutar preflight técnico de corte y validación de reglas técnicas oficiales
  const ejecutarPreflight = async (
    item: ItemAbertura,
    enfoque: 'material' | 'mazzola',
    asignados: typeof sobrantesAsignados
  ) => {
    try {
      setCalculandoPreflight(true);
      const res = await mazzolaApi.preflightFabrica(item, enfoque, asignados);
      setResultadoPreflight(res);
    } catch (err: any) {
      console.error('Error calculando preflight:', err);
      setResultadoPreflight({
        valido: false,
        motivoRechazo: 'ERROR DE CÁLCULO TÉCNICO',
        detallesFaltantes: [err.message || 'Fallo de comunicación al evaluar reglas técnicas']
      });
    } finally {
      setCalculandoPreflight(false);
    }
  };

  // Iniciar el flujo de generación para un ítem específico
  const iniciarGeneracionOrden = (presupuesto: Presupuesto, item: ItemAbertura, itemIdx: number) => {
    setPresupuestoOrigen(presupuesto);
    setItemSeleccionado(item);
    setItemIndexSeleccionado(itemIdx);
    setSobrantesAsignados([]);
    setEnfoqueOptimizacion('material');
    setModalGeneracionAbierto(true);
    ejecutarPreflight(item, 'material', []);
  };

  // Alternar uso de un sobrante sugerido en el preflight
  const handleDecidirSobrante = (sug: any, usar: boolean) => {
    let nuevosAsignados = [...sobrantesAsignados];
    if (usar) {
      if (!nuevosAsignados.some(a => a.sobranteId === sug.sobrante.id)) {
        nuevosAsignados.push({
          sobranteId: sug.sobrante.id,
          perfilCodigo: sug.perfilCodigo,
          longitudMm: sug.longitudMm,
          piezaId: sug.piezaAlineada
        });
      }
    } else {
      nuevosAsignados = nuevosAsignados.filter(a => a.sobranteId !== sug.sobrante.id);
    }
    setSobrantesAsignados(nuevosAsignados);
    if (itemSeleccionado) {
      ejecutarPreflight(itemSeleccionado, enfoqueOptimizacion, nuevosAsignados);
    }
  };

  // Alternar enfoque de optimización
  const handleCambiarEnfoque = (nuevoEnfoque: 'material' | 'mazzola') => {
    setEnfoqueOptimizacion(nuevoEnfoque);
    if (itemSeleccionado) {
      ejecutarPreflight(itemSeleccionado, nuevoEnfoque, sobrantesAsignados);
    }
  };

  // Confirmar y generar explícitamente la Orden de Producción
  const handleConfirmarGeneracionOrden = async () => {
    if (!presupuestoOrigen || !itemSeleccionado || !resultadoPreflight?.valido) return;

    try {
      setGenerandoOrden(true);
      const nuevaOrden = await mazzolaApi.createOrdenFabricacion({
        presupuestoId: presupuestoOrigen.id,
        numeroPresupuesto: presupuestoOrigen.numero,
        clienteNombre: presupuestoOrigen.clienteNombre,
        item: itemSeleccionado,
        itemIndex: itemIndexSeleccionado,
        tipologiaNombre: itemSeleccionado.tipologia,
        varianteNombre: itemSeleccionado.variante || '',
        medidasStr: `${itemSeleccionado.anchoMm} x ${itemSeleccionado.altoMm} mm`,
        cantidadTotal: itemSeleccionado.cantidad || 1,
        estadoFabrica: 'Por Iniciar',
        prioridad: 'Normal',
        enfoqueOptimizacion,
        datosCalculados: resultadoPreflight.datosCalculados,
        datosReales: {
          barrasCompradas: undefined,
          barrasUtilizadas: undefined,
          sobrantesReales: undefined,
          desperdicioRealMm: undefined,
          observaciones: '',
          registrado: false
        },
        listaCorte: resultadoPreflight.listaCorte,
        listaVidrios: resultadoPreflight.listaVidrios,
        listaAccesorios: resultadoPreflight.listaAccesorios,
        sobrantesAsignados,
        fechaIngreso: new Date().toISOString(),
        observacionesFabrica: `Generada explícitamente desde presupuesto #${presupuestoOrigen.numero}`
      });

      setModalGeneracionAbierto(false);
      await recargarSobrantes();
      if (onOrdenCreada) onOrdenCreada();
      setOrdenSeleccionada(nuevaOrden);
      setTabActiva('planilla');
    } catch (err: any) {
      alert('Error al generar la orden: ' + err.message);
    } finally {
      setGenerandoOrden(false);
    }
  };

  // Abrir modal de datos reales
  const abrirRegistroDatosReales = (orden: OrdenFabricacion) => {
    setOrdenParaDatosReales(orden);
    const dr = orden.datosReales || {};
    setFormDatosReales({
      barrasCompradas: dr.barrasCompradas || (orden.datosCalculados?.totalBarras || 0),
      barrasUtilizadas: dr.barrasUtilizadas || (orden.datosCalculados?.totalBarras || 0),
      sobrantesReales: dr.sobrantesReales || 0,
      desperdicioRealMm: dr.desperdicioRealMm || 0,
      observaciones: dr.observaciones || ''
    });
    setModalDatosRealesAbierto(true);
  };

  const handleGuardarDatosReales = async () => {
    if (!ordenParaDatosReales) return;
    try {
      await mazzolaApi.registrarDatosRealesOrden(ordenParaDatosReales.id, formDatosReales);
      setModalDatosRealesAbierto(false);
      if (onOrdenCreada) onOrdenCreada();
      if (ordenSeleccionada?.id === ordenParaDatosReales.id) {
        const refrescada = await mazzolaApi.getOrdenFabricacion(ordenParaDatosReales.id);
        setOrdenSeleccionada(refrescada);
      }
    } catch (err: any) {
      alert('Error al registrar datos reales: ' + err.message);
    }
  };

  // Crear sobrante manual
  const handleGuardarSobrante = async () => {
    try {
      await mazzolaApi.createSobrante(nuevoSobrante);
      setMostrarNuevoSobrante(false);
      await recargarSobrantes();
    } catch (err: any) {
      alert('Error creando sobrante: ' + err.message);
    }
  };

  // Eliminar sobrante
  const handleEliminarSobrante = async (id: string) => {
    if (!window.confirm('¿Desea dar de baja este retazo del stock de sobrantes?')) return;
    try {
      await mazzolaApi.deleteSobrante(id);
      await recargarSobrantes();
    } catch (err: any) {
      alert('Error eliminando sobrante: ' + err.message);
    }
  };

  // Filtro de órdenes
  const ordenesFiltradas = ordenes.filter(o => {
    const q = busqueda.toLowerCase();
    const it = o.item || {} as any;
    const coincideTexto = (
      (o.numeroOrden && o.numeroOrden.toLowerCase().includes(q)) ||
      (o.numeroPresupuesto && o.numeroPresupuesto.toLowerCase().includes(q)) ||
      (o.clienteNombre && o.clienteNombre.toLowerCase().includes(q)) ||
      (o.tipologiaNombre && o.tipologiaNombre.toLowerCase().includes(q)) ||
      (it.tipologia && it.tipologia.toLowerCase().includes(q))
    );
    const coincideEstado = filtroEstado === 'todos' || o.estadoFabrica === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  // Presupuestos confirmados (Aprobado o Señado) listos para decidir producción
  const presupuestosConfirmados = presupuestos.filter(p => 
    p.estado === 'Aprobado' || p.estado === 'Señado' || p.estado === 'En Fabricación'
  );

  return (
    <div className="space-y-6">
      {/* Encabezado Industrial de Fábrica */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#DFD9CD] border border-[#CCC4B4] rounded-xl p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <Hammer className="text-orange-700" />
              Fábrica y Orden de Producción
            </h2>
            <span className="bg-orange-200 text-orange-900 border border-orange-300 text-[10px] font-black uppercase px-2 py-0.5 rounded">
              FASE 6 — MDT / WinProyect
            </span>
          </div>
          <p className="text-stone-700 text-xs mt-0.5">
            Cálculo milimétrico estricto mediante datos técnicos homologados. Planilla interna de taller libre de precios comerciales.
          </p>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center gap-1.5 bg-[#D5CEC2] p-1 rounded-lg border border-[#C5BDAE] self-start sm:self-auto">
          <button
            onClick={() => setTabActiva('ordenes')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              tabActiva === 'ordenes' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-300/60'
            }`}
          >
            Órdenes ({ordenes.length})
          </button>
          <button
            onClick={() => setTabActiva('presupuestos_confirmados')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              tabActiva === 'presupuestos_confirmados' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-300/60'
            }`}
          >
            Cotizaciones Confirmadas ({presupuestosConfirmados.length})
          </button>
          <button
            onClick={() => setTabActiva('sobrantes')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
              tabActiva === 'sobrantes' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-300/60'
            }`}
          >
            Stock Sobrantes ({sobrantes.length})
          </button>
          {ordenSeleccionada && (
            <button
              onClick={() => setTabActiva('planilla')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                tabActiva === 'planilla' ? 'bg-orange-700 text-white shadow-xs' : 'text-orange-900 hover:bg-orange-200'
              }`}
            >
              <FileText size={13} />
              Hoja Taller #{ordenSeleccionada.numeroOrden || ordenSeleccionada.id.slice(0, 8)}
            </button>
          )}
        </div>
      </div>

      {/* Regla Directriz Visible */}
      <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl p-3.5 text-xs text-stone-700 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Layers size={18} className="text-orange-700 shrink-0" />
          <span>
            <strong>Flujo de Fábrica Exclusivo:</strong> Una cotización confirmada <span className="underline decoration-rose-500 font-bold">NO entra automáticamente</span> a producción. Debe existir una acción explícita del operario. La lista de corte y vidrios utiliza únicamente fórmulas oficiales aprobadas.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-stone-600 bg-[#EFECE6] px-2.5 py-1 rounded border border-[#DDD7CC]">
          <span>Mazzola Regla Técnica: 45° / 90° Estricto</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: ÓRDENES DE PRODUCCIÓN                                          */}
      {/* ========================================================================= */}
      {tabActiva === 'ordenes' && (
        <div className="space-y-4">
          {/* Barra de Filtro y Búsqueda */}
          <div className="bg-[#F4F1EA] border border-[#D8D2C6] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 text-stone-500" size={16} />
              <input
                type="text"
                placeholder="Buscar por OP, cliente, presupuesto o tipología..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#C5BDAE] rounded-lg pl-9 pr-3 py-2 text-xs text-stone-900 outline-none focus:border-orange-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-600">Etapa en Taller:</span>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="bg-[#FAF8F5] border border-[#C5BDAE] rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900 outline-none"
              >
                <option value="todos">Todas las etapas</option>
                <option value="Por Iniciar">Por Iniciar</option>
                <option value="Corte">Corte</option>
                <option value="Armado">Armado</option>
                <option value="Vidriado">Vidriado</option>
                <option value="Listo para Entrega">Listo para Entrega</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>
          </div>

          {/* Grilla de Órdenes */}
          {ordenesFiltradas.length === 0 ? (
            <div className="bg-[#FAF8F5] border border-dashed border-[#D5CEC2] rounded-xl p-12 text-center">
              <Boxes size={36} className="mx-auto text-stone-400 mb-2" />
              <p className="text-stone-700 font-bold text-sm">No hay órdenes de producción que coincidan.</p>
              <p className="text-stone-500 text-xs mt-1">
                Vaya a la pestaña "Cotizaciones Confirmadas" para generar una orden de fabricación con acción explícita.
              </p>
              <button
                onClick={() => setTabActiva('presupuestos_confirmados')}
                className="mt-4 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
              >
                <ArrowRight size={14} />
                Ver Cotizaciones Confirmadas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ordenesFiltradas.map((ord) => {
                const dc = ord.datosCalculados;
                const dr = ord.datosReales;
                return (
                  <div 
                    key={ord.id}
                    className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      {/* Cabecera Tarjeta */}
                      <div className="flex items-start justify-between gap-2 border-b border-[#E8E2D6] pb-2.5 mb-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-sm text-stone-900">
                              {ord.numeroOrden || `OP-${ord.numeroPresupuesto}-${ord.itemIndex}`}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              ord.prioridad === 'Urgente' ? 'bg-rose-100 text-rose-800' : 'bg-stone-200 text-stone-700'
                            }`}>
                              {ord.prioridad}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                            Presupuesto: #{ord.numeroPresupuesto} · Cliente: <strong>{ord.clienteNombre}</strong>
                          </p>
                        </div>

                        <select
                          value={ord.estadoFabrica}
                          onChange={(e) => onActualizarEstadoOrden(ord.id, e.target.value as any)}
                          className={`text-xs font-bold px-2 py-1 rounded-md border outline-none cursor-pointer ${
                            ord.estadoFabrica === 'Por Iniciar' ? 'bg-amber-50 text-amber-900 border-amber-300' :
                            ord.estadoFabrica === 'Corte' ? 'bg-blue-50 text-blue-900 border-blue-300' :
                            ord.estadoFabrica === 'Armado' ? 'bg-purple-50 text-purple-900 border-purple-300' :
                            ord.estadoFabrica === 'Vidriado' ? 'bg-cyan-50 text-cyan-900 border-cyan-300' :
                            'bg-emerald-50 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          <option value="Por Iniciar">Por Iniciar</option>
                          <option value="Corte">Corte</option>
                          <option value="Armado">Armado</option>
                          <option value="Vidriado">Vidriado</option>
                          <option value="Listo para Entrega">Listo p/ Entrega</option>
                          <option value="Finalizado">Finalizado</option>
                        </select>
                      </div>

                      {/* Detalles Técnicos */}
                      <div className="space-y-2 text-xs">
                        <div className="bg-[#F2EFE9] p-2.5 rounded-lg border border-[#DDD7CC]">
                          <p className="font-extrabold text-stone-900">
                            {ord.tipologiaNombre || ord.item?.tipologia}
                          </p>
                          <p className="text-stone-700 font-medium text-[11px] mt-0.5">
                            Medidas: <span className="font-mono font-bold text-orange-900">{ord.medidasStr || `${ord.item?.anchoMm}x${ord.item?.altoMm} mm`}</span> · Cantidad: <strong>{ord.cantidadTotal || ord.item?.cantidad || 1} u.</strong>
                          </p>
                          {ord.item?.vidrio && (
                            <p className="text-stone-600 text-[11px]">Vidrio: {ord.item.vidrio}</p>
                          )}
                        </div>

                        {/* Indicador de Enfoque y Cálculo */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="bg-stone-100 p-1.5 rounded border border-stone-200">
                            <span className="text-stone-500 block text-[10px] uppercase font-bold">Cálculo Técnico</span>
                            <span className="font-bold text-stone-900">
                              {dc ? `${dc.totalBarras} barras (6m)` : 'Pendiente'}
                            </span>
                            {dc && (
                              <span className="block text-[10px] text-stone-600">
                                Desp: {(dc.desperdicioMm / 1000).toFixed(2)}m
                              </span>
                            )}
                          </div>
                          <div className="bg-stone-100 p-1.5 rounded border border-stone-200">
                            <span className="text-stone-500 block text-[10px] uppercase font-bold">Datos Reales</span>
                            <span className={`font-bold ${dr?.registrado ? 'text-emerald-800' : 'text-amber-800'}`}>
                              {dr?.registrado ? `${dr.barrasUtilizadas} barras usadas` : 'Sin registrar'}
                            </span>
                            {dr?.registrado && (
                              <span className="block text-[10px] text-stone-600">
                                {dr.barrasCompradas} compradas
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center gap-2 pt-3 border-t border-[#E8E2D6]">
                          <button
                            onClick={() => {
                              setOrdenSeleccionada(ord);
                              setTabActiva('planilla');
                            }}
                            className="flex-1 bg-stone-900 hover:bg-stone-800 text-white py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <FileText size={13} />
                            Ver Planilla de Fábrica
                          </button>
                          <button
                            onClick={() => abrirRegistroDatosReales(ord)}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 py-1.5 px-2 rounded-lg text-xs font-bold cursor-pointer"
                            title="Registrar barras y desperdicios reales"
                          >
                            Real vs Calc
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: PRESUPUESTOS CONFIRMADOS (ACCIÓN EXPLÍCITA)                   */}
      {/* ========================================================================= */}
      {tabActiva === 'presupuestos_confirmados' && (
        <div className="space-y-4">
          <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl p-4">
            <h3 className="text-sm font-black text-stone-900 mb-1 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-700" />
              Cotizaciones Aprobadas / Señadas Pendientes de Entrada a Taller
            </h3>
            <p className="text-stone-600 text-xs">
              De acuerdo a la directiva técnica, ninguna cotización entra a producción automáticamente. Para cada abertura, revise los datos y decida explícitamente generar la orden.
            </p>
          </div>

          {presupuestosConfirmados.length === 0 ? (
            <div className="bg-[#FAF8F5] border border-dashed border-[#D5CEC2] rounded-xl p-8 text-center text-xs text-stone-600">
              No hay presupuestos en estado "Aprobado" o "Señado" pendientes de producción.
            </div>
          ) : (
            <div className="space-y-3">
              {presupuestosConfirmados.map((p) => (
                <div 
                  key={p.id}
                  className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl p-4 hover:shadow-xs transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E2D6] pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-stone-900 text-sm">Presupuesto #{p.numero}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {p.estado}
                        </span>
                        <span className="text-stone-500 text-xs">
                          Cliente: <strong>{p.clienteNombre}</strong>
                        </span>
                      </div>
                      <p className="text-stone-500 text-[11px] mt-0.5">
                        Emitido: {new Date(p.fechaCreacion).toLocaleDateString('es-AR')} · Total comercial: ${(p.total || 0).toLocaleString('es-AR')} (Precios ocultos en fábrica)
                      </p>
                    </div>
                  </div>

                  {/* Listado de Aberturas del Presupuesto */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-stone-700">Aberturas presupuestadas para fabricar:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {p.items?.map((it, idx) => {
                        const yaTieneOrden = ordenes.some(o => o.presupuestoId === p.id && o.itemIndex === (idx + 1));
                        return (
                          <div 
                            key={it.id || idx}
                            className="bg-[#F4F1EA] border border-[#DDD7CC] rounded-lg p-3 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-stone-900">
                                  #{idx + 1} {it.tipologia}
                                </span>
                                {yaTieneOrden ? (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Check size={11} />
                                    Orden Generada
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                                    Pendiente Acción
                                  </span>
                                )}
                              </div>
                              <p className="text-stone-700 text-xs mt-1">
                                Medidas: <span className="font-mono font-bold text-orange-950">{it.anchoMm} mm x {it.altoMm} mm</span> · Cantidad: <strong>{it.cantidad || 1}</strong>
                              </p>
                              <p className="text-stone-500 text-[11px]">
                                Vidrio: {it.vidrio || 'Simple'} · Color: {it.color || 'Blanco'}
                              </p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-[#DDD7CC] flex items-center justify-end">
                              <button
                                onClick={() => iniciarGeneracionOrden(p, it, idx + 1)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                                  yaTieneOrden 
                                    ? 'bg-stone-300 hover:bg-stone-400 text-stone-800' 
                                    : 'bg-orange-700 hover:bg-orange-800 text-white shadow-xs'
                                }`}
                              >
                                <Hammer size={13} />
                                {yaTieneOrden ? 'Revisar / Re-generar Orden' : 'GENERAR ORDEN DE PRODUCCIÓN'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: STOCK DE SOBRANTES / RETAZOS                                  */}
      {/* ========================================================================= */}
      {tabActiva === 'sobrantes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl p-4">
            <div>
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Boxes size={18} className="text-orange-700" />
                Pañol de Retazos y Sobrantes de Aluminio
              </h3>
              <p className="text-stone-600 text-xs mt-0.5">
                Registro de barras cortadas aprovechables (≥ 500 mm). Antes de comprar barra nueva, el sistema sugerirá usar sobrantes disponibles bajo decisión explícita.
              </p>
            </div>

            <button
              onClick={() => setMostrarNuevoSobrante(true)}
              className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={14} />
              Registrar Sobrante en Stock
            </button>
          </div>

          {/* Tabla de Sobrantes */}
          <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFECE6] border-b border-[#D5CEC2] text-stone-700 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Perfil</th>
                    <th className="p-3">Largo (mm)</th>
                    <th className="p-3">Cant.</th>
                    <th className="p-3">Ubicación</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Observaciones</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE6]">
                  {sobrantes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-stone-500">
                        No hay retazos registrados en el pañol de sobrantes.
                      </td>
                    </tr>
                  ) : (
                    sobrantes.map((s) => (
                      <tr key={s.id} className="hover:bg-[#F5F2EC]">
                        <td className="p-3 font-mono font-bold text-stone-900">{s.perfilCodigo}</td>
                        <td className="p-3 font-medium text-stone-800">{s.perfilNombre || 'Perfil estándar'}</td>
                        <td className="p-3 font-mono font-black text-orange-900">{s.longitudMm} mm</td>
                        <td className="p-3 font-bold">{s.cantidad}</td>
                        <td className="p-3 text-stone-700">{s.ubicacion}</td>
                        <td className="p-3 text-stone-500">{s.fecha}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            s.estado === 'Disponible' ? 'bg-emerald-100 text-emerald-800' :
                            s.estado === 'Reservado' ? 'bg-amber-100 text-amber-900' :
                            'bg-stone-200 text-stone-700'
                          }`}>
                            {s.estado}
                          </span>
                        </td>
                        <td className="p-3 text-stone-600 max-w-xs truncate">{s.observaciones || '-'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleEliminarSobrante(s.id)}
                            className="p-1 text-stone-400 hover:text-rose-700 rounded cursor-pointer transition-colors"
                            title="Eliminar de stock"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 4: PLANILLA DE FÁBRICA / HOJA DE TALLER                           */}
      {/* ========================================================================= */}
      {tabActiva === 'planilla' && ordenSeleccionada && (
        <div className="space-y-5">
          {/* Barra de Acciones de Planilla */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#DFD9CD] border border-[#CCC4B4] rounded-xl p-4 print:hidden">
            <div>
              <span className="text-[10px] font-mono uppercase bg-stone-900 text-white px-2 py-0.5 rounded font-bold">
                Hoja de Taller Interna
              </span>
              <h3 className="text-lg font-black text-stone-900 mt-1">
                Planilla de Fabricación: {ordenSeleccionada.numeroOrden || `OP-${ordenSeleccionada.numeroPresupuesto}`}
              </h3>
              <p className="text-stone-700 text-xs">
                Documento técnico para el operador de corte, vidriado y banco de armado.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => abrirRegistroDatosReales(ordenSeleccionada)}
                className="bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer border border-amber-400"
              >
                <Boxes size={14} />
                Registrar Datos Reales (Taller)
              </button>

              <button
                onClick={() => window.print()}
                className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer size={14} />
                Imprimir Hoja de Fábrica
              </button>
            </div>
          </div>

          {/* DOCUMENTO IMPRIMIBLE: PLANILLA DE TALLER */}
          <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl p-6 sm:p-8 text-stone-900 print:border-none print:p-2 space-y-6">
            {/* Cabecera Documento */}
            <div className="border-b-2 border-stone-800 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black text-stone-950 uppercase tracking-tight">
                    ABERTURAS MAZZOLA · ORDEN DE PRODUCCIÓN
                  </h1>
                  <p className="text-xs text-stone-600 font-bold">
                    PLANILLA TÉCNICA DE FÁBRICA — USO EXCLUSIVAMENTE INTERNO (NO ENTREGAR A CLIENTE)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono font-black text-orange-950">
                    {ordenSeleccionada.numeroOrden || `OP-${ordenSeleccionada.numeroPresupuesto}`}
                  </span>
                  <p className="text-xs text-stone-600">Fecha: {new Date(ordenSeleccionada.fechaIngreso).toLocaleDateString('es-AR')}</p>
                </div>
              </div>

              {/* Ficha Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F2EFE9] border border-[#DDD7CC] rounded-lg p-3 mt-4 text-xs">
                <div>
                  <span className="text-stone-500 uppercase text-[10px] font-bold block">Cliente</span>
                  <span className="font-extrabold text-stone-900">{ordenSeleccionada.clienteNombre}</span>
                </div>
                <div>
                  <span className="text-stone-500 uppercase text-[10px] font-bold block">Presupuesto Origen</span>
                  <span className="font-mono font-bold text-stone-900">#{ordenSeleccionada.numeroPresupuesto}</span>
                </div>
                <div>
                  <span className="text-stone-500 uppercase text-[10px] font-bold block">Tipología y Variante</span>
                  <span className="font-bold text-stone-900">
                    {ordenSeleccionada.tipologiaNombre} {ordenSeleccionada.varianteNombre ? `(${ordenSeleccionada.varianteNombre})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 uppercase text-[10px] font-bold block">Medidas / Cantidad</span>
                  <span className="font-mono font-black text-orange-900">
                    {ordenSeleccionada.medidasStr} — {ordenSeleccionada.cantidadTotal || 1} abertura(s)
                  </span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 1: LISTA DE CORTE DE PERFILERÍA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-300 pb-1.5">
                <h3 className="text-sm font-black text-stone-950 uppercase flex items-center gap-2">
                  <Scissors size={16} className="text-orange-700" />
                  1. Lista Técnica de Corte de Perfilería
                </h3>
                <span className="text-[11px] font-mono text-stone-600">
                  Ángulos homologados: 45° / 90°
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-stone-300">
                  <thead className="bg-[#EAE6DE] text-stone-800 uppercase font-black text-[10px]">
                    <tr className="border-b border-stone-300">
                      <th className="p-2">Perfil</th>
                      <th className="p-2">Código</th>
                      <th className="p-2">Función / Pieza</th>
                      <th className="p-2 text-right">Medida (mm)</th>
                      <th className="p-2 text-center">Cant.</th>
                      <th className="p-2">Barra / Origen</th>
                      <th className="p-2 text-center">Corte A</th>
                      <th className="p-2 text-center">Corte B</th>
                      <th className="p-2 text-center">Comb.</th>
                      <th className="p-2">Mecanizado / Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {(ordenSeleccionada.listaCorte || []).map((corte, i) => (
                      <tr key={i} className="hover:bg-stone-100">
                        <td className="p-2 font-medium">{corte.perfilNombre}</td>
                        <td className="p-2 font-mono font-black text-stone-950">{corte.perfilCodigo}</td>
                        <td className="p-2 font-bold text-stone-900">{corte.pieza}</td>
                        <td className="p-2 text-right font-mono font-black text-orange-950 text-sm">
                          {corte.medidaMm} mm
                        </td>
                        <td className="p-2 text-center font-bold">{corte.cantidad}</td>
                        <td className="p-2 font-medium text-stone-700">{corte.barraAsignada || 'Barra Estándar'}</td>
                        <td className="p-2 text-center font-mono font-bold">{corte.corteA}</td>
                        <td className="p-2 text-center font-mono font-bold">{corte.corteB}</td>
                        <td className="p-2 text-center font-mono font-extrabold bg-stone-100">
                          {corte.combinacionCortes}
                        </td>
                        <td className="p-2 text-[11px] text-stone-700">
                          <strong>{corte.mecanizado}</strong>
                          {corte.observaciones && <span className="block text-stone-500 text-[10px]">{corte.observaciones}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN 2: VIDRIOS TÉCNICOS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-300 pb-1.5">
                <h3 className="text-sm font-black text-stone-950 uppercase flex items-center gap-2">
                  <Maximize2 size={16} className="text-cyan-700" />
                  2. Lista Interna de Vidrios (Cálculo Oficial)
                </h3>
                <span className="text-[11px] text-stone-600 font-medium">
                  Descuentos milimétricos derivados de reglas técnicas
                </span>
              </div>

              {(!ordenSeleccionada.listaVidrios || ordenSeleccionada.listaVidrios.length === 0) ? (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded text-xs text-amber-900">
                  ⚠️ Esta abertura no posee vidrios asignados o no existen reglas técnicas de vidrio aprobadas en catálogo para esta tipología.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-stone-300">
                    <thead className="bg-[#EAE6DE] text-stone-800 uppercase font-black text-[10px]">
                      <tr className="border-b border-stone-300">
                        <th className="p-2">Pieza</th>
                        <th className="p-2 text-right">Ancho (mm)</th>
                        <th className="p-2 text-right">Alto (mm)</th>
                        <th className="p-2 text-center">Cant.</th>
                        <th className="p-2">Espesor / Tipo</th>
                        <th className="p-2">Observaciones</th>
                        <th className="p-2">Fuente Técnica</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {ordenSeleccionada.listaVidrios.map((v, i) => (
                        <tr key={i} className="hover:bg-stone-100">
                          <td className="p-2 font-bold">{v.pieza}</td>
                          <td className="p-2 text-right font-mono font-black text-cyan-950 text-sm">{v.anchoMm} mm</td>
                          <td className="p-2 text-right font-mono font-black text-cyan-950 text-sm">{v.altoMm} mm</td>
                          <td className="p-2 text-center font-bold">{v.cantidad}</td>
                          <td className="p-2 font-semibold text-stone-800">{v.espesorTipo}</td>
                          <td className="p-2 text-[11px] text-stone-600">{v.observaciones}</td>
                          <td className="p-2 font-mono text-[10px] text-stone-500">{v.fuenteTecnica}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECCIÓN 3: ACCESORIOS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-300 pb-1.5">
                <h3 className="text-sm font-black text-stone-950 uppercase flex items-center gap-2">
                  <Package size={16} className="text-purple-700" />
                  3. Lista Interna de Accesorios Homologados
                </h3>
              </div>

              {(!ordenSeleccionada.listaAccesorios || ordenSeleccionada.listaAccesorios.length === 0) ? (
                <div className="bg-stone-100 border border-stone-200 p-3 rounded text-xs text-stone-600">
                  Sin accesorios registrados para esta orden técnica.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-stone-300">
                    <thead className="bg-[#EAE6DE] text-stone-800 uppercase font-black text-[10px]">
                      <tr className="border-b border-stone-300">
                        <th className="p-2">Código</th>
                        <th className="p-2">Accesorio</th>
                        <th className="p-2">Función en Abertura</th>
                        <th className="p-2 text-center">Cant.</th>
                        <th className="p-2">Observaciones</th>
                        <th className="p-2">Fuente Técnica</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {ordenSeleccionada.listaAccesorios.map((a, i) => (
                        <tr key={i} className="hover:bg-stone-100">
                          <td className="p-2 font-mono font-bold text-stone-900">{a.codigo}</td>
                          <td className="p-2 font-bold">{a.nombre}</td>
                          <td className="p-2 text-stone-700">{a.funcion}</td>
                          <td className="p-2 text-center font-black text-purple-900 text-sm">
                            {a.cantidad} {a.unidad}
                          </td>
                          <td className="p-2 text-[11px] text-stone-600">{a.observaciones}</td>
                          <td className="p-2 font-mono text-[10px] text-stone-500">{a.fuenteTecnica}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECCIÓN 4: COMPARATIVA REAL VS CALCULADO */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between border-b border-stone-300 pb-1.5">
                <h3 className="text-sm font-black text-stone-950 uppercase flex items-center gap-2">
                  <Boxes size={16} className="text-orange-800" />
                  4. Control de Barras, Sobrantes y Desperdicio: Calculado vs Real
                </h3>
                <span className="text-[10px] font-bold text-stone-500">
                  Largo comercial estándar: 6.00 m (6000 mm)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Panel Calculado */}
                <div className="bg-[#FAF8F3] border-2 border-stone-300 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
                      DATOS CALCULADOS (Teórico)
                    </h4>
                    <span className="text-[10px] font-mono bg-stone-200 text-stone-800 px-2 py-0.5 rounded font-bold">
                      Enfoque: {ordenSeleccionada.enfoqueOptimizacion === 'material' ? 'Optimización Material' : 'Práctico Mazzola'}
                    </span>
                  </div>

                  {ordenSeleccionada.datosCalculados ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-stone-200">
                        <span className="text-stone-600">Barras comerciales requeridas:</span>
                        <span className="font-extrabold text-stone-900">{ordenSeleccionada.datosCalculados.totalBarras} barras (6.00m)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-200">
                        <span className="text-stone-600">Material útil cortado:</span>
                        <span className="font-bold text-stone-900">{(ordenSeleccionada.datosCalculados.materialUtilizadoMm / 1000).toFixed(2)} m</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-200">
                        <span className="text-stone-600">Sobrante aprovechable (≥ 500mm):</span>
                        <span className="font-bold text-emerald-800">{(ordenSeleccionada.datosCalculados.sobranteAprovechableMm / 1000).toFixed(2)} m</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-stone-600">Desperdicio (sierra + despuntes):</span>
                        <span className="font-bold text-rose-800">{(ordenSeleccionada.datosCalculados.desperdicioMm / 1000).toFixed(2)} m</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500">Sin desglose calculado disponible.</p>
                  )}
                </div>

                {/* Panel Real */}
                <div className="bg-[#FAF8F3] border-2 border-orange-300 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-950">
                      DATOS REALES (Taller de Fabricación)
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      ordenSeleccionada.datosReales?.registrado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {ordenSeleccionada.datosReales?.registrado ? 'Registrado en Taller' : 'Pendiente Registro'}
                    </span>
                  </div>

                  {ordenSeleccionada.datosReales?.registrado ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-stone-200">
                        <span className="text-stone-600">Barras compradas / asignadas:</span>
                        <span className="font-extrabold text-stone-900">{ordenSeleccionada.datosReales.barrasCompradas} barras</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-200">
                        <span className="text-stone-600">Barras realmente utilizadas:</span>
                        <span className="font-bold text-stone-900">{ordenSeleccionada.datosReales.barrasUtilizadas} barras</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-200">
                        <span className="text-stone-600">Sobrantes reales obtenidos:</span>
                        <span className="font-bold text-emerald-800">{ordenSeleccionada.datosReales.sobrantesReales} retazos</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-stone-200">
                        <span className="text-stone-600">Desperdicio real medido:</span>
                        <span className="font-bold text-rose-800">{ordenSeleccionada.datosReales.desperdicioRealMm} mm</span>
                      </div>
                      {ordenSeleccionada.datosReales.observaciones && (
                        <p className="text-[11px] text-stone-600 italic mt-1">
                          Notas: "{ordenSeleccionada.datosReales.observaciones}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs text-stone-600">
                      <p>Aún no se registraron los consumos reales para esta orden.</p>
                      <button
                        onClick={() => abrirRegistroDatosReales(ordenSeleccionada)}
                        className="bg-orange-700 hover:bg-orange-800 text-white font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer print:hidden"
                      >
                        Registrar Consumo Real Ahora
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Firmas de Taller */}
            <div className="pt-8 grid grid-cols-3 gap-8 text-center text-xs text-stone-600">
              <div className="border-t border-stone-400 pt-2">
                Operador de Corte
              </div>
              <div className="border-t border-stone-400 pt-2">
                Operador de Armado y Vidriado
              </div>
              <div className="border-t border-stone-400 pt-2">
                Control de Calidad Mazzola
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FLUJO EXPLÍCITO DE GENERACIÓN DE ORDEN DE PRODUCCIÓN             */}
      {/* ========================================================================= */}
      {modalGeneracionAbierto && itemSeleccionado && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#FAF8F5] border border-[#CCC4B4] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Cabecera Modal */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E0D9CC] bg-[#EFECE6]">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-orange-950 bg-orange-200 border border-orange-300 px-2 py-0.5 rounded">
                  ACCIÓN EXPLÍCITA REQUERIDA
                </span>
                <h3 className="text-lg font-black text-stone-900 mt-1">
                  Generación de Orden de Producción — Item #{itemIndexSeleccionado}
                </h3>
                <p className="text-xs text-stone-600">
                  Presupuesto #{presupuestoOrigen?.numero} · Cliente: <strong>{presupuestoOrigen?.clienteNombre}</strong>
                </p>
              </div>

              <button
                onClick={() => setModalGeneracionAbierto(false)}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-300/50 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
              {/* Ficha Resumen de Abertura */}
              <div className="bg-[#F2EFE9] border border-[#DDD7CC] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-stone-500 text-[10px] uppercase font-bold block">Tipología</span>
                  <span className="font-extrabold text-stone-900 text-sm">{itemSeleccionado.tipologia}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] uppercase font-bold block">Medidas de Fabricación</span>
                  <span className="font-mono font-black text-orange-950 text-sm">
                    {itemSeleccionado.anchoMm} mm (Ancho) x {itemSeleccionado.altoMm} mm (Alto)
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] uppercase font-bold block">Cantidad</span>
                  <span className="font-extrabold text-stone-900 text-sm">{itemSeleccionado.cantidad || 1} abertura(s)</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] uppercase font-bold block">Línea / Sistema</span>
                  <span className="font-bold text-stone-800">{itemSeleccionado.linea || 'MDT'}</span>
                </div>
              </div>

              {/* Estado de Cálculo Preflight */}
              {calculandoPreflight ? (
                <div className="p-8 text-center text-xs text-stone-600 flex items-center justify-center gap-2">
                  <RefreshCw className="animate-spin text-orange-700" size={18} />
                  Evaluando fórmulas técnicas oficiales y compatibilidad de sobrantes...
                </div>
              ) : resultadoPreflight && !resultadoPreflight.valido ? (
                /* REQUISITO ESTRICTO: Si faltan reglas técnicas aprobadas */
                <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-5 text-rose-950 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert size={24} className="text-rose-700 shrink-0" />
                    <div>
                      <h4 className="font-black text-sm tracking-tight text-rose-900">
                        NO SE PUEDE GENERAR ORDEN DE FABRICACIÓN — INFORMACIÓN TÉCNICA INCOMPLETA
                      </h4>
                      <p className="text-xs text-rose-800 mt-0.5">
                        Por estricta política técnica de Aberturas Mazzola, no se permite inventar medidas, fórmulas ni perfiles.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/80 rounded-lg p-3 text-xs space-y-1.5 border border-rose-200">
                    <p className="font-bold text-rose-900">Detalles técnicos faltantes en catálogo:</p>
                    <ul className="list-disc pl-5 space-y-1 text-rose-800">
                      {resultadoPreflight.detallesFaltantes?.map((det: string, i: number) => (
                        <li key={i}>{det}</li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-[11px] text-stone-600 italic">
                    Para habilitar la fabricación de esta tipología, cargue y apruebe el catálogo oficial correspondiente con sus reglas de corte perimetral en la sección "Datos Técnicos".
                  </p>
                </div>
              ) : resultadoPreflight && resultadoPreflight.valido ? (
                /* Preflight Válido: Mostrar Configuración de Enfoque y Sobrantes */
                <div className="space-y-4">
                  {/* Selector de Enfoque de Optimización */}
                  <div className="bg-[#FAF8F5] border border-[#DDD7CC] rounded-xl p-4 space-y-2">
                    <span className="text-xs font-black text-stone-900 block">
                      Seleccione Enfoque de Producción:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleCambiarEnfoque('material')}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                          enfoqueOptimizacion === 'material' 
                            ? 'bg-orange-50 border-orange-600 text-orange-950 ring-2 ring-orange-400/40' 
                            : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs">1. Optimización de Material</span>
                          {enfoqueOptimizacion === 'material' && <Check size={14} className="text-orange-700" />}
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1">
                          Prioriza menor retazo y mínimo desperdicio agrupando piezas por longitud decreciente.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCambiarEnfoque('mazzola')}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                          enfoqueOptimizacion === 'mazzola' 
                            ? 'bg-orange-50 border-orange-600 text-orange-950 ring-2 ring-orange-400/40' 
                            : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs">2. Método Práctico de Mazzola</span>
                          {enfoqueOptimizacion === 'mazzola' && <Check size={14} className="text-orange-700" />}
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1">
                          Prioriza producción más sencilla: cortes en serie de piezas idénticas para evitar confusiones en taller.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Sugerencias de Sobrantes Compatibles (Decisión Explícita) */}
                  {resultadoPreflight.sobrantesSugeridos && resultadoPreflight.sobrantesSugeridos.length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Boxes size={16} className="text-amber-800" />
                        <h4 className="text-xs font-black text-amber-950 uppercase">
                          Sobrantes / Retazos Compatibles Detectados en Stock
                        </h4>
                      </div>
                      <p className="text-[11px] text-amber-900">
                        El sistema detectó retazos disponibles en pañol compatibles con las piezas a cortar. Decida explícitamente si desea reutilizarlos antes de abrir barras comerciales de 6 metros:
                      </p>

                      <div className="space-y-2">
                        {resultadoPreflight.sobrantesSugeridos.map((sug: any, idx: number) => {
                          const estaAsignado = sobrantesAsignados.some(a => a.sobranteId === sug.sobrante.id);
                          return (
                            <div 
                              key={idx}
                              className="bg-white border border-amber-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <span className="font-mono font-bold text-stone-900">
                                  Perfil {sug.perfilCodigo} ({sug.sobrante.perfilNombre})
                                </span>
                                <span className="text-stone-600 ml-2">
                                  Largo en stock: <strong className="text-orange-950">{sug.longitudMm} mm</strong> (Pieza: {sug.piezaAlineada} de {sug.medidaPiezaMm} mm)
                                </span>
                                <p className="text-[10px] text-stone-500">
                                  Ubicación: {sug.sobrante.ubicacion}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDecidirSobrante(sug, true)}
                                  className={`px-3 py-1.5 rounded text-xs font-black cursor-pointer transition-colors ${
                                    estaAsignado 
                                      ? 'bg-emerald-700 text-white ring-2 ring-emerald-400' 
                                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                                  }`}
                                >
                                  [ USAR SOBRANTE ]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDecidirSobrante(sug, false)}
                                  className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors ${
                                    !estaAsignado 
                                      ? 'bg-stone-300 text-stone-900 font-black' 
                                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                                  }`}
                                >
                                  [ NO USAR SOBRANTE ]
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Resumen de Cálculo de Barras */}
                  {resultadoPreflight.datosCalculados && (
                    <div className="bg-[#F2EFE9] border border-[#DDD7CC] rounded-xl p-4 text-xs">
                      <span className="font-black text-stone-900 block mb-2">
                        Resumen del Plan de Corte (Barras de 6.00 m):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                          <span className="text-[10px] uppercase font-bold text-stone-500 block">Barras Nuevas (6m)</span>
                          <span className="text-base font-black text-stone-900">
                            {resultadoPreflight.datosCalculados.totalBarras} u.
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                          <span className="text-[10px] uppercase font-bold text-stone-500 block">Material Utilizado</span>
                          <span className="text-base font-black text-stone-900">
                            {(resultadoPreflight.datosCalculados.materialUtilizadoMm / 1000).toFixed(2)} m
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                          <span className="text-[10px] uppercase font-bold text-stone-500 block">Sobrante Útil (≥ 50cm)</span>
                          <span className="text-base font-black text-emerald-800">
                            {(resultadoPreflight.datosCalculados.sobranteAprovechableMm / 1000).toFixed(2)} m
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                          <span className="text-[10px] uppercase font-bold text-stone-500 block">Desperdicio</span>
                          <span className="text-base font-black text-rose-800">
                            {(resultadoPreflight.datosCalculados.desperdicioMm / 1000).toFixed(2)} m
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vista Previa de Piezas de Corte */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-stone-800 block">
                      Piezas calculadas ({resultadoPreflight.listaCorte?.length || 0}):
                    </span>
                    <div className="max-h-40 overflow-y-auto border border-stone-200 rounded-lg">
                      <table className="w-full text-left text-[11px] bg-white">
                        <thead className="bg-stone-100 font-bold text-stone-700 text-[10px] uppercase">
                          <tr>
                            <th className="p-2">Perfil</th>
                            <th className="p-2">Pieza</th>
                            <th className="p-2 text-right">Medida</th>
                            <th className="p-2 text-center">Cant.</th>
                            <th className="p-2 text-center">Cortes</th>
                            <th className="p-2">Mecanizado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {resultadoPreflight.listaCorte?.map((c: any, i: number) => (
                            <tr key={i}>
                              <td className="p-2 font-mono font-bold text-stone-900">{c.perfilCodigo}</td>
                              <td className="p-2 font-medium">{c.pieza}</td>
                              <td className="p-2 text-right font-mono font-bold text-orange-900">{c.medidaMm} mm</td>
                              <td className="p-2 text-center font-bold">{c.cantidad}</td>
                              <td className="p-2 text-center font-mono font-bold">{c.combinacionCortes}</td>
                              <td className="p-2 text-stone-600 truncate max-w-xs">{c.mecanizado}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Pie de Modal */}
            <div className="flex items-center justify-between p-4 border-t border-[#E0D9CC] bg-[#EFECE6]">
              <button
                type="button"
                onClick={() => setModalGeneracionAbierto(false)}
                className="px-4 py-2 rounded-lg bg-stone-300 hover:bg-stone-400 text-stone-800 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!resultadoPreflight?.valido || generandoOrden}
                onClick={handleConfirmarGeneracionOrden}
                className={`px-5 py-2.5 rounded-lg text-xs font-black cursor-pointer flex items-center gap-2 shadow-sm transition-all ${
                  resultadoPreflight?.valido && !generandoOrden
                    ? 'bg-orange-700 hover:bg-orange-800 text-white'
                    : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                }`}
              >
                {generandoOrden ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    Generando Orden...
                  </>
                ) : (
                  <>
                    <Hammer size={14} />
                    CONFIRMAR Y GENERAR ORDEN DE PRODUCCIÓN
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REGISTRO MANUAL DE DATOS REALES (CALCULADO VS REAL)              */}
      {/* ========================================================================= */}
      {modalDatosRealesAbierto && ordenParaDatosReales && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border border-[#CCC4B4] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#E0D9CC] bg-[#EFECE6]">
              <div>
                <h3 className="text-sm font-black text-stone-900">
                  Registrar Datos Reales de Fabricación
                </h3>
                <p className="text-xs text-stone-600">
                  Orden: {ordenParaDatosReales.numeroOrden || `OP-${ordenParaDatosReales.numeroPresupuesto}`}
                </p>
              </div>
              <button
                onClick={() => setModalDatosRealesAbierto(false)}
                className="text-stone-500 hover:text-stone-900"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-900">
                <strong>Regla de Aberturas Mazzola:</strong> Los datos calculados originales se mantienen inalterados. Los datos reales se guardan en paralelo para comparar lo proyectado versus lo efectivamente consumido en taller.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Barras Compradas:</label>
                  <input
                    type="number"
                    min="0"
                    value={formDatosReales.barrasCompradas}
                    onChange={(e) => setFormDatosReales({ ...formDatosReales, barrasCompradas: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-300 rounded p-2 text-xs font-bold text-stone-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Barras Utilizadas:</label>
                  <input
                    type="number"
                    min="0"
                    value={formDatosReales.barrasUtilizadas}
                    onChange={(e) => setFormDatosReales({ ...formDatosReales, barrasUtilizadas: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-300 rounded p-2 text-xs font-bold text-stone-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Sobrantes Reales Obtenidos:</label>
                  <input
                    type="number"
                    min="0"
                    value={formDatosReales.sobrantesReales}
                    onChange={(e) => setFormDatosReales({ ...formDatosReales, sobrantesReales: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-300 rounded p-2 text-xs font-bold text-stone-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Desperdicio Real (mm o aprox.):</label>
                  <input
                    type="number"
                    min="0"
                    value={formDatosReales.desperdicioRealMm}
                    onChange={(e) => setFormDatosReales({ ...formDatosReales, desperdicioRealMm: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-300 rounded p-2 text-xs font-bold text-stone-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Observaciones de Taller:</label>
                <textarea
                  rows={3}
                  value={formDatosReales.observaciones}
                  onChange={(e) => setFormDatosReales({ ...formDatosReales, observaciones: e.target.value })}
                  placeholder="Ej: Se compraron 10 barras porque el proveedor no fracciona; se usaron 8 y quedaron 2 sobrantes enteros."
                  className="w-full bg-white border border-stone-300 rounded p-2 text-xs text-stone-900 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-[#E0D9CC] bg-[#EFECE6]">
              <button
                type="button"
                onClick={() => setModalDatosRealesAbierto(false)}
                className="px-3 py-1.5 rounded bg-stone-300 text-stone-800 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarDatosReales}
                className="px-4 py-1.5 rounded bg-orange-700 hover:bg-orange-800 text-white text-xs font-bold cursor-pointer"
              >
                Guardar Datos Reales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REGISTRO MANUAL DE SOBRANTE EN STOCK                             */}
      {/* ========================================================================= */}
      {mostrarModalNuevoSobrante && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border border-[#CCC4B4] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#E0D9CC] bg-[#EFECE6]">
              <h3 className="text-sm font-black text-stone-900">
                Ingresar Retazo a Stock de Sobrantes
              </h3>
              <button onClick={() => setMostrarNuevoSobrante(false)}>
                <X size={18} className="text-stone-500 hover:text-stone-900" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Código de Perfil:</label>
                  <input
                    type="text"
                    value={nuevoSobrante.perfilCodigo}
                    onChange={(e) => setNuevoSobrante({ ...nuevoSobrante, perfilCodigo: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded p-2 text-xs font-mono font-bold outline-none"
                    placeholder="ej: 6201"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Nombre de Perfil:</label>
                  <input
                    type="text"
                    value={nuevoSobrante.perfilNombre}
                    onChange={(e) => setNuevoSobrante({ ...nuevoSobrante, perfilNombre: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded p-2 text-xs font-bold outline-none"
                    placeholder="ej: Marco 2 Guías"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Largo en mm:</label>
                  <input
                    type="number"
                    min="100"
                    value={nuevoSobrante.longitudMm}
                    onChange={(e) => setNuevoSobrante({ ...nuevoSobrante, longitudMm: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-300 rounded p-2 text-xs font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Cantidad:</label>
                  <input
                    type="number"
                    min="1"
                    value={nuevoSobrante.cantidad}
                    onChange={(e) => setNuevoSobrante({ ...nuevoSobrante, cantidad: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-300 rounded p-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Ubicación en Pañol:</label>
                <input
                  type="text"
                  value={nuevoSobrante.ubicacion}
                  onChange={(e) => setNuevoSobrante({ ...nuevoSobrante, ubicacion: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded p-2 text-xs outline-none"
                  placeholder="ej: Estantería Retazos A1"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Observaciones:</label>
                <input
                  type="text"
                  value={nuevoSobrante.observaciones}
                  onChange={(e) => setNuevoSobrante({ ...nuevoSobrante, observaciones: e.target.value })}
                  className="w-full bg-white border border-stone-300 rounded p-2 text-xs outline-none"
                  placeholder="Corte limpio aprovechable"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-[#E0D9CC] bg-[#EFECE6]">
              <button
                type="button"
                onClick={() => setMostrarNuevoSobrante(false)}
                className="px-3 py-1.5 rounded bg-stone-300 text-stone-800 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarSobrante}
                className="px-4 py-1.5 rounded bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold"
              >
                Ingresar a Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
