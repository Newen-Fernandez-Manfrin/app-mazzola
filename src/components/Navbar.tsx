import React from 'react';
import { 
  FileText, 
  Zap, 
  Wrench, 
  DollarSign,
  Users, 
  Sliders, 
  Hammer, 
  History, 
  LayoutDashboard,
  LogOut,
  Database,
  Download,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { SeccionPrincipal, Usuario } from '../types';

interface NavbarProps {
  seccionActiva: SeccionPrincipal;
  onCambiarSeccion: (seccion: SeccionPrincipal) => void;
  usuarioActual: Usuario | null;
  onCerrarSesion: () => void;
  onDescargarBackup: () => void;
  onMigrarDatosLocales?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  seccionActiva,
  onCambiarSeccion,
  usuarioActual,
  onCerrarSesion,
  onDescargarBackup,
  onMigrarDatosLocales
}) => {
  const [menuAbierto, setMenuAbierto] = React.useState(false);

  const secciones: { id: SeccionPrincipal; label: string; icon: React.ReactNode }[] = [
    { id: 'inicio', label: 'Inicio', icon: <LayoutDashboard size={17} /> },
    { id: 'presupuestos', label: 'Presupuestos', icon: <FileText size={17} /> },
    { id: 'ventas_rapidas', label: 'Venta rápida', icon: <Zap size={17} /> },
    { id: 'reparaciones', label: 'Reparaciones', icon: <Wrench size={17} /> },
    { id: 'precios', label: 'Precios', icon: <DollarSign size={17} /> },
    { id: 'clientes', label: 'Clientes', icon: <Users size={17} /> },
    { id: 'datos_tecnicos', label: 'Datos técnicos', icon: <Sliders size={17} /> },
    { id: 'fabrica', label: 'Fábrica', icon: <Hammer size={17} /> },
    { id: 'historial', label: 'Historial', icon: <History size={17} /> },
  ];

  return (
    <header className="bg-[#E2DDD4] border-b border-[#D0C9BD] sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Mazzola */}
          <div 
            id="nav-logo-brand" 
            onClick={() => onCambiarSeccion('inicio')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-xl shadow-xs border border-orange-400">
              M
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-stone-900 tracking-tight">ABERTURAS</span>
                <span className="font-black text-lg text-orange-600 tracking-wide">MAZZOLA</span>
              </div>
              <p className="text-[11px] font-medium text-stone-600 uppercase tracking-wider">
                Gestión de Taller y Fábrica
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            {secciones.map((sec) => {
              const activa = seccionActiva === sec.id;
              return (
                <button
                  key={sec.id}
                  id={`nav-btn-${sec.id}`}
                  onClick={() => onCambiarSeccion(sec.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                    activa
                      ? 'bg-amber-500/20 text-orange-800 border border-amber-600/30 font-bold shadow-xs'
                      : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/40'
                  }`}
                >
                  <span className={activa ? 'text-orange-600' : 'text-stone-600'}>
                    {sec.icon}
                  </span>
                  {sec.label}
                </button>
              );
            })}
          </nav>

          {/* Acciones de Base de datos, Usuario y Sesión */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Indicador Cloud SQL */}
            <div 
              title="Base de datos PostgreSQL en Cloud SQL conectada y persistente"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100/90 border border-emerald-300 text-emerald-800 text-[11px] font-bold"
            >
              <Database size={13} className="text-emerald-700" />
              <span>Cloud SQL</span>
            </div>

            {/* Botón de Backup */}
            <button
              id="nav-btn-backup"
              onClick={onDescargarBackup}
              title="Descargar copia de seguridad completa (JSON)"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-200/80 hover:bg-stone-300 border border-stone-300 text-stone-700 text-xs font-medium transition-colors"
            >
              <Download size={13} />
              <span>Backup</span>
            </button>

            {/* Usuario autenticado */}
            {usuarioActual && (
              <div className="flex items-center gap-2 bg-[#D8D2C5] px-3 py-1 rounded-lg border border-[#C5BDAE]">
                <UserCheck size={15} className="text-orange-700" />
                <div className="text-xs flex flex-col">
                  <span className="font-bold text-stone-900 leading-tight">
                    {usuarioActual.nombre || usuarioActual.usuario}
                  </span>
                  <span className="text-[10px] font-semibold text-orange-800 uppercase tracking-wider">
                    {usuarioActual.rol}
                  </span>
                </div>
              </div>
            )}

            {/* Botón Cerrar Sesión */}
            <button
              id="nav-btn-logout"
              onClick={onCerrarSesion}
              title="Cerrar sesión actual de forma segura"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-200/90 hover:bg-red-100 hover:border-red-300 hover:text-red-700 border border-stone-300 text-stone-700 text-xs font-semibold transition-colors"
            >
              <LogOut size={14} />
              <span>Salir</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              id="mobile-menu-toggle"
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="p-2 rounded-lg bg-stone-300/60 text-stone-800 hover:bg-stone-300 border border-stone-400/40"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuAbierto ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuAbierto && (
        <div className="xl:hidden border-t border-[#D0C9BD] bg-[#E2DDD4] px-4 py-3 space-y-2">
          {usuarioActual && (
            <div className="pb-2 border-b border-stone-300 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-stone-900">{usuarioActual.nombre}</p>
                <p className="text-[10px] text-orange-800 font-semibold uppercase">{usuarioActual.rol}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onDescargarBackup}
                  className="px-2 py-1 rounded bg-stone-200 text-xs text-stone-700 font-medium flex items-center gap-1"
                >
                  <Download size={12} />
                  <span>Backup</span>
                </button>
                <button
                  onClick={onCerrarSesion}
                  className="px-2 py-1 rounded bg-red-100 text-xs text-red-700 font-medium flex items-center gap-1"
                >
                  <LogOut size={12} />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {secciones.map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  onCambiarSeccion(sec.id);
                  setMenuAbierto(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                  seccionActiva === sec.id
                    ? 'bg-amber-500/20 text-orange-900 font-bold border border-amber-600/30'
                    : 'text-stone-700 hover:bg-stone-300/40'
                }`}
              >
                <span className={seccionActiva === sec.id ? 'text-orange-600' : 'text-stone-500'}>
                  {sec.icon}
                </span>
                {sec.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
