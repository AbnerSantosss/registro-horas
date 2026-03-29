import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
// Load .env relative to current working directory
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js';
import tagRoutes from './routes/tags.js';
import profileRoutes from './routes/profile.js';
import platformRoutes from './routes/platforms.js';
import brandRoutes from './routes/brands.js';
import notificationRoutes from './routes/notifications.js';
import cronRoutes from './routes/cron.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:5173', 'http://localhost:3000'],
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
app.use('/api/brands', brandRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cron', cronRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ambiente: process.env.NODE_ENV });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  initDb().then(() => {
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  });
}

// Export the express app for Vercel
export default app;