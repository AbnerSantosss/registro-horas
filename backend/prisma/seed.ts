/// <reference types="node" />
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import mariadb from 'mariadb';
import bcrypt from 'bcryptjs';

const pool = mariadb.createPool({
  host: process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL.replace('mysql://', 'http://')).hostname
    : 'localhost',
  port: process.env.DATABASE_URL
    ? parseInt(new URL(process.env.DATABASE_URL.replace('mysql://', 'http://')).port || '3306')
    : 3306,
  user: process.env.DATABASE_URL
    ? decodeURIComponent(new URL(process.env.DATABASE_URL.replace('mysql://', 'http://')).username)
    : 'root',
  password: process.env.DATABASE_URL
    ? decodeURIComponent(new URL(process.env.DATABASE_URL.replace('mysql://', 'http://')).password)
    : '',
  database: process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL.replace('mysql://', 'http://')).pathname.slice(1).split('?')[0]
    : 'test',
  ssl: { rejectUnauthorized: true },
  connectionLimit: 5,
});

const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@runtask.com' },
  });

  if (!adminExists) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    await prisma.user.create({
      data: {
        id: 'admin-id-123',
        name: 'Admin User',
        email: 'admin@runtask.com',
        passwordHash,
        role: 'admin',
        position: 'Administrator',
      },
    });
    console.log('Default admin created: admin@runtask.com / admin123');
  } else {
    console.log('Admin user already exists, skipping seed.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
