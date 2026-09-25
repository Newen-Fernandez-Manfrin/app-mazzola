import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Inicio } from './components/Inicio';
import { Presupuestos } from './components/Presupuestos';
import { VentaRapidaComponent } from './components/VentaRapidaComponent';
import { ReparacionesComponent } from './components/ReparacionesComponent';
import { ClientesComponent } from './components/ClientesComponent';
import { DatosTecnicosComponent } from './components/DatosTecnicosComponent';
import { FabricaComponent } from './components/FabricaComponent';
import { HistorialComponent } from './components/HistorialComponent';
import { ProductosComponent } from './components/ProductosComponent';
import { PresupuestoModal } from './components/PresupuestoModal';
import { LoginComponent } from './components/LoginComponent';
import { Database, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

import { 
  SeccionPrincipal, 
  Cliente, 
  Presupuesto, 
  VentaRapida, 
  Reparacion, 
  ProductoComercial,
  CatalogoTecnicoAprobado, 
  OrdenFabricacion, 
  EntradaHistorial,
  Usuario
} from './types';
import { mazzolaApi } from './services/api';

export default function App() {
  const [seccionActiva, setSeccionActiva] = useState<SeccionPrincipal>('inicio');
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(() => mazzolaApi.getStoredUser());
  const [operadorActual, setOperadorActual] = useState<string>(() => {
    const u = mazzolaApi.getStoredUser();
    return u ? u.nombre || u.usuario : 'Mazzola Administración';
  });

  // Estado global de datos persistentes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [ventasRapidas, setVentasRapidas] = useState<VentaRapida[]>([]);
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [productos, setProductos] = useState<ProductoComercial[]>([]);
  const [catalogosTecnicos, setCatalogosTecnicos] = useState<CatalogoTecnicoAprobado[]>([]);
  const [ordenesFabrica, setOrdenesFabrica] = useState<OrdenFabricacion[]>([]);
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estado de migración local
  const [migracionPendiente, setMigracionPendiente] = useState(false);
  const [mensajeMigracion, setMensajeMigracion] = useState<string | null>(null);

  // Modal de presupuesto global
  const [presupuestoModal, setPresupuestoModal] = useState<Presupuesto | null>(null);

  // Contexto para navegación directa a Fábrica
  const [contextoFabrica, setContextoFabrica] = useState<{ presupuestoId?: string; itemIndex?: number } | null>(null);

  const handleIrAFabrica = (presupuesto: Presupuesto) => {
    setContextoFabrica({ presupuestoId: presupuesto.id, itemIndex: 1 });
    setSeccionActiva('fabrica');
  };

  // Verificar si hay datos huérfanos en localStorage que requieran migración
  useEffect(() => {
    const locCli = localStorage.getItem('mazzola_clientes');
    const locPre = localStorage.getItem('mazzola_presupuestos');
    if (locCli || locPre) {
      setMigracionPendiente(true);
    }
  }, []);

  // Carga inicial de datos desde PostgreSQL
  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [
        cliData,
        preData,
        vrData,
        repData,
        prodData,
        catData,
        ordData,
        histData
      ] = await Promise.all([
        mazzolaApi.getClientes(),
        mazzolaApi.getPresupuestos(),
        mazzolaApi.getVentasRapidas(),
        mazzolaApi.getReparaciones(),
        mazzolaApi.getProductos(),
        mazzolaApi.getCatalogosTecnicos(),
        mazzolaApi.getOrdenesFabrica(),
        mazzolaApi.getHistorial()
      ]);

      setClientes(cliData);
      setPresupuestos(preData);
      setVentasRapidas(vrData);
      setReparaciones(repData);
      setProductos(prodData);
      setCatalogosTecnicos(catData);
      setOrdenesFabrica(ordData);
      setHistorial(histData);
    } catch (err) {
      console.error('Error al sincronizar datos con PostgreSQL:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (usuarioActual) {
      cargarDatos();
    }
  }, [usuarioActual]);

  const refrescarHistorial = async () => {
    try {
      const hist = await mazzolaApi.getHistorial();
      setHistorial(hist);
    } catch (err) {
      console.error(err);
    }
  };

  // Sesión y Login
  const handleLoginExitoso = (user: Usuario) => {
    setUsuarioActual(user);
    setOperadorActual(user.nombre || user.usuario);
  };

  const handleCerrarSesion = async () => {
    await mazzolaApi.logout();
    setUsuarioActual(null);
  };

  const handleDescargarBackup = async () => {
    try {
      await mazzolaApi.descargarBackup();
    } catch (err: any) {
      alert('Error descargando copia de seguridad: ' + err.message);
    }
  };

  const handleEjecutarMigracion = async () => {
    try {
      const res = await mazzolaApi.migrarDatosLocales();
      setMensajeMigracion(res.message);
      setMigracionPendiente(false);
      await cargarDatos();
    } catch (err: any) {
      alert('Error al migrar datos: ' + err.message);
    }
  };

  // CLIENTES HANDLERS
  const handleCrearCliente = async (clienteData: Omit<Cliente, 'id' | 'fechaCreacion'>) => {
    const nuevo = await mazzolaApi.createCliente(clienteData);
    setClientes([nuevo, ...clientes]);
    refrescarHistorial();
    return nuevo;
  };

  const handleEliminarCliente = async (id: string) => {
    await mazzolaApi.deleteCliente(id);
    setClientes(clientes.filter(c => c.id !== id));
  };

  // PRESUPUESTOS HANDLERS
  const handleGuardarPresupuesto = async (nuevoPres: Omit<Presupuesto, 'id' | 'numero' | 'fechaCreacion'>) => {
    const creado = await mazzolaApi.createPresupuesto(nuevoPres);
    setPresupuestos([creado, ...presupuestos]);
    const ords = await mazzolaApi.getOrdenesFabrica();
    setOrdenesFabrica(ords);
    refrescarHistorial();
    return creado;
  };

  const handleActualizarEstadoPresupuesto = async (id: string, nuevoEstado: Presupuesto['estado']) => {
    const actualizado = await mazzolaApi.updatePresupuesto(id, { 
      estado: nuevoEstado, 
      modificadoPor: operadorActual 
    });
    setPresupuestos(presupuestos.map(p => p.id === id ? actualizado : p));
    if (presupuestoModal && presupuestoModal.id === id) {
      setPresupuestoModal(actualizado);
    }
    refrescarHistorial();
  };

  // VENTAS RAPIDAS HANDLERS
  const handleGuardarVentaRapida = async (ventaData: Omit<VentaRapida, 'id' | 'numero' | 'fecha'>) => {
    const creada = await mazzolaApi.createVentaRapida(ventaData);
    setVentasRapidas([creada, ...ventasRapidas]);
    refrescarHistorial();
    return creada;
  };

  // REPARACIONES HANDLERS
  const handleGuardarReparacion = async (repData: Omit<Reparacion, 'id' | 'numero' | 'fecha'>) => {
    const creada = await mazzolaApi.createReparacion(repData);
    setReparaciones([creada, ...reparaciones]);
    refrescarHistorial();
    return creada;
  };

  const handleActualizarEstadoReparacion = async (id: string, nuevoEstado: Reparacion['estado']) => {
    const actualizada = await mazzolaApi.updateReparacion(id, {
      estado: nuevoEstado,
      modificadoPor: operadorActual
    });
    setReparaciones(reparaciones.map(r => r.id === id ? actualizada : r));
    refrescarHistorial();
  };

  // PRODUCTOS Y PRECIOS HANDLERS (FASE 5)
  const handleCrearProducto = async (prodData: Partial<ProductoComercial>) => {
    const creado = await mazzolaApi.createProducto(prodData);
    setProductos([creado, ...productos]);
    return creado;
  };

  const handleActualizarProducto = async (id: string, updates: Partial<ProductoComercial>) => {
    const actualizado = await mazzolaApi.updateProducto(id, updates);
    setProductos(productos.map(p => p.id === id ? actualizado : p));
    return actualizado;
  };

  const handleEliminarProducto = async (id: string) => {
    await mazzolaApi.deleteProducto(id);
    setProductos(productos.filter(p => p.id !== id));
  };

  // CATALOGOS TECNICOS HANDLERS
  const handleAgregarCatalogo = async (catData: CatalogoTecnicoAprobado) => {
    const creado = await mazzolaApi.createCatalogoTecnico(catData);
    setCatalogosTecnicos([...catalogosTecnicos, creado]);
    return creado;
  };

  // ORDENES FABRICA HANDLERS
  const handleActualizarEstadoOrdenFabrica = async (id: string, nuevoEstado: OrdenFabricacion['estadoFabrica']) => {
    const actualizada = await mazzolaApi.updateOrdenFabrica(id, {
      estadoFabrica: nuevoEstado
    });
    setOrdenesFabrica(ordenesFabrica.map(o => o.id === id ? actualizada : o));
  };

  // Si no está autenticado, mostrar pantalla de inicio de sesión
  if (!usuarioActual) {
    return <LoginComponent onLoginExitoso={handleLoginExitoso} />;
  }

  return (
    <div className="min-h-screen bg-[#EAE6DF] text-[#24211E] flex flex-col font-sans selection:bg-amber-500/30 selection:text-orange-950">
      {/* Barra de Navegación Principal */}
      <Navbar
        seccionActiva={seccionActiva}
        onCambiarSeccion={(sec) => setSeccionActiva(sec)}
        usuarioActual={usuarioActual}
        onCerrarSesion={handleCerrarSesion}
        onDescargarBackup={handleDescargarBackup}
        onMigrarDatosLocales={handleEjecutarMigracion}
      />

      {/* Banner de Migración de datos locales si existen */}
      {migracionPendiente && (
        <div className="bg-amber-500/15 border-b border-amber-400 px-4 py-2.5 text-xs text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-700 shrink-0" />
            <span>
              Se detectaron registros locales anteriores guardados en este navegador. ¿Desea migrarlos ahora a la base de datos PostgreSQL persistente?
            </span>
          </div>
          <button
            onClick={handleEjecutarMigracion}
            className="px-3 py-1 rounded bg-orange-600 hover:bg-orange-700 text-white font-bold shrink-0 cursor-pointer flex items-center gap-1 text-xs"
          >
            <span>Migrar a PostgreSQL</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {mensajeMigracion && (
        <div className="bg-emerald-100 border-b border-emerald-300 px-4 py-2 text-xs text-emerald-900 flex items-center gap-2 max-w-7xl mx-auto w-full">
          <CheckCircle2 size={16} className="text-emerald-700" />
          <span>{mensajeMigracion}</span>
        </div>
      )}

      {/* Contenido Principal de la Pantalla */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-600 space-y-3">
            <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Sincronizando Sistema Aberturas Mazzola con PostgreSQL...
            </span>
          </div>
        ) : (
          <>
            {seccionActiva === 'inicio' && (
              <Inicio
                onNavegar={(sec) => setSeccionActiva(sec)}
                presupuestos={presupuestos}
                ventasRapidas={ventasRapidas}
                reparaciones={reparaciones}
                clientes={clientes}
                onCrearPresupuesto={() => setSeccionActiva('presupuestos')}
                onCrearVentaRapida={() => setSeccionActiva('ventas_rapidas')}
                onCrearReparacion={() => setSeccionActiva('reparaciones')}
              />
            )}

            {seccionActiva === 'presupuestos' && (
              <Presupuestos
                presupuestos={presupuestos}
                clientes={clientes}
                operadorActual={operadorActual}
                onGuardarPresupuesto={handleGuardarPresupuesto}
                onActualizarEstado={handleActualizarEstadoPresupuesto}
                onCrearClienteRapido={(c) => handleCrearCliente({ ...c, creadoPor: operadorActual })}
                onIrAFabrica={handleIrAFabrica}
              />
            )}

            {seccionActiva === 'ventas_rapidas' && (
              <VentaRapidaComponent
                ventas={ventasRapidas}
                clientes={clientes}
                operadorActual={operadorActual}
                onGuardarVenta={handleGuardarVentaRapida}
              />
            )}

            {seccionActiva === 'reparaciones' && (
              <ReparacionesComponent
                reparaciones={reparaciones}
                clientes={clientes}
                operadorActual={operadorActual}
                onGuardarReparacion={handleGuardarReparacion}
                onActualizarEstado={handleActualizarEstadoReparacion}
              />
            )}

            {seccionActiva === 'precios' && (
              <ProductosComponent
                productos={productos}
                operadorActual={operadorActual}
                onCrearProducto={handleCrearProducto}
                onActualizarProducto={handleActualizarProducto}
                onEliminarProducto={handleEliminarProducto}
              />
            )}

            {seccionActiva === 'clientes' && (
              <ClientesComponent
                clientes={clientes}
                presupuestos={presupuestos}
                ventasRapidas={ventasRapidas}
                reparaciones={reparaciones}
                operadorActual={operadorActual}
                onCrearCliente={handleCrearCliente}
                onEliminarCliente={handleEliminarCliente}
                onVerPresupuesto={(p) => setPresupuestoModal(p)}
              />
            )}

            {seccionActiva === 'datos_tecnicos' && (
              <DatosTecnicosComponent
                operadorActual={operadorActual}
              />
            )}

            {seccionActiva === 'fabrica' && (
              <FabricaComponent
                ordenes={ordenesFabrica}
                presupuestos={presupuestos}
                onActualizarEstadoOrden={handleActualizarEstadoOrdenFabrica}
                onOrdenCreada={async () => {
                  const ords = await mazzolaApi.getOrdenesFabrica();
                  setOrdenesFabrica(ords);
                  refrescarHistorial();
                }}
                contextoInicial={contextoFabrica}
                onLimpiarContexto={() => setContextoFabrica(null)}
              />
            )}

            {seccionActiva === 'historial' && (
              <HistorialComponent
                historial={historial}
                presupuestos={presupuestos}
                ventasRapidas={ventasRapidas}
                reparaciones={reparaciones}
                onVerPresupuesto={(p) => setPresupuestoModal(p)}
              />
            )}
          </>
        )}
      </main>

      {/* Modal Global de Presupuesto */}
      <PresupuestoModal
        presupuesto={presupuestoModal}
        onCerrar={() => setPresupuestoModal(null)}
        onCambiarEstado={handleActualizarEstadoPresupuesto}
        onVerEnFabrica={handleIrAFabrica}
      />

      {/* Pie de página con identidad Mazzola y status de base de datos */}
      <footer className="bg-[#DFD8CC] border-t border-[#CCC4B4] py-4 px-6 text-center text-xs text-stone-600 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-stone-900">Aberturas Mazzola</span>
            <span>· Carpintería de Aluminio & Taller</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-stone-600">
            <span className="inline-flex items-center gap-1 text-emerald-800 font-bold">
              <Database size={12} />
              Base de Datos: PostgreSQL (Cloud SQL)
            </span>
            <span>·</span>
            <span>Autenticación Activa</span>
            <span>·</span>
            <button 
              onClick={handleDescargarBackup}
              className="text-orange-700 hover:underline font-bold cursor-pointer"
            >
              Exportar Copia de Seguridad
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
