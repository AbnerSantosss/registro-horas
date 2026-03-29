import express from 'express';
// No multer imports needed as we use Base64 arrays over JSON
import prisma from '../prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { sendTaskAssignedEmail } from '../services/emailService.js';
import { notify, getAdminAndCoordinatorIds, getTaskInvolvedUserIds } from '../services/notificationService.js';

const router = express.Router();
const generateId = () => Math.random().toString(36).substring(2, 15);

// Base64 reference storage is handled in the creation endpoint transparently

// Get tasks (admin sees all, user sees own)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    // --- Server-side filtering ---
    const { status, assignee, priority, tag, search, sortBy, sortOrder } = req.query as Record<string, string | undefined>;

    const filters: any[] = [];

    // Role-based visibility
    if (role !== 'admin') {
      filters.push({
        OR: [
          { assigneeId: userId },
          { creatorId: userId },
          { steps: { some: { userId } } },
        ],
      });
    }

    // Status filter (comma-separated)
    if (status) {
      const statusList = status.split(',').map(s => s.trim()).filter(Boolean);
      if (statusList.length > 0) filters.push({ status: { in: statusList } });
    }

    // Assignee filter
    if (assignee) filters.push({ assigneeId: assignee });

    // Priority filter (comma-separated)
    if (priority) {
      const priorityList = priority.split(',').map(p => p.trim()).filter(Boolean);
      if (priorityList.length > 0) filters.push({ priority: { in: priorityList } });
    }

    // Tag filter
    if (tag) filters.push({ tags: { some: { tagId: tag } } });

    // Search filter (title, case-insensitive)
    if (search) filters.push({ title: { contains: search } });

    const where = filters.length > 0 ? { AND: filters } : {};

    // --- Sorting ---
    const validSortFields: Record<string, string> = {
      created_at: 'createdAt',
      due_date: 'deadline',
      priority: 'priority',
      title: 'title',
    };
    const orderField = validSortFields[sortBy || ''] || 'createdAt';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { [orderField]: orderDir },
      include: {
        assignee: { select: { name: true } },
        creator: { select: { name: true } },
        steps: {
          include: { user: { select: { name: true } } },
          orderBy: { stepOrder: 'asc' },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    // Get active time entries
    const activeEntries = await prisma.timeEntry.findMany({
      where: {
        status: 'running',
        ...(role !== 'admin' ? { userId } : {}),
      },
      orderBy: { startTime: 'asc' },
    });

    const activeMap = new Map<string, string>();
    for (const e of activeEntries) {
      if (!activeMap.has(e.taskId)) activeMap.set(e.taskId, e.startTime.toISOString());
    }

    // Sum completed entry durations per task for accumulated time
    const completedEntries = await prisma.timeEntry.groupBy({
      by: ['taskId'],
      where: {
        status: { in: ['paused', 'stopped'] },
        duration: { gt: 0 },
        ...(role !== 'admin' ? { userId } : {}),
      },
      _sum: { duration: true },
    });

    const accumulatedMap = new Map<string, number>();
    for (const e of completedEntries) {
      accumulatedMap.set(e.taskId, e._sum?.duration ?? 0);
    }

    // Capture time spent specifically per user per task
    const userTimes = await prisma.timeEntry.groupBy({
      by: ['taskId', 'userId'],
      where: {
        status: { in: ['paused', 'stopped'] },
        duration: { gt: 0 },
        ...(role !== 'admin' ? { userId } : {}),
      },
      _sum: { duration: true },
    });
    
    const userIdsForTime = [...new Set(userTimes.map(u => u.userId))];
    const timeUsersCache = await prisma.user.findMany({
      where: { id: { in: userIdsForTime } },
      select: { id: true, name: true, avatarUrl: true }
    });
    const timeUsersMap = new Map(timeUsersCache.map(u => [u.id, u]));

    const userTimesByTask = new Map<string, { user_id: string, user_name: string, seconds: number, avatar_url: string | null }[]>();
    for (const ut of userTimes) {
      if (!userTimesByTask.has(ut.taskId)) userTimesByTask.set(ut.taskId, []);
      const uData = timeUsersMap.get(ut.userId);
      userTimesByTask.get(ut.taskId)?.push({
        user_id: ut.userId,
        user_name: uData?.name || 'Unknown',
        seconds: ut._sum?.duration ?? 0,
        avatar_url: uData?.avatarUrl ?? null,
      });
    }

    const result = tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      deadline: t.deadline?.toISOString() ?? null,
      type: t.type,
      status: t.status,
      assignee_id: t.assigneeId,
      creator_id: t.creatorId,
      created_at: t.createdAt.toISOString(),
      network: t.network,
      placement: t.placement,
      format: t.format,
      sector: t.sector,
      direction: t.direction,
      reference: t.reference,
      reference_files: t.referenceFiles,
      material_type: t.materialType,
      rejection_reason: t.rejectionReason,
      current_step_index: t.currentStepIndex,
      priority: t.priority,
      brand: t.brand,
      assignee_name: t.assignee?.name ?? null,
      creator_name: t.creator?.name ?? null,
      total_steps: t.steps.length,
      active_start_time: activeMap.get(t.id) || null,
      accumulated_seconds: accumulatedMap.get(t.id) || 0,
      user_times: userTimesByTask.get(t.id) || [],
      steps: t.steps.map(s => ({
        id: s.id,
        task_id: s.taskId,
        user_id: s.userId,
        step_order: s.stepOrder,
        status: s.status,
        completed_at: s.completedAt?.toISOString() ?? null,
        instruction: s.instruction,
        material_link: s.materialLink,
        comments: s.comments,
        pieces: s.pieces,
        user_name: s.user?.name ?? null,
      })),
      tags: t.tags.map(tt => ({
        id: tt.tag.id,
        name: tt.tag.name,
        color: tt.tag.color,
      })),
    }));

    res.json(result);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create task
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      title, description, deadline, type, materialType,
      network, placement, format, sector, reference, referenceFiles,
      steps, priority, brand, tag_ids,
    } = req.body;
    const creatorId = req.user?.id!;
    const id = generateId();

    if (!title || !type || !priority) {
      return res.status(400).json({ error: 'Title, type and priority are required' });
    }

    let initialAssigneeId: string | null = null;
    if (steps && Array.isArray(steps) && steps.length > 0) {
      initialAssigneeId = steps[0].user_id;
    }

    await prisma.task.create({
      data: {
        id,
        title,
        description: description || null,
        deadline: deadline ? new Date(deadline) : null,
        type,
        status: 'todo',
        assigneeId: initialAssigneeId,
        creatorId,
        network: network || null,
        placement: placement || null,
        format: format || null,
        sector: sector || null,
        reference: reference || null,
        referenceFiles: referenceFiles ? JSON.stringify(referenceFiles) : null,
        materialType: materialType || null,
        currentStepIndex: 0,
        priority,
        brand: brand || null,
        steps: steps && Array.isArray(steps) && steps.length > 0
          ? {
              create: steps.map((step: any, index: number) => ({
                id: generateId(),
                userId: step.user_id,
                stepOrder: index,
                status: 'pending',
                instruction: step.instruction || null,
                pieces: step.pieces ?? 0,
              })),
            }
          : undefined,
        tags: tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0
          ? {
              create: tag_ids.map((tagId: string) => ({
                tagId,
              })),
            }
          : undefined,
        history: {
          create: {
            id: generateId(),
            userId: creatorId,
            action: 'created',
            details: 'Task created',
          },
        },
      },
    });

    if (initialAssigneeId && initialAssigneeId !== creatorId) {
      await notify({
        userIds: [initialAssigneeId],
        title: '📋 Nova Tarefa Atribuída',
        message: `Uma nova tarefa foi atribuída a você: ${title}`,
        type: 'task_assigned',
        taskId: id,
      });

      const assigneeInfo = await prisma.user.findUnique({ where: { id: initialAssigneeId } });
      if (assigneeInfo) {
        sendTaskAssignedEmail(assigneeInfo.email, assigneeInfo.name, title, description).catch(console.error);
      }
    }

    res.status(201).json({ id, title, status: 'todo' });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task status
router.put('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, material_link, comments, pieces } = req.body;
    const userId = req.user?.id!;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user?.role !== 'admin' && task.assigneeId !== userId && task.creatorId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (status === 'done') {
      // Stop active timer
      const activeEntry = await prisma.timeEntry.findFirst({
        where: { taskId: id, userId, status: 'running' },
      });

      if (activeEntry) {
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - activeEntry.startTime.getTime()) / 1000);
        await prisma.timeEntry.update({
          where: { id: activeEntry.id },
          data: { endTime, duration, status: 'completed', pauseReason: 'Task completed' },
        });
      }

      // Handle workflow progression
      const steps = await prisma.taskStep.findMany({
        where: { taskId: id },
        orderBy: { stepOrder: 'asc' },
      });

      if (steps.length > 0) {
        const currentStepIndex = task.currentStepIndex || 0;
        const currentStep = steps[currentStepIndex];

        if (currentStep) {
          await prisma.taskStep.update({
            where: { id: currentStep.id },
            data: {
              status: 'done',
              completedAt: new Date(),
              materialLink: material_link || null,
              comments: comments || null,
              pieces: pieces !== undefined ? parseInt(String(pieces)) : undefined,
            },
          });
        }

        const nextStepIndex = currentStepIndex + 1;
        if (nextStepIndex < steps.length) {
          const nextStep = steps[nextStepIndex];

          await prisma.task.update({
            where: { id },
            data: { status: 'todo', assigneeId: nextStep.userId, currentStepIndex: nextStepIndex },
          });

          await notify({
            userIds: [nextStep.userId],
            title: '📋 Tarefa na sua etapa',
            message: `A tarefa "${task.title}" chegou à sua etapa de produção.`,
            type: 'task_assigned',
            taskId: id,
          });

          const nextAssigneeInfo = await prisma.user.findUnique({ where: { id: nextStep.userId } });
          if (nextAssigneeInfo) {
            sendTaskAssignedEmail(nextAssigneeInfo.email, nextAssigneeInfo.name, task.title, task.description).catch(console.error);
          }

          await prisma.taskHistory.create({
            data: {
              id: generateId(),
              taskId: id,
              userId,
              action: 'step_completed',
              details: 'Completed step, moved to next user',
            },
          });

          return res.json({ success: true, message: 'Moved to next step' });
        }
      }
    }

    let finalStatus = status;
    if (status === 'done') {
      finalStatus = 'in_review';
    }

    if (finalStatus === 'in_progress' && task.status !== 'in_progress') {
      const involvedIds = await getTaskInvolvedUserIds(id);
      const filtered = involvedIds.filter(uid => uid !== userId);
      await notify({
        userIds: filtered,
        title: '🚀 Tarefa Iniciada',
        message: `A tarefa "${task.title}" foi iniciada.`,
        type: 'task_started',
        taskId: id,
      });
    }

    await prisma.task.update({ where: { id }, data: { status: finalStatus } });

    await prisma.taskHistory.create({
      data: {
        id: generateId(),
        taskId: id,
        userId,
        action: 'status_changed',
        details: `Status changed to ${finalStatus}`,
      },
    });

    res.json({ success: true, status: finalStatus });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Review task
router.post('/:id/review', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const userId = req.user?.id!;

    if (req.user?.role !== 'admin' && req.user?.role !== 'coordenador') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const task = await prisma.task.findUnique({ where: { id }, include: { steps: true } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (action === 'approve') {
      await prisma.task.update({
        where: { id },
        data: { status: 'done', rejectionReason: null },
      });

      await prisma.taskHistory.create({
        data: {
          id: generateId(),
          taskId: id,
          userId,
          action: 'approved',
          details: 'Task approved by coordinator/admin',
        },
      });

      if (task.creatorId !== userId) {
        const creator = await prisma.user.findUnique({ where: { id: task.creatorId } });
        const involvedIds = await getTaskInvolvedUserIds(id);
        const adminIds = await getAdminAndCoordinatorIds();
        const allIds = [...new Set([...involvedIds, ...adminIds])].filter(uid => uid !== userId);

        await notify({
          userIds: allIds,
          title: '✅ Tarefa Concluída',
          message: `A tarefa "${task.title}" foi aprovada e concluída!`,
          type: 'task_completed',
          taskId: id,
        });
      }
    } else if (action === 'reject') {
      if (!reason) return res.status(400).json({ error: 'Reason required for rejection' });
      
      const lastStepIndex = Math.max(0, task.steps.length - 1);
      const lastStep = task.steps[lastStepIndex];
      const assigneeId = lastStep ? lastStep.userId : task.assigneeId;

      await prisma.task.update({
        where: { id },
        data: { 
          status: 'todo', 
          rejectionReason: reason,
          currentStepIndex: lastStepIndex,
          assigneeId: assigneeId
        },
      });

      if (lastStep) {
        await prisma.taskStep.update({
          where: { id: lastStep.id },
          data: { status: 'pending' }
        });
      }

      await prisma.taskHistory.create({
        data: {
          id: generateId(),
          taskId: id,
          userId,
          action: 'rejected',
          details: `Task rejected: ${reason}`,
        },
      });

      if (assigneeId) {
        const involvedIds = await getTaskInvolvedUserIds(id);
        const adminIds = await getAdminAndCoordinatorIds();
        const allIds = [...new Set([...involvedIds, ...adminIds])].filter(uid => uid !== userId);

        await notify({
          userIds: allIds,
          title: '❌ Tarefa Reprovada',
          message: `A tarefa "${task.title}" foi reprovada. Motivo: ${reason}`,
          type: 'task_rejected',
          taskId: id,
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Review task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transfer task
router.post('/:id/transfer', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { assignee_id } = req.body;
    const userId = req.user?.id!;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (req.user?.role !== 'admin' && task.assigneeId !== userId && task.creatorId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Stop active timer
    const activeEntry = await prisma.timeEntry.findFirst({
      where: { taskId: id, userId, status: 'running' },
    });

    if (activeEntry) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - activeEntry.startTime.getTime()) / 1000);
      await prisma.timeEntry.update({
        where: { id: activeEntry.id },
        data: { endTime, duration, status: 'completed', pauseReason: 'Transferred' },
      });
    }

    await prisma.task.update({
      where: { id },
      data: { assigneeId: assignee_id, status: 'todo' },
    });

    const newAssignee = await prisma.user.findUnique({
      where: { id: assignee_id },
      select: { name: true, email: true },
    });

    await prisma.taskHistory.create({
      data: {
        id: generateId(),
        taskId: id,
        userId,
        action: 'transferred',
        details: `Transferred to ${newAssignee?.name || 'Unknown'}`,
      },
    });

    await notify({
      userIds: [assignee_id],
      title: '🔄 Tarefa Transferida',
      message: `A tarefa "${task.title}" foi transferida para você.`,
      type: 'task_transferred',
      taskId: id,
    });

    if (newAssignee) {
      sendTaskAssignedEmail(newAssignee.email, newAssignee.name, task.title, task.description).catch(console.error);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Time tracking: Start
router.post('/:id/time/start', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id!;

    const active = await prisma.timeEntry.findFirst({
      where: { taskId: id, userId, status: 'running' },
    });

    if (active) {
      return res.status(400).json({ error: 'Timer already running for this task' });
    }

    const startTime = new Date();
    await prisma.timeEntry.create({
      data: { id: generateId(), taskId: id, userId, startTime, status: 'running' },
    });

    await prisma.task.update({ where: { id }, data: { status: 'in_progress' } });

    res.json({ success: true, start_time: startTime.toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Time tracking: Pause
router.post('/:id/time/pause', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id!;

    if (!reason) {
      return res.status(400).json({ error: 'Pause reason is required' });
    }

    const activeEntry = await prisma.timeEntry.findFirst({
      where: { taskId: id, userId, status: 'running' },
    });

    if (!activeEntry) {
      return res.status(400).json({ error: 'No active timer found' });
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - activeEntry.startTime.getTime()) / 1000);

    await prisma.timeEntry.update({
      where: { id: activeEntry.id },
      data: { endTime, duration, status: 'paused', pauseReason: reason },
    });

    await prisma.task.update({ where: { id }, data: { status: 'paused' } });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get task time summary
router.get('/:id/time', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const entries = await prisma.timeEntry.findMany({
      where: { taskId: id },
      include: { user: { select: { name: true } } },
      orderBy: { startTime: 'desc' },
    });

    const mapped = entries.map(e => ({
      id: e.id,
      task_id: e.taskId,
      user_id: e.userId,
      start_time: e.startTime.toISOString(),
      end_time: e.endTime?.toISOString() ?? null,
      duration: e.duration,
      pause_reason: e.pauseReason,
      status: e.status,
      created_at: e.createdAt.toISOString(),
      user_name: e.user?.name ?? null,
    }));

    const now = Date.now();
    const totalSeconds = mapped.reduce((acc, curr) => {
      if (curr.status === 'running' && curr.start_time) {
        return acc + Math.floor((now - new Date(curr.start_time).getTime()) / 1000);
      }
      return acc + (curr.duration || 0);
    }, 0);

    res.json({ total_seconds: totalSeconds, entries: mapped });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get task comments
router.get('/:id/comments', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const comments = await prisma.comment.findMany({
      where: { taskId: id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.json(comments.map(c => ({
      id: c.id,
      task_id: c.taskId,
      user_id: c.userId,
      content: c.content,
      created_at: c.createdAt.toISOString(),
      user_name: c.user?.name ?? null,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add task comment
router.post('/:id/comments', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?.id!;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const commentId = generateId();
    await prisma.comment.create({
      data: { id: commentId, taskId: id, userId, content },
    });

    res.status(201).json({ id: commentId, content });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === Bulk Actions ===

// Bulk status change
router.put('/bulk/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { taskIds, status } = req.body;
    const userId = req.user?.id!;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }
    const validStatuses = ['todo', 'in_progress', 'paused', 'done'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { status },
    });

    // Create history for each task
    await prisma.taskHistory.createMany({
      data: taskIds.map((taskId: string) => ({
        id: generateId(),
        taskId,
        userId,
        action: 'status_changed',
        details: `Bulk status change to ${status}`,
      })),
    });

    res.json({ success: true, updated: taskIds.length });
  } catch (error) {
    console.error('Bulk status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk reassign
router.put('/bulk/assign', authenticate, async (req: AuthRequest, res) => {
  try {
    const { taskIds, assigneeId } = req.body;
    const userId = req.user?.id!;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }
    if (!assigneeId) {
      return res.status(400).json({ error: 'assigneeId is required' });
    }

    const assignee = await prisma.user.findUnique({ where: { id: assigneeId }, select: { name: true, email: true } });
    if (!assignee) return res.status(404).json({ error: 'Assignee not found' });

    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { assigneeId },
    });

    await prisma.taskHistory.createMany({
      data: taskIds.map((taskId: string) => ({
        id: generateId(),
        taskId,
        userId,
        action: 'transferred',
        details: `Bulk reassigned to ${assignee.name}`,
      })),
    });

    // Notify the new assignee
    await notify({
      userIds: [assigneeId],
      title: '📋 Tarefas Atribuídas em Lote',
      message: `${taskIds.length} tarefa(s) foram atribuídas a você.`,
      type: 'task_assigned',
    });

    sendTaskAssignedEmail(assignee.email, assignee.name, `${taskIds.length} novas tarefas processadas em lote`, 'Você foi designado responsável por múltiplas tarefas de uma só vez. Por favor, acesse o painel para listar as tarefas a você atribuídas.').catch(console.error);

    res.json({ success: true, updated: taskIds.length });
  } catch (error) {
    console.error('Bulk assign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk delete
router.delete('/bulk', authenticate, async (req: AuthRequest, res) => {
  try {
    const { taskIds } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }

    // Delete related records first (cascade not automatic in all cases)
    await prisma.taskTag.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.taskStep.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.timeEntry.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.comment.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.taskHistory.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.task.deleteMany({ where: { id: { in: taskIds } } });

    res.json({ success: true, deleted: taskIds.length });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get task stats summary (admin only)
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'in_review' THEN 1 END) as in_review,
        COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
        COUNT(CASE WHEN deadline IS NOT NULL AND deadline < NOW() AND status != 'done' THEN 1 END) as overdue
      FROM tasks
    `);

    const stats = rows[0] ?? {};
    
    // Total pieces
    const stepStats = await prisma.taskStep.aggregate({
      _sum: { pieces: true },
      where: { status: 'done' }
    });

    const rejectStats = await prisma.taskHistory.count({
      where: { action: 'rejected' }
    });

    res.json({
      total:       Number(stats.total       ?? 0),
      todo:        Number(stats.todo        ?? 0),
      in_progress: Number(stats.in_progress ?? 0),
      in_review:   Number(stats.in_review   ?? 0),
      paused:      Number(stats.paused      ?? 0),
      done:        Number(stats.done        ?? 0),
      overdue:     Number(stats.overdue     ?? 0),
      total_pieces:Number(stepStats._sum.pieces ?? 0),
      total_rejections: Number(rejectStats ?? 0),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reports (admin only) — updated for MySQL
router.get('/reports', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const reports: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        u.id as user_id,
        u.name as user_name,
        t.id as task_id,
        t.title as task_title,
        t.status as task_status,
        t.brand as task_brand,
        t.deadline as task_deadline,
        t.type as task_type,
        SUM(
          CASE
            WHEN te.status = 'running'
              THEN TIMESTAMPDIFF(SECOND, te.start_time, NOW())
            ELSE COALESCE(te.duration, 0)
          END
        ) as total_duration,
        COUNT(CASE WHEN te.status = 'paused' THEN 1 END) as pause_count,
        COALESCE(ts_pieces.total_pieces, 0) as total_pieces,
        COALESCE(th_rejects.reject_count, 0) as reject_count
      FROM time_entries te
      JOIN users u ON te.user_id = u.id
      JOIN tasks t ON te.task_id = t.id
      LEFT JOIN (
        SELECT task_id, user_id, SUM(pieces) as total_pieces
        FROM task_steps
        GROUP BY task_id, user_id
      ) ts_pieces ON ts_pieces.task_id = te.task_id AND ts_pieces.user_id = te.user_id
      LEFT JOIN (
        SELECT task_id, COUNT(*) as reject_count
        FROM task_history
        WHERE action = 'rejected'
        GROUP BY task_id
      ) th_rejects ON th_rejects.task_id = t.id
      WHERE te.status IN ('completed', 'paused', 'running')
      GROUP BY te.user_id, te.task_id, u.name, t.title, t.brand, t.status, t.deadline, t.type, ts_pieces.total_pieces, th_rejects.reject_count
      ORDER BY total_duration DESC
    `);

    // We also want to map the raw response back to expected numbers where sum is applied
    const formatted = reports.map(r => ({
      ...r,
      total_duration: Number(r.total_duration ?? 0),
      pause_count: Number(r.pause_count ?? 0),
      total_pieces: Number(r.total_pieces ?? 0),
      reject_count: Number(r.reject_count ?? 0)
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
