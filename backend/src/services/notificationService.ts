import prisma from '../prisma.js';
import webPush from 'web-push';

// ── Configure web-push with VAPID keys ──────────────────────
const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY  || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT     = process.env.VAPID_SUBJECT     || 'mailto:noreply@logame.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// ── Notification types ──────────────────────────────────────
export type NotificationType =
  | 'task_assigned'
  | 'task_started'
  | 'task_completed'
  | 'task_rejected'
  | 'task_overdue'
  | 'task_transferred'
  | 'task_approved'
  | 'info';

interface NotifyPayload {
  userIds: string[];
  title: string;
  message: string;
  type: NotificationType;
  taskId?: string;
}

// ── Main entry point: save to DB + send push ────────────────
export async function notify(payload: NotifyPayload) {
  const { userIds, title, message, type, taskId } = payload;
  // Deduplicate user IDs
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  // 1. Bulk-insert into notifications table
  await prisma.notification.createMany({
    data: uniqueIds.map(userId => ({
      id: generateId(),
      userId,
      title,
      message,
      type,
      taskId: taskId || null,
      read: false,
    })),
  });

  // 2. Send web push to each user's subscriptions (fire-and-forget)
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    sendPushToUsers(uniqueIds, { title, body: message, type, taskId }).catch(console.error);
  }
}

// ── Web Push helper ─────────────────────────────────────────
async function sendPushToUsers(
  userIds: string[],
  payload: { title: string; body: string; type: string; taskId?: string }
) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: '/logos/icon_logame.png',
    badge: '/logos/icon_logame.png',
    data: { type: payload.type, taskId: payload.taskId, url: '/' },
  });

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        pushPayload
      )
    )
  );

  // Clean up expired subscriptions (410 Gone)
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'rejected' && (result.reason as any)?.statusCode === 410) {
      await prisma.pushSubscription.delete({ where: { id: subscriptions[i].id } }).catch(() => {});
    }
  }
}

// ── Helper: get admin + coordinator IDs ─────────────────────
export async function getAdminAndCoordinatorIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: { in: ['admin', 'coordenador'] } },
    select: { id: true },
  });
  return admins.map(a => a.id);
}

// ─── Helper: get all users involved in a task ───────────────
export async function getTaskInvolvedUserIds(taskId: string): Promise<string[]> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { steps: { select: { userId: true } } },
  });
  if (!task) return [];

  const ids = new Set<string>();
  if (task.creatorId) ids.add(task.creatorId);
  if (task.assigneeId) ids.add(task.assigneeId);
  task.steps.forEach(s => ids.add(s.userId));
  return [...ids];
}

// ── Get VAPID public key (safe to expose) ───────────────────
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
