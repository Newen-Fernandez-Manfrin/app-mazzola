import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  BookOpen, 
  Layers,
  FileCheck,
  FileText,
  Building2,
  FolderTree,
  Wrench,
  Sparkles,
  Search,
  ExternalLink,
  Edit3,
  Check,
  X,
  Clock,
  RotateCw,
  Info,
  CheckSquare,
  ChevronRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { 
  Marca, 
  LineaSistema, 
  CatalogoDocumento, 
  TipologiaTecnica, 
  VarianteTipologia, 
  ComponenteFuncion, 
  PerfilTecnico, 
  ReglaTecnica,
  EstadoRevision
} from '../types';
import { mazzolaApi } from '../services/api';

interface DatosTecnicosProps {
  operadorActual: string;
}

export const DatosTecnicosComponent: React.FC<DatosTecnicosProps> = ({
  operadorActual
}) => {
  const [seccionActiva, setSeccionActiva] = useState<'catalogos' | 'marcas_lineas' | 'tipologias' | 'perfiles_reglas' | 'revision'>('catalogos');

  // Estados de datos
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [lineas, setLineas] = useState<LineaSistema[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogoDocumento[]>([]);
  const [tipologias, setTipologias] = useState<TipologiaTecnica[]>([]);
  const [variantes, setVariantes] = useState<VarianteTipologia[]>([]);
  const [componentes, setComponentes] = useState<ComponenteFuncion[]>([]);
  const [perfiles, setPerfiles] = useState<PerfilTecnico[]>([]);
  const [reglas, setReglas] = useState<ReglaTecnica[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [marcaFiltro, setMarcaFiltro] = useState<string>('todas');
  const [lineaFiltro, setLineaFiltro] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [mostrarModalNuevoCatalogo, setMostrarModalNuevoCatalogo] = useState(false);
  const [mostrarModalNuevaMarca, setMostrarModalNuevaMarca] = useState(false);
  const [mostrarModalNuevaLinea, setMostrarModalNuevaLinea] = useState(false);
  const [mostrarModalRevision, setMostrarModalRevision] = useState(false);
  const [itemRevision, setItemRevision] = useState<{ tipo: 'tipologia' | 'perfil' | 'regla'; item: any } | null>(null);

  // Procesamiento por chunks simulado / real
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  // Formulario nuevo catálogo
  const [nuevoCatTitulo, setNuevoCatTitulo] = useState('');
  const [nuevoCatArchivo, setNuevoCatArchivo] = useState('');
  const [nuevoCatMarcaId, setNuevoCatMarcaId] = useState('');
  const [nuevoCatLineaId, setNuevoCatLineaId] = useState('');
  const [nuevoCatPaginas, setNuevoCatPaginas] = useState<number>(32);

  // Formulario nueva marca
  const [nuevaMarcaNombre, setNuevaMarcaNombre] = useState('');
  const [nuevaMarcaCodigo, setNuevaMarcaCodigo] = useState('');
  const [nuevaMarcaDesc, setNuevaMarcaDesc] = useState('');

  // Formulario nueva línea
  const [nuevaLineaMarcaId, setNuevaLineaMarcaId] = useState('');
  const [nuevaLineaNombre, setNuevaLineaNombre] = useState('');
  const [nuevaLineaAlias, setNuevaLineaAlias] = useState('');
  const [nuevaLineaDesc, setNuevaLineaDesc] = useState('');

  // Carga inicial
  const cargarTodo = async () => {
    setCargando(true);
    try {
      const [m, l, c, t, v, comp, p, r] = await Promise.all([
        mazzolaApi.getMarcas(),
        mazzolaApi.getLineas(),
        mazzolaApi.getCatalogosDocumentos(),
        mazzolaApi.getTipologias(),
        mazzolaApi.getVariantes(),
        mazzolaApi.getComponentes(),
        mazzolaApi.getPerfiles(),
        mazzolaApi.getReglasTecnicas()
      ]);
      setMarcas(m);
      setLineas(l);
      setCatalogos(c);
      setTipologias(t);
      setVariantes(v);
      setComponentes(comp);
      setPerfiles(p);
      setReglas(r);
    } catch (err) {
      console.error('Error cargando base técnica:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  // Procesar siguiente chunk de un catálogo
  const handleProcesarChunk = async (catId: string) => {
    setProcesandoId(catId);
    try {
      await mazzolaApi.procesarChunkCatalogo(catId, 8);
      await cargarTodo();
    } catch (err) {
      console.error('Error procesando bloque de catálogo:', err);
      alert('Error al procesar bloque.');
    } finally {
      setProcesandoId(null);
    }
  };

  // Aprobar catálogo formalmente
  const handleAprobarCatalogo = async (catId: string) => {
    const notas = prompt('Ingrese notas de homologación o dictamen de aprobación técnica:');
    if (notas === null) return;
    try {
      await mazzolaApi.aprobarCatalogo(catId, operadorActual, notas || 'Aprobado por Mazzola');
      await cargarTodo();
    } catch (err) {
      console.error('Error aprobando catálogo:', err);
      alert('Error al aprobar catálogo.');
    }
  };

  // Guardar nuevo catálogo
  const handleGuardarNuevoCatalogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCatTitulo.trim() || !nuevoCatMarcaId) {
      alert('Por favor complete título y marca del catálogo.');
      return;
    }
    const marcaObj = marcas.find(m => m.id === nuevoCatMarcaId);
    const lineaObj = lineas.find(l => l.id === nuevoCatLineaId);

    try {
      await mazzolaApi.createCatalogoDocumento({
        marcaId: nuevoCatMarcaId,
        marcaNombre: marcaObj?.nombre || 'Marca',
        lineaId: nuevoCatLineaId || undefined,
        lineaNombre: lineaObj?.nombre || undefined,
        titulo: nuevoCatTitulo.trim(),
        nombreArchivoOriginal: nuevoCatArchivo.trim() || `${nuevoCatTitulo.replace(/\s+/g, '_')}.pdf`,
        totalPaginas: Number(nuevoCatPaginas) || 30,
        cargadoPor: operadorActual
      });
      setMostrarModalNuevoCatalogo(false);
      setNuevoCatTitulo('');
      setNuevoCatArchivo('');
      await cargarTodo();
    } catch (err) {
      console.error('Error creando catálogo:', err);
      alert('Error al registrar catálogo.');
    }
  };

  // Guardar nueva marca
  const handleGuardarNuevaMarca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaMarcaNombre.trim()) {
      alert('Ingrese el nombre del fabricante o marca.');
      return;
    }
    try {
      await mazzolaApi.createMarca({
        nombre: nuevaMarcaNombre.trim(),
        codigo: nuevaMarcaCodigo.trim().toUpperCase() || undefined,
        descripcion: nuevaMarcaDesc.trim() || undefined,
        activo: true,
        creadoPor: operadorActual
      });
      setMostrarModalNuevaMarca(false);
      setNuevaMarcaNombre('');
      setNuevaMarcaCodigo('');
      setNuevaMarcaDesc('');
      await cargarTodo();
    } catch (err) {
      console.error('Error guardando marca:', err);
      alert('Error al guardar fabricante.');
    }
  };

  // Guardar nueva línea
  const handleGuardarNuevaLinea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaLineaNombre.trim() || !nuevaLineaMarcaId) {
      alert('Ingrese nombre y fabricante de la línea.');
      return;
    }
    const marcaObj = marcas.find(m => m.id === nuevaLineaMarcaId);
    const aliasArr = nuevaLineaAlias ? nuevaLineaAlias.split(',').map(a => a.trim()).filter(Boolean) : [];

    try {
      await mazzolaApi.createLinea({
        marcaId: nuevaLineaMarcaId,
        marcaNombre: marcaObj?.nombre || 'Marca',
        nombre: nuevaLineaNombre.trim(),
        alias: aliasArr,
        descripcion: nuevaLineaDesc.trim() || undefined,
        estado: 'Activo'
      });
      setMostrarModalNuevaLinea(false);
      setNuevaLineaNombre('');
      setNuevaLineaAlias('');
      setNuevaLineaDesc('');
      await cargarTodo();
    } catch (err) {
      console.error('Error guardando línea:', err);
      alert('Error al guardar línea.');
    }
  };

  // Guardar revisión humana con resguardo de dato original
  const handleGuardarRevision = async (accion: 'aprobar' | 'rechazar' | 'modificar', modificaciones?: any, notas?: string) => {
    if (!itemRevision) return;
    try {
      await mazzolaApi.revisionTecnica({
        tipoItem: itemRevision.tipo,
        id: itemRevision.item.id,
        accion,
        modificaciones,
        notas: notas || `Revisión técnica realizada por ${operadorActual}`,
        operador: operadorActual
      });
      setMostrarModalRevision(false);
      setItemRevision(null);
      await cargarTodo();
    } catch (err) {
      console.error('Error en revisión técnica:', err);
      alert('Error al guardar revisión.');
    }
  };

  // Filtrado de líneas
  const lineasFiltradas = lineas.filter(l => {
    if (marcaFiltro !== 'todas' && l.marcaId !== marcaFiltro) return false;
    if (busqueda && !l.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  // Filtrado de catálogos
  const catalogosFiltrados = catalogos.filter(c => {
    if (marcaFiltro !== 'todas' && c.marcaId !== marcaFiltro) return false;
    if (lineaFiltro !== 'todas' && c.lineaId !== lineaFiltro) return false;
    if (busqueda && !c.titulo.toLowerCase().includes(busqueda.toLowerCase()) && !c.nombreArchivoOriginal.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  // Filtrado de tipologías
  const tipologiasFiltradas = tipologias.filter(t => {
    if (marcaFiltro !== 'todas' && t.marcaId !== marcaFiltro) return false;
    if (lineaFiltro !== 'todas' && t.lineaId !== lineaFiltro) return false;
    if (busqueda && !t.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  // Catálogos aprobados Set para control estricto de tipologías
  const catalogosAprobadosIds = new Set(catalogos.filter(c => c.estado === 'Aprobado').map(c => c.id));

  // Ítems pendientes de revisión
  const itemsPendientesRevision = [
    ...catalogos.filter(c => c.estado === 'Revisión Pendiente').map(c => ({ tipo: 'catalogo', item: c })),
    ...catalogos.flatMap(c => (c.paginasParaRevision || []).filter(p => !p.revisado).map(p => ({ tipo: 'pagina_dudosa', catalogo: c, pagina: p }))),
    ...tipologias.filter(t => t.estadoRevision === 'Pendiente de revisión').map(t => ({ tipo: 'tipologia', item: t })),
    ...perfiles.filter(p => p.estadoRevision === 'Pendiente de revisión').map(p => ({ tipo: 'perfil', item: p })),
    ...reglas.filter(r => r.estadoRevision === 'Pendiente de revisión').map(r => ({ tipo: 'regla', item: r }))
  ];

  return (
    <div className="space-y-6">
      {/* ENCABEZADO CON IDENTIDAD MAZZOLA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#DFD9CD] border border-[#CCC4B4] rounded-xl p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <Sliders className="text-orange-600" />
              Catálogos y Base Técnica Oficial
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-stone-900 border border-amber-600">
              FASE 2: MULTI-FABRICANTE
            </span>
          </div>
          <p className="text-stone-700 text-xs mt-1">
            Gestión desacoplada de fabricantes (MDT, Aluar, Flamia, Hydro). Procesamiento seguro por páginas y resguardo histórico de datos originales.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMostrarModalNuevoCatalogo(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Plus size={15} strokeWidth={2.5} />
            Cargar Catálogo PDF
          </button>
          <button
            onClick={() => setMostrarModalNuevaMarca(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#EFECE4] hover:bg-stone-200 border border-[#CCC4B4] text-stone-800 font-bold text-xs transition-colors"
          >
            <Building2 size={14} />
            + Fabricante
          </button>
          <button
            onClick={() => setMostrarModalNuevaLinea(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#EFECE4] hover:bg-stone-200 border border-[#CCC4B4] text-stone-800 font-bold text-xs transition-colors"
          >
            <FolderTree size={14} />
            + Línea/Sistema
          </button>
        </div>
      </div>

      {/* REGLA DE ORO TÉCNICA MAZZOLA */}
      <div className="bg-amber-500/15 border-2 border-amber-600/50 rounded-xl p-4 flex items-start gap-3 shadow-xs">
        <ShieldAlert size={24} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-stone-800 space-y-1">
          <span className="font-black text-amber-950 block uppercase tracking-wider text-[11px]">
            Protocolo Técnico Estricto Mazzola: Sin Datos Inventados
          </span>
          <p className="leading-relaxed">
            <strong>1.</strong> Todo perfil, código, corte, fórmula o mecanizado debe provenir de un catálogo técnico verificado o de una modificación autorizada por Mazzola.
            <br />
            <strong>2.</strong> Si no hay catálogo aprobado para una línea: se muestra <strong>"NO HAY TIPOLOGÍAS DISPONIBLES"</strong>.
            <br />
            <strong>3.</strong> Si falta información técnica en el manual: se marca <strong>"Información técnica no disponible"</strong> y se deriva a verificación humana en pañol.
            <br />
            <strong>4.</strong> Toda modificación manual de Mazzola conserva intacto el <strong>dato original del fabricante</strong> para auditoría.
          </p>
        </div>
      </div>

      {/* BARRA DE NAVEGACIÓN DE SECCIONES TÉCNICAS */}
      <div className="flex flex-wrap items-center gap-1 bg-[#EBE7DE] border border-[#CCC4B4] p-1.5 rounded-xl">
        <button
          onClick={() => setSeccionActiva('catalogos')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all ${
            seccionActiva === 'catalogos'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-700 hover:bg-[#DFD9CD]'
          }`}
        >
          <FileText size={15} />
          Catálogos y Documentos
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-bold">
            {catalogos.length}
          </span>
        </button>

        <button
          onClick={() => setSeccionActiva('marcas_lineas')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all ${
            seccionActiva === 'marcas_lineas'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-700 hover:bg-[#DFD9CD]'
          }`}
        >
          <Building2 size={15} />
          Fabricantes y Líneas
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-300 text-stone-800 font-bold">
            {marcas.length} marcas / {lineas.length} líneas
          </span>
        </button>

        <button
          onClick={() => setSeccionActiva('tipologias')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all ${
            seccionActiva === 'tipologias'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-700 hover:bg-[#DFD9CD]'
          }`}
        >
          <FolderTree size={15} />
          Tipologías y Variantes
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-300 text-stone-800 font-bold">
            {tipologias.length}
          </span>
        </button>

        <button
          onClick={() => setSeccionActiva('perfiles_reglas')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all ${
            seccionActiva === 'perfiles_reglas'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-700 hover:bg-[#DFD9CD]'
          }`}
        >
          <Wrench size={15} />
          Perfiles y Fórmulas de Corte
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-300 text-stone-800 font-bold">
            {perfiles.length} perfiles / {reglas.length} reglas
          </span>
        </button>

        <button
          onClick={() => setSeccionActiva('revision')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all ${
            seccionActiva === 'revision'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-700 hover:bg-[#DFD9CD]'
          }`}
        >
          <ShieldCheck size={15} />
          Centro de Revisión Humana
          {itemsPendientesRevision.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-black animate-pulse">
              {itemsPendientesRevision.length}
            </span>
          )}
        </button>
      </div>

      {/* FILTROS GLOBALES RÁPIDOS */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#FAF8F5] border border-[#D5CEC2] p-3 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Buscar por código, nombre, tipología o catálogo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-900 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] font-bold text-stone-600 shrink-0">Fabricante:</span>
          <select
            value={marcaFiltro}
            onChange={(e) => {
              setMarcaFiltro(e.target.value);
              setLineaFiltro('todas');
            }}
            className="bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900 outline-none"
          >
            <option value="todas">Todos los fabricantes</option>
            {marcas.map(m => (
              <option key={m.id} value={m.id}>{m.nombre} ({m.codigo || 'S/C'})</option>
            ))}
          </select>

          <span className="text-[11px] font-bold text-stone-600 shrink-0">Línea:</span>
          <select
            value={lineaFiltro}
            onChange={(e) => setLineaFiltro(e.target.value)}
            className="bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900 outline-none"
          >
            <option value="todas">Todas las líneas</option>
            {lineas
              .filter(l => marcaFiltro === 'todas' || l.marcaId === marcaFiltro)
              .map(l => (
                <option key={l.id} value={l.id}>{l.nombre} - {l.marcaNombre}</option>
              ))}
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN 1: CATÁLOGOS Y DOCUMENTOS (PROCESAMIENTO CHUNKS) */}
      {/* ======================================================== */}
      {seccionActiva === 'catalogos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalogosFiltrados.map((cat) => {
              const estaAprobado = cat.estado === 'Aprobado';
              const estaProcesando = cat.estado === 'Procesando';
              const esRevisionPendiente = cat.estado === 'Revisión Pendiente';
              const estaDesactivado = cat.estado === 'Desactivado';
              const progreso = cat.progresoProcesamiento || { porcentaje: 0, paginaActual: 0, totalPaginas: cat.totalPaginas };

              return (
                <div
                  key={cat.id}
                  className={`bg-[#FAF8F5] border rounded-xl p-5 space-y-4 transition-all shadow-xs ${
                    estaAprobado
                      ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                      : esRevisionPendiente
                      ? 'border-amber-500/50'
                      : estaDesactivado
                      ? 'border-stone-300 opacity-70'
                      : 'border-[#CCC4B4]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-stone-200 text-stone-800 border border-stone-300">
                          {cat.marcaNombre}
                        </span>
                        {cat.lineaNombre && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            {cat.lineaNombre}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                            estaAprobado
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : esRevisionPendiente
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : estaProcesando
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {estaAprobado && <CheckCircle2 size={11} />}
                          {esRevisionPendiente && <AlertTriangle size={11} />}
                          {cat.estado}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-stone-900 mt-1.5">
                        {cat.titulo}
                      </h3>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5 flex items-center gap-1">
                        <FileText size={12} />
                        Archivo original: {cat.nombreArchivoOriginal}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-stone-700 block">
                        {cat.totalPaginas} páginas
                      </span>
                      <span className="text-[10px] text-stone-500">
                        Cargado {new Date(cat.fechaCarga).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {/* BARRA DE PROCESAMIENTO POR CHUNKS */}
                  <div className="bg-[#EFECE4] border border-[#DDD6C8] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-stone-800 flex items-center gap-1.5">
                        <Cpu size={14} className="text-orange-600" />
                        Procesamiento por Bloques / Chunks:
                      </span>
                      <span className="text-stone-900 font-black font-mono">
                        {progreso.porcentaje}% ({progreso.paginaActual} / {progreso.totalPaginas} págs)
                      </span>
                    </div>

                    {/* Barra visual */}
                    <div className="w-full h-2 bg-stone-300 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          progreso.porcentaje >= 100 ? 'bg-emerald-600' : 'bg-orange-600'
                        }`}
                        style={{ width: `${progreso.porcentaje}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-stone-600 font-mono">
                      <strong>Checkpoint:</strong> {progreso.checkpoint || 'Sin iniciar'}
                    </div>

                    {/* Advertencias de páginas marcadas para revisión humana (No inventar datos) */}
                    {cat.paginasParaRevision && cat.paginasParaRevision.length > 0 && (
                      <div className="mt-2 bg-amber-50 border border-amber-300 rounded-lg p-2.5 space-y-1">
                        <span className="text-[11px] font-black text-amber-900 flex items-center gap-1">
                          <AlertTriangle size={13} className="text-amber-700" />
                          {cat.paginasParaRevision.length} página(s) marcadas para revisión humana:
                        </span>
                        {cat.paginasParaRevision.map((p, idx) => (
                          <div key={idx} className="text-[10px] text-stone-700 pl-4">
                            • <strong>Pág {p.pagina}:</strong> {p.motivo} ({p.observaciones || 'Pendiente'})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ESTADÍSTICAS TÉCNICAS */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-[#EBE7DE] rounded-lg p-2">
                      <span className="text-[10px] font-bold text-stone-600 block">Tipologías</span>
                      <span className="font-black text-stone-900">{cat.cantidadTipologias || 0}</span>
                    </div>
                    <div className="bg-[#EBE7DE] rounded-lg p-2">
                      <span className="text-[10px] font-bold text-stone-600 block">Perfiles</span>
                      <span className="font-black text-stone-900">{cat.cantidadPerfiles || 0}</span>
                    </div>
                    <div className="bg-[#EBE7DE] rounded-lg p-2">
                      <span className="text-[10px] font-bold text-stone-600 block">Fórmulas Corte</span>
                      <span className="font-black text-stone-900">{cat.cantidadReglas || 0}</span>
                    </div>
                  </div>

                  {/* NOTAS DE HOMOLOGACIÓN */}
                  {cat.notasRevision && (
                    <div className="p-2.5 rounded-lg bg-[#EFECE4] text-[11px] text-stone-700 border border-stone-300 italic">
                      <strong>Dictamen Mazzola:</strong> {cat.notasRevision}
                      {cat.revisadoPor && ` — Homologó: ${cat.revisadoPor}`}
                    </div>
                  )}

                  {/* BOTONES DE ACCIÓN */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E5DFD3]">
                    <div className="flex items-center gap-2">
                      {progreso.porcentaje < 100 ? (
                        <button
                          onClick={() => handleProcesarChunk(cat.id)}
                          disabled={procesandoId === cat.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                        >
                          <RotateCw size={13} className={procesandoId === cat.id ? 'animate-spin' : ''} />
                          Procesar Siguiente Bloque (8 Págs)
                        </button>
                      ) : !estaAprobado ? (
                        <button
                          onClick={() => handleAprobarCatalogo(cat.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                        >
                          <CheckCircle2 size={13} />
                          Homologar y Aprobar
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          Catálogo Oficial Habilitado
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-stone-500 font-medium">
                      Estado: <strong>{cat.estadoRevision}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECCIÓN 2: FABRICANTES Y LÍNEAS / SISTEMAS               */}
      {/* ======================================================== */}
      {seccionActiva === 'marcas_lineas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MARCAS */}
            <div className="lg:col-span-1 bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-2">
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                  <Building2 size={16} className="text-orange-600" />
                  Fabricantes / Marcas
                </h3>
                <button
                  onClick={() => setMostrarModalNuevaMarca(true)}
                  className="text-xs font-bold text-orange-700 hover:text-orange-900"
                >
                  + Agregar
                </button>
              </div>

              <div className="space-y-2.5">
                {marcas.map(m => (
                  <div key={m.id} className="bg-[#EFECE4] border border-[#CCC4B4] rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-stone-900 text-xs">{m.nombre}</span>
                      <span className="text-[10px] font-mono bg-stone-300 px-1.5 py-0.5 rounded font-bold">
                        {m.codigo || 'SIN CÓDIGO'}
                      </span>
                    </div>
                    {m.descripcion && (
                      <p className="text-[11px] text-stone-600">{m.descripcion}</p>
                    )}
                    <div className="text-[10px] text-stone-500 pt-1">
                      {lineas.filter(l => l.marcaId === m.id).length} línea(s) registrada(s)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LÍNEAS / SISTEMAS (NO FUSIONAR SISTEMAS DISTINTOS) */}
            <div className="lg:col-span-2 bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-2">
                <div>
                  <h3 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                    <FolderTree size={16} className="text-orange-600" />
                    Líneas y Sistemas de Carpintería
                  </h3>
                  <p className="text-[11px] text-stone-600">
                    Regla Mazzola: no fusionar sistemas diferentes solo porque sus nombres se parezcan.
                  </p>
                </div>
                <button
                  onClick={() => setMostrarModalNuevaLinea(true)}
                  className="text-xs font-bold text-orange-700 hover:text-orange-900"
                >
                  + Nueva Línea
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lineasFiltradas.map(linea => {
                  const catalogoAsociado = catalogos.find(c => c.id === linea.catalogoId || c.lineaId === linea.id);
                  const estaAprobado = catalogoAsociado?.estado === 'Aprobado';

                  return (
                    <div
                      key={linea.id}
                      className={`bg-[#EFECE4] border rounded-xl p-3.5 space-y-2 ${
                        estaAprobado ? 'border-emerald-500/40' : 'border-[#CCC4B4]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-orange-700">
                            {linea.marcaNombre}
                          </span>
                          <h4 className="text-sm font-black text-stone-900">{linea.nombre}</h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            linea.estado === 'Activo'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {linea.estado}
                        </span>
                      </div>

                      {linea.descripcion && (
                        <p className="text-[11px] text-stone-600 leading-relaxed">{linea.descripcion}</p>
                      )}

                      {/* ALIAS (Para no fusionar con otros sistemas parecidos) */}
                      {(() => {
                        const aliasList = Array.isArray(linea.alias)
                          ? linea.alias
                          : typeof linea.alias === 'string'
                            ? (linea.alias as string).split(',').map(a => a.trim()).filter(Boolean)
                            : [];
                        if (aliasList.length === 0) return null;
                        return (
                          <div className="text-[11px]">
                            <span className="font-bold text-stone-700 block text-[10px]">Alias reconocidos:</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {aliasList.map((a, i) => (
                                <span key={i} className="px-1.5 py-0.2 bg-stone-300 text-stone-800 rounded text-[10px] font-mono">
                                  {a}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="pt-2 border-t border-[#DDD6C8] flex items-center justify-between text-[11px]">
                        <span className="text-stone-600">
                          Catálogo:{' '}
                          {catalogoAsociado ? (
                            <strong className={estaAprobado ? 'text-emerald-800' : 'text-amber-800'}>
                              {catalogoAsociado.titulo} ({catalogoAsociado.estado})
                            </strong>
                          ) : (
                            <em className="text-rose-700 font-bold">Sin catálogo oficial</em>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECCIÓN 3: TIPOLOGÍAS Y VARIANTES                        */}
      {/* ======================================================== */}
      {seccionActiva === 'tipologias' && (
        <div className="space-y-4">
          <div className="bg-stone-100 border border-stone-300 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-stone-800 font-medium">
              Mostrando tipologías cargadas. Si la línea no cuenta con catálogo aprobado, se prohíbe inventar tipologías.
            </span>
            <span className="text-stone-600 font-mono text-[11px]">
              Total: {tipologiasFiltradas.length} tipología(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tipologiasFiltradas.map(tip => {
              const catAsociado = catalogos.find(c => c.id === tip.catalogoId);
              const catAprobado = catAsociado?.estado === 'Aprobado';
              const vars = variantes.filter(v => v.tipologiaId === tip.id);
              const comps = componentes.filter(c => c.tipologiaId === tip.id);
              const regs = reglas.filter(r => r.tipologiaId === tip.id);

              return (
                <div
                  key={tip.id}
                  className={`bg-[#FAF8F5] border rounded-xl p-4.5 space-y-3 shadow-xs ${
                    tip.modificadoPorMazzola
                      ? 'border-amber-500/60 ring-1 ring-amber-500/20'
                      : 'border-[#CCC4B4]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black bg-stone-200 text-stone-800 px-2 py-0.5 rounded">
                          {tip.marcaNombre} / {tip.lineaNombre}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                          Pág {tip.paginaOrigen} de Catálogo
                        </span>
                        {tip.modificadoPorMazzola && (
                          <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                            <Edit3 size={10} /> Modificado por Mazzola
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-black text-stone-900 mt-1">
                        {tip.nombre}
                      </h4>
                      {tip.codigo && (
                        <span className="text-[11px] font-mono text-stone-600">Código Oficial: {tip.codigo}</span>
                      )}
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tip.estadoRevision === 'Aprobado'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {tip.estadoRevision}
                      </span>
                    </div>
                  </div>

                  {tip.descripcion && (
                    <p className="text-xs text-stone-600 leading-relaxed">{tip.descripcion}</p>
                  )}

                  {/* RESGUARDO HISTÓRICO: DATO ORIGINAL VS MODIFICACIÓN MAZZOLA */}
                  {tip.modificadoPorMazzola && tip.datoOriginal && (
                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-xs space-y-1">
                      <span className="font-bold text-amber-900 block text-[11px]">
                        Resguardo de Dato Original de Catálogo:
                      </span>
                      <div className="text-[11px] text-stone-700">
                        <strong>Original:</strong> "{tip.datoOriginal.nombre}" (Pág {tip.datoOriginal.paginaOrigen})
                      </div>
                      {tip.notasMazzola && (
                        <div className="text-[11px] text-amber-800 italic">
                          <strong>Nota Mazzola:</strong> {tip.notasMazzola}
                        </div>
                      )}
                    </div>
                  )}

                  {/* COMPONENTES / FUNCIONES VINCULADAS */}
                  <div className="space-y-1.5 pt-2 border-t border-[#E5DFD3]">
                    <span className="text-[11px] font-bold text-stone-800 block">
                      Componentes / Funciones de esta Tipología:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {comps.map(comp => (
                        <div key={comp.id} className="bg-[#EFECE4] border border-[#DDD6C8] rounded p-1.5 text-[11px]">
                          <span className="font-bold text-stone-800 block">{comp.funcion}</span>
                          <span className="text-stone-600 text-[10px]">Perfil cód: <strong>{comp.perfilCodigo || 'S/C'}</strong></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* VARIANTES VINCULADAS */}
                  {vars.length > 0 && (
                    <div className="text-xs">
                      <span className="font-bold text-stone-800 text-[11px] block">Variantes de Catálogo:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {vars.map(v => (
                          <span key={v.id} className="bg-stone-200 text-stone-800 px-2 py-0.5 rounded text-[10px] font-medium">
                            {v.nombre} (Pág {v.paginaOrigen})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#E5DFD3] flex items-center justify-between text-xs">
                    <span className="text-stone-600 text-[11px]">
                      {regs.length} regla(s) de corte asociada(s)
                    </span>
                    <button
                      onClick={() => {
                        setItemRevision({ tipo: 'tipologia', item: tip });
                        setMostrarModalRevision(true);
                      }}
                      className="text-orange-700 hover:text-orange-900 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Edit3 size={12} />
                      Ajustar / Revisar por Mazzola
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECCIÓN 4: PERFILES Y FÓRMULAS DE CORTE                  */}
      {/* ======================================================== */}
      {seccionActiva === 'perfiles_reglas' && (
        <div className="space-y-6">
          {/* TABLA DE PERFILES CON CÓDIGOS OFICIALES */}
          <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-2">
              <div>
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                  <Wrench size={16} className="text-orange-600" />
                  Perfiles Oficiales de Catálogo (Sin Códigos Inventados)
                </h3>
                <p className="text-[11px] text-stone-600">
                  Todo perfil incluye código exacto de matriz, función física, largo comercial y peso por metro.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#EBE7DE] text-stone-800 font-black text-[11px] border-b border-[#D5CEC2]">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Fabricante / Línea</th>
                    <th className="py-2.5 px-3">Nombre y Función</th>
                    <th className="py-2.5 px-3">Largo</th>
                    <th className="py-2.5 px-3">Peso</th>
                    <th className="py-2.5 px-3">Pág</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5DC]">
                  {perfiles.map(perf => (
                    <tr key={perf.id} className="hover:bg-[#F2EFE8]">
                      <td className="py-2 px-3 font-mono font-black text-stone-900">
                        {perf.codigo}
                      </td>
                      <td className="py-2 px-3 font-bold text-stone-700">
                        {perf.marcaNombre} - {perf.lineaNombre}
                      </td>
                      <td className="py-2 px-3">
                        <strong className="text-stone-900 block">{perf.nombre}</strong>
                        <span className="text-[11px] text-stone-600">{perf.funcion}</span>
                      </td>
                      <td className="py-2 px-3 font-mono">{perf.largoComercial ? `${perf.largoComercial}m` : '-'}</td>
                      <td className="py-2 px-3 font-mono">{perf.pesoPorMetro ? `${perf.pesoPorMetro} kg/m` : '-'}</td>
                      <td className="py-2 px-3 font-mono text-amber-800 font-bold">Pág {perf.paginaOrigen}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                          {perf.estadoRevision}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => {
                            setItemRevision({ tipo: 'perfil', item: perf });
                            setMostrarModalRevision(true);
                          }}
                          className="text-orange-700 hover:text-orange-900 font-bold text-[11px]"
                        >
                          Revisar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA DE REGLAS Y FÓRMULAS DE CORTE REALES */}
          <div className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl p-4 space-y-3 shadow-xs">
            <div className="border-b border-[#E5DFD3] pb-2">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                <Sliders size={16} className="text-orange-600" />
                Fórmulas de Corte y Mecanizados (Guardadas como Datos de Catálogo)
              </h3>
              <p className="text-[11px] text-stone-600">
                Las fórmulas son datos exactos documentados (ej: <code>A</code>, <code>H - 42</code>, <code>(A / 2) + 6</code>).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#EBE7DE] text-stone-800 font-black text-[11px] border-b border-[#D5CEC2]">
                    <th className="py-2.5 px-3">Tipología</th>
                    <th className="py-2.5 px-3">Componente</th>
                    <th className="py-2.5 px-3">Perfil Cód</th>
                    <th className="py-2.5 px-3">Cant</th>
                    <th className="py-2.5 px-3">Fórmula Corte</th>
                    <th className="py-2.5 px-3">Cortes A/B</th>
                    <th className="py-2.5 px-3">Orientación</th>
                    <th className="py-2.5 px-3">Mecanizado</th>
                    <th className="py-2.5 px-3">Pág</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5DC]">
                  {reglas.map(reg => (
                    <tr key={reg.id} className="hover:bg-[#F2EFE8]">
                      <td className="py-2 px-3 font-bold text-stone-900">
                        {reg.tipologiaNombre}
                      </td>
                      <td className="py-2 px-3 text-stone-800">{reg.funcionNombre}</td>
                      <td className="py-2 px-3 font-mono font-bold text-stone-900">{reg.perfilCodigo}</td>
                      <td className="py-2 px-3 font-mono font-bold">{reg.cantidad}</td>
                      <td className="py-2 px-3 font-mono font-black text-orange-700 bg-amber-50 rounded">
                        {reg.formula}
                      </td>
                      <td className="py-2 px-3 font-mono">{reg.corteA} / {reg.corteB}</td>
                      <td className="py-2 px-3">{reg.orientacion}</td>
                      <td className="py-2 px-3 text-[11px] text-stone-600">{reg.mecanizado || '-'}</td>
                      <td className="py-2 px-3 font-mono text-amber-800 font-bold">Pág {reg.paginaOrigen}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => {
                            setItemRevision({ tipo: 'regla', item: reg });
                            setMostrarModalRevision(true);
                          }}
                          className="text-orange-700 hover:text-orange-900 font-bold text-[11px]"
                        >
                          Revisar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECCIÓN 5: CENTRO DE REVISIÓN Y VALIDACIÓN HUMANA        */}
      {/* ======================================================== */}
      {seccionActiva === 'revision' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck size={24} className="text-amber-700 shrink-0" />
            <div className="text-xs space-y-1">
              <span className="font-black text-amber-950 text-sm block">
                Bandeja de Homologación y Validación Técnica
              </span>
              <p className="text-stone-700">
                Aquí se concentran los catálogos en revisión, las páginas con advertencias y los ítems modificados por Mazzola.
                Esto garantiza que ningún dato dudoso se aplique a producción sin el consentimiento explícito del taller.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {itemsPendientesRevision.length === 0 ? (
              <div className="bg-[#FAF8F5] border border-[#CCC4B4] rounded-xl p-8 text-center space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
                <h4 className="font-black text-stone-900 text-sm">No hay ítems pendientes de revisión</h4>
                <p className="text-xs text-stone-600">
                  Todos los catálogos, tipologías y fórmulas han sido formalmente homologados y verificados.
                </p>
              </div>
            ) : (
              itemsPendientesRevision.map((elem, idx) => (
                <div key={idx} className="bg-[#FAF8F5] border border-[#CCC4B4] rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    {elem.tipo === 'pagina_dudosa' ? (
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                          Página Dudosa - Manual {(elem as any).catalogo?.titulo}
                        </span>
                        <h4 className="text-xs font-black text-stone-900">
                          Página {(elem as any).pagina?.pagina}: {(elem as any).pagina?.motivo}
                        </h4>
                        <p className="text-[11px] text-stone-600">
                          Observación técnica: {(elem as any).pagina?.observaciones}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                          {elem.tipo}
                        </span>
                        <h4 className="text-xs font-black text-stone-900">
                          {(elem as any).item?.nombre || (elem as any).item?.titulo}
                        </h4>
                        <p className="text-[11px] text-stone-600">
                          Estado: {(elem as any).item?.estadoRevision || (elem as any).item?.estado}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (elem.tipo === 'catalogo') {
                        handleAprobarCatalogo((elem as any).item.id);
                      } else {
                        setItemRevision({ tipo: (elem as any).tipo, item: (elem as any).item });
                        setMostrarModalRevision(true);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs shrink-0 shadow-xs"
                  >
                    Examinar y Dictaminar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CARGAR NUEVO CATÁLOGO                             */}
      {/* ======================================================== */}
      {mostrarModalNuevoCatalogo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FAF8F5] border-2 border-orange-600/50 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DDD6C8] pb-3">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <FileText className="text-orange-600" />
                Cargar Nuevo Catálogo Técnico (PDF)
              </h3>
              <button onClick={() => setMostrarModalNuevoCatalogo(false)} className="text-stone-500 hover:text-stone-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevoCatalogo} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-800 block mb-1">Título del Catálogo / Edición *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Manual de Fabricación Aluar Módena 2026"
                  value={nuevoCatTitulo}
                  onChange={(e) => setNuevoCatTitulo(e.target.value)}
                  className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-3 py-2 text-stone-900 font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">Fabricante / Marca *</label>
                  <select
                    required
                    value={nuevoCatMarcaId}
                    onChange={(e) => {
                      setNuevoCatMarcaId(e.target.value);
                      setNuevoCatLineaId('');
                    }}
                    className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-3 py-2 text-stone-900 font-bold outline-none"
                  >
                    <option value="">-- Seleccionar --</option>
                    {marcas.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">Línea o Sistema</label>
                  <select
                    value={nuevoCatLineaId}
                    onChange={(e) => setNuevoCatLineaId(e.target.value)}
                    className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-3 py-2 text-stone-900 outline-none"
                  >
                    <option value="">-- General / Multi-línea --</option>
                    {lineas
                      .filter(l => !nuevoCatMarcaId || l.marcaId === nuevoCatMarcaId)
                      .map(l => (
                        <option key={l.id} value={l.id}>{l.nombre}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">Nombre Archivo Original</label>
                  <input
                    type="text"
                    placeholder="archivo_oficial.pdf"
                    value={nuevoCatArchivo}
                    onChange={(e) => setNuevoCatArchivo(e.target.value)}
                    className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-3 py-2 text-stone-900 outline-none font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">Total de Páginas</label>
                  <input
                    type="number"
                    min="1"
                    value={nuevoCatPaginas}
                    onChange={(e) => setNuevoCatPaginas(Number(e.target.value))}
                    className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-3 py-2 text-stone-900 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-stone-700">
                El archivo se registrará en estado <strong>Cargado</strong> y se procesará en bloques (chunks) de 8 páginas con verificación de checkpoints y resguardo del nombre original.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#DDD6C8]">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevoCatalogo(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-300 text-stone-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  Registrar Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NUEVA MARCA                                       */}
      {/* ======================================================== */}
      {mostrarModalNuevaMarca && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FAF8F5] border-2 border-orange-600/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DDD6C8] pb-3">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Building2 className="text-orange-600" />
                Registrar Nuevo Fabricante / Marca
              </h3>
              <button onClick={() => setMostrarModalNuevaMarca(false)} className="text-stone-500 hover:text-stone-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevaMarca} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-800 block mb-1">Nombre de la Marca / Fabricante *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Hydro, Flamia, Alcemar, etc."
                  value={nuevaMarcaNombre}
                  onChange={(e) => setNuevaMarcaNombre(e.target.value)}
                  className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-3 py-2 text-stone-900 font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Código Abreviado (Opcional)</label>
                <input
                  type="text"
                  placeholder="ej: HYD, FLA, ALU"
                  value={nuevaMarcaCodigo}
                  onChange={(e) => setNuevaMarcaCodigo(e.target.value)}
                  className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-3 py-2 text-stone-900 font-mono outline-none uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Descripción / Planta / Contacto</label>
                <textarea
                  rows={2}
                  placeholder="Notas de homologación de matrices..."
                  value={nuevaMarcaDesc}
                  onChange={(e) => setNuevaMarcaDesc(e.target.value)}
                  className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-3 py-2 text-stone-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#DDD6C8]">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevaMarca(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-300 text-stone-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  Guardar Marca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NUEVA LÍNEA / SISTEMA                             */}
      {/* ======================================================== */}
      {mostrarModalNuevaLinea && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FAF8F5] border-2 border-orange-600/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DDD6C8] pb-3">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <FolderTree className="text-orange-600" />
                Registrar Nueva Línea / Sistema
              </h3>
              <button onClick={() => setMostrarModalNuevaLinea(false)} className="text-stone-500 hover:text-stone-800">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevaLinea} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-800 block mb-1">Fabricante / Marca *</label>
                <select
                  required
                  value={nuevaLineaMarcaId}
                  onChange={(e) => setNuevaLineaMarcaId(e.target.value)}
                  className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-3 py-2 text-stone-900 font-bold outline-none"
                >
                  <option value="">-- Seleccionar --</option>
                  {marcas.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Nombre Oficial del Sistema *</label>
                <input
                  type="text"
                  required
                  placeholder="ej: HA 62, Modena RPT, Serie 20, etc."
                  value={nuevaLineaNombre}
                  onChange={(e) => setNuevaLineaNombre(e.target.value)}
                  className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-3 py-2 text-stone-900 font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Alias reconocidos (separados por coma)</label>
                <input
                  type="text"
                  placeholder="ej: HA62, HA-62 Corrediza"
                  value={nuevaLineaAlias}
                  onChange={(e) => setNuevaLineaAlias(e.target.value)}
                  className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-3 py-2 text-stone-900 outline-none"
                />
                <span className="text-[10px] text-stone-500">Ayuda a no fusionar sistemas diferentes que se llamen parecido.</span>
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1">Descripción Técnica</label>
                <textarea
                  rows={2}
                  placeholder="Prestación, tipo de corte, escuadras..."
                  value={nuevaLineaDesc}
                  onChange={(e) => setNuevaLineaDesc(e.target.value)}
                  className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg px-3 py-2 text-stone-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#DDD6C8]">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevaLinea(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-300 text-stone-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  Guardar Línea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REVISIÓN HUMANA (PRESERVA DATO ORIGINAL)          */}
      {/* ======================================================== */}
      {mostrarModalRevision && itemRevision && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FAF8F5] border-2 border-amber-600/60 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DDD6C8] pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 px-2 py-0.5 rounded">
                  Revisión Técnica Mazzola
                </span>
                <h3 className="text-base font-black text-stone-900 mt-1">
                  Revisar {itemRevision.tipo.toUpperCase()}: {itemRevision.item.nombre || itemRevision.item.perfilNombre || itemRevision.item.funcionNombre}
                </h3>
              </div>
              <button onClick={() => setMostrarModalRevision(false)} className="text-stone-500 hover:text-stone-800">
                <X size={18} />
              </button>
            </div>

            <div className="bg-[#EFECE4] border border-[#CCC4B4] rounded-xl p-3.5 text-xs space-y-2">
              <span className="font-bold text-stone-900 block text-[11px]">Dato de Catálogo Original:</span>
              <pre className="text-[10px] bg-stone-200 p-2 rounded overflow-x-auto text-stone-800 font-mono">
                {JSON.stringify(itemRevision.item.datoOriginal || itemRevision.item, null, 2)}
              </pre>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-stone-800 block">Dictamen del Operador ({operadorActual}):</label>
              <textarea
                id="notas-revision-taller"
                rows={2}
                placeholder="Indique motivo de ajuste o validación..."
                defaultValue={itemRevision.item.notasMazzola || ''}
                className="w-full bg-[#EFECE4] border border-[#C5BDAE] rounded-lg p-2.5 text-stone-900 outline-none"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-[11px] text-stone-700">
              Al dictaminar, el dato de origen del fabricante se mantiene intacto y se registra quién autorizó la modificación con sello de tiempo.
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#DDD6C8]">
              <button
                onClick={() => handleGuardarRevision('rechazar', {}, 'Rechazado en pañol por incongruencia técnica')}
                className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-900 font-bold text-xs hover:bg-rose-200"
              >
                Rechazar Ítem
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const notas = (document.getElementById('notas-revision-taller') as HTMLTextAreaElement)?.value;
                    handleGuardarRevision('modificar', {}, notas);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                >
                  Registrar Modificación Mazzola
                </button>
                <button
                  onClick={() => {
                    const notas = (document.getElementById('notas-revision-taller') as HTMLTextAreaElement)?.value;
                    handleGuardarRevision('aprobar', {}, notas);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  Aprobar Oficial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
