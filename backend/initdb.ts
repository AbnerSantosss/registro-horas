import { initDb } from './src/db.js';
import prisma from './src/prisma.js';

async function main() {
  await initDb();
  console.log('Database initialized');
  const users = await prisma.user.findMany();
  console.log('Users:', users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
