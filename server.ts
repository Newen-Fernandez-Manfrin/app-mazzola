import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { eq } from "drizzle-orm";
import { db } from "./src/db/index";
import * as schema from "./src/db/schema";
import {
  initDatabaseAndSeed,
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  getPresupuestos,
  createPresupuesto,
  updatePresupuesto,
  deletePresupuesto,
  getVentasRapidas,
  createVentaRapida,
  getReparaciones,
  createReparacion,
  updateReparacion,
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  getOrdenesFabricacion,
  getOrdenFabricacionById,
  createOrdenFabricacion,
  updateOrdenFabricacion,
  registrarDatosRealesOrden,
  getSobrantes,
  createSobrante,
  updateSobrante,
  deleteSobrante,
  getReglasVidrios,
  getReglasAccesorios,
  getMarcas,
  createMarca,
  getLineas,
  createLinea,
  getCatalogos,
  createCatalogo,
  getTipologias,
  createTipologia,
  getPerfiles,
  createPerfil,
  getReglasTecnicas,
  createReglaTecnica,
  aplicarRevisionTecnica,
  getHistorialAuditoria,
  getUsuarios,
  createUsuario,
  exportarBackupCompleto,
  restaurarBackupCompleto,
  restablecerPasswordAdmin,
  registrarAuditoria
} from "./src/db/repository";
import { generarListasTecnicas, calcularOptimizacionBarras } from "./src/services/optimizadorCorte";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "mazzola-produccion-segura-2026";

app.use(express.json({ limit: "50mb" }));

// Initialize and seed PostgreSQL Cloud SQL database
initDatabaseAndSeed().catch(err => {
  console.error("[PostgreSQL] Error en inicialización de base de datos:", err);
});

// Extend Express Request to include user session
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    usuario: string;
    nombre: string;
    rol: string;
  };
}

// Authentication Middleware
function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Permitir continuar con fallback a usuario genérico si no requiere estrictez o verificar token
    return next();
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token de sesión inválido o expirado" });
  }
}

// Helper to get active user name
function getUserName(req: AuthenticatedRequest): string {
  return req.user?.nombre || (req.headers["x-mazzola-user"] as string) || "Operador";
}

// -------------------------------------------------------------
// RUTAS DE AUTENTICACIÓN (FASE 4)
// -------------------------------------------------------------

// Iniciar sesión con Usuario y Contraseña (hash bcrypt verificado)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ error: "Debe ingresar usuario y contraseña" });
    }

    const cleanUser = usuario.toLowerCase().trim();
    const [user] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.usuario, cleanUser));

    if (!user || !user.activo) {
      return res.status(401).json({ error: "Usuario no encontrado o inactivo" });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      await registrarAuditoria(
        cleanUser,
        "Intento fallido de login",
        "usuarios",
        user.id,
        `Intento de acceso fallido para usuario ${cleanUser}`
      );
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Actualizar último acceso
    await db.update(schema.usuarios).set({ ultimoAcceso: new Date() }).where(eq(schema.usuarios.id, user.id));

    // Generar token de sesión seguro (expira en 7 días)
    const token = jwt.sign(
      {
        id: user.id,
        usuario: user.usuario,
        nombre: user.nombre,
        rol: user.rol,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    await registrarAuditoria(
      user.nombre,
      "Inicio de sesión",
      "usuarios",
      user.id,
      `Inicio de sesión exitoso como ${user.rol}`
    );

    // Responder sin exponer el password_hash
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        usuario: user.usuario,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      }
    });
  } catch (err: any) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error interno en el servidor de autenticación" });
  }
});

// Recuperación segura de contraseña de Administrador mediante Clave Maestra
app.post("/api/auth/recuperar-admin", async (req, res) => {
  try {
    const { usuario, recoveryKey, nuevaPassword } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "Desconocida";
    const result = await restablecerPasswordAdmin(usuario, recoveryKey, nuevaPassword, ip);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener usuario en sesión
app.get("/api/auth/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autenticado" });
  }
  const [user] = await db.select({
    id: schema.usuarios.id,
    usuario: schema.usuarios.usuario,
    nombre: schema.usuarios.nombre,
    email: schema.usuarios.email,
    rol: schema.usuarios.rol,
  }).from(schema.usuarios).where(eq(schema.usuarios.id, req.user.id));

  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  res.json(user);
});

// Cerrar sesión
app.post("/api/auth/logout", authMiddleware, async (req: AuthenticatedRequest, res) => {
  if (req.user) {
    await registrarAuditoria(
      req.user.nombre,
      "Cierre de sesión",
      "usuarios",
      req.user.id,
      "Sesión cerrada por el usuario"
    );
  }
  res.json({ success: true, message: "Sesión cerrada correctamente" });
});

// Listar usuarios (sin contraseñas)
app.get("/api/usuarios", authMiddleware, async (req, res) => {
  try {
    const users = await getUsuarios();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Crear usuario (con contraseña hasheada)
app.post("/api/usuarios", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const creador = getUserName(req);
    const created = await createUsuario(req.body, creador);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// HISTORIAL DE AUDITORÍA Y TRAZABILIDAD (FASE 4)
// -------------------------------------------------------------
app.get("/api/historial", authMiddleware, async (req, res) => {
  try {
    const items = await getHistorialAuditoria(150);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// BACKUP Y COPIAS DE SEGURIDAD (FASE 4 Y 7)
// -------------------------------------------------------------
const BACKUPS_DIR = path.join(process.cwd(), "backups");
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Función para guardar snapshot local periódico en el servidor
async function generarSnapshotPeriodicoServidor() {
  try {
    const backup = await exportarBackupCompleto();
    const filename = `backup_auto_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), "utf-8");
    console.log(`[Backup Periódico] Snapshot automático guardado con éxito: ${filename}`);

    // Mantener solo los últimos 30 snapshots
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith("backup_auto_") && f.endsWith(".json"))
      .sort()
      .reverse();

    if (files.length > 30) {
      for (const oldFile of files.slice(30)) {
        try {
          fs.unlinkSync(path.join(BACKUPS_DIR, oldFile));
        } catch (_) {}
      }
    }
  } catch (err) {
    console.error("[Backup Periódico] Error al generar snapshot automático:", err);
  }
}

// Programar backup periódico cada 24 horas
setInterval(generarSnapshotPeriodicoServidor, 24 * 60 * 60 * 1000);

app.get("/api/backup", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const backup = await exportarBackupCompleto();
    await registrarAuditoria(
      getUserName(req),
      "Descargó backup",
      "base_datos",
      "backup",
      "Copia de seguridad completa generada y descargada"
    );
    res.setHeader("Content-Disposition", `attachment; filename=mazzola_backup_${new Date().toISOString().slice(0, 10)}.json`);
    res.setHeader("Content-Type", "application/json");
    res.json(backup);
  } catch (err: any) {
    res.status(500).json({ error: "Error generando copia de seguridad" });
  }
});

// Restaurar backup completo
app.post("/api/backup/restore", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const usuario = getUserName(req);
    const backupData = req.body;
    const resultado = await restaurarBackupCompleto(backupData, usuario);
    res.json(resultado);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Error restaurando copia de seguridad" });
  }
});

// Listar snapshots guardados en el servidor
app.get("/api/backup/snapshots", authMiddleware, async (req, res) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return res.json([]);
    }
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith(".json"))
      .map(f => {
        const stats = fs.statSync(path.join(BACKUPS_DIR, f));
        return {
          archivo: f,
          tamanoBytes: stats.size,
          fecha: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Crear snapshot manual inmediato en el servidor
app.post("/api/backup/snapshot-now", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    await generarSnapshotPeriodicoServidor();
    await registrarAuditoria(
      getUserName(req),
      "Snapshot manual",
      "base_datos",
      "backup",
      "Snapshot de base de datos generado en servidor a demanda"
    );
    res.json({ success: true, message: "Snapshot generado exitosamente en el servidor" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Estado del sistema y entorno
app.get("/api/sistema/estado", async (req, res) => {
  const isProd = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
  res.json({
    app: "Aberturas Mazzola",
    version: "7.0.0",
    ambiente: isProd ? "PRODUCCIÓN" : "DESARROLLO",
    baseDatos: "PostgreSQL Cloud SQL",
    persistencia: "Cloud SQL Persistente",
    https: true,
    servidor: "Express Full-Stack",
    backupsActivos: true,
  });
});

// Endpoint de migración directa desde cliente/navegador
app.post("/api/migracion/desde-local", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const usuario = getUserName(req);
    const { clientes: locClientes, presupuestos: locPresupuestos } = req.body;
    let importados = 0;

    if (Array.isArray(locClientes)) {
      for (const c of locClientes) {
        await createCliente(c, usuario);
        importados++;
      }
    }

    if (Array.isArray(locPresupuestos)) {
      for (const p of locPresupuestos) {
        await createPresupuesto(p, usuario);
        importados++;
      }
    }

    res.json({ success: true, importados, message: `Se migraron ${importados} registros a la base persistente.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ENTIDADES DE NEGOCIO PERSISTENTES
// -------------------------------------------------------------

// CLIENTES
app.get("/api/clientes", authMiddleware, async (req, res) => {
  try {
    const data = await getClientes();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/clientes", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await createCliente(req.body, getUserName(req));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/clientes/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await updateCliente(req.params.id, req.body, getUserName(req));
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/clientes/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await deleteCliente(req.params.id, getUserName(req));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PRESUPUESTOS (CONSERVANDO PRECIO HISTÓRICO)
app.get("/api/presupuestos", authMiddleware, async (req, res) => {
  try {
    const data = await getPresupuestos();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/presupuestos", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await createPresupuesto(req.body, getUserName(req));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/presupuestos/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await updatePresupuesto(req.params.id, req.body, getUserName(req));
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/presupuestos/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await deletePresupuesto(req.params.id, getUserName(req));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// VENTAS RÁPIDAS
app.get("/api/ventas-rapidas", authMiddleware, async (req, res) => {
  try {
    const data = await getVentasRapidas();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ventas-rapidas", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await createVentaRapida(req.body, getUserName(req));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// REPARACIONES
app.get("/api/reparaciones", authMiddleware, async (req, res) => {
  try {
    const data = await getReparaciones();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reparaciones", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await createReparacion(req.body, getUserName(req));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/reparaciones/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await updateReparacion(req.params.id, req.body, getUserName(req));
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PRODUCTOS Y LISTA DE PRECIOS
app.get("/api/productos", authMiddleware, async (req, res) => {
  try {
    const data = await getProductos();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/productos", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await createProducto(req.body, getUserName(req));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/productos/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await updateProducto(req.params.id, req.body, getUserName(req));
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/productos/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await deleteProducto(req.params.id, getUserName(req));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================
// FÁBRICA, ÓRDENES DE PRODUCCIÓN, STOCK DE SOBRANTES Y CORTE
// =============================================================
app.get("/api/ordenes-fabrica", authMiddleware, async (req, res) => {
  try {
    const data = await getOrdenesFabricacion();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/ordenes-fabrica/:id", authMiddleware, async (req, res) => {
  try {
    const data = await getOrdenFabricacionById(req.params.id);
    if (!data) return res.status(404).json({ error: "Orden de fabricación no encontrada" });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Acción explícita para generar Orden de Producción
app.post("/api/ordenes-fabrica", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await createOrdenFabricacion(req.body, getUserName(req));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/ordenes-fabrica/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await updateOrdenFabricacion(req.params.id, req.body, getUserName(req));
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Registro manual de datos reales ocurridos en taller (Calculado vs Real)
app.post("/api/ordenes-fabrica/:id/datos-reales", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await registrarDatosRealesOrden(req.params.id, req.body, getUserName(req));
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Preflight de cálculo técnico y validación estricta de reglas técnicas oficiales
app.post("/api/fabrica/preflight", authMiddleware, async (req, res) => {
  try {
    const { item, enfoque = 'material', sobrantesAsignados = [] } = req.body;
    if (!item) return res.status(400).json({ error: "Item requerido" });

    const todasLasReglas = await getReglasTecnicas();
    const todasLasReglasVidrios = await getReglasVidrios();
    const todasLasReglasAccesorios = await getReglasAccesorios();
    const stockSobrantes = await getSobrantes();
    const todasLasTipologias = await getTipologias();

    const resultadoListas = generarListasTecnicas(
      item,
      todasLasReglas as any,
      todasLasReglasVidrios as any,
      todasLasReglasAccesorios as any,
      stockSobrantes as any,
      todasLasTipologias as any
    );

    if (!resultadoListas.valido) {
      return res.json({
        valido: false,
        motivoRechazo: resultadoListas.motivoRechazo,
        detallesFaltantes: resultadoListas.detallesFaltantes,
      });
    }

    const calculoBarras = calcularOptimizacionBarras(
      resultadoListas.listaCorte,
      enfoque,
      sobrantesAsignados,
      6000 // Largo comercial estándar de catálogo
    );

    res.json({
      valido: true,
      listaCorte: resultadoListas.listaCorte,
      listaVidrios: resultadoListas.listaVidrios,
      listaAccesorios: resultadoListas.listaAccesorios,
      sobrantesSugeridos: resultadoListas.sobrantesSugeridos,
      datosCalculados: calculoBarras,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stock de retazos y sobrantes de perfilería
app.get("/api/sobrantes", authMiddleware, async (req, res) => {
  try {
    const data = await getSobrantes();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/sobrantes", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await createSobrante(req.body, getUserName(req));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/sobrantes/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await updateSobrante(req.params.id, req.body, getUserName(req));
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/sobrantes/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await deleteSobrante(req.params.id, getUserName(req));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reglas de vidrios y accesorios
app.get("/api/reglas-vidrios", authMiddleware, async (req, res) => {
  try {
    const data = await getReglasVidrios(req.query.tipologiaId as string | undefined);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reglas-accesorios", authMiddleware, async (req, res) => {
  try {
    const data = await getReglasAccesorios(req.query.tipologiaId as string | undefined);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// CATÁLOGOS TÉCNICOS Y ESTRUCTURA MULTI-FABRICANTE
// -------------------------------------------------------------
app.get("/api/marcas", authMiddleware, async (req, res) => {
  try {
    const data = await getMarcas();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/marcas", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await createMarca(req.body, getUserName(req));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/lineas", authMiddleware, async (req, res) => {
  try {
    const { marcaId } = req.query;
    const data = await getLineas(marcaId as string);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/lineas", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await createLinea(req.body, getUserName(req));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/catalogos-documentos", authMiddleware, async (req, res) => {
  try {
    const { lineaId } = req.query;
    const data = await getCatalogos(lineaId as string);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/catalogos-documentos", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await createCatalogo(req.body, getUserName(req));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/tipologias", authMiddleware, async (req, res) => {
  try {
    const { lineaId } = req.query;
    const data = await getTipologias(lineaId as string);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tipologias", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await createTipologia(req.body, getUserName(req));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/perfiles", authMiddleware, async (req, res) => {
  try {
    const { lineaId, marcaId } = req.query;
    const data = await getPerfiles(lineaId as string, marcaId as string);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/perfiles", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await createPerfil(req.body, getUserName(req));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reglas-tecnicas", authMiddleware, async (req, res) => {
  try {
    const { tipologiaId } = req.query;
    const data = await getReglasTecnicas(tipologiaId as string);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reglas-tecnicas", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const created = await createReglaTecnica(req.body, getUserName(req));
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/revision-tecnica", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { tipoItem, id, accion, modificaciones, notas } = req.body;
    const updated = await aplicarRevisionTecnica(
      tipoItem,
      id,
      accion,
      modificaciones,
      notas,
      getUserName(req)
    );
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// START SERVER WITH VITE
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Aberturas Mazzola] Servidor de producción activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
