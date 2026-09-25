import React, { useState } from 'react';
import { Lock, User, KeyRound, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { mazzolaApi } from '../services/api';
import { Usuario } from '../types';

interface LoginComponentProps {
  onLoginExitoso: (user: Usuario) => void;
}

export const LoginComponent: React.FC<LoginComponentProps> = ({ onLoginExitoso }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado del modal de recuperación segura de administrador
  const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);
  const [recupUsuario, setRecupUsuario] = useState('admin');
  const [recupClaveMaestra, setRecupClaveMaestra] = useState('');
  const [recupNuevaPassword, setRecupNuevaPassword] = useState('');
  const [recupConfirmarPassword, setRecupConfirmarPassword] = useState('');
  const [recupCargando, setRecupCargando] = useState(false);
  const [recupError, setRecupError] = useState<string | null>(null);
  const [recupExito, setRecupExito] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !password) {
      setError('Por favor complete usuario y contraseña.');
      return;
    }

    try {
      setCargando(true);
      setError(null);
      const res = await mazzolaApi.login(usuario.trim(), password);
      onLoginExitoso(res.user);
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas. Verifique usuario y contraseña.');
    } finally {
      setCargando(false);
    }
  };

  const handleRecuperarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecupError(null);
    setRecupExito(null);

    if (!recupUsuario.trim()) {
      setRecupError('Ingrese el nombre del usuario administrador.');
      return;
    }
    if (!recupClaveMaestra.trim()) {
      setRecupError('Ingrese la Clave Maestra de Recuperación del Sistema.');
      return;
    }
    if (!recupNuevaPassword || recupNuevaPassword.length < 6) {
      setRecupError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (recupNuevaPassword !== recupConfirmarPassword) {
      setRecupError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setRecupCargando(true);
      const res = await mazzolaApi.recuperarPasswordAdmin(
        recupUsuario.trim(),
        recupClaveMaestra.trim(),
        recupNuevaPassword
      );
      setRecupExito(res.message || 'Contraseña de administrador actualizada correctamente.');
      // Pre-cargar el usuario en el formulario principal
      setUsuario(recupUsuario.trim());
      setPassword('');
      // Limpiar datos sensibles del formulario de recuperación
      setRecupClaveMaestra('');
      setRecupNuevaPassword('');
      setRecupConfirmarPassword('');
    } catch (err: any) {
      setRecupError(err.message || 'No se pudo restablecer la contraseña. Verifique la clave maestra.');
    } finally {
      setRecupCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDE8DE] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-[#FAF7F2] rounded-2xl border border-[#D5CEC2] shadow-xl p-8 sm:p-10 space-y-7">
        
        {/* Encabezado MAZZOLA */}
        <div className="text-center space-y-2">
          <h1 className="font-black text-3xl sm:text-4xl text-stone-900 tracking-wider">
            MAZZOLA
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
            Aberturas de Aluminio • Sistema de Gestión
          </p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm animate-fade-in">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Mensaje de Éxito de Recuperación si viene de allí */}
        {recupExito && !mostrarRecuperacion && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm animate-fade-in">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>{recupExito} Ingrese ahora con su nueva contraseña.</span>
          </div>
        )}

        {/* Formulario Principal de Ingreso */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Usuario:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <User size={18} />
              </div>
              <input
                id="login-input-usuario"
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Nombre de usuario"
                autoComplete="username"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#D5CEC2] text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-medium transition-all"
                disabled={cargando}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Contraseña:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock size={18} />
              </div>
              <input
                id="login-input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#D5CEC2] text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-medium transition-all"
                disabled={cargando}
              />
            </div>
          </div>

          <button
            id="login-btn-submit"
            type="submit"
            disabled={cargando}
            className="w-full py-3.5 px-4 rounded-xl bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm tracking-wider uppercase shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {cargando ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>VERIFICANDO...</span>
              </>
            ) : (
              <span>INGRESAR</span>
            )}
          </button>
        </form>

        {/* Opción Segura de Recuperación de Administrador */}
        <div className="pt-2 text-center border-t border-[#E5DFD5] space-y-3">
          <button
            type="button"
            onClick={() => {
              setMostrarRecuperacion(true);
              setRecupError(null);
              setRecupExito(null);
            }}
            className="text-xs font-semibold text-stone-600 hover:text-orange-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound size={13} />
            <span>Recuperar o cambiar contraseña de Administrador</span>
          </button>

          {/* Tarjeta de ayuda con credenciales iniciales configuradas */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Credenciales del Sistema
              </span>
              <span className="text-[10px] text-amber-700 font-medium">Toque para autocompletar:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setUsuario('admin');
                  setPassword('admin123');
                  setError(null);
                }}
                className="px-2 py-1.5 rounded-lg bg-white border border-amber-200 hover:border-orange-500 hover:bg-orange-50/50 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="text-[10px] font-bold text-stone-800 group-hover:text-orange-600">Admin</div>
                <div className="text-[10px] font-mono text-stone-500">admin / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsuario('ventas');
                  setPassword('ventas123');
                  setError(null);
                }}
                className="px-2 py-1.5 rounded-lg bg-white border border-amber-200 hover:border-orange-500 hover:bg-orange-50/50 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="text-[10px] font-bold text-stone-800 group-hover:text-orange-600">Ventas</div>
                <div className="text-[10px] font-mono text-stone-500">ventas / ventas123</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsuario('fabrica');
                  setPassword('fabrica123');
                  setError(null);
                }}
                className="px-2 py-1.5 rounded-lg bg-white border border-amber-200 hover:border-orange-500 hover:bg-orange-50/50 text-left transition-all cursor-pointer shadow-2xs group"
              >
                <div className="text-[10px] font-bold text-stone-800 group-hover:text-orange-600">Fábrica</div>
                <div className="text-[10px] font-mono text-stone-500">fabrica / fabrica123</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE RECUPERACIÓN SEGURA DE ADMINISTRADOR */}
      {mostrarRecuperacion && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#FAF7F2] rounded-2xl border border-[#D5CEC2] shadow-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD5]">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-base">
                <KeyRound size={20} className="text-orange-600" />
                <span>Recuperación de Administrador</span>
              </div>
              <button
                type="button"
                onClick={() => setMostrarRecuperacion(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Por razones de seguridad, las contraseñas actuales están encriptadas y no se muestran.
              Para restablecer la clave de administrador, ingrese la Clave Maestra de Seguridad del Sistema.
            </p>

            {recupError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span>{recupError}</span>
              </div>
            )}

            {recupExito ? (
              <div className="space-y-4 py-2">
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{recupExito}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarRecuperacion(false)}
                  className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Volver a Pantalla de Ingreso
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecuperarSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Usuario Administrador:
                  </label>
                  <input
                    type="text"
                    value={recupUsuario}
                    onChange={(e) => setRecupUsuario(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#D5CEC2] text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={recupCargando}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      Clave Maestra de Recuperación:
                    </label>
                    <span className="text-[10px] text-stone-400 font-mono">
                      (Clave inicial: MAZZOLA-REC-2026-SEGURA)
                    </span>
                  </div>
                  <input
                    type="password"
                    value={recupClaveMaestra}
                    onChange={(e) => setRecupClaveMaestra(e.target.value)}
                    placeholder="Clave maestra de rescate"
                    required
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#D5CEC2] text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={recupCargando}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Nueva Contraseña:
                  </label>
                  <input
                    type="password"
                    value={recupNuevaPassword}
                    onChange={(e) => setRecupNuevaPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#D5CEC2] text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={recupCargando}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Confirmar Nueva Contraseña:
                  </label>
                  <input
                    type="password"
                    value={recupConfirmarPassword}
                    onChange={(e) => setRecupConfirmarPassword(e.target.value)}
                    placeholder="Repita la nueva contraseña"
                    required
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#D5CEC2] text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={recupCargando}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarRecuperacion(false)}
                    disabled={recupCargando}
                    className="flex-1 py-2.5 rounded-xl border border-[#D5CEC2] bg-white text-stone-700 text-xs font-bold hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={recupCargando}
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {recupCargando ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <span>Restablecer</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
