import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const url = new URL(connectionString.replace('mysql://', 'http://'));

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 4000,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl: true,
  connectTimeout: 30000,
});
const prisma = new PrismaClient({ adapter });

export default prisma;
