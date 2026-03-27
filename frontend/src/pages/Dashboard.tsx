import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useBrand } from '../context/BrandContext';
import { Task } from '../types';
import {
  PlayCircle, PauseCircle, CheckCircle2, Clock, User as UserIcon,
  Plus, Eye, Check, AlertTriangle, Link as LinkIcon
} from 'lucide-react';
import NewTaskModal from '../components/NewTaskModal';
import TaskDetailsModal from '../components/TaskDetailsModal';
import FilterBar, { Filters } from '../components/FilterBar';
import BulkActionBar from '../components/BulkActionBar';

/* ─── Column config ──────────────────────────────────────── */
const COLUMNS = [
  { id: 'todo',        title: 'A Fazer',       dot: 'hsl(220 13% 50%)' },
  { id: 'in_progress', title: 'Em Andamento',  dot: 'var(--brand-500)' },
  { id: 'paused',      title: 'Pausado',       dot: 'hsl(38 92% 50%)' },
  { id: 'done',        title: 'Concluído',     dot: 'hsl(142 71% 45%)' },
];



const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  urgente: { bg: 'rgb(239 68 68 / 0.15)', color: '#f87171' },
  alta:    { bg: 'rgb(249 115 22 / 0.15)', color: '#fb923c' },
  normal:  { bg: 'rgb(34 197 94 / 0.15)',  color: '#4ade80' },
};

/* ─── Brand filter pills ──────────────────────────────────── */
function BrandFilterPills() {
  const { brands, selectedBrand, setSelectedBrand } = useBrand();

  const pillBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
    transition: 'all 0.15s', minHeight: 32,
  };

  return (
    <div className="flex items-center gap-2 mb-4 shrink-0 flex-wrap">
      {/* "Todas" pill */}
      <button
        onClick={() => setSelectedBrand(null)}
        style={{
          ...pillBase,
          fontSize: '0.72rem', fontWeight: 600,
          background: selectedBrand === null ? 'var(--brand-500)' : 'var(--surface-2)',
          color: selectedBrand === null ? '#fff' : 'var(--text-2)',
          border: `1px solid ${selectedBrand === null ? 'var(--brand-500)' : 'var(--border)'}`,
        }}
      >
        Todas
      </button>

      {/* Brand icon pills */}
      {brands.map(b => {
        const active = selectedBrand?.id === b.id;
        return (
          <button
            key={b.id}
            onClick={() => setSelectedBrand(active ? null : b)}
            title={b.name}
            style={{
              ...pillBase,
              background: active ? 'var(--brand-500)' : 'var(--surface-2)',
              border: `1px solid ${active ? 'var(--brand-500)' : 'var(--border)'}`,
            }}
          >
            <img
              src={b.iconUrl || '/logos/icon_geralbet_azul.png'}
              alt={b.name}
              style={{
                height: 18,
                width: 'auto',
                objectFit: 'contain',
                filter: active ? 'brightness(0) invert(1)' : 'grayscale(100%) opacity(70%)',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ─── Time helpers ────────────────────────────────────────── */
function formatTime(totalSeconds: number) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function LiveTimer({ startTime, offsetSeconds = 0 }: { startTime: string; offsetSeconds?: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startTime).getTime();
    const tick = () => setElapsed(offsetSeconds + Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime, offsetSeconds]);
  return (
    <span className="font-mono text-xs font-semibold tabular-nums" style={{ color: 'hsl(38 92% 50%)' }}>
      {formatTime(elapsed)}
    </span>
  );
}

/* ─── Main ────────────────────────────────────────────────── */
export default function Dashboard() {
  const { token, user } = useAuth();
  const { selectedBrand, setSelectedBrand } = useBrand();
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<string | null>(null);
  const [materialLink, setMaterialLink]     = useState('');
  const [comments, setComments]             = useState('');
  const [pieces, setPieces]                 = useState<number | ''>('');
  // Pause modal state
  const [pausingTaskId, setPausingTaskId]   = useState<string | null>(null);
  const [pauseReason, setPauseReason]       = useState('');

  // Filter & bulk selection state
  const [filters, setFilters] = useState<Filters>({
    search: '', status: [], priority: [], assignee: '', tag: '', sortBy: 'created_at', sortOrder: 'desc',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([]);
  const [allTags, setAllTags]   = useState<{ id: string; name: string; color: string }[]>([]);

  // Fetch users & tags once
  useEffect(() => {
    if (!token) return;
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setAllUsers(data.map((u: any) => ({ id: u.id, name: u.name }))))
      .catch(() => {});
    fetch('/api/tags', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setAllTags)
      .catch(() => {});
  }, [token]);

  useEffect(() => { fetchTasks(); }, [token, filters]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status.length > 0) params.set('status', filters.status.join(','));
      if (filters.priority.length > 0) params.set('priority', filters.priority.join(','));
      if (filters.assignee) params.set('assignee', filters.assignee);
      if (filters.tag) params.set('tag', filters.tag);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      const qs = params.toString();
      const url = `/api/tasks${qs ? `?${qs}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTasks(await res.json());
    } finally { setLoading(false); }
  };

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  // Bulk action handlers
  const handleBulkStatusChange = async (status: string) => {
    await fetch('/api/tasks/bulk/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ taskIds: Array.from(selectedIds), status }),
    });
    clearSelection();
    fetchTasks();
  };

  const handleBulkAssign = async (assigneeId: string) => {
    await fetch('/api/tasks/bulk/assign', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ taskIds: Array.from(selectedIds), assignee_id: assigneeId }),
    });
    clearSelection();
    fetchTasks();
  };

  const handleBulkDelete = async () => {
    await fetch('/api/tasks/bulk', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ taskIds: Array.from(selectedIds) }),
    });
    clearSelection();
    fetchTasks();
  };

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const newStatus = destination.droppableId;
    if (newStatus === 'done') { setTaskToComplete(draggableId); setMaterialLink(''); setComments(''); setPieces(''); return; }
    setTasks(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(t => t.id === draggableId);
      arr[idx] = { ...arr[idx], status: newStatus as any };
      return arr;
    });
    const res = await fetch(`/api/tasks/${draggableId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) fetchTasks();
  };

  const handleTimeAction = async (taskId: string, action: 'start') => {
    const res = await fetch(`/api/tasks/${taskId}/time/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    if (res.ok) fetchTasks();
  };

  const openPauseModal = (taskId: string) => {
    setPausingTaskId(taskId);
    setPauseReason('');
  };

  const confirmPause = async () => {
    if (!pausingTaskId) return;
    const reason = pauseReason.trim() || 'Pausa manual';
    const res = await fetch(`/api/tasks/${pausingTaskId}/time/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) fetchTasks();
    setPausingTaskId(null);
    setPauseReason('');
  };

  const confirmComplete = async () => {
    if (!taskToComplete) return;
    const res = await fetch(`/api/tasks/${taskToComplete}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'done', material_link: materialLink, comments, pieces: pieces !== '' ? Number(pieces) : undefined }),
    });
    if (res.ok) fetchTasks();
    setTaskToComplete(null);
    setPieces('');
  };

  const getColumn = (task: Task) => {
    if (task.status === 'done') return 'done';
    const hasMyStep = task.steps?.some(s => s.user_id === user?.id && s.status === 'done');
    return hasMyStep ? 'done' : task.status;
  };

  const visibleTasks = selectedBrand ? tasks.filter(t => (t as any).brand === selectedBrand.name) : tasks;

  if (loading) return (
    <div className="flex h-full items-center justify-center" style={{ color: 'var(--text-3)' }}>
      <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
        <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      Carregando tarefas…
    </div>
  );

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Meu Quadro</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {visibleTasks.length} tarefa{visibleTasks.length !== 1 ? 's' : ''}
          </p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setIsModalOpen(true)} className="btn-brand flex items-center gap-2">
            <Plus size={16} /> Nova Tarefa
          </button>
        )}
      </div>

      {/* Brand filter pills — sync with sidebar dropdown */}
      {user?.role === 'admin' && (
        <BrandFilterPills />
      )}

      {/* Filters + bulk bar */}
      <FilterBar
        filters={filters}
        onFiltersChange={f => { setFilters(f); clearSelection(); }}
        users={allUsers}
        tags={allTags}
      />

      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedIds={Array.from(selectedIds)}
          onClearSelection={clearSelection}
          onBulkStatus={handleBulkStatusChange}
          onBulkAssign={handleBulkAssign}
          onBulkDelete={handleBulkDelete}
          users={allUsers}
        />
      )}

      {/* Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 flex-1 overflow-x-auto pb-2 min-h-0">
          {COLUMNS.map(col => {
            const colTasks = visibleTasks.filter(t => getColumn(t) === col.id);
            return (
              <div key={col.id} className="kanban-col">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1 shrink-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.dot }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                    {col.title}
                  </span>
                  <span
                    className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--surface-3)', color: 'var(--text-3)' }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 rounded-xl p-2 overflow-y-auto transition-colors"
                      style={{
                        background: snapshot.isDraggingOver ? 'var(--surface-3)' : 'var(--surface-2)',
                        border: `1px solid ${snapshot.isDraggingOver ? 'var(--brand-300)' : 'var(--border)'}`,
                        minHeight: 120,
                      }}
                    >
                      {colTasks.map((task, index) => {
                        const isOverdue  = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
                        const progress   = task.total_steps ? Math.round(((task.current_step_index || 0) / task.total_steps) * 100) : 0;
                        const currentStep = task.steps?.[task.current_step_index ?? 0];
                        const isMyTurn   = currentStep?.user_id === user?.id;
                        const isMyStepDone = col.id === 'done' && task.status !== 'done' && task.assignee_id !== user?.id;
                        const pStyle     = PRIORITY_STYLE[task.priority ?? 'normal'] ?? PRIORITY_STYLE.normal;

                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                className="task-card"
                                style={{
                                  ...prov.draggableProps.style,
                                  opacity: snap.isDragging ? 0.92 : 1,
                                  boxShadow: snap.isDragging ? '0 12px 32px rgb(0 0 0 / 0.25)' : undefined,
                                  border: selectedIds.has(task.id)
                                    ? '2px solid var(--brand-500)'
                                    : isOverdue
                                      ? '1px solid rgb(239 68 68 / 0.35)'
                                      : '1px solid var(--border)',
                                }}
                              >
                                {/* Selection checkbox */}
                                {user?.role === 'admin' && (
                                  <div
                                    className="flex items-center mb-2"
                                    onClick={e => { e.stopPropagation(); toggleSelect(task.id); }}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <div
                                      style={{
                                        width: 16, height: 16, borderRadius: 4,
                                        border: selectedIds.has(task.id) ? '2px solid var(--brand-500)' : '2px solid var(--border)',
                                        background: selectedIds.has(task.id) ? 'var(--brand-500)' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.15s',
                                      }}
                                    >
                                      {selectedIds.has(task.id) && (
                                        <Check size={10} style={{ color: '#fff' }} />
                                      )}
                                    </div>
                                    <span className="text-[10px] ml-1.5" style={{ color: 'var(--text-3)' }}>Selecionar</span>
                                  </div>
                                )}

                                {/* Badges row */}
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  <span className="badge" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
                                    {task.type}
                                  </span>
                                  {(task as any).brand && (
                                    <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                                      {(task as any).brand}
                                    </span>
                                  )}
                                  {isMyStepDone && (
                                    <span className="badge" style={{ background: 'rgb(34 197 94 / 0.15)', color: '#4ade80' }}>
                                      <Check size={10} className="mr-0.5" /> Minha etapa ok
                                    </span>
                                  )}
                                  {!isMyStepDone && task.priority && (
                                    <span className="badge" style={{ background: pStyle.bg, color: pStyle.color }}>
                                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </span>
                                  )}
                                  {isOverdue && (
                                    <span className="badge" style={{ background: 'rgb(239 68 68 / 0.15)', color: '#f87171' }}>
                                      <AlertTriangle size={10} className="mr-0.5" /> Atrasada
                                    </span>
                                  )}
                                </div>
                                {/* Tags */}
                                {(task as any).tags?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {((task as any).tags as Array<{ id: string; name: string; color: string }>).map(tag => (
                                      <span
                                        key={tag.id}
                                        style={{
                                          display: 'inline-block',
                                          padding: '0.1rem 0.5rem',
                                          borderRadius: 20,
                                          fontSize: '0.68rem',
                                          fontWeight: 600,
                                          background: tag.color + '25',
                                          color: tag.color,
                                          border: `1px solid ${tag.color}55`,
                                        }}
                                      >
                                        {tag.name}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Title */}
                                <h4
                                  className="text-sm font-semibold leading-snug mb-1"
                                  style={{
                                    color: task.status === 'done' ? 'var(--text-3)' : 'var(--text-1)',
                                    textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                  }}
                                >
                                  {task.title}
                                </h4>

                                {/* Description */}
                                {!isMyStepDone && (
                                  <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-3)' }}>
                                    {task.description}
                                  </p>
                                )}

                                {/* My step instruction */}
                                {!isMyStepDone && isMyTurn && task.status !== 'done' && currentStep?.instruction && (
                                  <div
                                    className="text-xs p-2 rounded-lg mb-3"
                                    style={{
                                      background: 'var(--brand-50)',
                                      color: 'var(--brand-700)',
                                      border: '1px solid var(--brand-100)',
                                    }}
                                  >
                                    <span className="font-semibold">Instrução: </span>
                                    {currentStep.instruction}
                                  </div>
                                )}

                                {/* Progress bar */}
                                {!isMyStepDone && (task.total_steps ?? 0) > 0 && task.status !== 'done' && (
                                  <div className="mb-3">
                                    <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-3)' }}>
                                      <span>Fluxo</span><span>{progress}%</span>
                                    </div>
                                    <div className="rounded-full h-1" style={{ background: 'var(--surface-3)' }}>
                                      <div
                                        className="h-1 rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%`, background: 'var(--brand-500)' }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Assignee row */}
                                <div className="flex items-center gap-1.5 mb-2">
                                  <UserIcon size={12} style={{ color: 'var(--text-3)' }} />
                                  <span className="text-xs truncate max-w-[120px]" style={{ color: 'var(--text-3)' }}>
                                    {task.assignee_name || 'Não atribuído'}
                                  </span>
                                  <button
                                    onClick={() => setSelectedTask(task)}
                                    className="ml-auto w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                                    style={{ color: 'var(--text-3)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    title="Ver detalhes"
                                  >
                                    <Eye size={13} />
                                  </button>
                                </div>

                                {/* Tempo Gasto por Usuário */}
                                {task.user_times && task.user_times.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {task.user_times.map((ut, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]"
                                        style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
                                        title={`Tempo de ${ut.user_name}`}
                                      >
                                        <UserIcon size={9} />
                                        <span>{ut.user_name}:</span>
                                        <span className="font-mono font-semibold">{formatTime(ut.seconds)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* ── Timer + Actions footer ── */}
                                <div
                                  className="pt-3 mt-1 space-y-2"
                                  style={{ borderTop: '1px solid var(--border)' }}
                                >
                                  {task.status !== 'done' && !isMyStepDone ? (
                                    <>
                                      {/* ── Cronômetro com background destacado ── */}
                                      <div
                                        className="flex items-center justify-between rounded-lg px-3 py-2"
                                        style={{
                                          background: task.status === 'in_progress' && task.active_start_time
                                            ? 'hsl(38 92% 50% / 0.10)'
                                            : 'var(--surface-2)',
                                          border: task.status === 'in_progress' && task.active_start_time
                                            ? '1px solid hsl(38 92% 50% / 0.25)'
                                            : '1px solid var(--border)',
                                        }}
                                      >
                                        <div className="flex items-center gap-2">
                                          {task.status === 'in_progress' && task.active_start_time ? (
                                            <>
                                              <Clock size={14} className="animate-pulse" style={{ color: 'hsl(38 92% 50%)' }} />
                                              <LiveTimer startTime={task.active_start_time} offsetSeconds={task.accumulated_seconds || 0} />
                                            </>
                                          ) : (
                                            <>
                                              <Clock size={14} style={{ color: 'var(--text-3)' }} />
                                              <span className="font-mono text-sm font-semibold tabular-nums" style={{ color: 'var(--text-2)' }}>
                                                {formatTime(task.accumulated_seconds || 0)}
                                              </span>
                                            </>
                                          )}
                                        </div>

                                        {/* Steps counter dentro do cronômetro */}
                                        {(task.total_steps ?? 0) > 0 && (
                                          <span className="text-[10px] tabular-nums font-medium" style={{ color: 'var(--text-3)' }}>
                                            Etapa {(task.current_step_index ?? 0) + 1}/{task.total_steps}
                                          </span>
                                        )}
                                      </div>

                                      {/* ── Controles: Play/Pause + Botão Tarefa Concluída ── */}
                                      <div className="flex items-center gap-2">
                                        {/* Play / Pause */}
                                        {task.status === 'in_progress' && task.active_start_time ? (
                                          <button
                                            onClick={() => openPauseModal(task.id)}
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                                            style={{
                                              color: 'hsl(38 92% 50%)',
                                              background: 'hsl(38 92% 50% / 0.08)',
                                              border: '1px solid hsl(38 92% 50% / 0.2)',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'hsl(38 92% 50% / 0.15)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'hsl(38 92% 50% / 0.08)'; }}
                                            title="Pausar"
                                          >
                                            <PauseCircle size={14} />
                                            Pausar
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleTimeAction(task.id, 'start')}
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                                            style={{
                                              color: 'var(--brand-500)',
                                              background: 'var(--brand-50)',
                                              border: '1px solid var(--brand-100, var(--brand-50))',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-100, hsl(var(--brand-hue, 150) 60% 90%))'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--brand-50)'; }}
                                            title={task.status === 'paused' || (task.accumulated_seconds && task.accumulated_seconds > 0) ? 'Continuar' : 'Iniciar'}
                                          >
                                            <PlayCircle size={14} />
                                            {task.status === 'paused' || (task.accumulated_seconds && task.accumulated_seconds > 0) ? 'Continuar' : 'Iniciar'}
                                          </button>
                                        )}

                                        {/* Botão Tarefa Concluída — com texto nítido */}
                                        <button
                                          onClick={() => { setTaskToComplete(task.id); setMaterialLink(''); setComments(''); setPieces(''); }}
                                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ml-auto transition-all"
                                          style={{
                                            color: '#fff',
                                            background: 'hsl(142 71% 45%)',
                                          }}
                                          onMouseEnter={e => { e.currentTarget.style.background = 'hsl(142 71% 38%)'; }}
                                          onMouseLeave={e => { e.currentTarget.style.background = 'hsl(142 71% 45%)'; }}
                                          title="Concluir tarefa"
                                        >
                                          <CheckCircle2 size={14} />
                                          Tarefa Concluída
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    /* ── Estado concluído ── */
                                    <div
                                      className="flex items-center justify-between rounded-lg px-3 py-2"
                                      style={{ background: 'hsl(142 71% 45% / 0.08)', border: '1px solid hsl(142 71% 45% / 0.2)' }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Clock size={14} style={{ color: 'var(--text-3)' }} />
                                        <span className="font-mono text-sm font-semibold tabular-nums" style={{ color: 'var(--text-2)' }}>
                                          {formatTime(task.accumulated_seconds || 0)}
                                        </span>
                                      </div>
                                      <span
                                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                                        style={{ background: 'hsl(142 71% 45% / 0.15)', color: '#4ade80' }}
                                      >
                                        <CheckCircle2 size={12} />
                                        Concluído
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modals */}
      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTaskCreated={fetchTasks} />
      <TaskDetailsModal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} task={selectedTask} users={allUsers} onTransfer={fetchTasks} />

      {/* Pause modal */}
      {pausingTaskId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-1)' }}>Pausar Timer</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
              Informe o motivo da pausa (opcional).
            </p>
            <input
              type="text"
              className="input-base w-full mb-4"
              placeholder="Ex: reunião, almoço, aguardando retorno…"
              value={pauseReason}
              onChange={e => setPauseReason(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmPause(); if (e.key === 'Escape') setPausingTaskId(null); }}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPausingTaskId(null)} className="btn-ghost">Cancelar</button>
              <button onClick={confirmPause} className="btn-brand flex items-center gap-2">
                <PauseCircle size={16} /> Pausar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion modal */}
      {taskToComplete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-1)' }}>Concluir Tarefa</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
              O tempo será encerrado e a tarefa encaminhada para o próximo responsável no fluxo (se houver).
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>
                  Link do Material Produzido <span style={{ color: 'var(--text-3)' }}>(opcional)</span>
                </label>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                  <input
                    type="url"
                    className="input-base pl-9"
                    placeholder="https://..."
                    value={materialLink}
                    onChange={e => setMaterialLink(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>
                  Observações <span style={{ color: 'var(--text-3)' }}>(opcional)</span>
                </label>
                <textarea
                  className="input-base resize-none"
                  rows={3}
                  placeholder="Notas sobre a execução desta etapa…"
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>
                  Quantidade de Peças Produzidas <span style={{ color: 'var(--text-3)' }}>(opcional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="input-base"
                  placeholder="Ex: 5"
                  value={pieces}
                  onChange={e => setPieces(e.target.value ? parseInt(e.target.value) : '')}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setTaskToComplete(null)}
                className="btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={confirmComplete}
                className="btn-brand flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Concluir tarefa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
