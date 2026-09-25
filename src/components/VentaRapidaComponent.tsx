import React, { useState } from 'react';
import { 
  Zap, 
  Plus, 
  Search, 
  Check, 
  TrendingUp, 
  Clock, 
  Calendar,
  Layers,
  Eye,
  EyeOff,
  Printer,
  X,
  User,
  Tag,
  FileText
} from 'lucide-react';
import { VentaRapida, Cliente } from '../types';

interface VentaRapidaProps {
  ventas: VentaRapida[];
  clientes: Cliente[];
  operadorActual: string;
  onGuardarVenta: (venta: Omit<VentaRapida, 'id' | 'numero'>) => Promise<VentaRapida>;
  esInterno?: boolean;
}

export const VentaRapidaComponent: React.FC<VentaRapidaProps> = ({
  ventas,
  clientes,
  operadorActual,
  onGuardarVenta,
  esInterno = true
}) => {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [modoInterno, setModoInterno] = useState(esInterno);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaRapida | null>(null);

  // CAMPOS REQUERIDOS POR FASE 5:
  // - cliente opcional
  // - producto
  // - tipología
  // - medida
  // - características
  // - vidrio
  // - accesorios
  // - precio de venta (ingresado manualmente)
  // - costo
  // - ganancia
  // - fecha
  // - observaciones

  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [producto, setProducto] = useState('Ventana corrediza 2 hojas');
  const [tipologia, setTipologia] = useState('Corrediza 2 hojas');
  const [medida, setMedida] = useState('1200 x 1000 mm');
  const [caracteristicas, setCaracteristicas] = useState('Línea Herrero, Blanco brillante, felpa cortaviento');
  const [vidrio, setVidrio] = useState('Simple 4mm Float');
  const [accesorios, setAccesorios] = useState('Cierre central embutido, rodamientos a rulemán');
  const [precioVenta, setPrecioVenta] = useState<number | ''>(175000);
  const [costo, setCosto] = useState<number | ''>(105000);
  const [fecha, setFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState('');

  // Cálculo de ganancia
  const pVentaNum = typeof precioVenta === 'number' ? precioVenta : 0;
  const costoNum = typeof costo === 'number' ? costo : 0;
  const ganancia = pVentaNum - costoNum;
  const margenPorcentaje = costoNum > 0 ? Math.round((ganancia / costoNum) * 100) : 0;

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

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto.trim()) {
      alert('Por favor ingrese el nombre del producto');
      return;
    }
    if (!pVentaNum) {
      alert('Por favor ingrese el precio de venta (ingreso manual requerido)');
      return;
    }

    setGuardando(true);
    try {
      await onGuardarVenta({
        clienteId: clienteSeleccionadoId || undefined,
        clienteNombre: clienteNombre.trim() || 'Consumidor Final',
        clienteTelefono: clienteTelefono.trim() || undefined,
        producto: producto.trim(),
        tipologia: tipologia.trim(),
        medida: medida.trim(),
        caracteristicas: caracteristicas.trim(),
        vidrio: vidrio.trim(),
        accesorios: accesorios.trim(),
        precioVenta: pVentaNum,
        costo: costoNum,
        ganancia,
        fecha,
        observaciones: observaciones.trim() || undefined,
        notas: observaciones.trim() || undefined,
        creadoPor: operadorActual
      });

      // Reset
      setMostrarForm(false);
      setClienteSeleccionadoId('');
      setClienteNombre('');
      setClienteTelefono('');
      setProducto('Ventana corrediza 2 hojas');
      setTipologia('Corrediza 2 hojas');
      setMedida('1200 x 1000 mm');
      setCaracteristicas('Línea Herrero, Blanco brillante, felpa cortaviento');
      setVidrio('Simple 4mm Float');
      setAccesorios('Cierre central embutido, rodamientos a rulemán');
      setPrecioVenta('');
      setCosto('');
      setFecha(new Date().toISOString().slice(0, 10));
      setObservaciones('');
    } catch (err) {
      console.error(err);
      alert('Error al registrar la venta rápida');
    } finally {
      setGuardando(false);
    }
  };

  const ventasFiltradas = ventas.filter(v => {
    const q = busqueda.toLowerCase();
    return (
      v.numero.toLowerCase().includes(q) ||
      v.producto.toLowerCase().includes(q) ||
      (v.tipologia && v.tipologia.toLowerCase().includes(q)) ||
      (v.medida && v.medida.toLowerCase().includes(q)) ||
      (v.clienteNombre && v.clienteNombre.toLowerCase().includes(q)) ||
      (v.observaciones && v.observaciones.toLowerCase().includes(q)) ||
      (v.fecha && v.fecha.includes(q))
    );
  });

  const totalVentas = ventas.reduce((acc, v) => acc + (v.precioVenta || 0), 0);
  const totalCosto = ventas.reduce((acc, v) => acc + (v.costo || 0), 0);
  const totalGanancia = ventas.reduce((acc, v) => acc + (v.ganancia || 0), 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#DFD9CD] border border-[#CCC4B4] rounded-xl p-4 sm:p-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Zap className="text-orange-600" />
            Venta Rápida (Mostrador y Stock)
          </h2>
          <p className="text-stone-700 text-xs mt-0.5">
            Registro directo de venta sin presupuesto previo. Precio de venta ingresado manualmente con cálculo de costo y ganancia.
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
            title="Alternar entre vista interna (costos y ganancias) y vista cliente segura"
          >
            {modoInterno ? <Eye size={14} /> : <EyeOff size={14} />}
            {modoInterno ? 'Vista Interna (Con Costos)' : 'Vista Cliente (Segura)'}
          </button>

          {!mostrarForm && (
            <button
              id="btn-abrir-nueva-venta-rapida"
              onClick={() => setMostrarForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              Nueva Venta Directa
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#EAE5DC] border border-[#D5CEC2] rounded-xl p-3.5">
          <span className="text-stone-600 font-bold block">Total Operaciones:</span>
          <span className="text-xl font-black text-stone-950 mt-1 block">
            {ventas.length} ventas directas
          </span>
        </div>

        <div className="bg-[#EAE5DC] border border-[#D5CEC2] rounded-xl p-3.5">
          <span className="text-stone-600 font-bold block">Total Facturado / Vendido:</span>
          <span className="text-xl font-black text-orange-700 mt-1 block">
            ${totalVentas.toLocaleString('es-AR')}
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
              Costo total: ${totalCosto.toLocaleString('es-AR')}
            </span>
          </div>
        ) : (
          <div className="bg-[#EAE5DC] border border-[#D5CEC2] rounded-xl p-3.5 flex items-center gap-2 text-stone-500">
            <EyeOff size={16} />
            <span>Datos internos de costo protegidos en Vista Cliente</span>
          </div>
        )}
      </div>

      {/* FORMULARIO DE ALTA DE VENTA RÁPIDA */}
      {mostrarForm && (
        <form 
          id="form-venta-rapida"
          onSubmit={handleGuardar}
          className="bg-[#F5F2EA] border-2 border-orange-500/50 rounded-2xl p-5 sm:p-7 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#D5CEC2] pb-3">
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <Zap size={18} className="text-orange-600" />
              Registrar Venta Rápida sin Presupuesto
            </h3>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="text-stone-600 hover:text-stone-900 text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-300/60 cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {/* 1. Cliente opcional y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-stone-800 block mb-1">Cliente Registrado (Opcional):</label>
              <select
                value={clienteSeleccionadoId}
                onChange={handleClienteSelect}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-2.5 py-2 font-medium text-stone-900 outline-none"
              >
                <option value="">-- Consumidor Final / Sin registrar --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} {c.telefono ? `(${c.telefono})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Nombre / Razón Social (Opcional):</label>
              <input
                type="text"
                placeholder="Consumidor Final o Nombre"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-medium text-stone-900 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Fecha de la Venta *:</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-bold text-stone-900 outline-none"
              />
            </div>
          </div>

          {/* 2. Producto, Tipología, Medida */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-stone-800 block mb-1">Producto *:</label>
              <input
                type="text"
                required
                placeholder="Ej: Ventana corrediza 2 hojas"
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-bold text-stone-900 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Tipología *:</label>
              <input
                type="text"
                required
                placeholder="Ej: Corrediza 2 hojas / Paño fijo / Puerta"
                value={tipologia}
                onChange={(e) => setTipologia(e.target.value)}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-medium text-stone-900 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Medida *:</label>
              <input
                type="text"
                required
                placeholder="Ej: 1200 x 1000 mm o 1.50 x 1.10 m"
                value={medida}
                onChange={(e) => setMedida(e.target.value)}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-mono font-bold text-stone-900 outline-none"
              />
            </div>
          </div>

          {/* 3. Características, Vidrio, Accesorios */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-stone-800 block mb-1">Características:</label>
              <input
                type="text"
                placeholder="Ej: Línea Herrero, Blanco brillante"
                value={caracteristicas}
                onChange={(e) => setCaracteristicas(e.target.value)}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-medium text-stone-900 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Vidrio:</label>
              <input
                type="text"
                placeholder="Ej: Simple 4mm, DVH 4/9/4, Fantasía"
                value={vidrio}
                onChange={(e) => setVidrio(e.target.value)}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-medium text-stone-900 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Accesorios:</label>
              <input
                type="text"
                placeholder="Ej: Cierre central, mosquitero, ruedas"
                value={accesorios}
                onChange={(e) => setAccesorios(e.target.value)}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-medium text-stone-900 outline-none"
              />
            </div>
          </div>

          {/* 4. PRECIO DE VENTA (MANUAL), COSTO Y GANANCIA */}
          <div className="bg-[#EDE8DE] border border-[#D5CEC2] rounded-xl p-4 space-y-3">
            <div className="font-black text-stone-900 text-xs flex items-center justify-between">
              <span>Valores Comerciales (Precio ingresado manualmente)</span>
              <span className="text-[11px] text-orange-800 font-bold bg-orange-100 px-2 py-0.5 rounded">
                Ingreso de precio flexible
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Precio de Venta */}
              <div>
                <label className="font-black text-stone-900 block mb-1">
                  Precio de Venta ($) * (Manual):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-black text-stone-700">$</span>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border-2 border-orange-500 rounded-lg pl-7 pr-3 py-2 text-base font-black text-stone-950 outline-none"
                  />
                </div>
              </div>

              {/* Costo */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Costo Interno ($):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-stone-500">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-[#C5BDAE] rounded-lg pl-7 pr-3 py-2 text-sm font-bold text-stone-900 outline-none"
                  />
                </div>
              </div>

              {/* Ganancia calculada */}
              <div className="bg-[#E4DDCF] border border-[#CCC4B4] rounded-lg p-3 flex flex-col justify-center">
                <span className="text-[10px] font-black text-stone-700 uppercase">
                  Ganancia Neta Calculada:
                </span>
                <span className="text-lg font-black text-emerald-800 mt-0.5">
                  ${(ganancia || 0).toLocaleString('es-AR')}
                </span>
                <span className="text-[10px] font-bold text-stone-600">
                  Margen: {margenPorcentaje}% sobre costo
                </span>
              </div>
            </div>
          </div>

          {/* 5. Observaciones */}
          <div className="text-xs">
            <label className="font-bold text-stone-800 block mb-1">Observaciones / Detalles de entrega:</label>
            <textarea
              rows={2}
              placeholder="Detalles sobre retiro en mostrador, embalaje o especificaciones especiales..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-white border border-[#C5BDAE] rounded-lg p-2.5 font-medium text-stone-900 outline-none"
            />
          </div>

          {/* Botones de acción */}
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
              {guardando ? 'Registrando...' : 'Confirmar y Guardar Venta'}
            </button>
          </div>
        </form>
      )}

      {/* Buscador */}
      <div className="bg-[#EAE5DC] p-3.5 rounded-xl border border-[#D5CEC2] flex items-center gap-3">
        <Search size={15} className="text-stone-500" />
        <input
          type="text"
          placeholder="Buscar por producto, tipología, medida, cliente o número..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full bg-[#FAF8F5] border border-[#C5BDAE] rounded-lg px-3 py-1.5 text-xs text-stone-900 outline-none"
        />
      </div>

      {/* Lista de Ventas Rápidas */}
      <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E4DDCF] border-b border-[#CCC4B4] text-stone-700 font-extrabold">
                <th className="py-3 px-4">Operación / Fecha</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Producto & Tipología</th>
                <th className="py-3 px-4">Medida & Vidrio</th>
                <th className="py-3 px-4 text-right">Precio Venta</th>
                {modoInterno && (
                  <>
                    <th className="py-3 px-4 text-right">Costo Interno</th>
                    <th className="py-3 px-4 text-right">Ganancia</th>
                  </>
                )}
                <th className="py-3 px-4 text-center">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]">
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={modoInterno ? 8 : 6} className="py-8 text-center text-stone-500 italic">
                    No se encontraron ventas rápidas registradas.
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((v) => (
                  <tr key={v.id} className="hover:bg-[#F3EFE6] transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-stone-900 text-xs block">
                        {v.numero}
                      </span>
                      <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <Calendar size={11} /> {v.fecha || 'Hoy'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-800">
                      {v.clienteNombre || 'Consumidor Final'}
                      {v.clienteTelefono && (
                        <span className="block text-[10px] text-stone-500">{v.clienteTelefono}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-stone-950 block">{v.producto}</span>
                      <span className="text-[11px] text-stone-600">{v.tipologia || 'Estándar'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-stone-800 block">
                        {v.medida || `${v.anchoMm || 0}x${v.altoMm || 0} mm`}
                      </span>
                      <span className="text-[10px] text-stone-500">{v.vidrio || 'Simple'}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-black text-stone-950 text-sm">
                        ${(v.precioVenta || 0).toLocaleString('es-AR')}
                      </span>
                    </td>
                    {modoInterno && (
                      <>
                        <td className="py-3 px-4 text-right font-medium text-stone-600">
                          ${(v.costo || 0).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-800">
                          +${(v.ganancia || 0).toLocaleString('es-AR')}
                        </td>
                      </>
                    )}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setVentaSeleccionada(v)}
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

      {/* MODAL DE FICHA DE VENTA RÁPIDA (CON SOPORTE IMPRESIÓN Y VISTA CLIENTE) */}
      {ventaSeleccionada && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
          <div className="bg-[#FAF8F5] border border-[#CCC4B4] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden print:border-none print:shadow-none">
            {/* Header modal */}
            <div className="bg-[#E4DDCF] px-5 py-3.5 border-b border-[#CCC4B4] flex items-center justify-between no-print">
              <span className="font-extrabold text-stone-900 text-xs">
                Comprobante de Venta Rápida {ventaSeleccionada.numero}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-800 text-white font-bold text-xs"
                >
                  <Printer size={13} /> Imprimir
                </button>
                <button
                  onClick={() => setVentaSeleccionada(null)}
                  className="p-1 rounded text-stone-600 hover:bg-stone-300"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Documento imprimible */}
            <div className="p-6 space-y-4 text-xs text-stone-900">
              <div className="border-b-2 border-orange-500 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-black text-lg text-stone-900">ABERTURAS MAZZOLA</h3>
                  <p className="text-[11px] text-stone-600">Venta Directa de Taller</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-base text-stone-900 block">{ventaSeleccionada.numero}</span>
                  <span className="text-[11px] text-stone-500">{ventaSeleccionada.fecha}</span>
                </div>
              </div>

              {/* Datos cliente */}
              <div className="bg-[#EDE8DE] p-3 rounded-lg">
                <span className="font-bold text-stone-600 block text-[10px] uppercase">Cliente:</span>
                <span className="font-bold text-stone-900 text-sm">
                  {ventaSeleccionada.clienteNombre || 'Consumidor Final'}
                </span>
                {ventaSeleccionada.clienteTelefono && (
                  <span className="text-stone-600 block text-xs mt-0.5">Tel: {ventaSeleccionada.clienteTelefono}</span>
                )}
              </div>

              {/* Detalle del producto */}
              <div className="border border-[#D5CEC2] rounded-lg p-3.5 space-y-2 bg-white">
                <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-2">
                  <span className="font-extrabold text-stone-900 text-sm">{ventaSeleccionada.producto}</span>
                  <span className="font-black text-stone-950 text-base">
                    ${(ventaSeleccionada.precioVenta || 0).toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-stone-700">
                  <div><strong>Tipología:</strong> {ventaSeleccionada.tipologia || '-'}</div>
                  <div><strong>Medida:</strong> {ventaSeleccionada.medida || `${ventaSeleccionada.anchoMm || 0}x${ventaSeleccionada.altoMm || 0} mm`}</div>
                  <div><strong>Vidrio:</strong> {ventaSeleccionada.vidrio || '-'}</div>
                  <div><strong>Accesorios:</strong> {ventaSeleccionada.accesorios || '-'}</div>
                  {ventaSeleccionada.caracteristicas && (
                    <div className="col-span-2"><strong>Características:</strong> {ventaSeleccionada.caracteristicas}</div>
                  )}
                  {ventaSeleccionada.observaciones && (
                    <div className="col-span-2"><strong>Observaciones:</strong> {ventaSeleccionada.observaciones}</div>
                  )}
                </div>
              </div>

              {/* DATOS INTERNOS (SÓLO SI MODO INTERNO ESTÁ ACTIVO, NUNCA EN VISTA CLIENTE) */}
              {modoInterno && (
                <div className="bg-amber-500/10 border-2 border-amber-600/30 p-3 rounded-xl no-print text-[11px]">
                  <span className="font-black text-amber-950 block uppercase tracking-wider mb-1">
                    Datos Internos del Taller (Confidencial):
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-stone-800">
                    <div>Costo Interno: <strong>${(ventaSeleccionada.costo || 0).toLocaleString('es-AR')}</strong></div>
                    <div>Ganancia Neta: <strong className="text-emerald-800">${(ventaSeleccionada.ganancia || 0).toLocaleString('es-AR')}</strong></div>
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
