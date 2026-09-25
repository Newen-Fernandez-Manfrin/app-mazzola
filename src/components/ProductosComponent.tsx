import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Tag, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  TrendingUp, 
  Percent, 
  ShieldAlert, 
  Layers, 
  Sparkles,
  Info
} from 'lucide-react';
import { ProductoComercial } from '../types';

interface ProductosProps {
  productos: ProductoComercial[];
  operadorActual: string;
  onCrearProducto: (prod: Partial<ProductoComercial>) => Promise<ProductoComercial>;
  onActualizarProducto: (id: string, updates: Partial<ProductoComercial>) => Promise<ProductoComercial>;
  onEliminarProducto: (id: string) => Promise<void>;
  esInterno?: boolean;
}

export const ProductosComponent: React.FC<ProductosProps> = ({
  productos,
  operadorActual,
  onCrearProducto,
  onActualizarProducto,
  onEliminarProducto,
  esInterno = true
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Formulario
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Ventanas Estándar');
  const [costo, setCosto] = useState<number | ''>(120000);
  const [margen, setMargen] = useState<number | ''>(35);
  const [recargoConfigurable, setRecargoConfigurable] = useState<number | ''>(0);
  const [precioVentaManual, setPrecioVentaManual] = useState<number | ''>('');
  const [usarPrecioManual, setUsarPrecioManual] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [stock, setStock] = useState<number>(0);

  // Cálculo de precio sugerido
  const costoNum = typeof costo === 'number' ? costo : 0;
  const margenNum = typeof margen === 'number' ? margen : 0;
  const recargoNum = typeof recargoConfigurable === 'number' ? recargoConfigurable : 0;

  const precioCalculado = Math.round(costoNum * (1 + margenNum / 100) * (1 + recargoNum / 100));
  const precioFinalForm = usarPrecioManual && typeof precioVentaManual === 'number' ? precioVentaManual : precioCalculado;
  const gananciaForm = precioFinalForm - costoNum;

  const abrirCrear = () => {
    setEditandoId(null);
    setCodigo(`PRD-${Math.floor(100 + Math.random() * 900)}`);
    setNombre('');
    setCategoria('Ventanas Estándar');
    setCosto(120000);
    setMargen(35);
    setRecargoConfigurable(0);
    setPrecioVentaManual('');
    setUsarPrecioManual(false);
    setDescripcion('');
    setStock(5);
    setMostrarModal(true);
  };

  const abrirEditar = (prod: ProductoComercial) => {
    setEditandoId(prod.id);
    setCodigo(prod.codigo);
    setNombre(prod.nombre);
    setCategoria(prod.categoria);
    setCosto(prod.costo);
    setMargen(prod.margen || 35);
    setRecargoConfigurable(prod.recargoConfigurable || 0);
    setPrecioVentaManual(prod.precioVenta);
    setUsarPrecioManual(true);
    setDescripcion(prod.descripcion || '');
    setStock(prod.stock || 0);
    setMostrarModal(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('Por favor ingrese el nombre del producto');
      return;
    }

    setGuardando(true);
    try {
      const payload: Partial<ProductoComercial> = {
        codigo: codigo.trim() || `PRD-${Math.floor(100 + Math.random() * 900)}`,
        nombre: nombre.trim(),
        categoria,
        costo: costoNum,
        margen: margenNum,
        recargoConfigurable: recargoNum,
        precioVenta: precioFinalForm,
        descripcion: descripcion.trim(),
        stock: Number(stock) || 0,
        creadoPor: operadorActual
      };

      if (editandoId) {
        await onActualizarProducto(editandoId, payload);
      } else {
        await onCrearProducto(payload);
      }

      setMostrarModal(false);
    } catch (err) {
      console.error(err);
      alert('Error al guardar el producto');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string, nombreProd: string) => {
    if (confirm(`¿Confirma eliminar el producto "${nombreProd}" del catálogo? (No afectará presupuestos históricos existentes)`)) {
      try {
        await onEliminarProducto(id);
      } catch (err) {
        console.error(err);
        alert('Error al eliminar producto');
      }
    }
  };

  const categoriasUnicas = Array.from(new Set(productos.map(p => p.categoria)));

  const productosFiltrados = productos.filter(p => {
    const q = busqueda.toLowerCase();
    const coincideTexto = (
      p.nombre.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(q))
    );
    const coincideCat = categoriaFiltro === 'todas' || p.categoria === categoriaFiltro;
    return coincideTexto && coincideCat;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#DFD9CD] border border-[#CCC4B4] rounded-xl p-4 sm:p-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <DollarSign className="text-orange-600" />
            Lista de Precios y Catálogo de Productos
          </h2>
          <p className="text-stone-700 text-xs mt-0.5">
            Gestión interna de costos, márgenes, recargos y precios sugeridos. No reemplaza presupuestos históricos.
          </p>
        </div>

        <button
          id="btn-nuevo-producto"
          onClick={abrirCrear}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          Nuevo Producto
        </button>
      </div>

      {/* Regla Comercial Clave Mazzola */}
      <div className="bg-[#EDE8DE] border-l-4 border-orange-600 p-4 rounded-r-xl text-xs text-stone-800 flex items-start gap-3">
        <Info size={18} className="text-orange-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-black text-stone-900">
            Regla de Inmutabilidad de Precios Históricos y Flexibilidad Comercial:
          </p>
          <p>
            Los productos almacenan costo de compra, margen (%) y recargo configurable. Cuando un vendedor confecciona un presupuesto, puede modificar manualmente el precio final.
            Los presupuestos emitidos en el pasado <strong>nunca se recalculan ni modifican automáticamente</strong> al cambiar los precios de esta lista.
          </p>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#EAE5DC] p-3.5 rounded-xl border border-[#D5CEC2]">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-2.5 text-stone-500" />
          <input
            id="input-buscar-productos"
            type="text"
            placeholder="Buscar por código, nombre o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#C5BDAE] rounded-lg pl-9 pr-3 py-1.5 text-xs text-stone-900 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-700">Categoría:</span>
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="bg-[#FAF8F5] border border-[#C5BDAE] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-800 outline-none"
          >
            <option value="todas">Todas las categorías ({productos.length})</option>
            {categoriasUnicas.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E4DDCF] border-b border-[#CCC4B4] text-stone-700 font-extrabold">
                <th className="py-3 px-4">Código / Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Costo / Compra</th>
                <th className="py-3 px-4 text-center">Margen</th>
                <th className="py-3 px-4 text-center">Recargo</th>
                <th className="py-3 px-4 text-right">Precio Venta</th>
                <th className="py-3 px-4 text-right">Ganancia Neta</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500 italic">
                    No se encontraron productos en el catálogo.
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((prod) => {
                  const costoP = prod.costo || 0;
                  const ventaP = prod.precioVenta || 0;
                  const gananciaP = ventaP - costoP;
                  const margenCalculado = costoP > 0 ? Math.round((gananciaP / costoP) * 100) : 0;

                  return (
                    <tr key={prod.id} className="hover:bg-[#F3EFE6] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded font-bold">
                            {prod.codigo}
                          </span>
                          <span className="font-bold text-stone-950 text-sm">{prod.nombre}</span>
                        </div>
                        {prod.descripcion && (
                          <p className="text-stone-600 text-[11px] mt-0.5 line-clamp-1">{prod.descripcion}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-700 font-medium">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-[#E5DFD3] text-stone-800 text-[11px] font-semibold">
                          {prod.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-stone-700">
                        ${(prod.costo || 0).toLocaleString('es-AR')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                          +{prod.margen || 35}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {prod.recargoConfigurable ? (
                          <span className="font-bold text-orange-900 bg-orange-100 px-2 py-0.5 rounded">
                            +{prod.recargoConfigurable}%
                          </span>
                        ) : (
                          <span className="text-stone-400">0%</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-black text-stone-950 text-sm">
                          ${(prod.precioVenta || 0).toLocaleString('es-AR')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-800">
                        +${(gananciaP || 0).toLocaleString('es-AR')}
                        <span className="block text-[10px] font-bold text-emerald-600">
                          ({margenCalculado}%)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => abrirEditar(prod)}
                            className="p-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors cursor-pointer"
                            title="Editar precios o márgenes"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleEliminar(prod.id, prod.nombre)}
                            className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 transition-colors cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ALTA / EDICIÓN DE PRODUCTO */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#FAF8F5] border border-[#CCC4B4] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden">
            <div className="bg-[#E4DDCF] px-5 py-3.5 border-b border-[#CCC4B4] flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <DollarSign size={18} className="text-orange-600" />
                {editandoId ? 'Modificar Producto y Precios' : 'Alta de Nuevo Producto en Catálogo'}
              </h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="p-1 rounded text-stone-600 hover:bg-stone-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">Código Identificador *:</label>
                  <input
                    type="text"
                    required
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-mono font-bold text-stone-900 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-stone-800 block mb-1">Nombre del Producto / Abertura *:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Ventana Corrediza Módena 1500x1100 Blanca 4mm"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-semibold text-stone-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">Categoría:</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-semibold text-stone-900 outline-none"
                  >
                    <option value="Ventanas Estándar">Ventanas Estándar</option>
                    <option value="Puertas y Balcones">Puertas y Balcones</option>
                    <option value="Paños Fijos">Paños Fijos</option>
                    <option value="Mosquiteros">Mosquiteros</option>
                    <option value="Puertas">Puertas</option>
                    <option value="Accesorios y Vidrios">Accesorios y Vidrios</option>
                    <option value="Perfiles">Perfiles</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">Stock estimado inicial:</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-2 font-bold text-stone-900 outline-none"
                  />
                </div>
              </div>

              {/* BLOQUE DE PRECIOS, COSTO, MARGEN Y RECARGOS */}
              <div className="bg-[#EDE8DE] border border-[#D5CEC2] rounded-xl p-4 space-y-3">
                <div className="font-extrabold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-orange-700" />
                  Estructura de Precios Comerciales
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-stone-800 block mb-1">Costo / Compra ($):</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-stone-500 font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="0"
                        value={costo}
                        onChange={(e) => setCosto(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-white border border-[#C5BDAE] rounded-lg pl-6 pr-2.5 py-1.5 font-bold text-stone-900 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-stone-800 block mb-1">Margen Ganancia (%):</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="35"
                        value={margen}
                        onChange={(e) => setMargen(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-1.5 font-bold text-stone-900 outline-none"
                      />
                      <span className="absolute right-2.5 top-2 text-stone-500 font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-stone-800 block mb-1">Recargo Configurable (%):</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={recargoConfigurable}
                        onChange={(e) => setRecargoConfigurable(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-white border border-[#C5BDAE] rounded-lg px-3 py-1.5 font-bold text-stone-900 outline-none"
                      />
                      <span className="absolute right-2.5 top-2 text-stone-500 font-bold">%</span>
                    </div>
                  </div>
                </div>

                {/* Switch para fijar precio de venta manual o automático */}
                <div className="pt-2 border-t border-[#D5CEC2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="check-manual-price"
                      checked={usarPrecioManual}
                      onChange={(e) => {
                        setUsarPrecioManual(e.target.checked);
                        if (e.target.checked && !precioVentaManual) {
                          setPrecioVentaManual(precioCalculado);
                        }
                      }}
                      className="rounded text-orange-600 focus:ring-0"
                    />
                    <label htmlFor="check-manual-price" className="font-bold text-stone-800 cursor-pointer">
                      Modificar manualmente precio de venta final
                    </label>
                  </div>

                  {usarPrecioManual ? (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-700">Precio Fijo: $</span>
                      <input
                        type="number"
                        min="0"
                        value={precioVentaManual}
                        onChange={(e) => setPrecioVentaManual(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-32 bg-white border-2 border-orange-500 rounded-lg px-2.5 py-1 font-black text-stone-900 outline-none"
                      />
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-[11px] text-stone-600 block">Precio Calculado Automático:</span>
                      <span className="font-black text-base text-stone-950">
                        ${precioCalculado.toLocaleString('es-AR')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Resumen del margen final */}
                <div className="bg-[#DFD8CB] p-3 rounded-lg flex items-center justify-between">
                  <span className="font-bold text-stone-800">Ganancia Neta Estimada:</span>
                  <span className="font-black text-emerald-800 text-sm">
                    ${gananciaForm.toLocaleString('es-AR')} ({costoNum > 0 ? Math.round((gananciaForm / costoNum) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Descripción / Ficha técnica breve:</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre perfilería, felpa, rodamientos, vidriado..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-white border border-[#C5BDAE] rounded-lg p-2.5 text-stone-900 font-medium outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#CCC4B4] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 rounded-lg bg-stone-300 hover:bg-stone-400 text-stone-800 font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-black shadow-xs transition-colors cursor-pointer"
                >
                  <Save size={15} />
                  {guardando ? 'Guardando...' : (editandoId ? 'Guardar Cambios' : 'Registrar Producto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
