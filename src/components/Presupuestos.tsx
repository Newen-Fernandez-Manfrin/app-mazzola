import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Search, 
  UserPlus, 
  ChevronRight, 
  Check, 
  Printer, 
  AlertCircle,
  Building2,
  FolderTree,
  AlertTriangle,
  BookOpen,
  ShieldAlert,
  Hammer
} from 'lucide-react';
import { 
  Presupuesto, 
  Cliente, 
  ItemAbertura, 
  AccesoriosItem, 
  TipoVidrio,
  Marca,
  LineaSistema,
  CatalogoDocumento,
  TipologiaTecnica,
  VarianteTipologia,
  ProductoComercial
} from '../types';
import { PresupuestoModal } from './PresupuestoModal';
import { DisenadorTipologia } from './DisenadorTipologia';
import { mazzolaApi } from '../services/api';

interface PresupuestosProps {
  presupuestos: Presupuesto[];
  clientes: Cliente[];
  operadorActual: string;
  onGuardarPresupuesto: (nuevo: Omit<Presupuesto, 'id' | 'numero' | 'fechaCreacion'>) => Promise<Presupuesto>;
  onActualizarEstado: (id: string, nuevoEstado: Presupuesto['estado']) => void;
  onCrearClienteRapido: (c: { nombre: string; telefono: string; direccion: string }) => Promise<Cliente>;
  onIrAFabrica?: (presupuesto: Presupuesto) => void;
}

export const Presupuestos: React.FC<PresupuestosProps> = ({
  presupuestos,
  clientes,
  operadorActual,
  onGuardarPresupuesto,
  onActualizarEstado,
  onCrearClienteRapido,
  onIrAFabrica
}) => {
  const [modoCreacion, setModoCreacion] = useState(false);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<Presupuesto | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [guardando, setGuardando] = useState(false);

  // ESTADO DEL FORMULARIO DE PRESUPUESTO
  const [clienteId, setClienteId] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);

  // BASE TÉCNICA MULTI-FABRICANTE FASE 2 & FASE 3
  const [marcasTecnicas, setMarcasTecnicas] = useState<Marca[]>([]);
  const [lineasTecnicas, setLineasTecnicas] = useState<LineaSistema[]>([]);
  const [catalogosTecnicos, setCatalogosTecnicos] = useState<CatalogoDocumento[]>([]);
  const [tipologiasTecnicas, setTipologiasTecnicas] = useState<TipologiaTecnica[]>([]);
  const [variantesTecnicas, setVariantesTecnicas] = useState<VarianteTipologia[]>([]);
  const [marcaSeleccionadaId, setMarcaSeleccionadaId] = useState<string>('');
  const [productosCatalogo, setProductosCatalogo] = useState<ProductoComercial[]>([]);

  useEffect(() => {
    const cargarDatosTecnicos = async () => {
      try {
        const [m, l, c, t, v, prod] = await Promise.all([
          mazzolaApi.getMarcas(),
          mazzolaApi.getLineas(),
          mazzolaApi.getCatalogosDocumentos(),
          mazzolaApi.getTipologias(),
          mazzolaApi.getVariantes(),
          mazzolaApi.getProductos()
        ]);
        setMarcasTecnicas(m);
        setLineasTecnicas(l);
        setCatalogosTecnicos(c);
        setTipologiasTecnicas(t);
        setVariantesTecnicas(v);
        setProductosCatalogo(prod);
        if (m.length > 0) {
          setMarcaSeleccionadaId(m[0].id);
          const primeraLinea = l.find((linea: any) => linea.marcaId === m[0].id);
          if (primeraLinea) {
            setLineaActual(primeraLinea.nombre);
            const tips = t.filter((tip: any) => tip.lineaId === primeraLinea.id && tip.estadoRevision === 'Aprobado');
            if (tips.length > 0) {
              setTipologiaActual(tips[0].nombre);
              const vars = v.filter((va: any) => va.tipologiaId === tips[0].id);
              if (vars.length > 0) setVarianteActual(vars[0].nombre);
            }
          }
        }
      } catch (err) {
        console.warn('Error cargando catálogos en presupuestos:', err);
      }
    };
    cargarDatosTecnicos();
  }, []);

  // Conversión y normalización de unidades (mm, cm, metros)
  const [unidadMedida, setUnidadMedida] = useState<'mm' | 'cm' | 'm'>('mm');
  const [valorAnchoInput, setValorAnchoInput] = useState<number | string>(1200);
  const [valorAltoInput, setValorAltoInput] = useState<number | string>(1000);

  const convertirAMm = (val: number, u: 'mm' | 'cm' | 'm'): number => {
    if (isNaN(val)) return 0;
    if (u === 'cm') return Math.round(val * 10);
    if (u === 'm') return Math.round(val * 1000);
    return Math.round(val);
  };

  const convertirDesdeMm = (mm: number, u: 'mm' | 'cm' | 'm'): number => {
    if (isNaN(mm)) return 0;
    if (u === 'cm') return Number((mm / 10).toFixed(2));
    if (u === 'm') return Number((mm / 1000).toFixed(3));
    return mm;
  };

  const handleCambiarUnidad = (nuevaUnidad: 'mm' | 'cm' | 'm') => {
    setUnidadMedida(nuevaUnidad);
    setValorAnchoInput(convertirDesdeMm(anchoMm, nuevaUnidad));
    setValorAltoInput(convertirDesdeMm(altoMm, nuevaUnidad));
  };

  const handleCambiarAncho = (val: string) => {
    setValorAnchoInput(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAnchoMm(convertirAMm(num, unidadMedida));
    }
  };

  const handleCambiarAlto = (val: string) => {
    setValorAltoInput(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAltoMm(convertirAMm(num, unidadMedida));
    }
  };

  // Lista de aberturas agregadas al presupuesto
  const [itemsAberturas, setItemsAberturas] = useState<ItemAbertura[]>([]);

  // Ítem de abertura en edición actual ("¿Qué querés presupuestar?")
  const [tipologiaActual, setTipologiaActual] = useState('Ventana Corrediza 2 Hojas (MDT 52)');
  const [varianteActual, setVarianteActual] = useState('Vidrio Simple (4mm - 6mm)');
  const [lineaActual, setLineaActual] = useState('MDT 52');
  const [colorActual, setColorActual] = useState('Blanco');
  const [anchoMm, setAnchoMm] = useState<number>(1200);
  const [altoMm, setAltoMm] = useState<number>(1000);
  const [cantidad, setCantidad] = useState<number>(1);
  const [vidrio, setVidrio] = useState<TipoVidrio>('Simple');
  
  // Accesorios (Regla Mazzola: no asignar precio si el usuario no lo carga)
  const [tieneMosquitero, setTieneMosquitero] = useState(false);
  const [precioMosquitero, setPrecioMosquitero] = useState<number | ''>('');
  const [tieneReja, setTieneReja] = useState(false);
  const [precioReja, setPrecioReja] = useState<number | ''>('');
  const [tieneTransporte, setTieneTransporte] = useState(false);
  const [precioTransporte, setPrecioTransporte] = useState<number | ''>('');
  const [tieneInstalacion, setTieneInstalacion] = useState(false);
  const [precioInstalacion, setPrecioInstalacion] = useState<number | ''>('');
  const [otrosAccesorios, setOtrosAccesorios] = useState('');
  const [precioOtros, setPrecioOtros] = useState<number | ''>('');

  // Precio manual por unidad (REGLA MAZZOLA: El precio se escribe a mano, no por receta automática)
  const [precioUnitarioManual, setPrecioUnitarioManual] = useState<number | ''>('');
  const [notasItem, setNotasItem] = useState('');

  // Notas globales del presupuesto
  const [notasPresupuesto, setNotasPresupuesto] = useState(
    'Presupuesto válido por 10 días hábiles. Precios fijados manualmente al momento de cotizar.'
  );
  const [descuentoManual, setDescuentoManual] = useState<number | ''>('');
  const [costoEstimadoInterno, setCostoEstimadoInterno] = useState<number | ''>('');

  // Sincronizar selección de cliente
  const handleSelectCliente = (id: string) => {
    setClienteId(id);
    const cli = clientes.find(c => c.id === id);
    if (cli) {
      setClienteNombre(cli.nombre);
      setClienteTelefono(cli.telefono || '');
      setClienteDireccion(cli.direccion || '');
    } else {
      setClienteNombre('');
      setClienteTelefono('');
      setClienteDireccion('');
    }
  };

  // Crear cliente rápido desde el presupuesto
  const handleGuardarClienteRapido = async () => {
    if (!clienteNombre.trim()) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }
    const nuevo = await onCrearClienteRapido({
      nombre: clienteNombre,
      telefono: clienteTelefono,
      direccion: clienteDireccion
    });
    setClienteId(nuevo.id);
    setMostrarNuevoCliente(false);
  };

  // AGREGAR ABERTURA A LA LISTA
  const handleAgregarAbertura = () => {
    if (!tipologiaActual.trim()) {
      alert('⚠️ NO HAY TIPOLOGÍAS DISPONIBLES: La línea seleccionada no posee catálogo técnico aprobado. Por estricta directiva de Mazzola, no se permite inventar tipologías ni perfiles.');
      return;
    }
    if (!anchoMm || !altoMm) {
      alert('Por favor ingrese ancho y alto en mm');
      return;
    }

    const pUnit = typeof precioUnitarioManual === 'number' ? precioUnitarioManual : 0;
    const pMosq = typeof precioMosquitero === 'number' ? precioMosquitero : 0;
    const pReja = typeof precioReja === 'number' ? precioReja : 0;
    const pTrans = typeof precioTransporte === 'number' ? precioTransporte : 0;
    const pInst = typeof precioInstalacion === 'number' ? precioInstalacion : 0;
    const pOtr = typeof precioOtros === 'number' ? precioOtros : 0;

    const extrasManuales = (tieneMosquitero ? pMosq : 0) +
                           (tieneReja ? pReja : 0) +
                           (tieneTransporte ? pTrans : 0) +
                           (tieneInstalacion ? pInst : 0) +
                           (otrosAccesorios ? pOtr : 0);

    const totalItem = (pUnit * cantidad) + extrasManuales;
    const lineaObj = lineasTecnicas.find(l => l.nombre === lineaActual || l.id === lineaActual);
    const marcaObj = marcasTecnicas.find(m => m.id === lineaObj?.marcaId || m.id === marcaSeleccionadaId);

    const nuevaAbertura: ItemAbertura = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tipologia: tipologiaActual,
      variante: varianteActual || undefined,
      linea: lineaActual,
      marca: marcaObj?.nombre,
      anchoMm: Number(anchoMm),
      altoMm: Number(altoMm),
      unidadIngreso: unidadMedida,
      anchoIngresado: Number(valorAnchoInput),
      altoIngresado: Number(valorAltoInput),
      cantidad: Number(cantidad) || 1,
      color: colorActual,
      vidrio,
      accesorios: {
        mosquitero: tieneMosquitero,
        reja: tieneReja,
        transporte: tieneTransporte,
        instalacion: tieneInstalacion,
        otros: otrosAccesorios,
        precioMosquitero: tieneMosquitero ? pMosq : undefined,
        precioReja: tieneReja ? pReja : undefined,
        precioTransporte: tieneTransporte ? pTrans : undefined,
        precioInstalacion: tieneInstalacion ? pInst : undefined,
        precioOtros: otrosAccesorios ? pOtr : undefined
      },
      precioUnitarioManual: pUnit,
      precioTotalItem: totalItem,
      notasItem: notasItem.trim() || undefined
    };

    setItemsAberturas([...itemsAberturas, nuevaAbertura]);

    // Reset para la siguiente abertura conservando valores estándar cómodos
    setPrecioUnitarioManual('');
    setTieneMosquitero(false);
    setPrecioMosquitero('');
    setTieneReja(false);
    setPrecioReja('');
    setTieneTransporte(false);
    setPrecioTransporte('');
    setTieneInstalacion(false);
    setPrecioInstalacion('');
    setOtrosAccesorios('');
    setPrecioOtros('');
    setNotasItem('');
  };

  const handleEliminarItem = (index: number) => {
    setItemsAberturas(itemsAberturas.filter((_, idx) => idx !== index));
  };

  // Calcular subtotal acumulado de las aberturas
  const subtotal = itemsAberturas.reduce((acc, curr) => acc + curr.precioTotalItem, 0);
  const desc = typeof descuentoManual === 'number' ? descuentoManual : 0;
  const totalPresupuesto = Math.max(0, subtotal - desc);

  // GUARDAR PRESUPUESTO COMPLETO
  const handleGuardarPresupuestoCompleto = async () => {
    if (!clienteNombre.trim()) {
      alert('Por favor seleccione o ingrese el nombre del cliente');
      return;
    }
    if (itemsAberturas.length === 0) {
      alert('Debe agregar al menos una abertura al presupuesto');
      return;
    }

    setGuardando(true);
    try {
      const nuevo = await onGuardarPresupuesto({
        clienteId: clienteId || undefined,
        clienteNombre,
        clienteTelefono,
        clienteDireccion,
        items: itemsAberturas,
        subtotal,
        descuentoManual: desc > 0 ? desc : undefined,
        total: totalPresupuesto,
        costoEstimadoInterno: typeof costoEstimadoInterno === 'number' ? costoEstimadoInterno : undefined,
        notas: notasPresupuesto,
        estado: 'Pendiente',
        creadoPor: operadorActual
      });

      // Resetear estado
      setModoCreacion(false);
      setItemsAberturas([]);
      setClienteId('');
      setClienteNombre('');
      setClienteTelefono('');
      setClienteDireccion('');
      setPresupuestoSeleccionado(nuevo);
    } catch (err) {
      console.error(err);
      alert('Error al guardar el presupuesto');
    } finally {
      setGuardando(false);
    }
  };

  const presupuestosFiltrados = presupuestos.filter(p => {
    const q = busqueda.toLowerCase();
    return (
      p.numero.toLowerCase().includes(q) ||
      p.clienteNombre.toLowerCase().includes(q) ||
      p.estado.toLowerCase().includes(q) ||
      p.items?.some(i => i.tipologia.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Encabezado de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#DFD9CD] border border-[#CCC4B4] rounded-xl p-4 sm:p-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <FileText className="text-orange-600" />
            Presupuestos
          </h2>
          <p className="text-stone-700 text-xs mt-0.5">
            Cotizaciones de aberturas de aluminio con precios manuales y medidas en milímetros (mm).
          </p>
        </div>

        {!modoCreacion && (
          <button
            id="btn-abrir-crear-presupuesto"
            onClick={() => setModoCreacion(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-xs transition-colors shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            Nuevo Presupuesto
          </button>
        )}
      </div>

      {/* FORMULARIO: FLUJO EXACTO SOLICITADO */}
      {modoCreacion && (
        <div id="formulario-nuevo-presupuesto" className="bg-[#F5F2EA] border-2 border-orange-500/50 rounded-2xl p-5 sm:p-7 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-[#D5CEC2] pb-3">
            <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-black">
                +
              </span>
              Confeccionar Nuevo Presupuesto
            </h3>
            <button
              onClick={() => setModoCreacion(false)}
              className="text-stone-600 hover:text-stone-900 text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-300/60"
            >
              Cancelar
            </button>
          </div>

          {/* PASO 1: SELECCIONAR O CREAR CLIENTE */}
          <div className="bg-[#EBE7DE] border border-[#D5CEC2] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-stone-800 uppercase tracking-wider">
                1. Seleccionar Cliente
              </label>
              <button
                type="button"
                onClick={() => setMostrarNuevoCliente(!mostrarNuevoCliente)}
                className="text-xs font-bold text-orange-700 hover:text-orange-900 flex items-center gap-1"
              >
                <UserPlus size={14} />
                {mostrarNuevoCliente ? 'Elegir cliente existente' : '+ Cargar cliente nuevo'}
              </button>
            </div>

            {!mostrarNuevoCliente ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <select
                    id="select-cliente-presupuesto"
                    value={clienteId}
                    onChange={(e) => handleSelectCliente(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#C5BDAE] rounded-lg px-3 py-2 text-xs font-semibold text-stone-900 outline-none"
                  >
                    <option value="">-- Seleccionar de la lista --</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.telefono ? `(${c.telefono})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="O escribir nombre del cliente directamente..."
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#C5BDAE] rounded-lg px-3 py-2 text-xs text-stone-900 font-semibold outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-[#FAF8F5] border border-amber-500/40 rounded-xl p-3.5 space-y-3">
                <span className="text-xs font-bold text-amber-900 block">Alta rápida de nuevo cliente</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    placeholder="Nombre y apellido *"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="bg-[#F2EFE8] border border-[#C5BDAE] rounded-lg px-3 py-2 text-xs text-stone-900 font-semibold outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Teléfono"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="bg-[#F2EFE8] border border-[#C5BDAE] rounded-lg px-3 py-2 text-xs text-stone-900 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Dirección / Obra"
                    value={clienteDireccion}
                    onChange={(e) => setClienteDireccion(e.target.value)}
                    className="bg-[#F2EFE8] border border-[#C5BDAE] rounded-lg px-3 py-2 text-xs text-stone-900 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGuardarClienteRapido}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirmar y Usar Cliente
                </button>
              </div>
            )}
          </div>

          {/* PASO 2: ¿QUÉ QUERÉS PRESUPUESTAR? (DISEÑADOR VISUAL Y CONFIGURACIÓN) */}
          <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl p-5 space-y-4">
            <div className="border-b border-[#E2DDD3] pb-2">
              <span className="text-xs font-black text-orange-700 uppercase tracking-widest block">
                2. ¿Qué querés presupuestar?
              </span>
              <p className="text-xs text-stone-600">
                Seleccioná fabricante, tipología del catálogo aprobado, ingresá las medidas y visualizá el dibujo proporcional en tiempo real.
              </p>
            </div>

            {/* Selección de Fabricante y Línea con Validación Estricta de Catálogo */}
            {(() => {
              const lineaObj = lineasTecnicas.find(l => l.nombre === lineaActual || l.id === lineaActual);
              const catAsociado = catalogosTecnicos.find(c => 
                (c.lineaId === lineaObj?.id || c.id === lineaObj?.catalogoId) && c.estado === 'Aprobado'
              );
              const tipologiasDeLinea = tipologiasTecnicas.filter(t => 
                (t.lineaId === lineaObj?.id || t.lineaNombre === lineaObj?.nombre) && 
                t.estadoRevision === 'Aprobado'
              );
              const tieneCatalogoAprobado = !!catAsociado && tipologiasDeLinea.length > 0;
              
              const tipologiaSeleccionadaObj = tipologiasDeLinea.find(t => t.nombre === tipologiaActual);
              const variantesDeTipologia = variantesTecnicas.filter(v => v.tipologiaId === tipologiaSeleccionadaObj?.id);

              return (
                <div className="space-y-4">
                  {/* ALERTA DE CATÁLOGO NO APROBADO */}
                  {!tieneCatalogoAprobado && (
                    <div className="p-3 bg-amber-500/20 border-2 border-amber-600/70 rounded-xl text-xs space-y-1">
                      <span className="font-black text-amber-950 flex items-center gap-1.5">
                        <ShieldAlert size={16} className="text-amber-700 shrink-0" />
                        NO HAY TIPOLOGÍAS DISPONIBLES
                      </span>
                      <p className="text-stone-800 leading-relaxed">
                        La línea <strong>{lineaActual}</strong> ({lineaObj?.marcaNombre || 'Fabricante'}) no cuenta con catálogo técnico aprobado en el sistema. 
                        Por protocolo estricto de Mazzola, <em>está prohibido inventar tipologías, cortes o perfiles</em>. Puede cargar y aprobar el catálogo en el módulo &quot;Datos Técnicos&quot;.
                      </p>
                    </div>
                  )}

                  {/* SELECTORES DE MARCA Y LÍNEA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-[#E2DDD3]">
                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">
                        Fabricante / Marca:
                      </label>
                      <select
                        value={marcaSeleccionadaId}
                        onChange={(e) => {
                          const mId = e.target.value;
                          setMarcaSeleccionadaId(mId);
                          const primera = lineasTecnicas.find(l => l.marcaId === mId);
                          if (primera) {
                            setLineaActual(primera.nombre);
                            const tips = tipologiasTecnicas.filter(t => t.lineaId === primera.id && t.estadoRevision === 'Aprobado');
                            if (tips.length > 0) {
                              setTipologiaActual(tips[0].nombre);
                              const vars = variantesTecnicas.filter(va => va.tipologiaId === tips[0].id);
                              setVarianteActual(vars.length > 0 ? vars[0].nombre : '');
                            } else {
                              setTipologiaActual('');
                              setVarianteActual('');
                            }
                          }
                        }}
                        className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-2.5 py-2 text-xs font-bold text-stone-900 outline-none"
                      >
                        {marcasTecnicas.map(m => (
                          <option key={m.id} value={m.id}>{m.nombre} ({m.codigo || 'OFICIAL'})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-800 block mb-1">
                        Línea / Sistema:
                      </label>
                      <select
                        value={lineaActual}
                        onChange={(e) => {
                          const lNom = e.target.value;
                          setLineaActual(lNom);
                          const lObj = lineasTecnicas.find(l => l.nombre === lNom);
                          const tips = tipologiasTecnicas.filter(t => t.lineaId === lObj?.id && t.estadoRevision === 'Aprobado');
                          if (tips.length > 0) {
                            setTipologiaActual(tips[0].nombre);
                            const vars = variantesTecnicas.filter(va => va.tipologiaId === tips[0].id);
                            setVarianteActual(vars.length > 0 ? vars[0].nombre : '');
                          } else {
                            setTipologiaActual('');
                            setVarianteActual('');
                          }
                        }}
                        className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-2.5 py-2 text-xs font-bold text-stone-900 outline-none"
                      >
                        {lineasTecnicas
                          .filter(l => !marcaSeleccionadaId || l.marcaId === marcaSeleccionadaId)
                          .map(l => (
                            <option key={l.id} value={l.nombre}>{l.nombre}</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* LAYOUT DE 2 COLUMNAS: FORMULARIO INTERACTIVO + DISEÑADOR VISUAL */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* COLUMNA IZQUIERDA: CAMPOS DE LA ABERTURA */}
                    <div className="lg:col-span-7 space-y-3.5">
                      
                      {/* 1. TIPOLOGÍA */}
                      <div>
                        <label className="text-xs font-bold text-stone-800 block mb-1">
                          TIPOLOGÍA:
                        </label>
                        <select
                          id="select-tipologia-abertura"
                          value={tipologiaActual}
                          disabled={!tieneCatalogoAprobado}
                          onChange={(e) => {
                            const nuevoNom = e.target.value;
                            setTipologiaActual(nuevoNom);
                            const tipObj = tipologiasDeLinea.find(t => t.nombre === nuevoNom);
                            const vars = variantesTecnicas.filter(va => va.tipologiaId === tipObj?.id);
                            setVarianteActual(vars.length > 0 ? vars[0].nombre : '');
                          }}
                          className={`w-full border rounded-lg px-3 py-2 text-xs font-bold outline-none ${
                            tieneCatalogoAprobado
                              ? 'bg-[#EFECE4] border-[#C5BDAE] text-stone-900'
                              : 'bg-stone-200 border-stone-300 text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          {!tieneCatalogoAprobado ? (
                            <option value="">-- NO HAY TIPOLOGÍAS DISPONIBLES --</option>
                          ) : (
                            tipologiasDeLinea.map(t => (
                              <option key={t.id} value={t.nombre}>
                                {t.nombre} (Pág {t.paginaOrigen})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* 2. VARIANTE */}
                      <div>
                        <label className="text-xs font-bold text-stone-800 block mb-1">
                          VARIANTE:
                        </label>
                        <select
                          id="select-variante-abertura"
                          value={varianteActual}
                          disabled={!tieneCatalogoAprobado || variantesDeTipologia.length === 0}
                          onChange={(e) => setVarianteActual(e.target.value)}
                          className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-3 py-2 text-xs font-semibold text-stone-900 outline-none disabled:bg-stone-200 disabled:text-stone-500"
                        >
                          {variantesDeTipologia.length > 0 ? (
                            variantesDeTipologia.map(v => (
                              <option key={v.id} value={v.nombre}>
                                {v.nombre} {v.descripcion ? `(${v.descripcion})` : ''}
                              </option>
                            ))
                          ) : (
                            <option value="">Estándar según catálogo</option>
                          )}
                        </select>
                      </div>

                      {/* 3. MEDIDAS (ANCHO Y ALTO CON SELECTOR DE UNIDADES) */}
                      <div className="bg-[#EFECE4] border border-[#D5CEC2] rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-stone-800">
                            MEDIDAS:
                          </label>
                          {/* Selector de Unidades: mm, cm, metros */}
                          <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#C5BDAE] p-0.5 rounded-lg text-[11px] font-bold">
                            {(['mm', 'cm', 'm'] as const).map(u => (
                              <button
                                key={u}
                                type="button"
                                onClick={() => handleCambiarUnidad(u)}
                                className={`px-2 py-0.5 rounded transition-colors ${
                                  unidadMedida === u 
                                    ? 'bg-orange-600 text-white font-black shadow-xs' 
                                    : 'text-stone-700 hover:bg-stone-200'
                                }`}
                              >
                                {u === 'm' ? 'metros' : u}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* ANCHO */}
                          <div>
                            <span className="text-[11px] font-bold text-stone-700 block mb-1">
                              ANCHO:
                            </span>
                            <div className="relative">
                              <input
                                id="input-abertura-ancho"
                                type="number"
                                step={unidadMedida === 'm' ? '0.001' : unidadMedida === 'cm' ? '0.1' : '1'}
                                value={valorAnchoInput}
                                onChange={(e) => handleCambiarAncho(e.target.value)}
                                className="w-full bg-[#FAF8F5] border border-[#C5BDAE] rounded-lg px-2.5 py-1.5 text-xs font-black text-stone-900 outline-none focus:ring-1 focus:ring-orange-500"
                              />
                              <span className="absolute right-2 top-1.5 text-[10px] font-bold text-stone-500">
                                {unidadMedida}
                              </span>
                            </div>
                          </div>

                          {/* ALTO */}
                          <div>
                            <span className="text-[11px] font-bold text-stone-700 block mb-1">
                              ALTO:
                            </span>
                            <div className="relative">
                              <input
                                id="input-abertura-alto"
                                type="number"
                                step={unidadMedida === 'm' ? '0.001' : unidadMedida === 'cm' ? '0.1' : '1'}
                                value={valorAltoInput}
                                onChange={(e) => handleCambiarAlto(e.target.value)}
                                className="w-full bg-[#FAF8F5] border border-[#C5BDAE] rounded-lg px-2.5 py-1.5 text-xs font-black text-stone-900 outline-none focus:ring-1 focus:ring-orange-500"
                              />
                              <span className="absolute right-2 top-1.5 text-[10px] font-bold text-stone-500">
                                {unidadMedida}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Muestra de medida normalizada en milímetros */}
                        <div className="flex items-center justify-between pt-1 text-[11px] text-stone-600 border-t border-[#DBD5C8]">
                          <span>
                            Normalizado internamente: <strong>{anchoMm} × {altoMm} mm</strong>
                          </span>
                          
                          {/* Botones de prueba rápida para testear proporciones requeridas */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-stone-500 font-medium">Probar:</span>
                            <button
                              type="button"
                              onClick={() => {
                                setUnidadMedida('mm');
                                setValorAnchoInput(900);
                                setValorAltoInput(1200);
                                setAnchoMm(900);
                                setAltoMm(1200);
                              }}
                              className="px-1.5 py-0.5 rounded bg-stone-200 hover:bg-stone-300 text-[10px] font-bold text-stone-800"
                            >
                              900×1200
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setUnidadMedida('mm');
                                setValorAnchoInput(2340);
                                setValorAltoInput(4567);
                                setAnchoMm(2340);
                                setAltoMm(4567);
                              }}
                              className="px-1.5 py-0.5 rounded bg-amber-200 hover:bg-amber-300 text-[10px] font-black text-amber-900"
                            >
                              2340×4567
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 4. CANTIDAD, COLOR Y VIDRIO */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-bold text-stone-800 block mb-1">
                            CANTIDAD:
                          </label>
                          <input
                            id="input-abertura-cantidad"
                            type="number"
                            min={1}
                            value={cantidad}
                            onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                            className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-2 py-2 text-xs font-black text-center text-stone-900 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-stone-800 block mb-1">
                            COLOR:
                          </label>
                          <select
                            value={colorActual}
                            onChange={(e) => setColorActual(e.target.value)}
                            className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-2 py-2 text-xs font-semibold text-stone-900 outline-none"
                          >
                            <option value="Blanco">Blanco</option>
                            <option value="Negro">Negro</option>
                            <option value="Anodizado natural">Natural</option>
                            <option value="Bronce">Bronce</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-stone-800 block mb-1">
                            VIDRIO:
                          </label>
                          <select
                            id="select-abertura-vidrio"
                            value={vidrio}
                            onChange={(e) => setVidrio(e.target.value as TipoVidrio)}
                            className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-2 py-2 text-xs font-semibold text-stone-900 outline-none"
                          >
                            <option value="Simple">Simple 4mm</option>
                            <option value="DVH">DVH (Doble Vidriado)</option>
                            <option value="Laminado 3+3">Laminado 3+3</option>
                            <option value="Fantasía">Fantasía</option>
                            <option value="Sin vidrio">Sin vidrio</option>
                            <option value="Otro">Otro vidrio</option>
                          </select>
                        </div>
                      </div>

                      {/* 5. ACCESORIOS */}
                      <div className="bg-[#EFECE4] border border-[#D5CEC2] rounded-xl p-3 space-y-2">
                        <span className="text-xs font-black text-stone-800 block">
                          ACCESORIOS:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          {/* Mosquitero */}
                          <div className={`p-2 rounded-lg border transition-colors ${tieneMosquitero ? 'bg-amber-100/60 border-amber-500' : 'bg-[#FAF8F5] border-[#D5CEC2]'}`}>
                            <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tieneMosquitero}
                                onChange={(e) => setTieneMosquitero(e.target.checked)}
                                className="rounded accent-orange-600"
                              />
                              Mosquitero
                            </label>
                            {tieneMosquitero && (
                              <input
                                type="number"
                                placeholder="Precio manual $"
                                value={precioMosquitero}
                                onChange={(e) => setPrecioMosquitero(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full mt-1.5 bg-[#FAF8F5] border border-amber-400 rounded px-2 py-1 text-[11px] font-bold text-stone-900 outline-none"
                              />
                            )}
                          </div>

                          {/* Reja */}
                          <div className={`p-2 rounded-lg border transition-colors ${tieneReja ? 'bg-amber-100/60 border-amber-500' : 'bg-[#FAF8F5] border-[#D5CEC2]'}`}>
                            <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tieneReja}
                                onChange={(e) => setTieneReja(e.target.checked)}
                                className="rounded accent-orange-600"
                              />
                              Reja
                            </label>
                            {tieneReja && (
                              <input
                                type="number"
                                placeholder="Precio manual $"
                                value={precioReja}
                                onChange={(e) => setPrecioReja(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full mt-1.5 bg-[#FAF8F5] border border-amber-400 rounded px-2 py-1 text-[11px] font-bold text-stone-900 outline-none"
                              />
                            )}
                          </div>

                          {/* Transporte */}
                          <div className={`p-2 rounded-lg border transition-colors ${tieneTransporte ? 'bg-amber-100/60 border-amber-500' : 'bg-[#FAF8F5] border-[#D5CEC2]'}`}>
                            <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tieneTransporte}
                                onChange={(e) => setTieneTransporte(e.target.checked)}
                                className="rounded accent-orange-600"
                              />
                              Transporte
                            </label>
                            {tieneTransporte && (
                              <input
                                type="number"
                                placeholder="Precio manual $"
                                value={precioTransporte}
                                onChange={(e) => setPrecioTransporte(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full mt-1.5 bg-[#FAF8F5] border border-amber-400 rounded px-2 py-1 text-[11px] font-bold text-stone-900 outline-none"
                              />
                            )}
                          </div>

                          {/* Instalación */}
                          <div className={`p-2 rounded-lg border transition-colors ${tieneInstalacion ? 'bg-amber-100/60 border-amber-500' : 'bg-[#FAF8F5] border-[#D5CEC2]'}`}>
                            <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tieneInstalacion}
                                onChange={(e) => setTieneInstalacion(e.target.checked)}
                                className="rounded accent-orange-600"
                              />
                              Instalación
                            </label>
                            {tieneInstalacion && (
                              <input
                                type="number"
                                placeholder="Precio manual $"
                                value={precioInstalacion}
                                onChange={(e) => setPrecioInstalacion(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full mt-1.5 bg-[#FAF8F5] border border-amber-400 rounded px-2 py-1 text-[11px] font-bold text-stone-900 outline-none"
                              />
                            )}
                          </div>

                          {/* Otros */}
                          <div className="p-2 rounded-lg border bg-[#FAF8F5] border-[#D5CEC2] col-span-2 sm:col-span-1">
                            <input
                              type="text"
                              placeholder="Otros accesorios"
                              value={otrosAccesorios}
                              onChange={(e) => setOtrosAccesorios(e.target.value)}
                              className="w-full bg-[#FAF8F5] border-b border-stone-300 px-1 py-0.5 text-[11px] font-medium text-stone-900 outline-none"
                            />
                            {otrosAccesorios && (
                              <input
                                type="number"
                                placeholder="Precio $"
                                value={precioOtros}
                                onChange={(e) => setPrecioOtros(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full mt-1.5 bg-[#FAF8F5] border border-amber-400 rounded px-2 py-1 text-[11px] font-bold text-stone-900 outline-none"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 6. OBSERVACIONES */}
                      <div>
                        <label className="text-xs font-bold text-stone-800 block mb-1">
                          OBSERVACIONES:
                        </label>
                        <input
                          id="input-abertura-observaciones"
                          type="text"
                          placeholder="Ubicación (ej: Ventana Living, Planta Alta, Premarco)..."
                          value={notasItem}
                          onChange={(e) => setNotasItem(e.target.value)}
                          className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-3 py-2 text-xs text-stone-900 outline-none"
                        />
                      </div>

                      {/* 7. PRECIO DE VENTA (MANUAL) */}
                      <div className="bg-amber-500/15 border-2 border-amber-600/40 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-amber-950 uppercase tracking-wide">
                            PRECIO DE VENTA:
                          </label>
                          <span className="text-[10px] text-amber-900 font-extrabold bg-amber-200/80 px-2 py-0.5 rounded">
                            Fijación Manual
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-700">
                          Regla Mazzola: El precio es manual. El usuario puede modificarlo libremente sin alterar precios históricos ni del catálogo.
                        </p>

                        {/* Selector opcional desde Catálogo de Precios */}
                        {productosCatalogo.length > 0 && (
                          <div className="pt-1">
                            <label className="text-[11px] font-bold text-stone-700 block mb-0.5">
                              Cargar precio base desde Catálogo (opcional):
                            </label>
                            <select
                              onChange={(e) => {
                                const prodId = e.target.value;
                                const prod = productosCatalogo.find(p => p.id === prodId);
                                if (prod) {
                                  setPrecioUnitarioManual(prod.precioVenta);
                                }
                              }}
                              className="w-full bg-[#FAF8F5] border border-amber-500/60 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 font-semibold outline-none"
                            >
                              <option value="">-- Seleccionar producto para tomar precio de referencia --</option>
                              {productosCatalogo.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.nombre} {p.categoria ? `[${p.categoria}]` : ''} - ${p.precioVenta.toLocaleString('es-AR')}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <span className="font-black text-xl text-stone-900">$</span>
                          <input
                            id="input-abertura-precio-manual"
                            type="number"
                            placeholder="Precio de venta unitario..."
                            value={precioUnitarioManual}
                            onChange={(e) => setPrecioUnitarioManual(e.target.value === '' ? '' : Number(e.target.value))}
                            className="flex-1 bg-[#FAF8F5] border-2 border-amber-600 rounded-lg px-3 py-2 text-base font-black text-stone-950 outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      {/* BOTÓN AGREGAR ABERTURA */}
                      <button
                        id="btn-agregar-abertura-lista"
                        type="button"
                        onClick={handleAgregarAbertura}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-black text-sm shadow-md transition-colors"
                      >
                        <Plus size={18} strokeWidth={2.5} />
                        + Agregar Abertura al Presupuesto
                      </button>
                    </div>

                    {/* COLUMNA DERECHA: DIBUJO PROPORCIONAL TÉCNICO */}
                    <div className="lg:col-span-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-stone-800 uppercase tracking-wider block">
                          DIBUJO PROPORCIONAL
                        </span>
                        <span className="text-[11px] text-stone-500">
                          Actualización reactiva
                        </span>
                      </div>

                      {tieneCatalogoAprobado && tipologiaActual ? (
                        <DisenadorTipologia
                          tipologiaNombre={tipologiaActual}
                          varianteNombre={varianteActual}
                          lineaNombre={lineaActual}
                          marcaNombre={lineaObj?.marcaNombre}
                          anchoMm={anchoMm}
                          altoMm={altoMm}
                          color={colorActual}
                          vidrio={vidrio}
                          cantidad={cantidad}
                          tieneMosquitero={tieneMosquitero}
                          tieneReja={tieneReja}
                          unidadVisual={unidadMedida}
                          anchoOriginal={Number(valorAnchoInput)}
                          altoOriginal={Number(valorAltoInput)}
                        />
                      ) : (
                        <div className="bg-[#FAF8F5] border-2 border-dashed border-[#D5CEC2] rounded-2xl p-8 text-center text-xs text-stone-500 min-h-[240px] flex flex-col items-center justify-center space-y-2">
                          <ShieldAlert size={28} className="text-amber-600 mb-1" />
                          <span className="font-black text-stone-800">
                            NO HAY TIPOLOGÍAS DISPONIBLES
                          </span>
                          <p className="text-stone-600 max-w-xs text-center text-[11px]">
                            Aprobá el catálogo de la línea en &quot;Datos Técnicos&quot; para habilitar el dibujo técnico y el desglose de perfiles.
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })()}
          </div>

          {/* LISTA DE ABERTURAS YA AGREGADAS AL PRESUPUESTO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-stone-800 uppercase tracking-wider">
                Aberturas en este presupuesto ({itemsAberturas.length})
              </h4>
              <span className="text-xs text-stone-600 font-medium">
                Cada ítem es independiente
              </span>
            </div>

            {itemsAberturas.length === 0 ? (
              <div className="bg-[#FAF8F5] border-2 border-dashed border-[#D5CEC2] rounded-xl p-8 text-center text-xs text-stone-500">
                <AlertCircle size={28} className="mx-auto mb-2 text-stone-400" />
                No agregaste aberturas todavía. Completá los datos arriba y hacé clic en &quot;+ Agregar Abertura al Presupuesto&quot;.
              </div>
            ) : (
              <div className="divide-y divide-[#DBD5C8] border border-[#D5CEC2] rounded-xl overflow-hidden bg-[#FAF8F5]">
                {itemsAberturas.map((item, idx) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-stone-300 text-stone-800 flex items-center justify-center font-black text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="font-extrabold text-stone-900 text-sm">
                          {item.cantidad} {item.tipologia}
                        </span>
                        <span className="font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-xs">
                          {item.anchoMm} x {item.altoMm} mm
                        </span>
                      </div>
                      <p className="text-stone-600 text-xs">
                        {item.linea} · Vidrio: {item.vidrio} {item.color ? `· Color: ${item.color}` : ''}
                      </p>
                      {item.notasItem && (
                        <p className="text-stone-500 italic text-[11px]">{item.notasItem}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="text-[11px] text-stone-500 block">Precio total ítem:</span>
                        <span className="font-black text-stone-900 text-base">
                          ${(item.precioTotalItem || 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <button
                        onClick={() => handleEliminarItem(idx)}
                        className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-100 transition-colors"
                        title="Quitar abertura"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PASO 3: NOTAS, DESCUENTOS Y GUARDAR */}
          <div className="bg-[#EBE7DE] border border-[#D5CEC2] rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1">
                  Notas / Observaciones comerciales para el cliente:
                </label>
                <textarea
                  rows={3}
                  value={notasPresupuesto}
                  onChange={(e) => setNotasPresupuesto(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#C5BDAE] rounded-lg p-2.5 text-xs text-stone-900 outline-none resize-none"
                  placeholder="Validez de la oferta, forma de pago, plazos..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-700 font-semibold">Subtotal aberturas:</span>
                  <span className="font-extrabold text-stone-900">${(subtotal || 0).toLocaleString('es-AR')}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-700 font-semibold">Descuento o bonificación manual:</span>
                  <div className="flex items-center gap-1">
                    <span>$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={descuentoManual}
                      onChange={(e) => setDescuentoManual(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-28 bg-[#FAF8F5] border border-[#C5BDAE] rounded px-2 py-1 text-xs font-bold text-right outline-none"
                    />
                  </div>
                </div>

                {/* Costo interno (Sólo para personal interno) */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-300">
                  <span className="text-stone-600 font-medium">Costo interno estimado (opcional, solo Mazzola):</span>
                  <div className="flex items-center gap-1">
                    <span>$</span>
                    <input
                      type="number"
                      placeholder="Costo"
                      value={costoEstimadoInterno}
                      onChange={(e) => setCostoEstimadoInterno(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-28 bg-[#FAF8F5] border border-[#C5BDAE] rounded px-2 py-1 text-xs text-right outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t-2 border-orange-500 flex justify-between items-baseline">
                  <span className="font-black text-stone-900 text-sm">TOTAL FINAL:</span>
                  <span className="font-black text-orange-700 text-2xl">
                    ${(totalPresupuesto || 0).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#D5CEC2]">
              <button
                type="button"
                onClick={() => setModoCreacion(false)}
                className="px-4 py-2.5 rounded-lg bg-stone-300/80 hover:bg-stone-300 text-stone-800 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                id="btn-guardar-presupuesto-final"
                type="button"
                disabled={guardando || itemsAberturas.length === 0}
                onClick={handleGuardarPresupuestoCompleto}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-extrabold text-sm shadow-md transition-colors disabled:opacity-50"
              >
                <Check size={18} />
                {guardando ? 'Guardando Presupuesto...' : 'Guardar Presupuesto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LISTADO DE PRESUPUESTOS EXISTENTES */}
      <div className="bg-[#F4F1EA] border border-[#D8D2C6] rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-stone-500" size={16} />
            <input
              type="text"
              placeholder="Buscar por número, cliente, abertura o estado..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#C5BDAE] rounded-lg pl-9 pr-3 py-2 text-xs text-stone-900 outline-none focus:border-amber-500"
            />
          </div>
          <span className="text-xs font-semibold text-stone-600">
            {presupuestosFiltrados.length} presupuestos registrados
          </span>
        </div>

        {presupuestosFiltrados.length === 0 ? (
          <div className="py-12 text-center text-stone-500 text-xs italic">
            No se encontraron presupuestos que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="divide-y divide-[#E2DCD0]">
            {presupuestosFiltrados.map((p) => (
              <div 
                key={p.id}
                className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-[#FAF8F3] px-2 rounded-lg transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-stone-900 text-sm">{p.numero}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' :
                      p.estado === 'En Fabricación' ? 'bg-amber-100 text-amber-900' :
                      p.estado === 'Entregado' ? 'bg-blue-100 text-blue-900' :
                      p.estado === 'Rechazado' ? 'bg-rose-100 text-rose-800' :
                      'bg-stone-200 text-stone-800'
                    }`}>
                      {p.estado}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Emitido el {new Date(p.fechaCreacion).toLocaleDateString('es-AR')} por {p.creadoPor}
                    </span>
                  </div>

                  <p className="text-stone-800 font-bold text-xs">
                    Cliente: {p.clienteNombre}
                    {p.clienteTelefono ? ` · Tel: ${p.clienteTelefono}` : ''}
                  </p>

                  <p className="text-stone-600 text-xs">
                    {p.items?.length || 0} abertura(s): {p.items?.filter(Boolean).map(it => `${it.cantidad || 1} ${it.tipologia || 'Abertura'} (${it.anchoMm || 0}x${it.altoMm || 0}mm)`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 uppercase block font-bold">Precio Cotizado</span>
                    <span className="font-black text-stone-900 text-lg">
                      ${(p.total || 0).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <button
                    onClick={() => setPresupuestoSeleccionado(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <FileText size={14} />
                    Ver / Imprimir
                  </button>

                  {onIrAFabrica && (
                    <button
                      onClick={() => onIrAFabrica(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-colors cursor-pointer"
                      title="Ver en módulo de fábrica y generar órdenes de producción"
                    >
                      <Hammer size={14} />
                      Ver en fábrica
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DETALLE DE PRESUPUESTO COMPLETO */}
      <PresupuestoModal
        presupuesto={presupuestoSeleccionado}
        onCerrar={() => setPresupuestoSeleccionado(null)}
        onCambiarEstado={onActualizarEstado}
        onVerEnFabrica={onIrAFabrica}
      />
    </div>
  );
};
