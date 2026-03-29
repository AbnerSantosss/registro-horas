import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useBrand, getBrandAsset } from '../context/BrandContext';
import { Task } from '../types';
import {
  PlayCircle, PauseCircle, CheckCircle2, Clock, User as UserIcon,
  Plus, Eye, Check, AlertTriangle, Link as LinkIcon, Briefcase
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
  { id: 'in_review',   title: 'Revisão Final', dot: 'hsl(280 70% 50%)' },
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
  const { theme } = useTheme();

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
              src={getBrandAsset(b, 'icon', theme) || '/logos/icon_geralbet_azul.png'}
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
  const [pauseReasonType, setPauseReasonType] = useState('Outros');

  // Reject modal state
  const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Filter & bulk selection state
  const [filters, setFilters] = useState<Filters>({
    search: '', status: [], priority: [], assignee: '', tag: '', sortBy: 'created_at', sortOrder: 'desc',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; avatarUrl?: string | null }[]>([]);
  const [allTags, setAllTags]   = useState<{ id: string; name: string; color: string }[]>([]);

  // Fetch users & tags once
  useEffect(() => {
    if (!token) return;
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => setAllUsers(data.map((u: any) => ({ id: u.id, name: u.name, avatarUrl: u.avatarUrl }))))
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
    if (newStatus === 'done' || newStatus === 'in_review') { setTaskToComplete(draggableId); setMaterialLink(''); setComments(''); setPieces(''); return; }
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
    setPauseReasonType('Outros');
    setPauseReason('');
  };

  const confirmPause = async () => {
    if (!pausingTaskId) return;
    const finalReason = pauseReasonType === 'Outros' ? (pauseReason.trim() || 'Pausa manual') : pauseReasonType;
    const res = await fetch(`/api/tasks/${pausingTaskId}/time/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: finalReason }),
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
      body: JSON.stringify({ status: 'in_review', material_link: materialLink, comments, pieces: pieces !== '' ? Number(pieces) : undefined }),
    });
    if (res.ok) fetchTasks();
    setTaskToComplete(null);
    setPieces('');
  };

  const handleReview = async (taskId: string, approved: boolean, reason?: string) => {
    const res = await fetch(`/api/tasks/${taskId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ approved, reason }),
    });
    if (res.ok) fetchTasks();
    if (!approved) {
      setRejectingTaskId(null);
      setRejectReason('');
    }
  };

  const getColumn = (task: Task) => {
    if (task.status === 'done') return 'done';
    if (task.status === 'in_review') return 'in_review';
    const hasMyStep = task.steps?.some(s => s.user_id === user?.id && s.status === 'done');
    return hasMyStep ? 'done' : task.status;
  };

  let visibleTasks = tasks;
  if (user?.role === 'solicitante') {
    visibleTasks = visibleTasks.filter(t => t.creator_id === user.id);
  }
  if (selectedBrand) {
    visibleTasks = visibleTasks.filter(t => (t as any).brand === selectedBrand.name);
  }

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

                        const myTimeObj  = task.user_times?.find(ut => ut.user_name === user?.name);
                        const myTimeBase = myTimeObj ? myTimeObj.seconds : 0;

                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                className="task-card flex flex-col p-2.5"
                                onClick={() => setSelectedTask(task)} // Make whole card clickable
                                style={{
                                  ...prov.draggableProps.style,
                                  cursor: 'pointer',
                                  opacity: snap.isDragging ? 0.92 : 1,
                                  boxShadow: snap.isDragging ? '0 12px 32px rgb(0 0 0 / 0.25)' : undefined,
                                  border: selectedIds.has(task.id)
                                    ? '2px solid var(--brand-500)'
                                    : isOverdue
                                      ? '1px solid rgb(239 68 68 / 0.35)'
                                      : '1px solid var(--border)',
                                  background: 'var(--surface-1)',
                                  borderRadius: '8px',
                                  gap: '6px'
                                }}
                              >
                                {/* Header: Selection + Badges */}
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex flex-wrap gap-1 items-center">
                                    {user?.role === 'admin' && (
                                      <div
                                        onClick={e => { e.stopPropagation(); toggleSelect(task.id); }}
                                        className="mr-1 flex items-center justify-center shrink-0"
                                        style={{
                                          width: 14, height: 14, borderRadius: 3,
                                          border: selectedIds.has(task.id) ? 'transparent' : '1.5px solid var(--border)',
                                          background: selectedIds.has(task.id) ? 'var(--brand-500)' : 'transparent',
                                          transition: 'all 0.15s',
                                        }}
                                      >
                                        {selectedIds.has(task.id) && <Check size={10} style={{ color: '#fff' }} />}
                                      </div>
                                    )}
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
                                      {task.type}
                                    </span>
                                    {(task as any).brand && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm" style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}>
                                        {(task as any).brand}
                                      </span>
                                    )}
                                    {!isMyStepDone && task.priority && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm" style={{ background: pStyle.bg, color: pStyle.color }}>
                                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Tags */}
                                {(task as any).tags?.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {((task as any).tags as Array<{ id: string; name: string; color: string }>).map(tag => (
                                      <div key={tag.id} className="h-1.5 w-6 rounded-full" style={{ background: tag.color }} title={tag.name} />
                                    ))}
                                  </div>
                                )}

                                {/* Title */}
                                <h4
                                  className="text-[13px] font-medium leading-tight my-0.5"
                                  style={{
                                    color: task.status === 'done' ? 'var(--text-3)' : 'var(--text-1)',
                                    textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  {task.title}
                                </h4>

                                {/* Alerts / Info */}
                                {isOverdue && task.status !== 'done' && (
                                  <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: '#f87171' }}>
                                    <AlertTriangle size={10} /> Atrasada
                                  </div>
                                )}
                                {isMyStepDone && task.status !== 'done' && (
                                  <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: '#4ade80' }}>
                                    <Check size={10} /> Minha etapa ok
                                  </div>
                                )}
                                {!isMyStepDone && isMyTurn && task.status !== 'done' && currentStep?.instruction && (
                                  <div className="text-[11px] p-1.5 rounded bg-[var(--brand-50)] text-[var(--brand-700)] line-clamp-2 mt-1" title={currentStep.instruction}>
                                    <span className="font-semibold">Instrução: </span>{currentStep.instruction}
                                  </div>
                                )}
                                {task.status === 'in_review' && (
                                  <p className="text-[11px] font-medium mt-1" style={{ color: 'var(--brand-600)' }}>Aguardando Revisão</p>
                                )}

                                <div className="flex-1" />

                                {/* Footer: Controls & Avatars */}
                                <div className="flex items-center justify-between pt-2 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
                                  
                                  {/* Left: Time and Actions */}
                                  <div className="flex items-center gap-1.5 text-[var(--text-3)]">
                                    
                                    {/* Time Block */}
                                    <div 
                                      className="flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded"
                                      style={{ 
                                        background: task.status === 'in_progress' ? 'hsl(38 92% 50% / 0.15)' : 'var(--surface-2)',
                                        color: task.status === 'in_progress' ? 'hsl(38 92% 50%)' : 'var(--text-2)',
                                        border: task.status === 'in_progress' ? '1px solid hsl(38 92% 50% / 0.3)' : '1px solid transparent'
                                      }}
                                    >
                                      <Clock size={11} className={task.status === 'in_progress' ? "animate-pulse" : ""} />
                                      {task.status === 'in_progress' && task.active_start_time ? (
                                        <LiveTimer startTime={task.active_start_time} offsetSeconds={myTimeBase} />
                                      ) : (
                                        <span className="font-mono tabular-nums">{formatTime(task.status === 'done' ? task.accumulated_seconds || 0 : myTimeBase)}</span>
                                      )}
                                    </div>

                                    {/* Action buttons (only if actionable by me) */}
                                    {task.status !== 'done' && task.status !== 'in_review' && !isMyStepDone && (
                                      <div className="flex items-center gap-0.5">
                                        {task.status === 'in_progress' && task.active_start_time ? (
                                          <button onClick={(e) => { e.stopPropagation(); openPauseModal(task.id); }} className="p-1 rounded text-[hsl(38_92%_50%)] hover:bg-[hsl(38_92%_50%_/_0.15)] transition-colors" title="Pausar Timer">
                                              <PauseCircle size={15} />
                                          </button>
                                        ) : (
                                          <button onClick={(e) => { e.stopPropagation(); handleTimeAction(task.id, 'start'); }} className="p-1 rounded text-[var(--brand-500)] hover:bg-[var(--brand-100)] transition-colors" title="Iniciar Timer">
                                              <PlayCircle size={15} />
                                          </button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); setTaskToComplete(task.id); setMaterialLink(''); setComments(''); setPieces(''); }} className="p-1 rounded text-[hsl(142_71%_45%)] hover:bg-[hsl(142_71%_45%_/_0.15)] transition-colors" title="Concluir Etapa">
                                            <CheckCircle2 size={15} />
                                        </button>
                                      </div>
                                    )}

                                    {/* Admin review controls */}
                                    {task.status === 'in_review' && (user?.role === 'admin' || user?.role === 'coordenador') && (
                                      <div className="flex items-center gap-0.5 ml-1">
                                        <button onClick={(e) => { e.stopPropagation(); handleReview(task.id, true); }} className="p-1 rounded text-[hsl(142_71%_45%)] hover:bg-[hsl(142_71%_45%_/_0.15)] transition-colors" title="Aprovar Tarefa">
                                          <CheckCircle2 size={15} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setRejectingTaskId(task.id); }} className="p-1 rounded text-[hsl(0_84%_60%)] hover:bg-[hsl(0_84%_60%_/_0.15)] transition-colors" title="Reprovar Tarefa">
                                          <AlertTriangle size={15} />
                                        </button>
                                      </div>
                                    )}

                                  </div>

                                  {/* Right: Avatars */}
                                  <div className="flex items-center -space-x-1.5 shrink-0">
                                    {(() => {
                                      const uniqueMembers = new Map<string, {name: string, avatarUrl: string|null}>();
                                      if (task.assignee_id) {
                                          const a = allUsers.find(u => u.id === task.assignee_id);
                                          if (a) {
                                            const isMe = a.id === user?.id;
                                            uniqueMembers.set(a.id, {
                                              name: isMe && user?.name ? user.name : a.name, 
                                              avatarUrl: isMe && user?.avatarUrl !== undefined ? user.avatarUrl : (a.avatarUrl || null)
                                            });
                                          }
                                      }
                                      task.user_times?.forEach(ut => {
                                          if (ut.user_id && ut.user_name && !uniqueMembers.has(ut.user_id)) {
                                            const isMe = ut.user_id === user?.id;
                                            uniqueMembers.set(ut.user_id, {
                                              name: isMe && user?.name ? user.name : ut.user_name, 
                                              avatarUrl: isMe && user?.avatarUrl !== undefined ? user.avatarUrl : (ut.avatar_url || null)
                                            });
                                          }
                                      });
                                      
                                      const members = Array.from(uniqueMembers.values());
                                      const maxAvatars = 3;
                                      const showMembers = members.slice(0, maxAvatars);
                                      const extra = members.length > maxAvatars ? members.length - maxAvatars : 0;
                                      
                                      if (members.length === 0) {
                                        return <div className="text-[10px] text-[var(--text-3)]" title="Não atribuído"><UserIcon size={12} /></div>;
                                      }
                                      
                                      return (
                                        <>
                                          {showMembers.map((m, i) => (
                                            <div 
                                              key={i} 
                                              className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm bg-cover bg-center" 
                                              style={{ 
                                                backgroundImage: m.avatarUrl ? `url(${m.avatarUrl})` : 'none',
                                                backgroundColor: m.avatarUrl ? 'transparent' : 'var(--brand-400)',
                                                border: '1.5px solid var(--surface-1)',
                                                zIndex: 10 - i 
                                              }} 
                                              title={m.name}
                                            >
                                              {!m.avatarUrl && m.name.substring(0,2).toUpperCase()}
                                            </div>
                                          ))}
                                          {extra > 0 && (
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold bg-[var(--surface-3)] text-[var(--text-3)] shadow-sm" style={{ border: '1.5px solid var(--surface-1)', zIndex: 0 }} title={`+${extra} outros`}>
                                              +{extra}
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
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
              Informe o motivo da pausa.
            </p>
            <select
              className="input-base w-full mb-3"
              value={pauseReasonType}
              onChange={e => { setPauseReasonType(e.target.value); if (e.target.value !== 'Outro') setPauseReason(''); }}
            >
              <option value="Intervalo">Intervalo</option>
              <option value="Banheiro">Banheiro</option>
              <option value="Urgente">Urgente</option>
              <option value="Outro">Outro</option>
            </select>
            {pauseReasonType === 'Outro' && (
              <input
                type="text"
                className="input-base w-full mb-4"
                placeholder="Ex: reunião, almoço, aguardando retorno…"
                value={pauseReason}
                onChange={e => setPauseReason(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmPause(); if (e.key === 'Escape') setPausingTaskId(null); }}
                autoFocus
              />
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPausingTaskId(null)} className="btn-ghost">Cancelar</button>
              <button onClick={confirmPause} className="btn-brand flex items-center gap-2">
                <PauseCircle size={16} /> Pausar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectingTaskId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-1)' }}>Reprovar Tarefa</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
              Informe o motivo da reprovação (obrigatório). A tarefa será devolvida para a última pessoa responsável.
            </p>
            <textarea
              className="input-base w-full mb-4 resize-none"
              rows={4}
              placeholder="Descreva o que precisa ser ajustado..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setRejectingTaskId(null); setRejectReason(''); }} className="btn-ghost">Cancelar</button>
              <button onClick={() => { if (rejectReason.trim()) handleReview(rejectingTaskId, false, rejectReason); else alert('Informe o motivo!'); }} className="btn-brand flex items-center gap-2" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>
                <AlertTriangle size={16} /> Reprovar
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
