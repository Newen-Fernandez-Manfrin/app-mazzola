import { eq, desc, asc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from './index';
import * as schema from './schema';
import {
  SEED_MARCAS,
  SEED_LINEAS,
  SEED_CATALOGOS_DOCUMENTOS,
  SEED_TIPOLOGIAS,
  SEED_VARIANTES,
  SEED_PERFILES,
  SEED_REGLAS_TECNICAS,
  SEED_REGLAS_VIDRIOS,
  SEED_REGLAS_ACCESORIOS,
  SEED_SOBRANTES
} from '../../server_seed_tecnico';
import fs from 'fs';
import path from 'path';

// Helper for generating unique IDs
export const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// REGISTRO DE AUDITORÍA (HISTORIAL)
export async function registrarAuditoria(
  usuario: string,
  accion: string,
  elementoTipo: string,
  elementoId: string | undefined,
  detalle: string
) {
  try {
    const id = generateId('aud');
    await db.insert(schema.historial).values({
      id,
      usuario: usuario || 'Sistema',
      accion,
      elementoTipo,
      elementoId: elementoId || null,
      detalle,
      fecha: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Auditoría] Error registrando acción:', err);
  }
}

// INICIALIZACIÓN Y MIGRACIÓN AUTOMÁTICA
export async function initDatabaseAndSeed() {
  console.log('[PostgreSQL] Verificando tablas y datos iniciales en Cloud SQL...');

  try {
    // 1. Verificar Usuarios
    const existingUsers = await db.select().from(schema.usuarios);
    if (existingUsers.length === 0) {
      console.log('[PostgreSQL] Inicializando usuarios del sistema con contraseñas encriptadas...');
      const adminHash = bcrypt.hashSync('admin123', 10);
      const ventasHash = bcrypt.hashSync('ventas123', 10);
      const fabricaHash = bcrypt.hashSync('fabrica123', 10);

      await db.insert(schema.usuarios).values([
        {
          id: 'usr-admin',
          usuario: 'admin',
          nombre: 'Administrador Mazzola',
          email: 'admin@mazzola.com.ar',
          passwordHash: adminHash,
          rol: 'Administrador',
          activo: true,
        },
        {
          id: 'usr-ventas',
          usuario: 'ventas',
          nombre: 'Ventas Mazzola',
          email: 'ventas@mazzola.com.ar',
          passwordHash: ventasHash,
          rol: 'Ventas',
          activo: true,
        },
        {
          id: 'usr-fabrica',
          usuario: 'fabrica',
          nombre: 'Taller y Fábrica Mazzola',
          email: 'fabrica@mazzola.com.ar',
          passwordHash: fabricaHash,
          rol: 'Fábrica',
          activo: true,
        },
      ]);

      await registrarAuditoria(
        'Sistema',
        'Inicialización',
        'usuarios',
        'usr-admin',
        'Creación de usuarios base (admin, ventas, fabrica) con hash bcrypt'
      );
    }

    // 2. Verificar Marcas y Catálogos Técnicos
    const existingMarcas = await db.select().from(schema.marcas);
    if (existingMarcas.length === 0) {
      console.log('[PostgreSQL] Sembrando marcas y catálogos técnicos de fabricantes (MDT, Aluar, etc.)...');
      
      // Marcas
      for (const m of SEED_MARCAS) {
        await db.insert(schema.marcas).values({
          id: m.id,
          nombre: m.nombre,
          codigo: m.codigo,
          descripcion: m.descripcion,
          activo: m.activo,
          creadoPor: m.creadoPor || 'Dirección Técnica Mazzola',
        }).onConflictDoNothing();
      }

      // Líneas
      for (const l of SEED_LINEAS) {
        await db.insert(schema.lineas).values({
          id: l.id,
          marcaId: l.marcaId,
          marcaNombre: l.marcaNombre,
          nombre: l.nombre,
          descripcion: l.descripcion,
          alias: Array.isArray(l.alias) ? l.alias.join(', ') : l.alias,
          estado: l.estado,
          catalogoId: l.catalogoId,
          creadoPor: 'Dirección Técnica Mazzola',
        }).onConflictDoNothing();
      }

      // Catálogos
      for (const c of SEED_CATALOGOS_DOCUMENTOS) {
        await db.insert(schema.catalogos).values({
          id: c.id,
          marcaId: c.marcaId,
          lineaId: c.lineaId || 'linea-herrero',
          nombreArchivo: c.nombreArchivoOriginal || c.titulo,
          titulo: c.titulo,
          version: '1.0',
          totalPaginas: c.totalPaginas,
          estado: c.estado,
          archivoUrl: c.archivoUrl,
          aprobadoPor: c.revisadoPor || c.cargadoPor,
          fechaAprobacion: c.fechaRevision || c.fechaCarga,
          observaciones: c.notasRevision,
          creadoPor: c.cargadoPor || 'Dirección Técnica Mazzola',
        }).onConflictDoNothing();
      }

      // Tipologías
      for (const t of SEED_TIPOLOGIAS) {
        await db.insert(schema.tipologias).values({
          id: t.id,
          lineaId: t.lineaId,
          lineaNombre: t.lineaNombre,
          catalogoId: t.catalogoId,
          nombre: t.nombre,
          codigo: t.codigo,
          descripcion: t.descripcion,
          paginaOrigen: t.paginaOrigen,
          estadoRevision: t.estadoRevision,
          modificadoPorMazzola: t.modificadoPorMazzola || false,
          notasMazzola: t.notasMazzola,
          creadoPor: 'Dirección Técnica Mazzola',
        }).onConflictDoNothing();
      }

      // Variantes
      for (const v of SEED_VARIANTES) {
        await db.insert(schema.variantes).values({
          id: v.id,
          tipologiaId: v.tipologiaId,
          nombre: v.nombre,
          descripcion: v.descripcion,
          paginaOrigen: v.paginaOrigen,
          estadoRevision: v.estadoRevision,
          modificadoPorMazzola: v.modificadoPorMazzola || false,
          creadoPor: 'Dirección Técnica Mazzola',
        }).onConflictDoNothing();
      }

      // Perfiles
      for (const p of SEED_PERFILES) {
        await db.insert(schema.perfiles).values({
          id: p.id,
          marcaId: p.marcaId,
          marcaNombre: p.marcaNombre,
          lineaId: p.lineaId,
          lineaNombre: p.lineaNombre,
          catalogoId: p.catalogoId,
          codigo: p.codigo,
          nombre: p.nombre,
          descripcion: p.descripcion,
          funcion: p.funcion,
          largoComercial: p.largoComercial ? String(p.largoComercial) : '6.00',
          pesoPorMetro: p.pesoPorMetro ? String(p.pesoPorMetro) : '0.000',
          paginaOrigen: p.paginaOrigen,
          estado: p.estado,
          estadoRevision: p.estadoRevision,
          modificadoPorMazzola: p.modificadoPorMazzola || false,
          notasMazzola: p.notasMazzola,
          creadoPor: 'Dirección Técnica Mazzola',
        }).onConflictDoNothing();
      }

      // Reglas Técnicas
      for (const r of SEED_REGLAS_TECNICAS) {
        await db.insert(schema.reglasTecnicas).values({
          id: r.id,
          tipologiaId: r.tipologiaId,
          varianteId: r.varianteId,
          componenteFuncionId: r.componenteFuncionId,
          funcionNombre: r.funcionNombre,
          perfilId: r.perfilId,
          perfilCodigo: r.perfilCodigo,
          perfilNombre: r.perfilNombre,
          cantidad: r.cantidad,
          formula: r.formula,
          corteA: r.corteA,
          corteB: r.corteB,
          orientacion: r.orientacion,
          mecanizado: r.mecanizado,
          paginaOrigen: r.paginaOrigen,
          estadoRevision: r.estadoRevision,
          modificadoPorMazzola: r.modificadoPorMazzola || false,
          notasMazzola: r.notasMazzola,
          creadoPor: 'Dirección Técnica Mazzola',
        }).onConflictDoNothing();
      }

      await registrarAuditoria(
        'Sistema',
        'Carga Inicial',
        'catalogos',
        'cat-mdt-mass-r60',
        'Sembrado de catálogo oficial MDT Línea R60 y estructura multi-fabricante'
      );
    }

    // Reglas Técnicas de Vidrio Oficiales (Verificación independiente)
    const existingVidrios = await db.select().from(schema.reglasVidrios);
    if (existingVidrios.length === 0) {
      for (const rv of SEED_REGLAS_VIDRIOS) {
        await db.insert(schema.reglasVidrios).values({
          id: rv.id,
          tipologiaId: rv.tipologiaId,
          pieza: rv.pieza,
          formulaAncho: rv.formulaAncho,
          formulaAlto: rv.formulaAlto,
          cantidadPorAbertura: rv.cantidadPorAbertura,
          espesorTipoSugerido: rv.espesorTipoSugerido,
          observaciones: rv.observaciones,
          fuenteTecnica: rv.fuenteTecnica,
          estadoRevision: rv.estadoRevision,
          creadoPor: 'Dirección Técnica Mazzola',
        }).onConflictDoNothing();
      }
    }

    // Reglas Técnicas de Accesorios Oficiales (Verificación independiente)
    const existingAccesorios = await db.select().from(schema.reglasAccesorios);
    if (existingAccesorios.length === 0) {
      for (const ra of SEED_REGLAS_ACCESORIOS) {
        await db.insert(schema.reglasAccesorios).values({
          id: ra.id,
          tipologiaId: ra.tipologiaId,
          codigo: ra.codigo,
          nombre: ra.nombre,
          funcion: ra.funcion,
          cantidadPorAbertura: ra.cantidadPorAbertura,
          unidad: ra.unidad,
          observaciones: ra.observaciones,
          fuenteTecnica: ra.fuenteTecnica,
          estadoRevision: ra.estadoRevision,
          creadoPor: 'Dirección Técnica Mazzola',
        }).onConflictDoNothing();
      }
    }

    // Sobrantes iniciales en pañol de retazos (Verificación independiente)
    const existingSobrantes = await db.select().from(schema.sobrantes);
    if (existingSobrantes.length === 0) {
      for (const s of SEED_SOBRANTES) {
        await db.insert(schema.sobrantes).values({
          id: s.id,
          perfilCodigo: s.perfilCodigo,
          perfilNombre: s.perfilNombre,
          longitudMm: s.longitudMm,
          cantidad: s.cantidad,
          ubicacion: s.ubicacion,
          estado: s.estado,
          fecha: s.fecha,
          origenOrdenId: s.origenOrdenId,
          origenTipo: s.origenTipo || 'Corte',
          observaciones: s.observaciones,
          aprovechable: s.aprovechable,
        }).onConflictDoNothing();
      }
    }

    // 3. Migrar Clientes, Presupuestos y Operaciones previas si existen en archivo local
    const existingClientes = await db.select().from(schema.clientes);
    if (existingClientes.length === 0) {
      const localDbPath = path.join(process.cwd(), 'data', 'mazzola_db.json');
      if (fs.existsSync(localDbPath)) {
        try {
          const raw = fs.readFileSync(localDbPath, 'utf-8');
          const localData = JSON.parse(raw);
          console.log('[PostgreSQL] Migrando datos comerciales desde almacenamiento local...');

          // Clientes
          if (Array.isArray(localData.clientes)) {
            for (const c of localData.clientes) {
              await db.insert(schema.clientes).values({
                id: c.id || generateId('cli'),
                nombre: c.nombre,
                telefono: c.telefono,
                direccion: c.direccion,
                notas: c.observaciones || c.notas,
                creadoPor: c.creadoPor || 'Migración Sistema',
              }).onConflictDoNothing();
            }
          }

          // Presupuestos e ítems
          if (Array.isArray(localData.presupuestos)) {
            for (const p of localData.presupuestos) {
              const presId = p.id || generateId('pre');
              await db.insert(schema.presupuestos).values({
                id: presId,
                numero: p.numero,
                clienteId: p.clienteId,
                clienteNombre: p.clienteNombre,
                clienteTelefono: p.clienteTelefono,
                clienteEmail: p.clienteEmail,
                clienteDireccion: p.clienteDireccion,
                totalVenta: String(p.totalVenta || 0),
                descuentoPorcentaje: p.descuentoPorcentaje || 0,
                costoInterno: String(p.costoInternoTotal || p.costoInterno || 0),
                ganancia: String(p.gananciaEstimada || p.ganancia || 0),
                estado: p.estado || 'Borrador',
                validezDias: p.validezDias || 15,
                fecha: p.fechaCreacion || new Date().toISOString(),
                notas: p.observaciones || p.notas,
                creadoPor: p.creadoPor || 'Migración Sistema',
              }).onConflictDoNothing();

              // Ítems del presupuesto
              if (Array.isArray(p.items)) {
                for (const item of p.items) {
                  await db.insert(schema.itemsPresupuesto).values({
                    id: item.id || generateId('item'),
                    presupuestoId: presId,
                    tipologia: item.tipologia,
                    linea: item.linea || 'Línea Herrero',
                    marca: item.marca || 'MDT',
                    variante: item.variante,
                    anchoMm: item.anchoMm,
                    altoMm: item.altoMm,
                    cantidad: item.cantidad || 1,
                    color: item.color || 'Blanco',
                    vidrio: item.vidrio || 'Simple',
                    tieneMosquitero: item.accesorios?.mosquitero || false,
                    precioMosquitero: String(item.accesorios?.precioMosquitero || 0),
                    tieneReja: item.accesorios?.reja || false,
                    precioReja: String(item.accesorios?.precioReja || 0),
                    tieneTransporte: item.accesorios?.transporte || false,
                    precioTransporte: String(item.accesorios?.precioTransporte || 0),
                    tieneInstalacion: item.accesorios?.instalacion || false,
                    precioInstalacion: String(item.accesorios?.precioInstalacion || 0),
                    otrosAccesorios: item.accesorios?.otros || '',
                    precioOtros: String(item.accesorios?.precioOtros || 0),
                    precioUnitario: String(item.precioUnitarioManual || 0),
                    precioTotalItem: String(item.precioTotalItem || 0),
                    notasItem: item.notasItem || '',
                    unidadIngreso: item.unidadIngreso || 'mm',
                  }).onConflictDoNothing();
                }
              }
            }
          }

          // Reparaciones
          if (Array.isArray(localData.reparaciones)) {
            for (const r of localData.reparaciones) {
              await db.insert(schema.reparaciones).values({
                id: r.id || generateId('rep'),
                numero: r.numero,
                clienteNombre: r.clienteNombre,
                clienteTelefono: r.clienteTelefono,
                trabajo: r.trabajo,
                tipoFrecuente: r.tipoFrecuente,
                materiales: String(r.materiales || 0),
                manoDeObra: String(r.manoDeObra || 0),
                costo: String(r.costo || 0),
                precioCobrado: String(r.precioCobrado || 0),
                ganancia: String(r.ganancia || 0),
                estado: r.estado || 'Pendiente',
                fecha: r.fecha || new Date().toISOString(),
                observaciones: r.observaciones,
                creadoPor: r.creadoPor || 'Migración Sistema',
              }).onConflictDoNothing();
            }
          }

          // Ventas rápidas
          if (Array.isArray(localData.ventasRapidas)) {
            for (const v of localData.ventasRapidas) {
              await db.insert(schema.ventasRapidas).values({
                id: v.id || generateId('vta'),
                numero: v.numero,
                clienteNombre: v.clienteNombre,
                items: v.items || [],
                total: String(v.total || 0),
                costo: String(v.costo || 0),
                metodoPago: v.metodoPago || 'Efectivo',
                fecha: v.fecha || new Date().toISOString(),
                creadoPor: v.creadoPor || 'Migración Sistema',
              }).onConflictDoNothing();
            }
          }

          // Órdenes de Fábrica
          if (Array.isArray(localData.ordenesFabrica)) {
            for (const o of localData.ordenesFabrica) {
              await db.insert(schema.ordenesFabricacion).values({
                id: o.id || generateId('ord'),
                presupuestoId: o.presupuestoId,
                numeroPresupuesto: o.numeroPresupuesto,
                clienteNombre: o.clienteNombre,
                itemIndex: o.itemIndex || 0,
                itemData: o.item || {},
                estadoFabrica: o.estadoFabrica || 'Por Iniciar',
                prioridad: o.prioridad || 'Normal',
                fechaIngreso: o.fechaIngreso || new Date().toISOString(),
                observacionesFabrica: o.observacionesFabrica,
                creadoPor: 'Migración Sistema',
              }).onConflictDoNothing();
            }
          }

          await registrarAuditoria(
            'Sistema',
            'Migración',
            'base_datos',
            'all',
            'Migración completada exitosamente desde almacenamiento local a PostgreSQL Cloud SQL'
          );
        } catch (mErr) {
          console.error('[PostgreSQL] Error migrando datos locales:', mErr);
        }
      }
    }

    console.log('[PostgreSQL] Inicialización de base de datos completada exitosamente.');
  } catch (err) {
    console.error('[PostgreSQL] Error durante la inicialización:', err);
  }
}

// =========================================================================
// MÉTODOS DE CONSULTA Y PERSISTENCIA (CRUD)
// =========================================================================

// CLIENTES
export async function getClientes() {
  const rows = await db.select().from(schema.clientes).orderBy(desc(schema.clientes.createdAt));
  return rows.map(r => ({
    id: r.id,
    nombre: r.nombre,
    telefono: r.telefono || '',
    direccion: r.direccion || '',
    cuit: r.cuit || '',
    condicionIva: r.condicionIva,
    observaciones: r.notas || '',
    fechaCreacion: r.createdAt.toISOString(),
    creadoPor: r.creadoPor,
  }));
}

export async function createCliente(data: any, usuarioNombre: string) {
  const id = data.id || generateId('cli');
  const [created] = await db.insert(schema.clientes).values({
    id,
    nombre: data.nombre,
    telefono: data.telefono,
    direccion: data.direccion,
    cuit: data.cuit,
    condicionIva: data.condicionIva || 'Consumidor Final',
    notas: data.observaciones || data.notas,
    creadoPor: usuarioNombre || 'Usuario',
  }).returning();

  await registrarAuditoria(
    usuarioNombre,
    'Creó cliente',
    'clientes',
    id,
    `Cliente ${data.nombre} creado`
  );

  return {
    id: created.id,
    nombre: created.nombre,
    telefono: created.telefono || '',
    direccion: created.direccion || '',
    cuit: created.cuit || '',
    condicionIva: created.condicionIva,
    observaciones: created.notas || '',
    fechaCreacion: created.createdAt.toISOString(),
    creadoPor: created.creadoPor,
  };
}

export async function updateCliente(id: string, data: any, usuarioNombre: string) {
  const [updated] = await db.update(schema.clientes).set({
    nombre: data.nombre,
    telefono: data.telefono,
    direccion: data.direccion,
    cuit: data.cuit,
    condicionIva: data.condicionIva,
    notas: data.observaciones || data.notas,
    updatedAt: new Date(),
  }).where(eq(schema.clientes.id, id)).returning();

  await registrarAuditoria(
    usuarioNombre,
    'Modificó cliente',
    'clientes',
    id,
    `Cliente ${data.nombre || id} actualizado`
  );

  return updated;
}

export async function deleteCliente(id: string, usuarioNombre: string) {
  await db.delete(schema.clientes).where(eq(schema.clientes.id, id));
  await registrarAuditoria(
    usuarioNombre,
    'Eliminó cliente',
    'clientes',
    id,
    `Cliente con ID ${id} eliminado`
  );
  return { success: true };
}

// PRESUPUESTOS (CONSERVANDO PRECIO HISTÓRICO INMUTABLE)
export async function getPresupuestos() {
  const presRows = await db.select().from(schema.presupuestos).orderBy(desc(schema.presupuestos.createdAt));
  const itemRows = await db.select().from(schema.itemsPresupuesto);

  const itemsMap: Record<string, any[]> = {};
  for (const item of itemRows) {
    if (!itemsMap[item.presupuestoId]) itemsMap[item.presupuestoId] = [];
    itemsMap[item.presupuestoId].push({
      id: item.id,
      tipologia: item.tipologia,
      linea: item.linea,
      marca: item.marca,
      variante: item.variante,
      anchoMm: item.anchoMm,
      altoMm: item.altoMm,
      cantidad: item.cantidad,
      color: item.color,
      vidrio: item.vidrio,
      accesorios: {
        mosquitero: item.tieneMosquitero,
        precioMosquitero: Number(item.precioMosquitero || 0),
        reja: item.tieneReja,
        precioReja: Number(item.precioReja || 0),
        transporte: item.tieneTransporte,
        precioTransporte: Number(item.precioTransporte || 0),
        instalacion: item.tieneInstalacion,
        precioInstalacion: Number(item.precioInstalacion || 0),
        otros: item.otrosAccesorios || '',
        precioOtros: Number(item.precioOtros || 0),
      },
      precioUnitarioManual: Number(item.precioUnitario || 0),
      precioTotalItem: Number(item.precioTotalItem || 0),
      notasItem: item.notasItem || '',
      unidadIngreso: item.unidadIngreso || 'mm',
    });
  }

  return presRows.map(p => ({
    id: p.id,
    numero: p.numero,
    clienteId: p.clienteId,
    clienteNombre: p.clienteNombre,
    clienteTelefono: p.clienteTelefono,
    clienteEmail: p.clienteEmail,
    clienteDireccion: p.clienteDireccion,
    items: itemsMap[p.id] || [],
    totalVenta: Number(p.totalVenta || 0),
    descuentoPorcentaje: p.descuentoPorcentaje || 0,
    costoInternoTotal: Number(p.costoInterno || 0),
    gananciaEstimada: Number(p.ganancia || 0),
    estado: p.estado,
    validezDias: p.validezDias || 15,
    fechaCreacion: p.fecha || p.createdAt.toISOString(),
    observaciones: p.notas || '',
    creadoPor: p.creadoPor,
  }));
}

export async function createPresupuesto(data: any, usuarioNombre: string) {
  const id = data.id || generateId('pre');
  const numero = data.numero || `PRE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const [createdPres] = await db.insert(schema.presupuestos).values({
    id,
    numero,
    clienteId: data.clienteId,
    clienteNombre: data.clienteNombre,
    clienteTelefono: data.clienteTelefono,
    clienteEmail: data.clienteEmail,
    clienteDireccion: data.clienteDireccion,
    totalVenta: String(data.totalVenta || 0),
    descuentoPorcentaje: data.descuentoPorcentaje || 0,
    costoInterno: String(data.costoInternoTotal || data.costoInterno || 0),
    ganancia: String(data.gananciaEstimada || data.ganancia || 0),
    estado: data.estado || 'Borrador',
    validezDias: data.validezDias || 15,
    fecha: data.fechaCreacion || new Date().toISOString(),
    notas: data.observaciones || data.notas,
    creadoPor: usuarioNombre || 'Ventas',
  }).returning();

  // Guardar ítems con precios congelados
  const createdItems = [];
  if (Array.isArray(data.items)) {
    for (const item of data.items) {
      const itemId = item.id || generateId('item');
      const [savedItem] = await db.insert(schema.itemsPresupuesto).values({
        id: itemId,
        presupuestoId: id,
        tipologia: item.tipologia,
        linea: item.linea || 'Línea Herrero',
        marca: item.marca || 'MDT',
        variante: item.variante,
        anchoMm: Number(item.anchoMm) || 1000,
        altoMm: Number(item.altoMm) || 1000,
        cantidad: Number(item.cantidad) || 1,
        color: item.color || 'Blanco brillante',
        vidrio: item.vidrio || 'Simple',
        tieneMosquitero: Boolean(item.accesorios?.mosquitero),
        precioMosquitero: String(item.accesorios?.precioMosquitero || 0),
        tieneReja: Boolean(item.accesorios?.reja),
        precioReja: String(item.accesorios?.precioReja || 0),
        tieneTransporte: Boolean(item.accesorios?.transporte),
        precioTransporte: String(item.accesorios?.precioTransporte || 0),
        tieneInstalacion: Boolean(item.accesorios?.instalacion),
        precioInstalacion: String(item.accesorios?.precioInstalacion || 0),
        otrosAccesorios: item.accesorios?.otros || '',
        precioOtros: String(item.accesorios?.precioOtros || 0),
        precioUnitario: String(item.precioUnitarioManual || 0),
        precioTotalItem: String(item.precioTotalItem || 0),
        notasItem: item.notasItem || '',
        unidadIngreso: item.unidadIngreso || 'mm',
      }).returning();
      createdItems.push(savedItem);
    }
  }

  // REGLA FASE 6: Una cotización confirmada NO debe entrar automáticamente a producción.
  // Debe existir una acción explícita del usuario desde fábrica o presupuesto.
  // Las órdenes de fabricación se generan únicamente por acción explícita del operador.

  await registrarAuditoria(
    usuarioNombre,
    'Creó presupuesto',
    'presupuestos',
    numero,
    `Presupuesto #${numero} para ${data.clienteNombre} por $${Number(data.totalVenta || 0).toLocaleString('es-AR')}`
  );

  return {
    id: createdPres.id,
    numero: createdPres.numero,
    clienteId: createdPres.clienteId,
    clienteNombre: createdPres.clienteNombre,
    clienteTelefono: createdPres.clienteTelefono,
    clienteEmail: createdPres.clienteEmail,
    clienteDireccion: createdPres.clienteDireccion,
    items: data.items,
    totalVenta: Number(createdPres.totalVenta),
    descuentoPorcentaje: createdPres.descuentoPorcentaje,
    costoInternoTotal: Number(createdPres.costoInterno),
    gananciaEstimada: Number(createdPres.ganancia),
    estado: createdPres.estado,
    validezDias: createdPres.validezDias,
    fechaCreacion: createdPres.fecha,
    observaciones: createdPres.notas,
    creadoPor: createdPres.creadoPor,
  };
}

export async function updatePresupuesto(id: string, data: any, usuarioNombre: string) {
  const [current] = await db.select().from(schema.presupuestos).where(eq(schema.presupuestos.id, id));
  if (!current) throw new Error('Presupuesto no encontrado');

  const [updated] = await db.update(schema.presupuestos).set({
    estado: data.estado !== undefined ? data.estado : current.estado,
    totalVenta: data.totalVenta !== undefined ? String(data.totalVenta) : current.totalVenta,
    costoInterno: data.costoInternoTotal !== undefined ? String(data.costoInternoTotal) : current.costoInterno,
    ganancia: data.gananciaEstimada !== undefined ? String(data.gananciaEstimada) : current.ganancia,
    notas: data.observaciones !== undefined ? data.observaciones : current.notas,
    updatedAt: new Date(),
  }).where(eq(schema.presupuestos.id, id)).returning();

  let detalleAuditoria = `Presupuesto #${current.numero} actualizado`;
  if (data.estado && data.estado !== current.estado) {
    detalleAuditoria = `Cambió estado de ${current.estado} a ${data.estado}`;
  } else if (data.totalVenta && Number(data.totalVenta) !== Number(current.totalVenta)) {
    detalleAuditoria = `Modificó precio de $${Number(current.totalVenta || 0).toLocaleString('es-AR')} a $${Number(data.totalVenta || 0).toLocaleString('es-AR')}`;
  }

  await registrarAuditoria(
    usuarioNombre,
    'Modificó presupuesto',
    'presupuestos',
    current.numero,
    detalleAuditoria
  );

  return updated;
}

export async function deletePresupuesto(id: string, usuarioNombre: string) {
  const [current] = await db.select().from(schema.presupuestos).where(eq(schema.presupuestos.id, id));
  await db.delete(schema.presupuestos).where(eq(schema.presupuestos.id, id));
  await registrarAuditoria(
    usuarioNombre,
    'Eliminó presupuesto',
    'presupuestos',
    current?.numero || id,
    `Presupuesto #${current?.numero || id} eliminado`
  );
  return { success: true };
}

// VENTAS RÁPIDAS
export async function getVentasRapidas() {
  const rows = await db.select().from(schema.ventasRapidas).orderBy(desc(schema.ventasRapidas.createdAt));
  return rows.map(r => {
    let itemFirst: any = {};
    if (Array.isArray(r.items) && r.items.length > 0) {
      itemFirst = r.items[0] || {};
    } else if (r.items && typeof r.items === 'object') {
      itemFirst = r.items;
    }

    const precioVenta = Number(r.total) || Number(itemFirst.precioVenta) || 0;
    const costo = Number(r.costo) || Number(itemFirst.costo) || 0;
    const ganancia = precioVenta - costo;

    return {
      id: r.id,
      numero: r.numero,
      clienteId: itemFirst.clienteId || undefined,
      clienteNombre: r.clienteNombre || itemFirst.clienteNombre || 'Consumidor Final',
      clienteTelefono: itemFirst.clienteTelefono || '',
      producto: itemFirst.producto || 'Abertura de Aluminio',
      tipologia: itemFirst.tipologia || 'Corrediza',
      medida: itemFirst.medida || `${itemFirst.anchoMm || 0}x${itemFirst.altoMm || 0} mm`,
      caracteristicas: itemFirst.caracteristicas || (itemFirst.color ? `Color ${itemFirst.color}` : ''),
      vidrio: itemFirst.vidrio || 'Simple',
      accesorios: itemFirst.accesorios || '',
      anchoMm: Number(itemFirst.anchoMm) || 0,
      altoMm: Number(itemFirst.altoMm) || 0,
      color: itemFirst.color || 'Blanco',
      precioVenta,
      costo,
      ganancia,
      metodoPago: r.metodoPago,
      fecha: r.fecha,
      observaciones: itemFirst.observaciones || itemFirst.notas || '',
      notas: itemFirst.observaciones || itemFirst.notas || '',
      creadoPor: r.creadoPor,
      items: r.items,
    };
  });
}

export async function createVentaRapida(data: any, usuarioNombre: string) {
  const id = data.id || generateId('vta');
  const numero = data.numero || `VR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const precioVenta = Number(data.precioVenta !== undefined ? data.precioVenta : (data.total || 0));
  const costo = Number(data.costo || 0);
  const ganancia = precioVenta - costo;
  const clienteNombre = (data.clienteNombre && data.clienteNombre.trim()) ? data.clienteNombre.trim() : 'Consumidor Final';

  const itemData = {
    clienteId: data.clienteId,
    clienteNombre,
    clienteTelefono: data.clienteTelefono || '',
    producto: data.producto || 'Abertura',
    tipologia: data.tipologia || 'Corrediza',
    medida: data.medida || `${data.anchoMm || 0}x${data.altoMm || 0} mm`,
    caracteristicas: data.caracteristicas || '',
    vidrio: data.vidrio || 'Simple',
    accesorios: data.accesorios || '',
    anchoMm: Number(data.anchoMm) || 0,
    altoMm: Number(data.altoMm) || 0,
    color: data.color || 'Blanco',
    precioVenta,
    costo,
    ganancia,
    fecha: data.fecha || new Date().toISOString().slice(0, 10),
    observaciones: data.observaciones || data.notas || '',
  };

  const [created] = await db.insert(schema.ventasRapidas).values({
    id,
    numero,
    clienteNombre,
    items: [itemData],
    total: String(precioVenta),
    costo: String(costo),
    metodoPago: data.metodoPago || 'Efectivo',
    fecha: data.fecha || new Date().toISOString().slice(0, 10),
    creadoPor: usuarioNombre || 'Ventas',
  }).returning();

  await registrarAuditoria(
    usuarioNombre,
    'Registró venta rápida',
    'ventas_rapidas',
    numero,
    `Venta rápida #${numero} para ${clienteNombre}: ${data.producto} por $${precioVenta.toLocaleString('es-AR')} (Costo: $${costo.toLocaleString('es-AR')}, Ganancia: $${ganancia.toLocaleString('es-AR')})`
  );

  return {
    id: created.id,
    numero: created.numero,
    clienteId: data.clienteId,
    clienteNombre,
    clienteTelefono: data.clienteTelefono || '',
    producto: itemData.producto,
    tipologia: itemData.tipologia,
    medida: itemData.medida,
    caracteristicas: itemData.caracteristicas,
    vidrio: itemData.vidrio,
    accesorios: itemData.accesorios,
    anchoMm: itemData.anchoMm,
    altoMm: itemData.altoMm,
    color: itemData.color,
    precioVenta,
    costo,
    ganancia,
    metodoPago: created.metodoPago,
    fecha: created.fecha,
    observaciones: itemData.observaciones,
    notas: itemData.observaciones,
    creadoPor: created.creadoPor,
  };
}

// REPARACIONES
export async function getReparaciones() {
  const rows = await db.select().from(schema.reparaciones).orderBy(desc(schema.reparaciones.createdAt));
  return rows.map(r => ({
    id: r.id,
    numero: r.numero,
    clienteId: r.clienteId || undefined,
    clienteNombre: r.clienteNombre,
    clienteTelefono: r.clienteTelefono || '',
    trabajo: r.trabajo,
    tipoFrecuente: r.tipoFrecuente || '',
    materialesTexto: r.materialesTexto || '',
    materiales: Number(r.materiales),
    manoDeObra: Number(r.manoDeObra),
    costo: Number(r.costo),
    precioCobrado: Number(r.precioCobrado),
    ganancia: Number(r.ganancia),
    estado: r.estado,
    fecha: r.fecha,
    observaciones: r.observaciones || '',
    creadoPor: r.creadoPor,
  }));
}

export async function createReparacion(data: any, usuarioNombre: string) {
  const id = data.id || generateId('rep');
  const numero = data.numero || `REP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const matCosto = Number(data.materiales || data.costoMateriales || 0);
  const mdo = Number(data.manoDeObra || 0);
  const costoTotal = Number(data.costo !== undefined ? data.costo : (matCosto + mdo));
  const cobrado = Number(data.precioCobrado || 0);
  const ganancia = Number(data.ganancia !== undefined ? data.ganancia : (cobrado - costoTotal));

  const [created] = await db.insert(schema.reparaciones).values({
    id,
    numero,
    clienteId: data.clienteId,
    clienteNombre: data.clienteNombre,
    clienteTelefono: data.clienteTelefono,
    trabajo: data.trabajo,
    tipoFrecuente: data.tipoFrecuente,
    materialesTexto: data.materialesTexto || '',
    materiales: String(matCosto),
    manoDeObra: String(mdo),
    costo: String(costoTotal),
    precioCobrado: String(cobrado),
    ganancia: String(ganancia),
    estado: data.estado || 'Pendiente',
    fecha: data.fecha || new Date().toISOString().slice(0, 10),
    observaciones: data.observaciones,
    creadoPor: usuarioNombre || 'Taller',
  }).returning();

  await registrarAuditoria(
    usuarioNombre,
    'Registró reparación',
    'reparaciones',
    numero,
    `Reparación #${numero} para ${data.clienteNombre}: ${data.trabajo} por $${cobrado.toLocaleString('es-AR')} (Costo: $${costoTotal.toLocaleString('es-AR')}, Ganancia: $${ganancia.toLocaleString('es-AR')})`
  );

  return {
    ...created,
    clienteId: data.clienteId,
    materialesTexto: created.materialesTexto || '',
    materiales: Number(created.materiales),
    manoDeObra: Number(created.manoDeObra),
    costo: Number(created.costo),
    precioCobrado: Number(created.precioCobrado),
    ganancia: Number(created.ganancia),
  };
}

export async function updateReparacion(id: string, data: any, usuarioNombre: string) {
  const [current] = await db.select().from(schema.reparaciones).where(eq(schema.reparaciones.id, id));
  if (!current) throw new Error('Reparación no encontrada');

  const matCosto = data.materiales !== undefined ? Number(data.materiales) : Number(current.materiales);
  const mdo = data.manoDeObra !== undefined ? Number(data.manoDeObra) : Number(current.manoDeObra);
  const costoTotal = data.costo !== undefined ? Number(data.costo) : (matCosto + mdo);
  const cobrado = data.precioCobrado !== undefined ? Number(data.precioCobrado) : Number(current.precioCobrado);
  const ganancia = data.ganancia !== undefined ? Number(data.ganancia) : (cobrado - costoTotal);

  const [updated] = await db.update(schema.reparaciones).set({
    estado: data.estado !== undefined ? data.estado : current.estado,
    materialesTexto: data.materialesTexto !== undefined ? data.materialesTexto : current.materialesTexto,
    materiales: String(matCosto),
    manoDeObra: String(mdo),
    costo: String(costoTotal),
    precioCobrado: String(cobrado),
    ganancia: String(ganancia),
    observaciones: data.observaciones !== undefined ? data.observaciones : current.observaciones,
  }).where(eq(schema.reparaciones.id, id)).returning();

  await registrarAuditoria(
    usuarioNombre,
    'Actualizó reparación',
    'reparaciones',
    current.numero,
    `Reparación #${current.numero} actualizada a estado ${data.estado || current.estado}`
  );

  return {
    ...updated,
    materialesTexto: updated.materialesTexto || '',
    materiales: Number(updated.materiales),
    manoDeObra: Number(updated.manoDeObra),
    costo: Number(updated.costo),
    precioCobrado: Number(updated.precioCobrado),
    ganancia: Number(updated.ganancia),
  };
}

// ==========================================
// PRODUCTOS Y LISTA DE PRECIOS COMERCIALES (FASE 5)
// ==========================================
export async function getProductos() {
  const rows = await db.select().from(schema.productos).orderBy(asc(schema.productos.nombre));
  if (rows.length === 0) {
    return await seedProductosIniciales();
  }
  return rows.map(r => ({
    id: r.id,
    codigo: r.codigo,
    nombre: r.nombre,
    categoria: r.categoria,
    unidad: r.unidad,
    costo: Number(r.costo),
    precioVenta: Number(r.precioVenta),
    margen: Number(r.margen || 35),
    recargoConfigurable: Number(r.recargoConfigurable || 0),
    stock: r.stock,
    descripcion: r.descripcion || '',
    activo: r.activo,
    creadoPor: r.creadoPor,
  }));
}

export async function createProducto(data: any, usuarioNombre: string) {
  const id = data.id || generateId('prod');
  const codigo = data.codigo || `PRD-${Math.floor(100 + Math.random() * 900)}`;

  const costo = Number(data.costo || 0);
  const margen = Number(data.margen !== undefined ? data.margen : 35);
  const recargo = Number(data.recargoConfigurable || 0);
  // Si no se especifica precioVenta, calcular: costo * (1 + margen/100) * (1 + recargo/100)
  const precioVenta = Number(
    data.precioVenta !== undefined
      ? data.precioVenta
      : Math.round(costo * (1 + margen / 100) * (1 + recargo / 100))
  );

  const [created] = await db.insert(schema.productos).values({
    id,
    codigo,
    nombre: data.nombre,
    categoria: data.categoria || 'Aberturas Estándar',
    unidad: data.unidad || 'u',
    costo: String(costo),
    precioVenta: String(precioVenta),
    margen: String(margen),
    recargoConfigurable: String(recargo),
    stock: Number(data.stock || 0),
    descripcion: data.descripcion || '',
    activo: data.activo !== undefined ? data.activo : true,
    creadoPor: usuarioNombre || 'Administrador',
  }).returning();

  await registrarAuditoria(
    usuarioNombre,
    'Creó producto en lista de precios',
    'productos',
    codigo,
    `Producto ${data.nombre} (${codigo}): Costo $${costo.toLocaleString('es-AR')}, Precio Venta $${precioVenta.toLocaleString('es-AR')} (Margen: ${margen}%)`
  );

  return {
    ...created,
    costo: Number(created.costo),
    precioVenta: Number(created.precioVenta),
    margen: Number(created.margen || 35),
    recargoConfigurable: Number(created.recargoConfigurable || 0),
  };
}

export async function updateProducto(id: string, data: any, usuarioNombre: string) {
  const [current] = await db.select().from(schema.productos).where(eq(schema.productos.id, id));
  if (!current) throw new Error('Producto no encontrado');

  const costo = data.costo !== undefined ? Number(data.costo) : Number(current.costo);
  const margen = data.margen !== undefined ? Number(data.margen) : Number(current.margen || 35);
  const recargo = data.recargoConfigurable !== undefined ? Number(data.recargoConfigurable) : Number(current.recargoConfigurable || 0);
  const precioVenta = data.precioVenta !== undefined 
    ? Number(data.precioVenta) 
    : Math.round(costo * (1 + margen / 100) * (1 + recargo / 100));

  const [updated] = await db.update(schema.productos).set({
    nombre: data.nombre !== undefined ? data.nombre : current.nombre,
    codigo: data.codigo !== undefined ? data.codigo : current.codigo,
    categoria: data.categoria !== undefined ? data.categoria : current.categoria,
    costo: String(costo),
    precioVenta: String(precioVenta),
    margen: String(margen),
    recargoConfigurable: String(recargo),
    stock: data.stock !== undefined ? Number(data.stock) : current.stock,
    descripcion: data.descripcion !== undefined ? data.descripcion : current.descripcion,
    activo: data.activo !== undefined ? data.activo : current.activo,
  }).where(eq(schema.productos.id, id)).returning();

  await registrarAuditoria(
    usuarioNombre,
    'Actualizó precios de producto',
    'productos',
    current.codigo,
    `Actualizó producto ${updated.nombre}: Costo $${costo.toLocaleString('es-AR')}, Precio Venta $${precioVenta.toLocaleString('es-AR')} (Margen: ${margen}%, Recargo: ${recargo}%)`
  );

  return {
    ...updated,
    costo: Number(updated.costo),
    precioVenta: Number(updated.precioVenta),
    margen: Number(updated.margen || 35),
    recargoConfigurable: Number(updated.recargoConfigurable || 0),
  };
}

export async function deleteProducto(id: string, usuarioNombre: string) {
  const [current] = await db.select().from(schema.productos).where(eq(schema.productos.id, id));
  if (!current) return { success: false };

  await db.delete(schema.productos).where(eq(schema.productos.id, id));
  await registrarAuditoria(
    usuarioNombre,
    'Eliminó producto',
    'productos',
    current.codigo,
    `Eliminó producto ${current.nombre} (${current.codigo})`
  );
  return { success: true };
}

async function seedProductosIniciales() {
  const defaultProds = [
    {
      id: 'prod-001',
      codigo: 'VTA-HER-1210',
      nombre: 'Ventana Corrediza Herrero 1200x1000 Blanca',
      categoria: 'Ventanas Estándar',
      costo: 110000,
      margen: 40,
      recargoConfigurable: 0,
      precioVenta: 154000,
      descripcion: 'Ventana 2 hojas corredizas línea Herrero con vidrio Float 4mm y felpa.',
    },
    {
      id: 'prod-002',
      codigo: 'VTA-MOD-1511',
      nombre: 'Ventana Corrediza Módena 1500x1100 Blanca 4mm',
      categoria: 'Ventanas Estándar',
      costo: 195000,
      margen: 35,
      recargoConfigurable: 0,
      precioVenta: 263250,
      descripcion: 'Línea Módena con cierre lateral embutido, rodamientos a rulemán y vidrio simple.',
    },
    {
      id: 'prod-003',
      codigo: 'PTA-BAL-2020',
      nombre: 'Puerta Balcón 2000x2000 Módena DVH',
      categoria: 'Puertas y Balcones',
      costo: 420000,
      margen: 35,
      recargoConfigurable: 0,
      precioVenta: 567000,
      descripcion: 'Puerta balcón 2 hojas para terraza o patio con DVH 4/9/4 y ruedas reforzadas.',
    },
    {
      id: 'prod-004',
      codigo: 'PNO-FIJ-1060',
      nombre: 'Paño Fijo 1000x600 Módena',
      categoria: 'Paños Fijos',
      costo: 65000,
      margen: 45,
      recargoConfigurable: 0,
      precioVenta: 94250,
      descripcion: 'Paño fijo hermético con contravidrio curvo y burletes EPDM.',
    },
    {
      id: 'prod-005',
      codigo: 'MOS-COR-1210',
      nombre: 'Mosquitero Corredizo 1200x1000 Malla Fibra',
      categoria: 'Mosquiteros',
      costo: 24000,
      margen: 50,
      recargoConfigurable: 0,
      precioVenta: 36000,
      descripcion: 'Mosquitero marco aluminio blanco con tela de fibra de vidrio gris lavable.',
    },
    {
      id: 'prod-006',
      codigo: 'PTA-ABR-0820',
      nombre: 'Puerta de Abrir 800x2000 Herrero Ciega',
      categoria: 'Puertas',
      costo: 180000,
      margen: 35,
      recargoConfigurable: 0,
      precioVenta: 243000,
      descripcion: 'Puerta de abrir 1 hoja con machimbre de aluminio tubular y cerradura euro.',
    },
  ];

  for (const p of defaultProds) {
    await db.insert(schema.productos).values({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      categoria: p.categoria,
      unidad: 'u',
      costo: String(p.costo),
      precioVenta: String(p.precioVenta),
      margen: String(p.margen),
      recargoConfigurable: String(p.recargoConfigurable),
      stock: 5,
      descripcion: p.descripcion,
      activo: true,
      creadoPor: 'Sistema Mazzola',
    }).onConflictDoNothing();
  }

  const rows = await db.select().from(schema.productos).orderBy(asc(schema.productos.nombre));
  return rows.map(r => ({
    id: r.id,
    codigo: r.codigo,
    nombre: r.nombre,
    categoria: r.categoria,
    unidad: r.unidad,
    costo: Number(r.costo),
    precioVenta: Number(r.precioVenta),
    margen: Number(r.margen || 35),
    recargoConfigurable: Number(r.recargoConfigurable || 0),
    stock: r.stock,
    descripcion: r.descripcion || '',
    activo: r.activo,
    creadoPor: r.creadoPor,
  }));
}

// ÓRDENES DE FÁBRICA
export async function getOrdenesFabricacion() {
  const rows = await db.select().from(schema.ordenesFabricacion).orderBy(desc(schema.ordenesFabricacion.createdAt));
  return rows.map(r => {
    let itemObj = r.itemData as any;
    if (typeof itemObj === 'string') {
      try {
        itemObj = JSON.parse(itemObj);
      } catch (_) {
        itemObj = {};
      }
    }
    itemObj = itemObj || {};
    if (!itemObj.accesorios) {
      itemObj.accesorios = {};
    }

    const parseJson = (val: any, defaultVal: any) => {
      if (!val) return defaultVal;
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (_) { return defaultVal; }
      }
      return val;
    };

    return {
      id: r.id,
      numeroOrden: r.numeroOrden || `OP-${r.numeroPresupuesto}-${r.itemIndex}`,
      presupuestoId: r.presupuestoId,
      numeroPresupuesto: r.numeroPresupuesto,
      clienteNombre: r.clienteNombre,
      item: itemObj,
      itemIndex: r.itemIndex,
      tipologiaNombre: r.tipologiaNombre || itemObj.tipologia || 'Abertura',
      varianteNombre: r.varianteNombre || itemObj.variante || '',
      medidasStr: r.medidasStr || `${itemObj.anchoMm || 0} x ${itemObj.altoMm || 0} mm`,
      cantidadTotal: r.cantidadTotal || itemObj.cantidad || 1,
      estadoFabrica: r.estadoFabrica,
      prioridad: r.prioridad,
      enfoqueOptimizacion: r.enfoqueOptimizacion || 'material',
      datosCalculados: parseJson(r.datosCalculados, null),
      datosReales: parseJson(r.datosReales, {
        barrasCompradas: undefined,
        barrasUtilizadas: undefined,
        sobrantesReales: undefined,
        desperdicioRealMm: undefined,
        observaciones: '',
        registrado: false,
      }),
      listaCorte: parseJson(r.listaCorte, []),
      listaVidrios: parseJson(r.listaVidrios, []),
      listaAccesorios: parseJson(r.listaAccesorios, []),
      sobrantesAsignados: parseJson(r.sobrantesAsignados, []),
      fechaIngreso: r.fechaIngreso,
      observacionesFabrica: r.observacionesFabrica,
      createdAt: r.createdAt,
    };
  });
}

export async function getOrdenFabricacionById(id: string) {
  const [r] = await db.select().from(schema.ordenesFabricacion).where(eq(schema.ordenesFabricacion.id, id));
  if (!r) return null;
  let itemObj = r.itemData as any;
  if (typeof itemObj === 'string') {
    try { itemObj = JSON.parse(itemObj); } catch (_) { itemObj = {}; }
  }
  itemObj = itemObj || {};

  const parseJson = (val: any, defaultVal: any) => {
    if (!val) return defaultVal;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (_) { return defaultVal; }
    }
    return val;
  };

  return {
    id: r.id,
    numeroOrden: r.numeroOrden || `OP-${r.numeroPresupuesto}-${r.itemIndex}`,
    presupuestoId: r.presupuestoId,
    numeroPresupuesto: r.numeroPresupuesto,
    clienteNombre: r.clienteNombre,
    item: itemObj,
    itemIndex: r.itemIndex,
    tipologiaNombre: r.tipologiaNombre || itemObj.tipologia || 'Abertura',
    varianteNombre: r.varianteNombre || itemObj.variante || '',
    medidasStr: r.medidasStr || `${itemObj.anchoMm || 0} x ${itemObj.altoMm || 0} mm`,
    cantidadTotal: r.cantidadTotal || itemObj.cantidad || 1,
    estadoFabrica: r.estadoFabrica,
    prioridad: r.prioridad,
    enfoqueOptimizacion: r.enfoqueOptimizacion || 'material',
    datosCalculados: parseJson(r.datosCalculados, null),
    datosReales: parseJson(r.datosReales, {
      barrasCompradas: undefined,
      barrasUtilizadas: undefined,
      sobrantesReales: undefined,
      desperdicioRealMm: undefined,
      observaciones: '',
      registrado: false,
    }),
    listaCorte: parseJson(r.listaCorte, []),
    listaVidrios: parseJson(r.listaVidrios, []),
    listaAccesorios: parseJson(r.listaAccesorios, []),
    sobrantesAsignados: parseJson(r.sobrantesAsignados, []),
    fechaIngreso: r.fechaIngreso,
    observacionesFabrica: r.observacionesFabrica,
    createdAt: r.createdAt,
  };
}

export async function createOrdenFabricacion(data: any, usuarioNombre: string) {
  const id = data.id || generateId('op');
  const countExistentes = (await db.select().from(schema.ordenesFabricacion)).length + 1;
  const numeroOrden = data.numeroOrden || `OP-2026-${String(countExistentes).padStart(3, '0')}`;

  const itemObj = data.item || {};
  const tipologiaNombre = data.tipologiaNombre || itemObj.tipologia || 'Abertura';
  const varianteNombre = data.varianteNombre || itemObj.variante || '';
  const medidasStr = data.medidasStr || `${itemObj.anchoMm || 0} x ${itemObj.altoMm || 0} mm`;
  const cantidadTotal = data.cantidadTotal || itemObj.cantidad || 1;

  const [created] = await db.insert(schema.ordenesFabricacion).values({
    id,
    numeroOrden,
    presupuestoId: data.presupuestoId,
    numeroPresupuesto: data.numeroPresupuesto,
    clienteNombre: data.clienteNombre,
    itemIndex: data.itemIndex || 1,
    itemData: itemObj,
    tipologiaNombre,
    varianteNombre,
    medidasStr,
    cantidadTotal,
    estadoFabrica: data.estadoFabrica || 'Por Iniciar',
    prioridad: data.prioridad || 'Normal',
    enfoqueOptimizacion: data.enfoqueOptimizacion || 'material',
    datosCalculados: data.datosCalculados || null,
    datosReales: data.datosReales || {
      barrasCompradas: undefined,
      barrasUtilizadas: undefined,
      sobrantesReales: undefined,
      desperdicioRealMm: undefined,
      observaciones: '',
      registrado: false,
    },
    listaCorte: data.listaCorte || [],
    listaVidrios: data.listaVidrios || [],
    listaAccesorios: data.listaAccesorios || [],
    sobrantesAsignados: data.sobrantesAsignados || [],
    fechaIngreso: data.fechaIngreso || new Date().toISOString(),
    observacionesFabrica: data.observacionesFabrica || '',
    creadoPor: usuarioNombre || 'Fábrica',
  }).returning();

  // Guardar en tabla relacional cortes para trazabilidad histórica
  if (Array.isArray(data.listaCorte)) {
    for (const c of data.listaCorte) {
      await db.insert(schema.cortes).values({
        id: generateId('crt'),
        ordenFabricacionId: id,
        perfilCodigo: c.perfilCodigo,
        perfilNombre: c.perfilNombre || c.pieza || '',
        longitudMm: c.medidaMm,
        anguloA: c.corteA || '90°',
        anguloB: c.corteB || '90°',
        cantidad: c.cantidad || 1,
        estado: 'Pendiente',
        creadoPor: usuarioNombre || 'Fábrica',
      }).onConflictDoNothing();
    }
  }

  // Si se asignaron sobrantes de stock, marcar estado como Reservado
  if (Array.isArray(data.sobrantesAsignados)) {
    for (const sob of data.sobrantesAsignados) {
      if (sob.sobranteId) {
        await db.update(schema.sobrantes).set({
          estado: 'Reservado',
          origenOrdenId: id,
        }).where(eq(schema.sobrantes.id, sob.sobranteId));
      }
    }
  }

  await registrarAuditoria(
    usuarioNombre,
    'Generó orden de producción',
    'ordenes_fabricacion',
    numeroOrden,
    `Orden ${numeroOrden} creada explícitamente para ${data.clienteNombre} (${tipologiaNombre} ${medidasStr})`
  );

  return created;
}

export async function updateOrdenFabricacion(id: string, data: any, usuarioNombre: string) {
  const [current] = await db.select().from(schema.ordenesFabricacion).where(eq(schema.ordenesFabricacion.id, id));
  if (!current) throw new Error('Orden no encontrada');

  const updateSet: any = {
    estadoFabrica: data.estadoFabrica || current.estadoFabrica,
    prioridad: data.prioridad || current.prioridad,
    observacionesFabrica: data.observacionesFabrica !== undefined ? data.observacionesFabrica : current.observacionesFabrica,
  };

  if (data.enfoqueOptimizacion !== undefined) updateSet.enfoqueOptimizacion = data.enfoqueOptimizacion;
  if (data.datosCalculados !== undefined) updateSet.datosCalculados = data.datosCalculados;
  if (data.listaCorte !== undefined) updateSet.listaCorte = data.listaCorte;
  if (data.sobrantesAsignados !== undefined) updateSet.sobrantesAsignados = data.sobrantesAsignados;

  const [updated] = await db.update(schema.ordenesFabricacion).set(updateSet).where(eq(schema.ordenesFabricacion.id, id)).returning();

  // Si la orden se finaliza o completa, actualizar sobrantes a Utilizado
  if (data.estadoFabrica === 'Finalizado' || data.estadoFabrica === 'Listo para Entrega') {
    if (Array.isArray(current.sobrantesAsignados as any)) {
      for (const sob of (current.sobrantesAsignados as any)) {
        if (sob.sobranteId) {
          await db.update(schema.sobrantes).set({ estado: 'Utilizado' }).where(eq(schema.sobrantes.id, sob.sobranteId));
        }
      }
    }
  }

  await registrarAuditoria(
    usuarioNombre,
    'Actualizó orden de fábrica',
    'ordenes_fabricacion',
    current.numeroOrden || current.numeroPresupuesto,
    `Orden ${current.numeroOrden || current.numeroPresupuesto} actualizada a ${data.estadoFabrica || current.estadoFabrica}`
  );

  return updated;
}

export async function registrarDatosRealesOrden(id: string, datosReales: any, usuarioNombre: string) {
  const [current] = await db.select().from(schema.ordenesFabricacion).where(eq(schema.ordenesFabricacion.id, id));
  if (!current) throw new Error('Orden no encontrada');

  const payload = {
    ...datosReales,
    registrado: true,
    fechaRegistro: new Date().toISOString(),
    registradoPor: usuarioNombre || 'Fábrica',
  };

  const [updated] = await db.update(schema.ordenesFabricacion).set({
    datosReales: payload,
  }).where(eq(schema.ordenesFabricacion.id, id)).returning();

  await registrarAuditoria(
    usuarioNombre,
    'Registró datos reales de taller',
    'ordenes_fabricacion',
    current.numeroOrden || current.numeroPresupuesto,
    `Datos reales registrados para orden ${current.numeroOrden || current.numeroPresupuesto}: ${payload.barrasUtilizadas || 0} barras utilizadas, ${payload.barrasCompradas || 0} compradas.`
  );

  return updated;
}

// GESTIÓN DE SOBRANTES / RETAZOS DE STOCK
export async function getSobrantes() {
  return await db.select().from(schema.sobrantes).orderBy(desc(schema.sobrantes.createdAt));
}

export async function createSobrante(data: any, usuarioNombre: string) {
  const id = data.id || generateId('sob');
  const [created] = await db.insert(schema.sobrantes).values({
    id,
    perfilCodigo: data.perfilCodigo,
    perfilNombre: data.perfilNombre || `Perfil ${data.perfilCodigo}`,
    longitudMm: Number(data.longitudMm) || 0,
    cantidad: Number(data.cantidad) || 1,
    ubicacion: data.ubicacion || 'Estantería de Retazos',
    estado: data.estado || 'Disponible',
    fecha: data.fecha || new Date().toISOString().split('T')[0],
    origenOrdenId: data.origenOrdenId || null,
    origenTipo: data.origenTipo || 'Corte',
    observaciones: data.observaciones || '',
    aprovechable: data.aprovechable !== undefined ? Boolean(data.aprovechable) : true,
  }).returning();

  await registrarAuditoria(
    usuarioNombre,
    'Ingresó sobrante a stock',
    'sobrantes',
    id,
    `Retazo de ${data.perfilCodigo} de ${data.longitudMm} mm ingresado en ${data.ubicacion}`
  );

  return created;
}

export async function updateSobrante(id: string, data: any, usuarioNombre: string) {
  const [current] = await db.select().from(schema.sobrantes).where(eq(schema.sobrantes.id, id));
  if (!current) throw new Error('Sobrante no encontrado');

  const [updated] = await db.update(schema.sobrantes).set({
    perfilCodigo: data.perfilCodigo !== undefined ? data.perfilCodigo : current.perfilCodigo,
    perfilNombre: data.perfilNombre !== undefined ? data.perfilNombre : current.perfilNombre,
    longitudMm: data.longitudMm !== undefined ? Number(data.longitudMm) : current.longitudMm,
    cantidad: data.cantidad !== undefined ? Number(data.cantidad) : current.cantidad,
    ubicacion: data.ubicacion !== undefined ? data.ubicacion : current.ubicacion,
    estado: data.estado !== undefined ? data.estado : current.estado,
    observaciones: data.observaciones !== undefined ? data.observaciones : current.observaciones,
    aprovechable: data.aprovechable !== undefined ? Boolean(data.aprovechable) : current.aprovechable,
  }).where(eq(schema.sobrantes.id, id)).returning();

  await registrarAuditoria(
    usuarioNombre,
    'Actualizó sobrante',
    'sobrantes',
    id,
    `Sobrante #${id} actualizado (${data.estado || current.estado})`
  );

  return updated;
}

export async function deleteSobrante(id: string, usuarioNombre: string) {
  const [current] = await db.select().from(schema.sobrantes).where(eq(schema.sobrantes.id, id));
  await db.delete(schema.sobrantes).where(eq(schema.sobrantes.id, id));
  await registrarAuditoria(
    usuarioNombre,
    'Eliminó sobrante',
    'sobrantes',
    id,
    `Sobrante #${id} (${current?.perfilCodigo} ${current?.longitudMm}mm) eliminado de stock`
  );
  return { success: true };
}

// REGLAS TÉCNICAS DE VIDRIOS Y ACCESORIOS
export async function getReglasVidrios(tipologiaId?: string) {
  if (tipologiaId) {
    return await db.select().from(schema.reglasVidrios).where(eq(schema.reglasVidrios.tipologiaId, tipologiaId));
  }
  return await db.select().from(schema.reglasVidrios);
}

export async function getReglasAccesorios(tipologiaId?: string) {
  if (tipologiaId) {
    return await db.select().from(schema.reglasAccesorios).where(eq(schema.reglasAccesorios.tipologiaId, tipologiaId));
  }
  return await db.select().from(schema.reglasAccesorios);
}

// DATOS TÉCNICOS (MARCAS, LÍNEAS, CATÁLOGOS, TIPOLOGÍAS, PERFILES, REGLAS)
export async function getMarcas() {
  return await db.select().from(schema.marcas);
}

export async function createMarca(data: any, usuarioNombre: string) {
  const id = data.id || generateId('marca');
  const [created] = await db.insert(schema.marcas).values({
    id,
    nombre: data.nombre,
    codigo: data.codigo,
    descripcion: data.descripcion,
    activo: data.activo !== undefined ? data.activo : true,
    creadoPor: usuarioNombre || 'Técnica',
  }).returning();

  await registrarAuditoria(usuarioNombre, 'Creó marca', 'marcas', id, `Fabricante ${data.nombre} añadido`);
  return created;
}

function formatAliasList(alias: any): string[] {
  if (!alias) return [];
  if (Array.isArray(alias)) return alias.map(String).filter(Boolean);
  if (typeof alias === 'string') {
    const trimmed = alias.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {}
    }
    return trimmed.split(',').map(a => a.trim()).filter(Boolean);
  }
  return [];
}

export async function getLineas(marcaId?: string) {
  const rows = marcaId
    ? await db.select().from(schema.lineas).where(eq(schema.lineas.marcaId, marcaId))
    : await db.select().from(schema.lineas);

  return rows.map(r => ({
    ...r,
    alias: formatAliasList(r.alias),
  }));
}

export async function createLinea(data: any, usuarioNombre: string) {
  const id = data.id || generateId('linea');
  const aliasStr = Array.isArray(data.alias) ? data.alias.join(', ') : (data.alias || '');
  const [created] = await db.insert(schema.lineas).values({
    id,
    marcaId: data.marcaId,
    marcaNombre: data.marcaNombre,
    nombre: data.nombre,
    descripcion: data.descripcion,
    alias: aliasStr,
    estado: data.estado || 'Activo',
    catalogoId: data.catalogoId,
    creadoPor: usuarioNombre || 'Técnica',
  }).returning();

  await registrarAuditoria(usuarioNombre, 'Creó línea', 'lineas', id, `Línea ${data.nombre} añadida para ${data.marcaNombre}`);
  return {
    ...created,
    alias: formatAliasList(created.alias),
  };
}

export async function getCatalogos(lineaId?: string) {
  if (lineaId) {
    return await db.select().from(schema.catalogos).where(eq(schema.catalogos.lineaId, lineaId));
  }
  return await db.select().from(schema.catalogos);
}

export async function createCatalogo(data: any, usuarioNombre: string) {
  const id = data.id || generateId('cat');
  const [created] = await db.insert(schema.catalogos).values({
    id,
    marcaId: data.marcaId,
    lineaId: data.lineaId,
    nombreArchivo: data.nombreArchivo,
    titulo: data.titulo,
    version: data.version || '1.0',
    totalPaginas: data.totalPaginas || 1,
    estado: data.estado || 'En revisión',
    archivoUrl: data.archivoUrl,
    aprobadoPor: data.aprobadoPor,
    fechaAprobacion: data.fechaAprobacion,
    observaciones: data.observaciones,
    creadoPor: usuarioNombre || 'Técnica',
  }).returning();

  await registrarAuditoria(usuarioNombre, 'Subió catálogo', 'catalogos', id, `Catálogo ${data.titulo} registrado`);
  return created;
}

export async function getTipologias(lineaId?: string) {
  let tips;
  if (lineaId) {
    tips = await db.select().from(schema.tipologias).where(eq(schema.tipologias.lineaId, lineaId));
  } else {
    tips = await db.select().from(schema.tipologias);
  }

  const allVariantes = await db.select().from(schema.variantes);
  const varsMap: Record<string, any[]> = {};
  for (const v of allVariantes) {
    if (!varsMap[v.tipologiaId]) varsMap[v.tipologiaId] = [];
    varsMap[v.tipologiaId].push(v);
  }

  return tips.map(t => ({
    ...t,
    variantes: varsMap[t.id] || [],
  }));
}

export async function createTipologia(data: any, usuarioNombre: string) {
  const id = data.id || generateId('tip');
  const [created] = await db.insert(schema.tipologias).values({
    id,
    lineaId: data.lineaId,
    lineaNombre: data.lineaNombre,
    catalogoId: data.catalogoId,
    nombre: data.nombre,
    codigo: data.codigo,
    descripcion: data.descripcion,
    paginaOrigen: data.paginaOrigen || 1,
    estadoRevision: data.estadoRevision || 'Aprobado',
    modificadoPorMazzola: false,
    creadoPor: usuarioNombre || 'Técnica',
  }).returning();

  await registrarAuditoria(usuarioNombre, 'Creó tipología', 'tipologias', id, `Tipología ${data.nombre} creada`);
  return created;
}

export async function getPerfiles(lineaId?: string, marcaId?: string) {
  if (lineaId) {
    return await db.select().from(schema.perfiles).where(eq(schema.perfiles.lineaId, lineaId));
  }
  if (marcaId) {
    return await db.select().from(schema.perfiles).where(eq(schema.perfiles.marcaId, marcaId));
  }
  return await db.select().from(schema.perfiles);
}

export async function createPerfil(data: any, usuarioNombre: string) {
  const id = data.id || generateId('perf');
  const [created] = await db.insert(schema.perfiles).values({
    id,
    marcaId: data.marcaId,
    marcaNombre: data.marcaNombre,
    lineaId: data.lineaId,
    lineaNombre: data.lineaNombre,
    catalogoId: data.catalogoId,
    codigo: data.codigo,
    nombre: data.nombre,
    descripcion: data.descripcion,
    funcion: data.funcion,
    largoComercial: String(data.largoComercial || 6),
    pesoPorMetro: String(data.pesoPorMetro || 0),
    paginaOrigen: data.paginaOrigen || 1,
    estado: 'Activo',
    estadoRevision: data.estadoRevision || 'Aprobado',
    creadoPor: usuarioNombre || 'Técnica',
  }).returning();

  await registrarAuditoria(usuarioNombre, 'Creó perfil', 'perfiles', id, `Perfil ${data.codigo} - ${data.nombre} creado`);
  return created;
}

export async function getReglasTecnicas(tipologiaId?: string) {
  if (tipologiaId) {
    return await db.select().from(schema.reglasTecnicas).where(eq(schema.reglasTecnicas.tipologiaId, tipologiaId));
  }
  return await db.select().from(schema.reglasTecnicas);
}

export async function createReglaTecnica(data: any, usuarioNombre: string) {
  const id = data.id || generateId('reg');
  const [created] = await db.insert(schema.reglasTecnicas).values({
    id,
    tipologiaId: data.tipologiaId,
    varianteId: data.varianteId,
    componenteFuncionId: data.componenteFuncionId,
    funcionNombre: data.funcionNombre,
    perfilId: data.perfilId,
    perfilCodigo: data.perfilCodigo,
    perfilNombre: data.perfilNombre,
    cantidad: data.cantidad,
    formula: data.formula,
    corteA: data.corteA,
    corteB: data.corteB,
    orientacion: data.orientacion,
    mecanizado: data.mecanizado,
    paginaOrigen: data.paginaOrigen || 1,
    estadoRevision: data.estadoRevision || 'Aprobado',
    creadoPor: usuarioNombre || 'Técnica',
  }).returning();

  await registrarAuditoria(usuarioNombre, 'Creó regla técnica', 'reglas_tecnicas', id, `Regla para ${data.perfilCodigo}: ${data.formula}`);
  return created;
}

// REVISIÓN TÉCNICA MAZZOLA
export async function aplicarRevisionTecnica(
  tipoItem: 'tipologia' | 'perfil' | 'regla',
  id: string,
  accion: 'aprobar' | 'rechazar' | 'modificar',
  modificaciones: any,
  notas: string,
  usuarioNombre: string
) {
  let nuevoEstado = 'Aprobado';
  if (accion === 'rechazar') nuevoEstado = 'Rechazado';
  if (accion === 'modificar') nuevoEstado = 'Modificado por Mazzola';

  if (tipoItem === 'tipologia') {
    const [updated] = await db.update(schema.tipologias).set({
      estadoRevision: nuevoEstado,
      modificadoPorMazzola: accion === 'modificar',
      notasMazzola: notas,
      ...(modificaciones || {}),
    }).where(eq(schema.tipologias.id, id)).returning();
    await registrarAuditoria(usuarioNombre, `Revisión ${accion}`, 'tipologias', id, `Tipología ${id} ${accion}`);
    return updated;
  } else if (tipoItem === 'perfil') {
    const [updated] = await db.update(schema.perfiles).set({
      estadoRevision: nuevoEstado,
      modificadoPorMazzola: accion === 'modificar',
      notasMazzola: notas,
      ...(modificaciones || {}),
    }).where(eq(schema.perfiles.id, id)).returning();
    await registrarAuditoria(usuarioNombre, `Revisión ${accion}`, 'perfiles', id, `Perfil ${id} ${accion}`);
    return updated;
  } else if (tipoItem === 'regla') {
    const [updated] = await db.update(schema.reglasTecnicas).set({
      estadoRevision: nuevoEstado,
      modificadoPorMazzola: accion === 'modificar',
      notasMazzola: notas,
      ...(modificaciones || {}),
    }).where(eq(schema.reglasTecnicas.id, id)).returning();
    await registrarAuditoria(usuarioNombre, `Revisión ${accion}`, 'reglas_tecnicas', id, `Regla técnica ${id} ${accion}`);
    return updated;
  }
}

// AUDITORÍA / HISTORIAL
export async function getHistorialAuditoria(limit = 100) {
  return await db.select().from(schema.historial).orderBy(desc(schema.historial.createdAt)).limit(limit);
}

// USUARIOS
export async function getUsuarios() {
  const users = await db.select({
    id: schema.usuarios.id,
    usuario: schema.usuarios.usuario,
    nombre: schema.usuarios.nombre,
    email: schema.usuarios.email,
    rol: schema.usuarios.rol,
    activo: schema.usuarios.activo,
    ultimoAcceso: schema.usuarios.ultimoAcceso,
    createdAt: schema.usuarios.createdAt,
  }).from(schema.usuarios);
  return users;
}

export async function createUsuario(data: any, usuarioCreador: string) {
  const id = data.id || generateId('usr');
  const passwordHash = bcrypt.hashSync(data.password || 'mazzola2026', 10);

  const [created] = await db.insert(schema.usuarios).values({
    id,
    usuario: data.usuario.toLowerCase().trim(),
    nombre: data.nombre,
    email: data.email,
    passwordHash,
    rol: data.rol || 'Ventas',
    activo: data.activo !== undefined ? data.activo : true,
  }).returning({
    id: schema.usuarios.id,
    usuario: schema.usuarios.usuario,
    nombre: schema.usuarios.nombre,
    email: schema.usuarios.email,
    rol: schema.usuarios.rol,
    activo: schema.usuarios.activo,
    createdAt: schema.usuarios.createdAt,
  });

  await registrarAuditoria(
    usuarioCreador,
    'Creó usuario',
    'usuarios',
    created.usuario,
    `Usuario ${created.usuario} (${created.rol}) creado`
  );

  return created;
}

// BACKUP COMPLETO DE LA BASE DE DATOS
export async function exportarBackupCompleto() {
  const timestamp = new Date().toISOString();
  const [
    usuariosList,
    clientesList,
    presupuestosList,
    itemsList,
    ventasList,
    reparacionesList,
    ordenesList,
    marcasList,
    lineasList,
    catalogosList,
    tipologiasList,
    variantesList,
    perfilesList,
    reglasList,
    reglasVidriosList,
    reglasAccesoriosList,
    sobrantesList,
    historialList,
  ] = await Promise.all([
    db.select().from(schema.usuarios),
    db.select().from(schema.clientes),
    db.select().from(schema.presupuestos),
    db.select().from(schema.itemsPresupuesto),
    db.select().from(schema.ventasRapidas),
    db.select().from(schema.reparaciones),
    db.select().from(schema.ordenesFabricacion),
    db.select().from(schema.marcas),
    db.select().from(schema.lineas),
    db.select().from(schema.catalogos),
    db.select().from(schema.tipologias),
    db.select().from(schema.variantes),
    db.select().from(schema.perfiles),
    db.select().from(schema.reglasTecnicas),
    db.select().from(schema.reglasVidrios),
    db.select().from(schema.reglasAccesorios),
    db.select().from(schema.sobrantes),
    db.select().from(schema.historial),
  ]);

  // Sanitize users (do not export hashes in plain backup download)
  const safeUsers = usuariosList.map(u => ({
    id: u.id,
    usuario: u.usuario,
    nombre: u.nombre,
    email: u.email,
    rol: u.rol,
    activo: u.activo,
  }));

  return {
    version: '7.0',
    app: 'Aberturas Mazzola - Sistema Integral',
    fechaBackup: timestamp,
    totalEntidades: {
      usuarios: safeUsers.length,
      clientes: clientesList.length,
      presupuestos: presupuestosList.length,
      itemsPresupuesto: itemsList.length,
      ventasRapidas: ventasList.length,
      reparaciones: reparacionesList.length,
      ordenesFabricacion: ordenesList.length,
      marcas: marcasList.length,
      lineas: lineasList.length,
      catalogos: catalogosList.length,
      tipologias: tipologiasList.length,
      variantes: variantesList.length,
      perfiles: perfilesList.length,
      reglasTecnicas: reglasList.length,
      reglasVidrios: reglasVidriosList.length,
      reglasAccesorios: reglasAccesoriosList.length,
      sobrantes: sobrantesList.length,
      historial: historialList.length,
    },
    datos: {
      usuarios: safeUsers,
      clientes: clientesList,
      presupuestos: presupuestosList,
      itemsPresupuesto: itemsList,
      ventasRapidas: ventasList,
      reparaciones: reparacionesList,
      ordenesFabricacion: ordenesList,
      marcas: marcasList,
      lineas: lineasList,
      catalogos: catalogosList,
      tipologias: tipologiasList,
      variantes: variantesList,
      perfiles: perfilesList,
      reglasTecnicas: reglasList,
      reglasVidrios: reglasVidriosList,
      reglasAccesorios: reglasAccesoriosList,
      sobrantes: sobrantesList,
      historial: historialList,
    }
  };
}

/**
 * Restaurar backup completo en PostgreSQL
 * Respeta la integridad referencial y nunca borra datos que no estén en conflicto
 */
export async function restaurarBackupCompleto(backupData: any, usuarioRestaurador: string): Promise<{ success: boolean; entidadesRestauradas: Record<string, number> }> {
  if (!backupData || !backupData.datos) {
    throw new Error('Formato de backup inválido: faltan los datos principales.');
  }

  const { datos } = backupData;
  const contador: Record<string, number> = {};

  // 1. Clientes
  if (Array.isArray(datos.clientes)) {
    for (const c of datos.clientes) {
      await db.insert(schema.clientes).values({
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono || '',
        email: c.email || '',
        direccion: c.direccion || '',
        cuit: c.cuit || c.cuitDni || '',
        condicionIva: c.condicionIva || c.categoriaIva || 'Consumidor Final',
        historialCompras: c.historialCompras || 0,
        totalGastado: String(c.totalGastado || 0),
        notas: c.notas || c.observaciones || '',
        creadoPor: c.creadoPor || usuarioRestaurador,
      }).onConflictDoNothing();
    }
    contador.clientes = datos.clientes.length;
  }

  // 2. Presupuestos e Ítems
  if (Array.isArray(datos.presupuestos)) {
    for (const p of datos.presupuestos) {
      await db.insert(schema.presupuestos).values({
        id: p.id,
        numero: p.numero || p.numeroPresupuesto || `PRE-${Date.now()}`,
        clienteId: p.clienteId || null,
        clienteNombre: p.clienteNombre || 'Consumidor Final',
        clienteTelefono: p.clienteTelefono || '',
        clienteEmail: p.clienteEmail || '',
        clienteDireccion: p.clienteDireccion || '',
        totalVenta: String(p.totalVenta || p.total || 0),
        descuentoPorcentaje: Number(p.descuentoPorcentaje) || 0,
        costoInterno: String(p.costoInterno || p.costoEstimadoTotal || 0),
        ganancia: String(p.ganancia || p.margenGananciaTotal || 0),
        estado: p.estado || 'Pendiente',
        validezDias: Number(p.validezDias) || 15,
        fecha: p.fecha || new Date().toISOString(),
        notas: p.notas || p.observaciones || '',
        creadoPor: p.creadoPor || usuarioRestaurador,
      }).onConflictDoNothing();
    }
    contador.presupuestos = datos.presupuestos.length;
  }

  if (Array.isArray(datos.itemsPresupuesto)) {
    for (const it of datos.itemsPresupuesto) {
      await db.insert(schema.itemsPresupuesto).values({
        id: it.id,
        presupuestoId: it.presupuestoId,
        tipologia: it.tipologia,
        linea: it.linea || 'Línea Herrero',
        marca: it.marca || 'MDT',
        variante: it.variante || '',
        anchoMm: Number(it.anchoMm) || 1000,
        altoMm: Number(it.altoMm) || 1000,
        cantidad: Number(it.cantidad) || 1,
        color: it.color || 'Blanco',
        vidrio: it.vidrio || 'Simple',
        tieneMosquitero: Boolean(it.tieneMosquitero ?? it.accesorios?.mosquitero),
        precioMosquitero: String(it.precioMosquitero || it.accesorios?.precioMosquitero || 0),
        tieneReja: Boolean(it.tieneReja ?? it.accesorios?.reja),
        precioReja: String(it.precioReja || it.accesorios?.precioReja || 0),
        tieneTransporte: Boolean(it.tieneTransporte ?? it.accesorios?.transporte),
        precioTransporte: String(it.precioTransporte || it.accesorios?.precioTransporte || 0),
        tieneInstalacion: Boolean(it.tieneInstalacion ?? it.accesorios?.instalacion),
        precioInstalacion: String(it.precioInstalacion || it.accesorios?.precioInstalacion || 0),
        otrosAccesorios: it.otrosAccesorios || it.accesorios?.otros || '',
        precioOtros: String(it.precioOtros || it.accesorios?.precioOtros || 0),
        precioUnitario: String(it.precioUnitario || 0),
        precioTotalItem: String(it.precioTotalItem || it.precioTotal || 0),
        notasItem: it.notasItem || it.observaciones || '',
        unidadIngreso: it.unidadIngreso || 'mm',
      }).onConflictDoNothing();
    }
    contador.itemsPresupuesto = datos.itemsPresupuesto.length;
  }

  // 3. Ventas Rápidas
  if (Array.isArray(datos.ventasRapidas)) {
    for (const vr of datos.ventasRapidas) {
      await db.insert(schema.ventasRapidas).values({
        id: vr.id,
        numero: vr.numero || vr.numeroVenta || `VR-${Date.now()}`,
        clienteNombre: vr.clienteNombre || 'Mostrador / Particular',
        items: vr.items || [],
        total: String(vr.total || 0),
        costo: String(vr.costo || vr.costoTotal || 0),
        metodoPago: vr.metodoPago || 'Efectivo',
        fecha: vr.fecha || new Date().toISOString(),
        creadoPor: vr.creadoPor || usuarioRestaurador,
      }).onConflictDoNothing();
    }
    contador.ventasRapidas = datos.ventasRapidas.length;
  }

  // 4. Reparaciones
  if (Array.isArray(datos.reparaciones)) {
    for (const rep of datos.reparaciones) {
      await db.insert(schema.reparaciones).values({
        id: rep.id,
        numero: rep.numero || rep.numeroTicket || `REP-${Date.now()}`,
        clienteId: rep.clienteId || null,
        clienteNombre: rep.clienteNombre || 'Cliente Reparación',
        clienteTelefono: rep.clienteTelefono || '',
        trabajo: rep.trabajo || rep.tipoTrabajo || 'Reparación de Abertura',
        tipoFrecuente: rep.tipoFrecuente || 'Mantenimiento General',
        materialesTexto: rep.materialesTexto || (Array.isArray(rep.repuestosUtilizados) ? rep.repuestosUtilizados.join(', ') : ''),
        materiales: String(rep.materiales || rep.costoRepuestos || 0),
        manoDeObra: String(rep.manoDeObra || rep.costoManoObra || 0),
        costo: String(rep.costo || rep.costoTotal || 0),
        precioCobrado: String(rep.precioCobrado || 0),
        ganancia: String(rep.ganancia || 0),
        estado: rep.estado || 'Recibido',
        fecha: rep.fecha || rep.fechaIngreso || new Date().toISOString(),
        observaciones: rep.observaciones || '',
        creadoPor: rep.creadoPor || usuarioRestaurador,
      }).onConflictDoNothing();
    }
    contador.reparaciones = datos.reparaciones.length;
  }

  // 5. Órdenes de Fabricación
  if (Array.isArray(datos.ordenesFabricacion)) {
    for (const ofab of datos.ordenesFabricacion) {
      await db.insert(schema.ordenesFabricacion).values({
        id: ofab.id,
        numeroOrden: ofab.numeroOrden || ofab.numero || `OF-${Date.now()}`,
        presupuestoId: ofab.presupuestoId || 'pre-manual',
        numeroPresupuesto: ofab.numeroPresupuesto || 'PRE-MANUAL',
        clienteNombre: ofab.clienteNombre || 'Cliente General',
        itemIndex: Number(ofab.itemIndex) || 0,
        itemData: ofab.itemData || ofab.itemJson || ofab.item || {},
        tipologiaNombre: ofab.tipologiaNombre || '',
        varianteNombre: ofab.varianteNombre || '',
        medidasStr: ofab.medidasStr || '',
        cantidadTotal: Number(ofab.cantidadTotal) || 1,
        estadoFabrica: ofab.estadoFabrica || 'Por Iniciar',
        prioridad: ofab.prioridad || 'Normal',
        enfoqueOptimizacion: ofab.enfoqueOptimizacion || 'material',
        datosCalculados: ofab.datosCalculados || ofab.datosCalculadosJson || {},
        datosReales: ofab.datosReales || ofab.datosRealesJson || {},
        listaCorte: ofab.listaCorte || ofab.listaCorteJson || [],
        listaVidrios: ofab.listaVidrios || ofab.listaVidriosJson || [],
        listaAccesorios: ofab.listaAccesorios || ofab.listaAccesoriosJson || [],
        sobrantesAsignados: ofab.sobrantesAsignados || ofab.sobrantesAsignadosJson || [],
        fechaIngreso: ofab.fechaIngreso || new Date().toISOString(),
        observacionesFabrica: ofab.observacionesFabrica || '',
        creadoPor: ofab.creadoPor || usuarioRestaurador,
      }).onConflictDoNothing();
    }
    contador.ordenesFabricacion = datos.ordenesFabricacion.length;
  }

  // 6. Sobrantes / Retazos
  if (Array.isArray(datos.sobrantes)) {
    for (const sob of datos.sobrantes) {
      await db.insert(schema.sobrantes).values({
        id: sob.id,
        perfilCodigo: sob.perfilCodigo,
        perfilNombre: sob.perfilNombre,
        longitudMm: sob.longitudMm,
        cantidad: sob.cantidad || 1,
        ubicacion: sob.ubicacion || 'Pañol',
        estado: sob.estado || 'Disponible',
        fecha: sob.fecha,
        origenOrdenId: sob.origenOrdenId || null,
        origenTipo: sob.origenTipo || 'Corte',
        observaciones: sob.observaciones || '',
        aprovechable: sob.aprovechable ?? true,
      }).onConflictDoNothing();
    }
    contador.sobrantes = datos.sobrantes.length;
  }

  // 7. Reglas de Vidrios y Accesorios
  if (Array.isArray(datos.reglasVidrios)) {
    for (const rv of datos.reglasVidrios) {
      await db.insert(schema.reglasVidrios).values({
        id: rv.id,
        tipologiaId: rv.tipologiaId,
        pieza: rv.pieza,
        formulaAncho: rv.formulaAncho,
        formulaAlto: rv.formulaAlto,
        cantidadPorAbertura: rv.cantidadPorAbertura,
        espesorTipoSugerido: rv.espesorTipoSugerido || '',
        observaciones: rv.observaciones || '',
        fuenteTecnica: rv.fuenteTecnica || '',
        estadoRevision: rv.estadoRevision || 'Aprobado',
        creadoPor: rv.creadoPor || 'Sistema',
      }).onConflictDoNothing();
    }
    contador.reglasVidrios = datos.reglasVidrios.length;
  }

  if (Array.isArray(datos.reglasAccesorios)) {
    for (const ra of datos.reglasAccesorios) {
      await db.insert(schema.reglasAccesorios).values({
        id: ra.id,
        tipologiaId: ra.tipologiaId,
        codigo: ra.codigo,
        nombre: ra.nombre,
        funcion: ra.funcion || '',
        cantidadPorAbertura: ra.cantidadPorAbertura,
        unidad: ra.unidad || 'U',
        observaciones: ra.observaciones || '',
        fuenteTecnica: ra.fuenteTecnica || '',
        estadoRevision: ra.estadoRevision || 'Aprobado',
        creadoPor: ra.creadoPor || 'Sistema',
      }).onConflictDoNothing();
    }
    contador.reglasAccesorios = datos.reglasAccesorios.length;
  }

  await registrarAuditoria(
    usuarioRestaurador,
    'Restauración de Base de Datos',
    'base_datos',
    'restore',
    `Restauración completa realizada con éxito. Entidades procesadas: ${JSON.stringify(contador)}`
  );

  return {
    success: true,
    entidadesRestauradas: contador,
  };
}

/**
 * Restablecer contraseña de administrador de forma segura mediante Clave Maestra
 * Sin exponer nunca contraseñas actuales
 */
export async function restablecerPasswordAdmin(
  usuario: string,
  recoveryKey: string,
  nuevaPassword: string,
  operadorIp?: string
): Promise<{ success: boolean; message: string }> {
  const MASTER_KEY = process.env.ADMIN_RECOVERY_KEY || 'MAZZOLA-REC-2026-SEGURA';

  if (!recoveryKey || recoveryKey.trim() !== MASTER_KEY.trim()) {
    await registrarAuditoria(
      'Sistema de Seguridad',
      'Intento fallido de recuperación',
      'usuarios',
      usuario,
      `Intento fallido de restablecer contraseña para usuario ${usuario} desde ${operadorIp || 'IP desconocida'}`
    );
    throw new Error('Clave Maestra de Recuperación inválida. No se autoriza el cambio.');
  }

  if (!nuevaPassword || nuevaPassword.length < 6) {
    throw new Error('La nueva contraseña debe contener al menos 6 caracteres.');
  }

  const cleanUser = (usuario || 'admin').toLowerCase().trim();
  const [user] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.usuario, cleanUser));

  if (!user) {
    throw new Error('Usuario administrador no encontrado en el sistema.');
  }

  if (user.rol !== 'Administrador') {
    throw new Error('Solo los usuarios con rol de Administrador pueden recuperarse por esta vía.');
  }

  const newHash = bcrypt.hashSync(nuevaPassword, 10);

  await db.update(schema.usuarios)
    .set({ passwordHash: newHash })
    .where(eq(schema.usuarios.id, user.id));

  await registrarAuditoria(
    'Administrador Mazzola',
    'Contraseña Restablecida',
    'usuarios',
    user.id,
    `Se restableció de forma segura la contraseña del usuario ${cleanUser} mediante clave maestra.`
  );

  return {
    success: true,
    message: 'Contraseña de administrador actualizada exitosamente.',
  };
}
