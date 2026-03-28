import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, BarChart2, ClipboardList, CheckCircle2, Clock, AlertTriangle, PauseCircle, ListTodo, Layers } from 'lucide-react';
import TaskDetailsModal from '../components/TaskDetailsModal';
import { Task } from '../types';

/* ───── Status badge map ───── */
const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  done:        { label: 'Concluído',    bg: 'hsl(142 71% 45% / 0.15)',  color: '#4ade80' },
  in_progress: { label: 'Em andamento', bg: 'var(--brand-100)',          color: 'var(--brand-700)' },
  in_review:   { label: 'Em Revisão',   bg: 'hsl(280 80% 60% / 0.15)',  color: 'hsl(280 80% 60%)' },
  paused:      { label: 'Pausado',      bg: 'hsl(38 92% 50% / 0.15)',   color: 'hsl(38 92% 50%)' },
  todo:        { label: 'A Fazer',      bg: 'var(--surface-3)',          color: 'var(--text-3)' },
};

const fmt = (s: number) => {
  if (!s) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

const COLORS = [
  '#818cf8','#34d399','#fb923c','#f472b6','#60a5fa','#a78bfa','#2dd4bf',
];
const avatarColor = (name: string) => COLORS[name.charCodeAt(0) % COLORS.length];

/* ───── Types ───── */
interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  in_review: number;
  paused: number;
  done: number;
  overdue: number;
  total_pieces: number;
  total_rejections: number;
}

/* ───── StatsCard ───── */
function StatsCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: accent + '18', color: accent }}
        >
          <Icon size={18} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
          {label}
        </span>
      </div>
      <span className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>
        {value}
      </span>
    </div>
  );
}

/* ───── Main component ───── */
export default function Reports() {
  const { token, user } = useAuth();
  const [reports, setReports]     = useState<any[]>([]);
  const [stats, setStats]         = useState<TaskStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'colaborador'>('geral');
  const [filterBrand, setFilterBrand] = useState('Todas');

  const BRANDS = ['Todas', 'Logame', 'Officom', 'Habeas', 'Sintonia', 'Poder das Teclas', 'Escola das Teclas', 'Venda Mais', 'Venda Mais B2B', 'Gospel', 'Iniciação', 'Outros'];

  useEffect(() => {
    if (user?.role === 'admin') {
      Promise.all([fetchReports(), fetchStats()]).finally(() => setLoading(false));
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/tasks/reports', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setReports(await res.json());
    } catch { /* ignore */ }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/tasks/stats', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  };

  const openTask = async (taskId: string) => {
    const res = await fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const list: Task[] = await res.json();
      const t = list.find(t => t.id === taskId);
      if (t) setSelectedTask(t);
    }
  };

  if (user?.role !== 'admin') return (
    <div className="flex h-full items-center justify-center">
      <p style={{ color: 'var(--text-3)' }}>Acesso restrito a administradores.</p>
    </div>
  );

  const STAT_CARDS = stats ? [
    { icon: ClipboardList,  label: 'Total de Tarefas',  value: stats.total,       accent: '#818cf8' },
    { icon: ListTodo,       label: 'A Fazer',           value: stats.todo,        accent: '#94a3b8' },
    { icon: Clock,          label: 'Em Produção',     value: stats.in_progress, accent: '#60a5fa' },
    { icon: Eye,            label: 'Em Revisão',      value: stats.in_review,   accent: '#c084fc' },
    { icon: PauseCircle,    label: 'Pausadas',          value: stats.paused,      accent: '#fbbf24' },
    { icon: CheckCircle2,   label: 'Concluídas',        value: stats.done,        accent: '#4ade80' },
    { icon: AlertTriangle,  label: 'Atrasadas',         value: stats.overdue,     accent: '#f87171' },
    { icon: Layers,         label: 'Peças Produzidas',  value: stats.total_pieces, accent: '#34d399' },
    { icon: AlertTriangle,  label: 'Devoluções',       value: stats.total_rejections || 0, accent: '#ef4444' },
  ] : [];

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <BarChart2 size={20} style={{ color: 'var(--brand-500)' }} />
          Relatórios
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
          Visão geral de tarefas e tempo registrado por colaborador.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
        <button
          className={`pb-3 font-medium text-sm transition-colors border-b-2`}
          style={{
            borderColor: activeTab === 'geral' ? 'var(--brand-500)' : 'transparent',
            color: activeTab === 'geral' ? 'var(--brand-500)' : 'var(--text-3)'
          }}
          onClick={() => setActiveTab('geral')}
        >
          Visão Geral
        </button>
        <button
          className={`pb-3 font-medium text-sm transition-colors border-b-2`}
          style={{
            borderColor: activeTab === 'colaborador' ? 'var(--brand-500)' : 'transparent',
            color: activeTab === 'colaborador' ? 'var(--brand-500)' : 'var(--text-3)'
          }}
          onClick={() => setActiveTab('colaborador')}
        >
          Por Colaborador
        </button>
      </div>

      {activeTab === 'geral' && (
        <div className="flex flex-col gap-6">
          {/* ── Stats cards ─── */}
          {stats && (
            <div className="flex flex-wrap gap-4 [&>*]:flex-1 [&>*]:min-w-[140px]">
              {STAT_CARDS.map(card => (
                <StatsCard key={card.label} {...card} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'colaborador' && (
        <div className="flex flex-col gap-6">
          {/* ── Time reports table ─── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                <Clock size={16} style={{ color: 'var(--brand-500)' }} />
                Tempo por Colaborador
              </h2>
              <select
                value={filterBrand}
                onChange={e => setFilterBrand(e.target.value)}
                className="input"
                style={{ width: 140, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              >
                {BRANDS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16" style={{ color: 'var(--text-3)' }}>
              <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Carregando…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                    {['Colaborador', 'Tarefa', 'Marca', 'Status', 'Tempo', 'Peças', 'Pausas', 'Devoluções', ''].map(h => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${h === '' ? 'text-right' : ''}`}
                        style={{ color: 'var(--text-3)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = filterBrand === 'Todas' ? reports : reports.filter(r => r.task_brand === filterBrand);
                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={9} className="py-16 text-center text-sm" style={{ color: 'var(--text-3)' }}>
                            Nenhum registro encontrado para esta seleção.
                          </td>
                        </tr>
                      );
                    }
                    return filtered.map((r, i) => {
                      const s = STATUS_MAP[r.task_status] ?? STATUS_MAP.todo;
                      return (
                        <tr
                          key={i}
                          className="transition-colors"
                          style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-2)')}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                        >
                          {/* Collaborator */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                style={{ background: avatarColor(r.user_name) + '25', color: avatarColor(r.user_name) }}
                              >
                                {initials(r.user_name)}
                              </div>
                              <span className="font-medium text-sm" style={{ color: 'var(--text-1)' }}>
                                {r.user_name}
                              </span>
                            </div>
                          </td>

                          {/* Task */}
                          <td className="px-4 py-3 text-sm max-w-xs truncate" style={{ color: 'var(--text-2)' }} title={r.task_title}>
                            {r.task_title}
                          </td>

                          {/* Brand */}
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                            {r.task_brand || '—'}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className="badge"
                              style={{ background: s.bg, color: s.color }}
                            >
                              {s.label}
                            </span>
                          </td>

                          {/* Time */}
                          <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                            {fmt(r.total_duration)}
                          </td>

                          {/* Pieces */}
                          <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: r.total_pieces > 0 ? 'var(--brand-600)' : 'var(--text-3)' }}>
                            {r.total_pieces > 0 ? r.total_pieces : '—'}
                          </td>

                          {/* Pauses */}
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-3)' }}>
                            {r.pause_count} {r.pause_count === 1 ? 'pausa' : 'pausas'}
                          </td>

                          {/* Devolucoes */}
                          <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: r.reject_count > 0 ? '#ef4444' : 'var(--text-3)' }}>
                            {r.reject_count > 0 ? r.reject_count : '—'}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openTask(r.task_id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center ml-auto transition-colors"
                              style={{ color: 'var(--text-3)' }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)';
                                (e.currentTarget as HTMLElement).style.color = 'var(--brand-500)';
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                (e.currentTarget as HTMLElement).style.color = 'var(--text-3)';
                              }}
                              title="Ver detalhes"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </div>
      )}

      <TaskDetailsModal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} task={selectedTask} />
    </div>
  );
}
