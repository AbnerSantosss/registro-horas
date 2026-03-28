import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Task } from '../types';
import {
  Plus, Eye, Clock, CheckCircle2, AlertTriangle
} from 'lucide-react';
import NewTaskModal from '../components/NewTaskModal';
import TaskDetailsModal from '../components/TaskDetailsModal';

/* ─── Column config for Solicitante ─────────────────────── */
const COLUMNS = [
  { id: 'aguardando',   title: 'Aguardando',   dot: 'hsl(220 13% 50%)',     sourceStatuses: ['todo', 'paused'] },
  { id: 'em_andamento', title: 'Em Andamento', dot: 'var(--brand-500)',      sourceStatuses: ['in_progress'] },
  { id: 'concluido',    title: 'Concluído',    dot: 'hsl(142 71% 45%)',      sourceStatuses: ['done'] },
];

export default function SolicitanteDashboard() {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks?sortOrder=desc', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setTasks(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const getSimplifiedColumn = (status: string) => {
    return COLUMNS.find(c => c.sourceStatuses.includes(status))?.id || 'aguardando';
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center" style={{ color: 'var(--text-3)' }}>
      <svg className="animate-spin w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
        <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      Carregando minhas solicitações…
    </div>
  );

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Minhas Solicitações</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Acompanhe o andamento das suas demandas
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-brand flex items-center gap-2">
          <Plus size={16} /> Nova Solicitação
        </button>
      </div>

      {/* Grid Simplificado */}
      <div className="flex gap-4 flex-1 overflow-x-auto pb-2 min-h-0">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => getSimplifiedColumn(t.status) === col.id);
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

              <div
                className="flex-1 rounded-xl p-2 overflow-y-auto"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  minHeight: 120,
                }}
              >
                {colTasks.length === 0 && (
                  <div className="text-xs text-center p-4" style={{ color: 'var(--text-3)' }}>
                    Nenhuma solicitação nesta etapa.
                  </div>
                )}
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    className="task-card"
                    style={{ border: '1px solid var(--border)' }}
                    onClick={() => setSelectedTask(task)}
                  >
                    {/* Badges row */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="badge" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
                        Rede: {task.network || 'Não definida'}
                      </span>
                      <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                        Formato: {task.format || 'Não definido'}
                      </span>
                    </div>

                    {/* Title */}
                    <h4
                      className="text-sm font-semibold leading-snug mb-1"
                      style={{
                        color: task.status === 'done' ? 'var(--text-3)' : 'var(--text-1)',
                      }}
                    >
                      {task.title}
                    </h4>

                    {/* Description preview */}
                    <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-3)' }}>
                      {task.description || 'Sem descrição'}
                    </p>

                    {/* Progress indicator info */}
                    <div
                      className="pt-3 mt-1 space-y-2 flex items-center justify-between"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                        Criada em: {new Date(task.created_at).toLocaleDateString()}
                      </span>
                      <button
                        className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                        style={{ color: 'var(--text-3)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        title="Ver detalhes"
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTaskCreated={fetchTasks} />
      
      {/* We pass an empty users array or just don't pass if not needed, as the form should be read-only */}
      <TaskDetailsModal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} task={selectedTask} users={[]} onTransfer={fetchTasks} />
    </div>
  );
}
