import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  FileText, 
  Zap, 
  Wrench, 
  Clock, 
  Check, 
  Trash2,
  Calendar,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { Cliente, Presupuesto, VentaRapida, Reparacion } from '../types';

interface ClientesProps {
  clientes: Cliente[];
  presupuestos: Presupuesto[];
  ventasRapidas: VentaRapida[];
  reparaciones: Reparacion[];
  operadorActual: string;
  onCrearCliente: (cliente: Omit<Cliente, 'id' | 'fechaCreacion'>) => Promise<Cliente>;
  onEliminarCliente: (id: string) => Promise<void>;
  onVerPresupuesto: (p: Presupuesto) => void;
  esInterno?: boolean;
}

export const ClientesComponent: React.FC<ClientesProps> = ({
  clientes,
  presupuestos,
  ventasRapidas,
  reparaciones,
  operadorActual,
  onCrearCliente,
  onEliminarCliente,
  onVerPresupuesto,
  esInterno = true
}) => {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  
  // REQUISITO ESTRICTO PROMPT:
  // "CLIENTE: Nunca mostrar: costo, ganancia, proveedor, perfiles, cortes, desperdicio, datos de fábrica"
  // "INTERNO: Los usuarios internos autorizados pueden consultar costos y ganancias."
  // Por defecto inicializamos en Vista Cliente Segura:
  const [modoInterno, setModoInterno] = useState(false);

  // Formulario nuevo cliente
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }

    setGuardando(true);
    try {
      const nuevo = await onCrearCliente({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        observaciones: observaciones.trim() || undefined,
        creadoPor: operadorActual
      });

      setMostrarForm(false);
      setNombre('');
      setTelefono('');
      setDireccion('');
      setObservaciones('');
      setClienteSeleccionadoId(nuevo.id);
    } catch (err) {
      console.error(err);
      alert('Error al registrar cliente');
    } finally {
      setGuardando(false);
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    const q = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono && c.telefono.toLowerCase().includes(q)) ||
      (c.direccion && c.direccion.toLowerCase().includes(q))
    );
  });

  const clienteActivo = clientes.find(c => c.id === clienteSeleccionadoId) || clientes[0];

  // Historial comercial unificado del cliente activo
  const presupuestosDelCliente = presupuestos.filter(p => 
    p.clienteId === clienteActivo?.id || 
    (p.clienteNombre && clienteActivo?.nombre && p.clienteNombre.toLowerCase() === clienteActivo.nombre.toLowerCase())
  );

  const ventasDelCliente = ventasRapidas.filter(v => 
    (v.clienteId && clienteActivo?.id && v.clienteId === clienteActivo.id) ||
    (v.clienteNombre && clienteActivo?.nombre && v.clienteNombre.toLowerCase() === clienteActivo.nombre.toLowerCase())
  );

  const reparacionesDelCliente = reparaciones.filter(r => 
    (r.clienteId && clienteActivo?.id && r.clienteId === clienteActivo.id) ||
    (r.clienteNombre && clienteActivo?.nombre && r.clienteNombre.toLowerCase() === clienteActivo.nombre.toLowerCase())
  );

  // Totales comerciales del cliente
  const totalMontoPresupuestos = presupuestosDelCliente.reduce((acc, p) => acc + (p.total || 0), 0);
  const totalMontoVentas = ventasDelCliente.reduce((acc, v) => acc + (v.precioVenta || 0), 0);
  const totalMontoReparaciones = reparacionesDelCliente.reduce((acc, r) => acc + (r.precioCobrado || 0), 0);
  const totalFacturadoCliente = totalMontoPresupuestos + totalMontoVentas + totalMontoReparaciones;

  // Ganancias (SÓLO para modo interno)
  const totalGananciaVentas = ventasDelCliente.reduce((acc, v) => acc + (v.ganancia || 0), 0);
  const totalGananciaReparaciones = reparacionesDelCliente.reduce((acc, r) => acc + (r.ganancia || 0), 0);
  const totalGananciaInterna = totalGananciaVentas + totalGananciaReparaciones;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#DFD9CD] border border-[#CCC4B4] rounded-xl p-4 sm:p-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Users className="text-orange-600" />
            Clientes y Ficha Comercial
          </h2>
          <p className="text-stone-700 text-xs mt-0.5">
            Ficha individual del cliente con historial comercial de presupuestos, ventas rápidas y reparaciones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Vista Cliente Segura vs Vista Interna Autorizada */}
          <button
            onClick={() => setModoInterno(!modoInterno)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              modoInterno 
                ? 'bg-amber-600 text-white border-amber-700' 
                : 'bg-emerald-700 text-white border-emerald-800'
            }`}
            title="Alternar entre Vista Cliente segura y Vista Interna autorizada"
          >
            {modoInterno ? <Eye size={14} /> : <ShieldCheck size={14} />}
            {modoInterno ? 'Vista Interna Autorizada (Con Costos)' : 'Vista Cliente (Segura y Limpia)'}
          </button>

          {!mostrarForm && (
            <button
              id="btn-abrir-nuevo-cliente"
              onClick={() => setMostrarForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              Nuevo Cliente
            </button>
          )}
        </div>
      </div>

      {/* AVISO DE CONFIDENCIALIDAD REGLA MAZZOLA */}
      {!modoInterno ? (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
          <span>
            <strong>Modo Vista Cliente Activo:</strong> Costos, márgenes, ganancias, perfiles, cortes y datos técnicos de fábrica están estrictamente ocultos.
          </span>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
          <ShieldAlert size={16} className="text-amber-700 shrink-0" />
          <span>
            <strong>Modo Interno Taller Autorizado:</strong> Visualizando costos internos y ganancias para análisis comercial.
          </span>
        </div>
      )}

      {/* FORMULARIO NUEVO CLIENTE */}
      {mostrarForm && (
        <form 
          onSubmit={handleGuardar}
          className="bg-[#F5F2EA] border-2 border-orange-500/50 rounded-2xl p-5 sm:p-7 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#D5CEC2] pb-3">
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <Users size={18} className="text-orange-600" />
              Alta de Nuevo Cliente
            </h3>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="text-stone-600 hover:text-stone-900 text-xs font-bold px-3 py-1.5 rounded-lg bg-stone-300/60 cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-stone-800 block mb-1">Nombre completo o Razón Social *:</label>
              <input
                id="input-cliente-nombre"
                type="text"
                required
                placeholder="Ej: Juan Carlos Pérez / Constructora"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-bold text-stone-900 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Teléfono de contacto:</label>
              <input
                id="input-cliente-telefono"
                type="text"
                placeholder="Ej: +54 9 11 4455-6677"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-medium text-stone-900 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">Dirección / Localidad:</label>
              <input
                id="input-cliente-direccion"
                type="text"
                placeholder="Ej: Av. Rivadavia 1234, San Martín"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-medium text-stone-900 outline-none"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="font-bold text-stone-800 block mb-1">Observaciones generales:</label>
            <textarea
              rows={2}
              placeholder="Preferencias de obra, detalles de facturación..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-white border border-[#C5BDAE] rounded-lg p-2.5 font-medium text-stone-900 outline-none"
            />
          </div>

          <div className="pt-2 border-t border-[#D5CEC2] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="px-4 py-2 rounded-lg bg-stone-300 hover:bg-stone-400 text-stone-800 font-bold text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-xs cursor-pointer"
            >
              <Check size={15} />
              {guardando ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      )}

      {/* Grid Principal: Lista a la izquierda y Ficha Comercial a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Buscador y Lista de Clientes */}
        <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl p-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              placeholder="Buscar cliente por nombre o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-white border border-[#C5BDAE] rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-900 outline-none"
            />
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {clientesFiltrados.length === 0 ? (
              <div className="text-center py-6 text-xs text-stone-500 italic">
                No hay clientes que coincidan.
              </div>
            ) : (
              clientesFiltrados.map((c) => {
                const seleccionado = clienteActivo?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setClienteSeleccionadoId(c.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      seleccionado
                        ? 'bg-amber-500/20 border-amber-600 text-stone-950 font-bold shadow-xs'
                        : 'bg-white border-[#E0D9CC] hover:bg-[#F5F2EA] text-stone-800'
                    }`}
                  >
                    <div className="font-extrabold text-sm">{c.nombre}</div>
                    {c.telefono && (
                      <div className="text-[11px] text-stone-600 flex items-center gap-1 mt-0.5">
                        <Phone size={11} className="text-orange-600" /> {c.telefono}
                      </div>
                    )}
                    {c.direccion && (
                      <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5 line-clamp-1">
                        <MapPin size={11} /> {c.direccion}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Ficha del Cliente e HISTORIAL COMERCIAL */}
        <div className="lg:col-span-2 space-y-5">
          {clienteActivo ? (
            <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl p-5 space-y-5">
              {/* Encabezado Ficha del Cliente */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#D5CEC2] pb-4">
                <div>
                  <h3 className="text-xl font-black text-stone-950 tracking-tight">{clienteActivo.nombre}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-1">
                    {clienteActivo.telefono && (
                      <span className="flex items-center gap-1">
                        <Phone size={13} className="text-orange-600" /> {clienteActivo.telefono}
                      </span>
                    )}
                    {clienteActivo.direccion && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-orange-600" /> {clienteActivo.direccion}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right text-[11px] text-stone-500">
                  <span>Registrado el {new Date(clienteActivo.fechaCreacion).toLocaleDateString('es-AR')}</span>
                  <span className="block">por {clienteActivo.creadoPor}</span>
                </div>
              </div>

              {clienteActivo.observaciones && (
                <div className="bg-[#EDE8DE] p-3 rounded-lg text-xs text-stone-700">
                  <span className="font-bold text-stone-900 block mb-0.5">Observaciones del Cliente:</span>
                  {clienteActivo.observaciones}
                </div>
              )}

              {/* Resumen Comercial del Cliente */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-[#EDE8DE] p-3 rounded-xl border border-[#D5CEC2]">
                  <span className="text-[10px] text-stone-600 font-bold block uppercase">Presupuestos:</span>
                  <span className="text-base font-black text-stone-900">{presupuestosDelCliente.length}</span>
                  <span className="block text-[11px] text-stone-500">${totalMontoPresupuestos.toLocaleString('es-AR')}</span>
                </div>

                <div className="bg-[#EDE8DE] p-3 rounded-xl border border-[#D5CEC2]">
                  <span className="text-[10px] text-stone-600 font-bold block uppercase">Ventas Directas:</span>
                  <span className="text-base font-black text-stone-900">{ventasDelCliente.length}</span>
                  <span className="block text-[11px] text-stone-500">${totalMontoVentas.toLocaleString('es-AR')}</span>
                </div>

                <div className="bg-[#EDE8DE] p-3 rounded-xl border border-[#D5CEC2]">
                  <span className="text-[10px] text-stone-600 font-bold block uppercase">Reparaciones:</span>
                  <span className="text-base font-black text-stone-900">{reparacionesDelCliente.length}</span>
                  <span className="block text-[11px] text-stone-500">${totalMontoReparaciones.toLocaleString('es-AR')}</span>
                </div>

                <div className="bg-[#E4DDCF] p-3 rounded-xl border border-[#C5BDAE]">
                  <span className="text-[10px] text-stone-700 font-black block uppercase">Total Operado:</span>
                  <span className="text-base font-black text-orange-800">
                    ${totalFacturadoCliente.toLocaleString('es-AR')}
                  </span>
                  {modoInterno && (
                    <span className="block text-[10px] font-bold text-emerald-800">
                      Ganancia: ${totalGananciaInterna.toLocaleString('es-AR')}
                    </span>
                  )}
                </div>
              </div>

              {/* HISTORIAL COMERCIAL (PRESUPUESTOS, VENTAS, REPARACIONES) */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={15} className="text-orange-600" />
                  Historial Comercial Completo
                </h4>

                {/* 1. Presupuestos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <span className="flex items-center gap-1.5">
                      <FileText size={14} className="text-amber-700" />
                      Presupuestos Cotizados ({presupuestosDelCliente.length})
                    </span>
                  </div>

                  {presupuestosDelCliente.length === 0 ? (
                    <div className="p-3 bg-white border border-[#E0D9CC] rounded-lg text-xs text-stone-500 italic">
                      No tiene presupuestos emitidos.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#EAE5DC] border border-[#D5CEC2] rounded-lg overflow-hidden bg-white text-xs">
                      {presupuestosDelCliente.map(p => (
                        <div key={p.id} className="p-3 flex items-center justify-between gap-3 hover:bg-[#FAF8F5]">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-stone-900">{p.numero}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                                {p.estado}
                              </span>
                            </div>
                            <p className="text-stone-600 text-[11px] mt-0.5">
                              {p.items?.length || 0} abertura(s) · {new Date(p.fechaCreacion).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-stone-900 text-sm">
                              ${(p.total || 0).toLocaleString('es-AR')}
                            </span>
                            <button
                              onClick={() => onVerPresupuesto(p)}
                              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Ver
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Ventas Rápidas */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <span className="flex items-center gap-1.5">
                      <Zap size={14} className="text-orange-600" />
                      Ventas Directas / Mostrador ({ventasDelCliente.length})
                    </span>
                  </div>

                  {ventasDelCliente.length === 0 ? (
                    <div className="p-3 bg-white border border-[#E0D9CC] rounded-lg text-xs text-stone-500 italic">
                      No tiene ventas directas registradas.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#EAE5DC] border border-[#D5CEC2] rounded-lg overflow-hidden bg-white text-xs">
                      {ventasDelCliente.map(v => (
                        <div key={v.id} className="p-3 flex items-center justify-between gap-3 hover:bg-[#FAF8F5]">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-stone-900">{v.numero}</span>
                              <span className="text-[11px] text-stone-500">{v.fecha}</span>
                            </div>
                            <p className="font-bold text-stone-950 mt-0.5">{v.producto}</p>
                            <span className="text-[11px] text-stone-600">
                              {v.tipologia} · {v.medida}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-stone-900 text-sm block">
                              ${(v.precioVenta || 0).toLocaleString('es-AR')}
                            </span>
                            {modoInterno && (
                              <span className="text-[10px] font-bold text-emerald-800">
                                Ganancia: +${(v.ganancia || 0).toLocaleString('es-AR')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Reparaciones */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <span className="flex items-center gap-1.5">
                      <Wrench size={14} className="text-orange-600" />
                      Reparaciones y Trabajos de Taller ({reparacionesDelCliente.length})
                    </span>
                  </div>

                  {reparacionesDelCliente.length === 0 ? (
                    <div className="p-3 bg-white border border-[#E0D9CC] rounded-lg text-xs text-stone-500 italic">
                      No tiene reparaciones registradas.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#EAE5DC] border border-[#D5CEC2] rounded-lg overflow-hidden bg-white text-xs">
                      {reparacionesDelCliente.map(r => (
                        <div key={r.id} className="p-3 flex items-center justify-between gap-3 hover:bg-[#FAF8F5]">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-stone-900">{r.numero}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                                {r.estado}
                              </span>
                              <span className="text-[11px] text-stone-500">{r.fecha}</span>
                            </div>
                            <p className="font-bold text-stone-950 mt-0.5">{r.trabajo}</p>
                            {r.materialesTexto && (
                              <span className="text-[11px] text-stone-600 line-clamp-1">{r.materialesTexto}</span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-black text-stone-900 text-sm block">
                              ${(r.precioCobrado || 0).toLocaleString('es-AR')}
                            </span>
                            {modoInterno && (
                              <span className="text-[10px] font-bold text-emerald-800">
                                Ganancia: +${(r.ganancia || 0).toLocaleString('es-AR')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl text-center text-xs text-stone-500">
              Seleccione un cliente de la lista para ver su ficha y su historial comercial.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
