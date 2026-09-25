import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Check, 
  Clock, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  Eye,
  EyeOff,
  Printer,
  X,
  Sparkles,
  Layers,
  Phone,
  User
} from 'lucide-react';
import { Reparacion, TipoReparacionFrecuente, EstadoReparacion, Cliente } from '../types';

interface ReparacionesProps {
  reparaciones: Reparacion[];
  clientes: Cliente[];
  operadorActual: string;
  onGuardarReparacion: (rep: Omit<Reparacion, 'id' | 'numero'>) => Promise<Reparacion>;
  onActualizarEstado: (id: string, nuevoEstado: EstadoReparacion) => void;
  esInterno?: boolean;
}

export const ReparacionesComponent: React.FC<ReparacionesProps> = ({
  reparaciones,
  clientes,
  operadorActual,
  onGuardarReparacion,
  onActualizarEstado,
  esInterno = true
}) => {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [guardando, setGuardando] = useState(false);
  const [modoInterno, setModoInterno] = useState(esInterno);
  const [reparacionSeleccionada, setReparacionSeleccionada] = useState<Reparacion | null>(null);

  // ACCESOS RÁPIDOS PARA REPARACIONES FRECUENTES (REQUISITO ESTRICTO FASE 5)
  // - cambio de malla
  // - cambio de rueda
  // - cambio de felpa
  // - cambio de vidrio
  // - cambio de manija
  // - reparación general
  const accesosRapidos = [
    {
      tipo: 'cambio de malla' as TipoReparacionFrecuente,
      label: 'Cambio de malla',
      icono: '🕸️',
      trabajo: 'Cambio de malla de mosquitero corredizo',
      materialesTexto: 'Tela de fibra de vidrio gris lavable y cordón burlete de goma',
      costoMateriales: 12000,
      manoDeObra: 18000,
      precioCobrado: 45000,
    },
    {
      tipo: 'cambio de rueda' as TipoReparacionFrecuente,
      label: 'Cambio de rueda',
      icono: '⚙️',
      trabajo: 'Cambio de ruedas / rodamientos con rulemán',
      materialesTexto: 'Par de rodamientos de rulemán regulables con pista de nylon',
      costoMateriales: 16000,
      manoDeObra: 16000,
      precioCobrado: 52000,
    },
    {
      tipo: 'cambio de felpa' as TipoReparacionFrecuente,
      label: 'Cambio de felpa',
      icono: '🌫️',
      trabajo: 'Cambio de felpas perimetrales cortaviento y hermeticidad',
      materialesTexto: 'Felpa tejida siliconada con lámina central de polipropileno',
      costoMateriales: 9000,
      manoDeObra: 18000,
      precioCobrado: 38000,
    },
    {
      tipo: 'cambio de vidrio' as TipoReparacionFrecuente,
      label: 'Cambio de vidrio',
      icono: '🪟',
      trabajo: 'Reposición y cambio de vidrio roto/astillado',
      materialesTexto: 'Vidrio float incoloro 4mm y silicona selladora estructural',
      costoMateriales: 22000,
      manoDeObra: 22000,
      precioCobrado: 68000,
    },
    {
      tipo: 'cambio de manija' as TipoReparacionFrecuente,
      label: 'Cambio de manija',
      icono: '🚪',
      trabajo: 'Cambio de manija / cierre lateral de abertura',
      materialesTexto: 'Cierre lateral embutido de aluminio con traba y enganche',
      costoMateriales: 14000,
      manoDeObra: 15000,
      precioCobrado: 44000,
    },
    {
      tipo: 'reparación general' as TipoReparacionFrecuente,
      label: 'Reparación general',
      icono: '🛠️',
      trabajo: 'Alineación, escuadrado, cambio de burletes y service integral',
      materialesTexto: 'Tornillería inoxidable, escuadras de tiraje y lubricación técnica',
      costoMateriales: 18000,
      manoDeObra: 30000,
      precioCobrado: 75000,
    },
  ];

  // ESTADO DEL FORMULARIO DE REPARACIÓN
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [tipoFrecuente, setTipoFrecuente] = useState<TipoReparacionFrecuente | 'otro'>('cambio de malla');
  const [trabajo, setTrabajo] = useState('Cambio de malla de mosquitero corredizo');
  const [materialesTexto, setMaterialesTexto] = useState('Tela de fibra de vidrio gris lavable y cordón burlete de goma');
  const [costoMateriales, setCostoMateriales] = useState<number | ''>(12000);
  const [manoDeObra, setManoDeObra] = useState<number | ''>(18000);
  const [precioCobrado, setPrecioCobrado] = useState<number | ''>(45000);
  const [fecha, setFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState('');

  // 1-Click aplicador de accesos rápidos
  const aplicarAccesoRapido = (acc: typeof accesosRapidos[0]) => {
    setTipoFrecuente(acc.tipo);
    setTrabajo(acc.trabajo);
    setMaterialesTexto(acc.materialesTexto);
    setCostoMateriales(acc.costoMateriales);
    setManoDeObra(acc.manoDeObra);
    setPrecioCobrado(acc.precioCobrado);
  };

  const handleClienteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setClienteSeleccionadoId(id);
    if (id) {
      const c = clientes.find(item => item.id === id);
      if (c) {
        setClienteNombre(c.nombre);
        setClienteTelefono(c.telefono || '');
      }
    } else {
      setClienteNombre('');
      setClienteTelefono('');
    }
  };

  // Cálculos de costo total y ganancia
  const matNum = typeof costoMateriales === 'number' ? costoMateriales : 0;
  const mdoNum = typeof manoDeObra === 'number' ? manoDeObra : 0;
  const costoTotal = matNum + mdoNum;
  const cobradoNum = typeof precioCobrado === 'number' ? precioCobrado : 0;
  const ganancia = cobradoNum - costoTotal;
  const margenPorcentaje = costoTotal > 0 ? Math.round((ganancia / costoTotal) * 100) : 0;

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim()) {
      alert('Por favor ingrese o seleccione el cliente');
      return;
    }
    if (!trabajo.trim()) {
      alert('Por favor detalle el trabajo a realizar');
      return;
    }
    if (!cobradoNum) {
      alert('Por favor ingrese el precio cobrado');
      return;
    }

    setGuardando(true);
    try {
      await onGuardarReparacion({
        clienteId: clienteSeleccionadoId || undefined,
        clienteNombre: clienteNombre.trim(),
        clienteTelefono: clienteTelefono.trim() || undefined,
        trabajo: trabajo.trim(),
        tipoFrecuente,
        materialesTexto: materialesTexto.trim() || undefined,
        materiales: matNum,
        manoDeObra: mdoNum,
        costo: costoTotal,
        precioCobrado: cobradoNum,
        ganancia,
        estado: 'Pendiente',
        fecha,
        observaciones: observaciones.trim() || undefined,
        creadoPor: operadorActual
      });

      // Reset
      setMostrarForm(false);
      setClienteSeleccionadoId('');
      setClienteNombre('');
      setClienteTelefono('');
      aplicarAccesoRapido(accesosRapidos[0]);
      setFecha(new Date().toISOString().slice(0, 10));
      setObservaciones('');
    } catch (err) {
      console.error(err);
      alert('Error al registrar la reparación');
    } finally {
      setGuardando(false);
    }
  };

  const reparacionesFiltradas = reparaciones.filter(r => {
    const q = busqueda.toLowerCase();
    const coincideTexto = (
      r.numero.toLowerCase().includes(q) ||
      r.clienteNombre.toLowerCase().includes(q) ||
      r.trabajo.toLowerCase().includes(q) ||
      (r.materialesTexto && r.materialesTexto.toLowerCase().includes(q)) ||
      (r.observaciones && r.observaciones.toLowerCase().includes(q)) ||
      (r.fecha && r.fecha.includes(q))
    );
    const coincideEstado = filtroEstado === 'todos' || r.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  const totalCobrado = reparaciones.reduce((acc, r) => acc + (r.precioCobrado || 0), 0);
  const totalCosto = reparaciones.reduce((acc, r) => acc + (r.costo || 0), 0);
  const totalGanancia = reparaciones.reduce((acc, r) => acc + (r.ganancia || 0), 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#DFD9CD] border border-[#CCC4B4] rounded-xl p-4 sm:p-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Wrench className="text-orange-600" />
            Reparaciones y Trabajos de Taller
          </h2>
          <p className="text-stone-700 text-xs mt-0.5">
            Registro de services con accesos rápidos para reparaciones frecuentes, desglose de materiales, mano de obra y ganancia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Vista Interna vs Vista Cliente */}
          <button
            onClick={() => setModoInterno(!modoInterno)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              modoInterno 
                ? 'bg-amber-600 text-white border-amber-700' 
                : 'bg-[#EDE8DE] text-stone-800 border-[#C5BDAE] hover:bg-[#E4DDCF]'
            }`}
            title="Alternar entre vista interna (costos y ganancias) y vista cliente limpia"
          >
            {modoInterno ? <Eye size={14} /> : <EyeOff size={14} />}
            {modoInterno ? 'Vista Interna (Con Costos)' : 'Vista Cliente (Segura)'}
          </button>

          {!mostrarForm && (
            <button
              id="btn-abrir-nueva-reparacion"
              onClick={() => setMostrarForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              Nueva Reparación
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#EAE5DC] border border-[#D5CEC2] rounded-xl p-3.5">
          <span className="text-stone-600 font-bold block">Trabajos Registrados:</span>
          <span className="text-xl font-black text-stone-950 mt-1 block">
            {reparaciones.length} órdenes de reparación
          </span>
        </div>

        <div className="bg-[#EAE5DC] border border-[#D5CEC2] rounded-xl p-3.5">
          <span className="text-stone-600 font-bold block">Total Cobrado:</span>
          <span className="text-xl font-black text-orange-700 mt-1 block">
            ${totalCobrado.toLocaleString('es-AR')}
          </span>
        </div>

        {modoInterno ? (
          <div className="bg-emerald-500/15 border-2 border-emerald-600/40 rounded-xl p-3.5">
            <span className="text-emerald-950 font-black block uppercase tracking-wider text-[10px]">
              Ganancia Neta Interna:
            </span>
            <span className="text-xl font-black text-emerald-800 mt-1 block">
              ${totalGanancia.toLocaleString('es-AR')}
            </span>
            <span className="text-[11px] text-stone-600">
              Costo total taller: ${totalCosto.toLocaleString('es-AR')}
            </span>
          </div>
        ) : (
          <div className="bg-[#EAE5DC] border border-[#D5CEC2] rounded-xl p-3.5 flex items-center gap-2 text-stone-500">
            <EyeOff size={16} />
            <span>Costos y ganancias ocultos en Vista Cliente</span>
          </div>
        )}
      </div>

      {/* FORMULARIO DE ALTA DE REPARACIÓN */}
      {mostrarForm && (
        <form 
          id="form-reparacion"
          onSubmit={handleGuardar}
          className="bg-[#F5F2EA] border-2 border-orange-500/50 rounded-2xl p-5 sm:p-7 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#D5CEC2] pb-3">
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <Wrench size={18} className="text-orange-600" />
              Registrar Reparación / Trabajo de Taller
            </h3>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="text-stone-600 hover:text-stone-900 text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-300/60 cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {/* ACCESOS RÁPIDOS PARA REPARACIONES FRECUENTES (REQUERIMIENTO FASE 5) */}
          <div className="bg-[#EAE5DC] border border-[#D5CEC2] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-stone-900 uppercase tracking-wider">
              <Sparkles size={14} className="text-orange-600" />
              <span>Accesos Rápidos para Reparaciones Frecuentes (1 Clic para Cargar):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {accesosRapidos.map((acc) => {
                const activo = tipoFrecuente === acc.tipo;
                return (
                  <button
                    key={acc.tipo}
                    type="button"
                    onClick={() => aplicarAccesoRapido(acc)}
                    className={`p-2 rounded-lg text-xs font-bold border transition-all flex flex-col items-center text-center gap-1 cursor-pointer ${
                      activo
                        ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                        : 'bg-white hover:bg-stone-100 text-stone-800 border-[#CCC4B4]'
                    }`}
                  >
                    <span className="text-base">{acc.icono}</span>
                    <span className="line-clamp-1">{acc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1. Cliente y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-stone-800 block mb-1">Cliente Registrado (Opcional):</label>
              <select
                value={clienteSeleccionadoId}
                onChange={handleClienteSelect}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-2.5 py-2 font-medium text-stone-900 outline-none"
              >
                <option value="">-- Cargar cliente o ingresar manual --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} {c.telefono ? `(${c.telefono})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Nombre del Cliente *:</label>
              <input
                type="text"
                required
                placeholder="Nombre del cliente o razón social"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-bold text-stone-900 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Fecha *:</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-bold text-stone-900 outline-none"
              />
            </div>
          </div>

          {/* 2. Trabajo a realizar */}
          <div className="text-xs">
            <label className="font-bold text-stone-800 block mb-1">Trabajo a realizar *:</label>
            <input
              type="text"
              required
              placeholder="Ej: Cambio de malla de mosquitero 1200x1000 con burlete nuevo"
              value={trabajo}
              onChange={(e) => setTrabajo(e.target.value)}
              className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-bold text-stone-900 outline-none"
            />
          </div>

          {/* 3. Materiales texto */}
          <div className="text-xs">
            <label className="font-bold text-stone-800 block mb-1">Materiales utilizados:</label>
            <input
              type="text"
              placeholder="Detalle de materiales (malla, tornillos, rodamientos, silicona...)"
              value={materialesTexto}
              onChange={(e) => setMaterialesTexto(e.target.value)}
              className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-medium text-stone-900 outline-none"
            />
          </div>

          {/* 4. COSTOS, MANO DE OBRA, COSTO TOTAL, PRECIO COBRADO Y GANANCIA */}
          <div className="bg-[#EDE8DE] border border-[#D5CEC2] rounded-xl p-4 space-y-3 text-xs">
            <div className="font-black text-stone-900 text-xs flex items-center justify-between">
              <span>Desglose de Costos, Mano de Obra y Ganancia</span>
              <span className="text-[11px] text-orange-800 font-bold bg-orange-100 px-2 py-0.5 rounded">
                Cálculo automático de costo total y margen
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Costo Materiales */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">Costo de Materiales ($):</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-stone-500 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={costoMateriales}
                    onChange={(e) => setCostoMateriales(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-[#C5BDAE] rounded-lg pl-6 pr-2.5 py-1.5 font-bold text-stone-900 outline-none"
                  />
                </div>
              </div>

              {/* Mano de Obra */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">Mano de Obra ($):</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-stone-500 font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={manoDeObra}
                    onChange={(e) => setManoDeObra(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-[#C5BDAE] rounded-lg pl-6 pr-2.5 py-1.5 font-bold text-stone-900 outline-none"
                  />
                </div>
              </div>

              {/* Costo Total (Materiales + Mano de Obra) */}
              <div className="bg-[#E4DDCF] border border-[#CCC4B4] rounded-lg p-2.5 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-stone-700 uppercase">Costo Total:</span>
                <span className="text-base font-black text-stone-900 mt-0.5">
                  ${costoTotal.toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] text-stone-500">(Materiales + Mano de Obra)</span>
              </div>

              {/* Precio Cobrado */}
              <div>
                <label className="font-black text-stone-900 block mb-1">Precio Cobrado ($) *:</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-orange-700 font-black">$</span>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={precioCobrado}
                    onChange={(e) => setPrecioCobrado(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border-2 border-orange-500 rounded-lg pl-6 pr-2.5 py-1.5 font-black text-stone-950 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Ganancia resultante */}
            <div className="pt-2 border-t border-[#D5CEC2] flex items-center justify-between">
              <span className="font-bold text-stone-800">Ganancia Neta (Precio Cobrado - Costo Total):</span>
              <span className="text-base font-black text-emerald-800">
                ${ganancia.toLocaleString('es-AR')} ({margenPorcentaje}%)
              </span>
            </div>
          </div>

          {/* 5. Observaciones */}
          <div className="text-xs">
            <label className="font-bold text-stone-800 block mb-1">Observaciones:</label>
            <textarea
              rows={2}
              placeholder="Notas adicionales sobre la abertura, garantía o instrucciones de colocación..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-white border border-[#C5BDAE] rounded-lg p-2.5 font-medium text-stone-900 outline-none"
            />
          </div>

          {/* Acciones */}
          <div className="pt-2 border-t border-[#D5CEC2] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 rounded-lg bg-stone-300 hover:bg-stone-400 text-stone-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Check size={15} />
              {guardando ? 'Guardando...' : 'Registrar Reparación'}
            </button>
          </div>
        </form>
      )}

      {/* Buscador y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#EAE5DC] p-3.5 rounded-xl border border-[#D5CEC2]">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-2.5 text-stone-500" />
          <input
            type="text"
            placeholder="Buscar por cliente, trabajo, número o fecha..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#C5BDAE] rounded-lg pl-9 pr-3 py-1.5 text-xs text-stone-900 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-700">Estado:</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-[#FAF8F5] border border-[#C5BDAE] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-800 outline-none"
          >
            <option value="todos">Todos ({reparaciones.length})</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En taller">En taller</option>
            <option value="Listo">Listo</option>
            <option value="Entregado">Entregado</option>
          </select>
        </div>
      </div>

      {/* Tabla de Reparaciones */}
      <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E4DDCF] border-b border-[#CCC4B4] text-stone-700 font-extrabold">
                <th className="py-3 px-4">Orden / Fecha</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Trabajo & Materiales</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Precio Cobrado</th>
                {modoInterno && (
                  <>
                    <th className="py-3 px-4 text-right">Costo Total</th>
                    <th className="py-3 px-4 text-right">Ganancia</th>
                  </>
                )}
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]">
              {reparacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={modoInterno ? 8 : 6} className="py-8 text-center text-stone-500 italic">
                    No se encontraron reparaciones registradas.
                  </td>
                </tr>
              ) : (
                reparacionesFiltradas.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F3EFE6] transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-stone-900 text-xs block">{r.numero}</span>
                      <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <Calendar size={11} /> {r.fecha || 'Hoy'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-800">
                      {r.clienteNombre}
                      {r.clienteTelefono && (
                        <span className="block text-[10px] text-stone-500">{r.clienteTelefono}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-stone-950 block">{r.trabajo}</span>
                      {r.materialesTexto && (
                        <span className="text-[11px] text-stone-600 block line-clamp-1">{r.materialesTexto}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={r.estado}
                        onChange={(e) => onActualizarEstado(r.id, e.target.value as EstadoReparacion)}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                          r.estado === 'Entregado' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                          r.estado === 'Listo' ? 'bg-cyan-100 text-cyan-900 border-cyan-300' :
                          r.estado === 'En taller' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                          'bg-stone-200 text-stone-800 border-stone-300'
                        }`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En taller">En taller</option>
                        <option value="Listo">Listo</option>
                        <option value="Entregado">Entregado</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-black text-stone-950 text-sm">
                        ${(r.precioCobrado || 0).toLocaleString('es-AR')}
                      </span>
                    </td>
                    {modoInterno && (
                      <>
                        <td className="py-3 px-4 text-right font-medium text-stone-600">
                          ${(r.costo || 0).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-800">
                          +${(r.ganancia || 0).toLocaleString('es-AR')}
                        </td>
                      </>
                    )}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setReparacionSeleccionada(r)}
                        className="px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE COMPROBANTE / FICHA DE REPARACIÓN */}
      {reparacionSeleccionada && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
          <div className="bg-[#FAF8F5] border border-[#CCC4B4] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden print:border-none print:shadow-none">
            <div className="bg-[#E4DDCF] px-5 py-3.5 border-b border-[#CCC4B4] flex items-center justify-between no-print">
              <span className="font-extrabold text-stone-900 text-xs">
                Orden de Servicio {reparacionSeleccionada.numero}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-800 text-white font-bold text-xs"
                >
                  <Printer size={13} /> Imprimir
                </button>
                <button
                  onClick={() => setReparacionSeleccionada(null)}
                  className="p-1 rounded text-stone-600 hover:bg-stone-300"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-stone-900">
              <div className="border-b-2 border-orange-500 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-black text-lg text-stone-900">ABERTURAS MAZZOLA</h3>
                  <p className="text-[11px] text-stone-600">Servicio Técnico y Reparaciones de Aberturas</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-base text-stone-900 block">{reparacionSeleccionada.numero}</span>
                  <span className="text-[11px] text-stone-500">{reparacionSeleccionada.fecha}</span>
                </div>
              </div>

              <div className="bg-[#EDE8DE] p-3 rounded-lg">
                <span className="font-bold text-stone-600 block text-[10px] uppercase">Cliente:</span>
                <span className="font-bold text-stone-900 text-sm">{reparacionSeleccionada.clienteNombre}</span>
                {reparacionSeleccionada.clienteTelefono && (
                  <span className="text-stone-600 block text-xs mt-0.5">Tel: {reparacionSeleccionada.clienteTelefono}</span>
                )}
              </div>

              <div className="border border-[#D5CEC2] rounded-lg p-3.5 space-y-2 bg-white">
                <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-2">
                  <div>
                    <span className="font-black text-stone-900 text-sm block">{reparacionSeleccionada.trabajo}</span>
                    <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded">
                      Estado: {reparacionSeleccionada.estado}
                    </span>
                  </div>
                  <span className="font-black text-stone-950 text-base">
                    ${(reparacionSeleccionada.precioCobrado || 0).toLocaleString('es-AR')}
                  </span>
                </div>

                {reparacionSeleccionada.materialesTexto && (
                  <div className="text-stone-700 text-[11px]">
                    <strong>Materiales:</strong> {reparacionSeleccionada.materialesTexto}
                  </div>
                )}
                {reparacionSeleccionada.observaciones && (
                  <div className="text-stone-700 text-[11px]">
                    <strong>Observaciones:</strong> {reparacionSeleccionada.observaciones}
                  </div>
                )}
              </div>

              {/* DATOS INTERNOS (SÓLO SI MODO INTERNO ESTÁ ACTIVO, NUNCA EN VISTA CLIENTE) */}
              {modoInterno && (
                <div className="bg-amber-500/10 border-2 border-amber-600/30 p-3.5 rounded-xl no-print text-[11px]">
                  <span className="font-black text-amber-950 block uppercase tracking-wider mb-2">
                    Datos Internos del Taller (Confidencial):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-stone-800">
                    <div>Costo Mat.: <strong>${(reparacionSeleccionada.materiales || 0).toLocaleString('es-AR')}</strong></div>
                    <div>Mano de Obra: <strong>${(reparacionSeleccionada.manoDeObra || 0).toLocaleString('es-AR')}</strong></div>
                    <div>Costo Total: <strong>${(reparacionSeleccionada.costo || 0).toLocaleString('es-AR')}</strong></div>
                    <div>Ganancia Neta: <strong className="text-emerald-800">${(reparacionSeleccionada.ganancia || 0).toLocaleString('es-AR')}</strong></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
