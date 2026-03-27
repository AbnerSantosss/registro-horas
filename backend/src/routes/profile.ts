import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed'));
    }
  },
});

// Update name
router.put('/name', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true, role: true, position: true, avatarUrl: true },
    });
    res.json(user);
  } catch (error) {
    console.error('Update name error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update password
router.put('/password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload avatar
router.post('/avatar', authenticate, upload.single('avatar'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const avatarUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl },
      select: { id: true, name: true, email: true, role: true, position: true, avatarUrl: true },
    });
    res.json(user);
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
