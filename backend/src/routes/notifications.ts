import express from 'express';
import prisma from '../prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { getVapidPublicKey } from '../services/notificationService.js';

const router = express.Router();
const generateId = () => Math.random().toString(36).substring(2, 15);

// ── Get VAPID public key (no auth needed, it's a PUBLIC key) ─
router.get('/vapid-key', (_req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

// ── Subscribe to push notifications ─────────────────────────
router.post('/subscribe', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id!;
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    // Upsert: avoid duplicate subscriptions per endpoint
    const existing = await prisma.pushSubscription.findFirst({
      where: { userId, endpoint },
    });

    if (!existing) {
      await prisma.pushSubscription.create({
        data: {
          id: generateId(),
          userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Unsubscribe from push ───────────────────────────────────
router.post('/unsubscribe', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id!;
    const { endpoint } = req.body;

    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: { userId, endpoint },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── List notifications for the current user ─────────────────
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id!;
    const limit = parseInt(req.query.limit as string) || 50;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Mark one notification as read ───────────────────────────
router.put('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id!;
    const { id } = req.params;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Mark ALL notifications as read ──────────────────────────
router.put('/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id!;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
