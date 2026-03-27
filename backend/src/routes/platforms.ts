import { Router } from 'express';
import prisma from '../prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

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

export default router;
