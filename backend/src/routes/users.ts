import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();
const generateId = () => Math.random().toString(36).substring(2, 15);

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, position: true, brands: true },
    });
    res.json(users.map(u => ({
      ...u,
      brands: (() => { try { return JSON.parse(u.brands || '[]'); } catch { return []; } })(),
    })));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, email, password, role, position, brands } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password and role are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = generateId();
    const brandsJson = JSON.stringify(Array.isArray(brands) ? brands : []);

    await prisma.user.create({
      data: { id, name, email, passwordHash, role, position: position || '', brands: brandsJson },
    });

    // Send welcome email with credentials (non-blocking)
    const emailResult = await sendWelcomeEmail({ name, email, password, role, position });

    res.status(201).json({
      id, name, email, role,
      position: position || '',
      brands: JSON.parse(brandsJson),
      emailSent: emailResult.success,
      emailError: emailResult.error,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role, position, brands } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const updateData: Record<string, unknown> = {};
    if (role) updateData.role = role;
    if (position !== undefined) updateData.position = position;
    if (brands !== undefined) updateData.brands = JSON.stringify(Array.isArray(brands) ? brands : []);

    await prisma.user.update({ where: { id }, data: updateData });

    const updated = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, position: true, brands: true },
    });

    res.json({
      ...updated,
      brands: (() => { try { return JSON.parse(updated!.brands || '[]'); } catch { return []; } })(),
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Não é possível excluir a si mesmo' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/reset-password', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { newPassword } = req.body;
    const { id } = req.params;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id }, data: { passwordHash } });

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
