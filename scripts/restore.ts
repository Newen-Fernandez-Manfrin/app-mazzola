import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { restaurarBackupCompleto } from '../src/db/repository.ts';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Uso: npx tsx scripts/restore.ts <ruta-al-archivo-backup.json>');
    process.exit(1);
  }

  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: El archivo "${resolved}" no existe.`);
    process.exit(1);
  }

  console.log(`[Mazzola Restore CLI] Leyendo archivo de backup: ${resolved}`);
  try {
    const raw = fs.readFileSync(resolved, 'utf-8');
    const backupData = JSON.parse(raw);

    console.log('[Mazzola Restore CLI] Restaurando datos en PostgreSQL...');
    const res = await restaurarBackupCompleto(backupData, 'CLI Admin');

    console.log('====================================================');
    console.log('✓ RESTAURACIÓN COMPLETADA CON ÉXITO');
    console.log('Entidades restauradas/actualizadas:');
    console.table(res.entidadesRestauradas);
    console.log('====================================================');
    process.exit(0);
  } catch (err: any) {
    console.error('Error restaurando backup:', err);
    process.exit(1);
  }
}

main();
