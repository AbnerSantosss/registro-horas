import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.DATABASE_URL;
  console.log('Connecting to', url.substring(0, 30) + '...');
  const pool = mysql.createPool(url);
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS brands (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(50) NOT NULL DEFAULT '#6366f1',
        logo_url VARCHAR(500),
        icon_url VARCHAR(500),
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(query);
    console.log('Created brands table!');

    const seed = `
      INSERT IGNORE INTO brands (id, name, color, logo_url, icon_url) VALUES 
      ('geralbet', 'Geralbet', '#e63232', '/logos/geralbet-azul.png', '/logos/icon_geralbet_azul.png'),
      ('liderbet', 'Liderbet', '#E03326', '/logos/liderbet-preto.png', '/logos/icon_liderbet_preto.png'),
      ('certeiro', 'Certeiro FC', '#fac302', '/logos/Certeiro - Logo.png', '/logos/icon_certeiro.png')
    `;
    await pool.query(seed);
    console.log('Seeded brands!');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
