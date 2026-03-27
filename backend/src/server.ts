import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root (handles CWD being different from backend/)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import tagRoutes from './routes/tags.js';
import profileRoutes from './routes/profile.js';
import platformRoutes from './routes/platforms.js';


async function startServer() {
  // Ensure default admin user exists
  await initDb();

  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  }));
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tags', tagRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/platforms', platformRoutes);

  // Serve uploaded files (avatars)
  const uploadsDir = path.resolve(__dirname, '..', 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

startServer();
