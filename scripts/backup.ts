import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { exportarBackupCompleto } from '../src/db/repository.ts';

async function main() {
  console.log('[Mazzola Backup CLI] Conectando a la base de datos PostgreSQL...');
  try {
    const backup = await exportarBackupCompleto();
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mazzola_backup_${timestamp}.json`;
    const dest = path.join(backupsDir, filename);

    fs.writeFileSync(dest, JSON.stringify(backup, null, 2), 'utf-8');

    console.log('====================================================');
    console.log('✓ COPIA DE SEGURIDAD GENERADA CON ÉXITO');
    console.log(`Archivo: ${dest}`);
    console.log(`Fecha:   ${backup.fechaBackup}`);
    console.log('Entidades resguardadas:');
    console.table(backup.totalEntidades);
    console.log('====================================================');
    process.exit(0);
  } catch (err: any) {
    console.error('Error generando backup:', err);
    process.exit(1);
  }
}

main();
