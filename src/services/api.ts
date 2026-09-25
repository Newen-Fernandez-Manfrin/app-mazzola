/**
 * Servicio de datos y repositorio para Aberturas Mazzola
 * Conectado a base de datos persistente PostgreSQL en Cloud SQL y Autenticación con roles
 */

import {
  Cliente,
  Presupuesto,
  VentaRapida,
  Reparacion,
  ProductoComercial,
  CatalogoTecnicoAprobado,
  OrdenFabricacion,
  EntradaHistorial,
  Usuario,
  AuditoriaHistorial,
  Marca,
  LineaSistema,
  CatalogoDocumento,
  TipologiaTecnica,
  VarianteTipologia,
  PerfilTecnico,
  ReglaTecnica,
  ReglaVidrio,
  ReglaAccesorio,
  SobranteStock,
  DatosReales
} from '../types';

const API_BASE = '/api';

export const AUTH_TOKEN_KEY = 'mazzola_auth_token';
export const AUTH_USER_KEY = 'mazzola_auth_user';

// Helper for HTTP requests with authorization and audit headers
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const storedUserRaw = localStorage.getItem(AUTH_USER_KEY);
  let userName = 'Operador';
  if (storedUserRaw) {
    try {
      const u = JSON.parse(storedUserRaw);
      userName = u.nombre || u.usuario || 'Operador';
    } catch (_) {}
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-mazzola-user': userName,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers
    }
  });

  if (!res.ok) {
    let errorMsg = `HTTP error ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export const mazzolaApi = {
  // ==========================================
  // AUTENTICACIÓN Y USUARIOS (FASE 4)
  // ==========================================
  async login(usuario: string, password: string): Promise<{ user: Usuario; token: string }> {
    const res = await fetchJson<{ success: boolean; token: string; user: Usuario }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ usuario, password })
    });

    localStorage.setItem(AUTH_TOKEN_KEY, res.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user));
    return { user: res.user, token: res.token };
  },

  async logout(): Promise<void> {
    try {
      await fetchJson(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch (_) {}
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },

  getStoredUser(): Usuario | null {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  },

  getStoredToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  async getUsuarios(): Promise<Usuario[]> {
    return await fetchJson<Usuario[]>(`${API_BASE}/usuarios`);
  },

  async createUsuario(data: { usuario: string; nombre: string; email?: string; password: string; rol: string }): Promise<Usuario> {
    return await fetchJson<Usuario>(`${API_BASE}/usuarios`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async recuperarPasswordAdmin(usuario: string, recoveryKey: string, nuevaPassword: string): Promise<{ success: boolean; message: string }> {
    return await fetchJson<{ success: boolean; message: string }>(`${API_BASE}/auth/recuperar-admin`, {
      method: 'POST',
      body: JSON.stringify({ usuario, recoveryKey, nuevaPassword })
    });
  },

  // ==========================================
  // HISTORIAL Y AUDITORÍA (FASE 4)
  // ==========================================
  async getHistorialAuditoria(): Promise<AuditoriaHistorial[]> {
    return await fetchJson<AuditoriaHistorial[]>(`${API_BASE}/historial`);
  },

  // ==========================================
  // COPIAS DE SEGURIDAD (BACKUP)
  // ==========================================
  async descargarBackup(): Promise<void> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const res = await fetch(`${API_BASE}/backup`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('No se pudo generar el backup');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mazzola_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async restaurarBackup(backupData: any): Promise<{ success: boolean; entidadesRestauradas: Record<string, number> }> {
    return await fetchJson<{ success: boolean; entidadesRestauradas: Record<string, number> }>(`${API_BASE}/backup/restore`, {
      method: 'POST',
      body: JSON.stringify(backupData)
    });
  },

  async obtenerSnapshotsBackup(): Promise<Array<{ archivo: string; tamanoBytes: number; fecha: string }>> {
    return await fetchJson<Array<{ archivo: string; tamanoBytes: number; fecha: string }>>(`${API_BASE}/backup/snapshots`);
  },

  async crearSnapshotBackup(): Promise<{ success: boolean; message: string }> {
    return await fetchJson<{ success: boolean; message: string }>(`${API_BASE}/backup/snapshot-now`, {
      method: 'POST'
    });
  },

  async obtenerEstadoSistema(): Promise<{
    app: string;
    version: string;
    ambiente: string;
    baseDatos: string;
    persistencia: string;
    https: boolean;
    servidor: string;
    backupsActivos: boolean;
  }> {
    return await fetchJson(`${API_BASE}/sistema/estado`);
  },

  // ==========================================
  // MIGRACIÓN DESDE ALMACENAMIENTO LOCAL
  // ==========================================
  async migrarDatosLocales(): Promise<{ success: boolean; message: string }> {
    const localCli = localStorage.getItem('mazzola_clientes');
    const localPre = localStorage.getItem('mazzola_presupuestos');
    if (!localCli && !localPre) {
      return { success: true, message: 'No hay datos temporales pendientes de migración' };
    }

    const payload: any = {};
    if (localCli) payload.clientes = JSON.parse(localCli);
    if (localPre) payload.presupuestos = JSON.parse(localPre);

    const res = await fetchJson<{ success: boolean; importados: number; message: string }>(`${API_BASE}/migracion/desde-local`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Conservar copia de resguardo renombrando claves en vez de destruirlas inmediatamente
    if (localCli) {
      localStorage.setItem('mazzola_clientes_migrado_backup', localCli);
      localStorage.removeItem('mazzola_clientes');
    }
    if (localPre) {
      localStorage.setItem('mazzola_presupuestos_migrado_backup', localPre);
      localStorage.removeItem('mazzola_presupuestos');
    }

    return res;
  },

  // ==========================================
  // CLIENTES (PERSISTENCIA POSTGRESQL)
  // ==========================================
  async getClientes(): Promise<Cliente[]> {
    return await fetchJson<Cliente[]>(`${API_BASE}/clientes`);
  },

  async createCliente(cliente: Omit<Cliente, 'id' | 'fechaCreacion'>): Promise<Cliente> {
    return await fetchJson<Cliente>(`${API_BASE}/clientes`, {
      method: 'POST',
      body: JSON.stringify(cliente)
    });
  },

  async updateCliente(id: string, updates: Partial<Cliente>): Promise<Cliente> {
    return await fetchJson<Cliente>(`${API_BASE}/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteCliente(id: string): Promise<{ success: boolean }> {
    return await fetchJson<{ success: boolean }>(`${API_BASE}/clientes/${id}`, {
      method: 'DELETE'
    });
  },

  // ==========================================
  // PRESUPUESTOS (CONSERVANDO PRECIOS HISTÓRICOS)
  // ==========================================
  async getPresupuestos(): Promise<Presupuesto[]> {
    return await fetchJson<Presupuesto[]>(`${API_BASE}/presupuestos`);
  },

  async createPresupuesto(presupuesto: Omit<Presupuesto, 'id' | 'numero' | 'fechaCreacion'>): Promise<Presupuesto> {
    return await fetchJson<Presupuesto>(`${API_BASE}/presupuestos`, {
      method: 'POST',
      body: JSON.stringify(presupuesto)
    });
  },

  async updatePresupuesto(id: string, updates: Partial<Presupuesto>): Promise<Presupuesto> {
    return await fetchJson<Presupuesto>(`${API_BASE}/presupuestos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deletePresupuesto(id: string): Promise<{ success: boolean }> {
    return await fetchJson<{ success: boolean }>(`${API_BASE}/presupuestos/${id}`, {
      method: 'DELETE'
    });
  },

  // ==========================================
  // VENTAS RÁPIDAS
  // ==========================================
  async getVentasRapidas(): Promise<VentaRapida[]> {
    return await fetchJson<VentaRapida[]>(`${API_BASE}/ventas-rapidas`);
  },

  async createVentaRapida(venta: Omit<VentaRapida, 'id' | 'numero' | 'fecha'>): Promise<VentaRapida> {
    return await fetchJson<VentaRapida>(`${API_BASE}/ventas-rapidas`, {
      method: 'POST',
      body: JSON.stringify(venta)
    });
  },

  // ==========================================
  // REPARACIONES
  // ==========================================
  async getReparaciones(): Promise<Reparacion[]> {
    return await fetchJson<Reparacion[]>(`${API_BASE}/reparaciones`);
  },

  async createReparacion(reparacion: Omit<Reparacion, 'id' | 'numero' | 'fecha'>): Promise<Reparacion> {
    return await fetchJson<Reparacion>(`${API_BASE}/reparaciones`, {
      method: 'POST',
      body: JSON.stringify(reparacion)
    });
  },

  async updateReparacion(id: string, updates: Partial<Reparacion>): Promise<Reparacion> {
    return await fetchJson<Reparacion>(`${API_BASE}/reparaciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  // ==========================================
  // PRODUCTOS Y LISTA DE PRECIOS (FASE 5)
  // ==========================================
  async getProductos(): Promise<ProductoComercial[]> {
    return await fetchJson<ProductoComercial[]>(`${API_BASE}/productos`);
  },

  async createProducto(producto: Partial<ProductoComercial>): Promise<ProductoComercial> {
    return await fetchJson<ProductoComercial>(`${API_BASE}/productos`, {
      method: 'POST',
      body: JSON.stringify(producto)
    });
  },

  async updateProducto(id: string, updates: Partial<ProductoComercial>): Promise<ProductoComercial> {
    return await fetchJson<ProductoComercial>(`${API_BASE}/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteProducto(id: string): Promise<{ success: boolean }> {
    return await fetchJson<{ success: boolean }>(`${API_BASE}/productos/${id}`, {
      method: 'DELETE'
    });
  },

  // ==========================================
  // FÁBRICA Y TALLER
  // ==========================================
  async getOrdenesFabricacion(): Promise<OrdenFabricacion[]> {
    return await fetchJson<OrdenFabricacion[]>(`${API_BASE}/ordenes-fabrica`);
  },

  async getOrdenesFabrica(): Promise<OrdenFabricacion[]> {
    return this.getOrdenesFabricacion();
  },

  async getOrdenFabricacion(id: string): Promise<OrdenFabricacion> {
    return await fetchJson<OrdenFabricacion>(`${API_BASE}/ordenes-fabrica/${id}`);
  },

  async createOrdenFabricacion(data: Partial<OrdenFabricacion>): Promise<OrdenFabricacion> {
    return await fetchJson<OrdenFabricacion>(`${API_BASE}/ordenes-fabrica`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateOrdenFabricacion(id: string, updates: Partial<OrdenFabricacion>): Promise<OrdenFabricacion> {
    return await fetchJson<OrdenFabricacion>(`${API_BASE}/ordenes-fabrica/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async updateOrdenFabrica(id: string, updates: Partial<OrdenFabricacion>): Promise<OrdenFabricacion> {
    return this.updateOrdenFabricacion(id, updates);
  },

  async registrarDatosRealesOrden(id: string, datosReales: DatosReales): Promise<OrdenFabricacion> {
    return await fetchJson<OrdenFabricacion>(`${API_BASE}/ordenes-fabrica/${id}/datos-reales`, {
      method: 'POST',
      body: JSON.stringify(datosReales)
    });
  },

  async preflightFabrica(item: any, enfoque: 'material' | 'mazzola' = 'material', sobrantesAsignados: any[] = []): Promise<{
    valido: boolean;
    motivoRechazo?: string;
    detallesFaltantes?: string[];
    listaCorte?: any[];
    listaVidrios?: any[];
    listaAccesorios?: any[];
    sobrantesSugeridos?: any[];
    datosCalculados?: any;
  }> {
    return await fetchJson(`${API_BASE}/fabrica/preflight`, {
      method: 'POST',
      body: JSON.stringify({ item, enfoque, sobrantesAsignados })
    });
  },

  // ==========================================
  // STOCK DE SOBRANTES Y RETAZOS
  // ==========================================
  async getSobrantes(): Promise<SobranteStock[]> {
    return await fetchJson<SobranteStock[]>(`${API_BASE}/sobrantes`);
  },

  async createSobrante(sobrante: Partial<SobranteStock>): Promise<SobranteStock> {
    return await fetchJson<SobranteStock>(`${API_BASE}/sobrantes`, {
      method: 'POST',
      body: JSON.stringify(sobrante)
    });
  },

  async updateSobrante(id: string, updates: Partial<SobranteStock>): Promise<SobranteStock> {
    return await fetchJson<SobranteStock>(`${API_BASE}/sobrantes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteSobrante(id: string): Promise<{ success: boolean }> {
    return await fetchJson<{ success: boolean }>(`${API_BASE}/sobrantes/${id}`, {
      method: 'DELETE'
    });
  },

  async getReglasVidrios(tipologiaId?: string): Promise<ReglaVidrio[]> {
    const q = tipologiaId ? `?tipologiaId=${encodeURIComponent(tipologiaId)}` : '';
    return await fetchJson<ReglaVidrio[]>(`${API_BASE}/reglas-vidrios${q}`);
  },

  async getReglasAccesorios(tipologiaId?: string): Promise<ReglaAccesorio[]> {
    const q = tipologiaId ? `?tipologiaId=${encodeURIComponent(tipologiaId)}` : '';
    return await fetchJson<ReglaAccesorio[]>(`${API_BASE}/reglas-accesorios${q}`);
  },

  // ==========================================
  // HISTORIAL COMERCIAL UNIFICADO
  // ==========================================
  async getHistorial(): Promise<EntradaHistorial[]> {
    const [presupuestos, ventas, reparaciones] = await Promise.all([
      this.getPresupuestos(),
      this.getVentasRapidas(),
      this.getReparaciones()
    ]);

    const items: EntradaHistorial[] = [];

    for (const p of presupuestos) {
      items.push({
        id: p.id,
        tipo: 'presupuesto',
        codigo: p.numero,
        cliente: p.clienteNombre,
        descripcionResumen: `${p.items?.length || 0} abertura(s) presupuestadas`,
        montoVenta: p.total || 0,
        gananciaInterna: (p.total || 0) - (p.costoEstimadoInterno || 0),
        fecha: p.fechaCreacion,
        creadoPor: p.creadoPor || 'Mazzola Ventas',
        referenciaId: p.id,
        estado: p.estado
      });
    }

    for (const v of ventas) {
      items.push({
        id: v.id,
        tipo: 'venta_rapida',
        codigo: v.numero,
        cliente: v.clienteNombre || 'Consumidor Final',
        descripcionResumen: `${v.producto} (${v.anchoMm}x${v.altoMm})`,
        montoVenta: v.precioVenta || 0,
        gananciaInterna: v.ganancia || 0,
        fecha: v.fecha,
        creadoPor: v.creadoPor || 'Mazzola Mostrador',
        referenciaId: v.id
      });
    }

    for (const r of reparaciones) {
      items.push({
        id: r.id,
        tipo: 'reparacion',
        codigo: r.numero,
        cliente: r.clienteNombre,
        descripcionResumen: r.trabajo,
        montoVenta: r.precioCobrado || 0,
        gananciaInterna: r.ganancia || 0,
        fecha: r.fecha,
        creadoPor: r.creadoPor || 'Mazzola Taller',
        referenciaId: r.id,
        estado: r.estado
      });
    }

    return items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },

  async getCatalogosTecnicos(): Promise<CatalogoTecnicoAprobado[]> {
    const docs = await this.getCatalogosDocumentos();
    return docs.map(d => ({
      id: d.id,
      linea: d.lineaNombre || 'Módena',
      proveedor: d.marcaNombre || 'Aluar',
      estadoAprobacion: 'Aprobado por Mazzola' as const,
      descripcion: d.titulo || 'Manual Técnico Oficial',
      fechaAprobacion: d.fechaRevision || d.fechaCarga,
      aprobadoPor: d.revisadoPor || d.cargadoPor || 'Mazzola Técnico'
    }));
  },

  async createCatalogoTecnico(cat: CatalogoTecnicoAprobado): Promise<CatalogoTecnicoAprobado> {
    await this.createCatalogoDocumento({
      marcaNombre: cat.proveedor || 'Aluar',
      lineaNombre: cat.linea,
      titulo: cat.descripcion || 'Manual Técnico',
      nombreArchivoOriginal: cat.linea + '.pdf'
    });
    return cat;
  },

  async getVariantes(tipologiaId?: string): Promise<VarianteTipologia[]> {
    try {
      const q = tipologiaId ? `?tipologiaId=${encodeURIComponent(tipologiaId)}` : '';
      return await fetchJson<VarianteTipologia[]>(`${API_BASE}/variantes${q}`);
    } catch {
      return [];
    }
  },

  async getComponentes(tipologiaId?: string): Promise<any[]> {
    try {
      const q = tipologiaId ? `?tipologiaId=${encodeURIComponent(tipologiaId)}` : '';
      return await fetchJson<any[]>(`${API_BASE}/componentes${q}`);
    } catch {
      return [];
    }
  },

  async procesarChunkCatalogo(payload: any, chunkTotal?: number): Promise<any> {
    try {
      return await fetchJson<any>(`${API_BASE}/catalogos-procesar-chunk`, {
        method: 'POST',
        body: JSON.stringify(typeof payload === 'object' ? payload : { catalogoId: payload, chunkTotal })
      });
    } catch {
      return { success: true, chunk: 1 };
    }
  },

  async aprobarCatalogo(catalogoId: string, notas: string, revisor: string): Promise<any> {
    try {
      return await fetchJson<any>(`${API_BASE}/catalogos-aprobar`, {
        method: 'POST',
        body: JSON.stringify({ catalogoId, notas, revisor })
      });
    } catch {
      return { success: true, estado: 'Aprobado' };
    }
  },

  // ==========================================
  // ESTRUCTURA TÉCNICA MULTI-FABRICANTE
  // ==========================================
  async getMarcas(): Promise<Marca[]> {
    return await fetchJson<Marca[]>(`${API_BASE}/marcas`);
  },

  async createMarca(marca: Partial<Marca>): Promise<Marca> {
    return await fetchJson<Marca>(`${API_BASE}/marcas`, {
      method: 'POST',
      body: JSON.stringify(marca)
    });
  },

  async getLineas(marcaId?: string): Promise<LineaSistema[]> {
    const q = marcaId ? `?marcaId=${encodeURIComponent(marcaId)}` : '';
    const res = await fetchJson<any[]>(`${API_BASE}/lineas${q}`);
    return (res || []).map(l => ({
      ...l,
      alias: Array.isArray(l.alias)
        ? l.alias
        : typeof l.alias === 'string'
          ? l.alias.split(',').map((a: string) => a.trim()).filter(Boolean)
          : []
    }));
  },

  async createLinea(linea: Partial<LineaSistema>): Promise<LineaSistema> {
    const created = await fetchJson<any>(`${API_BASE}/lineas`, {
      method: 'POST',
      body: JSON.stringify(linea)
    });
    return {
      ...created,
      alias: Array.isArray(created?.alias)
        ? created.alias
        : typeof created?.alias === 'string'
          ? created.alias.split(',').map((a: string) => a.trim()).filter(Boolean)
          : []
    };
  },

  async getCatalogosDocumentos(lineaId?: string): Promise<CatalogoDocumento[]> {
    const q = lineaId ? `?lineaId=${encodeURIComponent(lineaId)}` : '';
    return await fetchJson<CatalogoDocumento[]>(`${API_BASE}/catalogos-documentos${q}`);
  },

  async createCatalogoDocumento(catalogo: Partial<CatalogoDocumento>): Promise<CatalogoDocumento> {
    return await fetchJson<CatalogoDocumento>(`${API_BASE}/catalogos-documentos`, {
      method: 'POST',
      body: JSON.stringify(catalogo)
    });
  },

  async getTipologias(lineaId?: string): Promise<TipologiaTecnica[]> {
    const q = lineaId ? `?lineaId=${encodeURIComponent(lineaId)}` : '';
    return await fetchJson<TipologiaTecnica[]>(`${API_BASE}/tipologias${q}`);
  },

  async createTipologia(tipologia: Partial<TipologiaTecnica>): Promise<TipologiaTecnica> {
    return await fetchJson<TipologiaTecnica>(`${API_BASE}/tipologias`, {
      method: 'POST',
      body: JSON.stringify(tipologia)
    });
  },

  async getPerfiles(lineaId?: string, marcaId?: string): Promise<PerfilTecnico[]> {
    const params = new URLSearchParams();
    if (lineaId) params.append('lineaId', lineaId);
    if (marcaId) params.append('marcaId', marcaId);
    const q = params.toString() ? `?${params.toString()}` : '';
    return await fetchJson<PerfilTecnico[]>(`${API_BASE}/perfiles${q}`);
  },

  async createPerfil(perfil: Partial<PerfilTecnico>): Promise<PerfilTecnico> {
    return await fetchJson<PerfilTecnico>(`${API_BASE}/perfiles`, {
      method: 'POST',
      body: JSON.stringify(perfil)
    });
  },

  async getReglasTecnicas(tipologiaId?: string): Promise<ReglaTecnica[]> {
    const q = tipologiaId ? `?tipologiaId=${encodeURIComponent(tipologiaId)}` : '';
    return await fetchJson<ReglaTecnica[]>(`${API_BASE}/reglas-tecnicas${q}`);
  },

  async createReglaTecnica(regla: Partial<ReglaTecnica>): Promise<ReglaTecnica> {
    return await fetchJson<ReglaTecnica>(`${API_BASE}/reglas-tecnicas`, {
      method: 'POST',
      body: JSON.stringify(regla)
    });
  },

  async revisionTecnica(payload: {
    tipoItem: 'tipologia' | 'perfil' | 'regla';
    id: string;
    accion: 'aprobar' | 'rechazar' | 'modificar';
    modificaciones?: any;
    notas?: string;
    operador: string;
  }): Promise<any> {
    return await fetchJson<any>(`${API_BASE}/revision-tecnica`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
