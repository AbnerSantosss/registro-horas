import express from 'express';
import prisma from '../prisma.js';
import { notify, getAdminAndCoordinatorIds } from '../services/notificationService.js';

const router = express.Router();

// ── Cron: check overdue tasks (called by Vercel Cron or manually) ──
router.get('/overdue-tasks', async (req, res) => {
  try {
    // Simple protection: require a secret header or query param
    const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
    if (cronSecret !== (process.env.CRON_SECRET || 'cron-default-secret')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const now = new Date();

    // Find tasks that are overdue (deadline passed, not done/in_review)
    const overdueTasks = await prisma.task.findMany({
      where: {
        deadline: { lt: now },
        status: { notIn: ['done', 'in_review', 'cancelled'] },
      },
      include: {
        assignee: { select: { id: true, name: true } },
        steps: { select: { userId: true } },
      },
    });

    if (overdueTasks.length === 0) {
      return res.json({ message: 'No overdue tasks', count: 0 });
    }

    const adminIds = await getAdminAndCoordinatorIds();
    let notifiedCount = 0;

    for (const task of overdueTasks) {
      // Check if we already sent an overdue notification for this task today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          taskId: task.id,
          type: 'task_overdue',
          createdAt: { gte: todayStart },
        },
      });

      if (alreadyNotified) continue; // skip duplicate

      // Collect all involved users + admins
      const involvedIds = new Set<string>();
      if (task.assigneeId) involvedIds.add(task.assigneeId);
      if (task.creatorId) involvedIds.add(task.creatorId);
      task.steps.forEach(s => involvedIds.add(s.userId));
      adminIds.forEach(id => involvedIds.add(id));

      await notify({
        userIds: [...involvedIds],
        title: '⚠️ Tarefa Atrasada',
        message: `A tarefa "${task.title}" está atrasada! O prazo era ${task.deadline?.toLocaleDateString('pt-BR')}.`,
        type: 'task_overdue',
        taskId: task.id,
      });

      notifiedCount++;
    }

    res.json({ message: `Processed ${notifiedCount} overdue tasks`, count: notifiedCount });
  } catch (error) {
    console.error('Cron overdue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
