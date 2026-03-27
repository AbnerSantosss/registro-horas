import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Setup Multer for Icons
const uploadsDir = path.resolve(import.meta.dirname, '..', '..', 'uploads', 'platforms');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});
const uploadIcon = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP and SVG images are allowed'));
    }
  },
});


// Requer autenticação em todas rotas
router.use(authenticate);

// Listar todas plataformas
router.get('/', async (req, res) => {
  try {
    const platforms = await prisma.platform.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(platforms);
  } catch (error) {
    console.error('Erro ao listar plataformas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar plataforma
router.post('/', async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    // Gera um ID simples a partir do nome se não houver
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const newPlatform = await prisma.platform.create({
      data: {
        id,
        name,
        color: color || '#888888',
        icon: icon || 'link',
      },
    });

    res.status(201).json(newPlatform);
  } catch (error: any) {
    console.error('Erro ao criar plataforma:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Uma plataforma com esse nome/ID já existe' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar plataforma
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, icon } = req.body;

    const updated = await prisma.platform.update({
      where: { id },
      data: { name, color, icon },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar plataforma:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar plataforma
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.platform.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao deletar plataforma:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Upload de formato personalizado (ícone da plataforma)
router.post('/upload-icon', uploadIcon.single('icon'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const iconUrl = `/uploads/platforms/${req.file.filename}`;
    res.json({ url: iconUrl });
  } catch (error) {
    console.error('Upload icon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
