// Export all personas from the SQLite DB as JSON
import db from '../db/db.js';
import fs from 'fs';

const rows = db.prepare(`
  SELECT * FROM personalities
`).all();

fs.writeFileSync('personas_export.json', JSON.stringify(rows, null, 2));

console.log(`Exported ${rows.length} personas to personas_export.json`);