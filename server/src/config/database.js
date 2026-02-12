import mysql from 'mysql2/promise';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  //  port: process.env.DB_PORT || 3306,
  // Don't set database here, schema.sql handles it
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

// simulate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initDB() {
  try {
    // Always resolve relative to this file
    const schemaPath = join(__dirname, '../../database/schema.sql');

    console.log(`📂 Using schema file: ${schemaPath}`);

    const schema = fs.readFileSync(schemaPath, 'utf8');

    const connection = await pool.getConnection();
    await connection.query(schema);
    connection.release();

    console.log('✅ Database schema initialized');
  } catch (err) {
    console.error('❌ Error initializing schema:');
    console.error(err);
  }
}

// default export = pool
export default pool;
// named export = initDB
export { initDB };
