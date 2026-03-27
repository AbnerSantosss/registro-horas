import 'dotenv/config';
import prisma from './prisma.js';

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS platforms (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      color VARCHAR(50) DEFAULT '#000000' NOT NULL,
      icon VARCHAR(50) DEFAULT 'link' NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    )
  `);
  console.log('Platforms table created');
}

main().catch(console.error).finally(() => prisma.$disconnect());
