import { Router } from 'express';
import prisma from '../prisma.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas.'));
    }
  }
});

// Create Brand
router.post('/', async (req, res) => {
  try {
    const { name, color, iconUrl, logoUrl } = req.body;
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const brand = await prisma.brand.create({
      data: {
        id,
        name,
        color: color || '#6366f1',
        iconUrl: iconUrl || null,
        logoUrl: logoUrl || null
      }
    });
    res.json(brand);
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ error: 'Erro ao criar marca.' });
  }
});

// Get Brands
router.get('/', async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Erro ao buscar marcas.' });
  }
});

// Update Brand
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, iconUrl, logoUrl } = req.body;

    const brand = await prisma.brand.update({
      where: { id },
      data: { name, color, iconUrl, logoUrl }
    });
    res.json(brand);
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ error: 'Erro ao atualizar marca.' });
  }
});

// Delete Brand
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.brand.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: 'Erro ao deletar marca.' });
  }
});

// Upload endpoint for Brand Logo
router.post('/upload-logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum logo enviado.' });
    }
    const base64Image = req.file.buffer.toString('base64');
    const url = `data:${req.file.mimetype};base64,${base64Image}`;
    res.json({ url });
  } catch (error) {
    console.error('Error uploading brand logo:', error);
    res.status(500).json({ error: 'Erro no upload do logo.' });
  }
});

// Upload endpoint for Brand Icon
router.post('/upload-icon', upload.single('icon'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum ícone enviado.' });
    }
    const base64Image = req.file.buffer.toString('base64');
    const url = `data:${req.file.mimetype};base64,${base64Image}`;
    res.json({ url });
  } catch (error) {
    console.error('Error uploading brand icon:', error);
    res.status(500).json({ error: 'Erro no upload do ícone.' });
  }
});

export default router;
