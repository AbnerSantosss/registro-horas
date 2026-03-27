import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X, Clock, User as UserIcon, Calendar, MessageSquare, Send,
  Check, Link as LinkIcon, Layers, Target, MapPin, GitCommit, PauseCircle,
  ArrowRightLeft,
} from 'lucide-react';
import { Task } from '../types';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onComplete?: (taskId: string) => void;
  users?: { id: string; name: string }[];
  onTransfer?: () => void;
}

const PRIORITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  urgente: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'Urgente' },
  alta:    { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Alta' },
  normal:  { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', label: 'Normal' },
};

export default function TaskDetailsModal({ isOpen, onClose, task, onComplete, users, onTransfer }: TaskDetailsModalProps) {
  const { token } = useAuth();
  const [comments, setComments]   = useState<any[]>([]);
  const [timeData, setTimeData]   = useState<{ total_seconds: number; entries: any[] } | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading]     = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo]     = useState('');
  const [transferring, setTransferring] = useState(false);

  const handleTransfer = async () => {
    if (!transferTo || !task) return;
    setTransferring(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignee_id: transferTo }),
      });
      if (res.ok) {
        setShowTransfer(false);
        setTransferTo('');
        onTransfer?.();
        onClose();
      }
    } catch {}
    finally { setTransferring(false); }
  };

  useEffect(() => {
    if (isOpen && task) { fetchComments(); fetchTimeData(); }
  }, [isOpen, task]);

  const fetchComments = async () => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setComments(await res.json());
    } catch {}
  };

  const fetchTimeData = async () => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/time`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTimeData(await res.json());
    } catch {}
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) { setNewComment(''); fetchComments(); }
    } catch {}
    finally { setLoading(false); }
  };

  const fmtDuration = (s: number) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return `${h}h ${m}m`; };
  const getEntryDuration = (e: any) => {
    if (e.status === 'running' && e.start_time) {
      return Math.floor((Date.now() - new Date(e.start_time).getTime()) / 1000);
    }
    return e.duration || 0;
  };

  if (!isOpen || !task) return null;

  const priority = PRIORITY_STYLE[task.priority || 'normal'] || PRIORITY_STYLE.normal;
  const progress = task.status === 'done' ? 100 : Math.round(((task.current_step_index || 0) / (task.steps?.length || 1)) * 100);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}
      >
        {/* ── Header ── */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* badges */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20, background: 'var(--brand-100)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)' }}>
                {task.type}
              </span>
              {task.priority && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20, background: priority.bg, color: priority.color, border: `1px solid ${priority.color}40` }}>
                  {priority.label}
                </span>
              )}
              {task.status === 'done' && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 20, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                  ✓ Concluída
                </span>
              )}
            </div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.3, textDecoration: task.status === 'done' ? 'line-through' : 'none', opacity: task.status === 'done' ? 0.55 : 1 }}>
              {task.title}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
            {task.status !== 'done' && users && users.length > 0 && (
              <button
                onClick={() => setShowTransfer(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0.4rem 0.75rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
                  border: '1px solid var(--border)', cursor: 'pointer',
                  background: showTransfer ? 'var(--brand-50)' : 'var(--surface-2)',
                  color: showTransfer ? 'var(--brand-600)' : 'var(--text-2)',
                  transition: 'all 0.15s',
                }}
              >
                <ArrowRightLeft size={14} /> Transferir
              </button>
            )}
            {task.status !== 'done' && onComplete && (
              <button
                onClick={() => { onComplete(task.id); onClose(); }}
                className="btn-success"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Check size={15} strokeWidth={2.5} /> Concluir
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-3)', borderRadius: 6, display: 'flex' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Metadata chips */}
          {(task.network || task.format || task.placement || task.sector) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[
                task.network   && { icon: <Layers size={12}/>,  label: 'Rede',           value: task.network },
                task.format    && { icon: <MapPin size={12}/>,   label: 'Formato',        value: task.format },
                task.placement && { icon: <Target size={12}/>,   label: 'Posicionamento', value: task.placement },
                task.sector    && { icon: <UserIcon size={12}/>, label: 'Setor',          value: task.sector },
              ].filter(Boolean).map((m: any, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.3rem 0.6rem' }}>
                  <span style={{ color: 'var(--text-3)' }}>{m.icon}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>{m.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Assignee + Deadline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <InfoCard icon={<UserIcon size={14}/>} label="Responsável Atual" value={task.assignee_name || 'Não atribuído'} />
            <InfoCard icon={<Calendar size={14}/>} label="Prazo Final" value={task.deadline ? new Date(task.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'} />
          </div>

          {/* Transfer panel */}
          {showTransfer && users && (
            <div style={{
              background: 'var(--brand-50)', border: '1px solid var(--brand-200)',
              borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowRightLeft size={14} style={{ color: 'var(--brand-600)' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-700)' }}>Transferir tarefa para:</span>
              </div>
              <select
                value={transferTo}
                onChange={e => setTransferTo(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.88rem' }}
              >
                <option value="">Selecione um membro...</option>
                {users
                  .filter(u => u.id !== task.assignee_id)
                  .map(u => <option key={u.id} value={u.id}>{u.name}</option>)
                }
              </select>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowTransfer(false); setTransferTo(''); }}
                  style={{
                    padding: '0.4rem 0.85rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
                    border: '1px solid var(--border)', background: 'var(--surface-1)',
                    color: 'var(--text-2)', cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={!transferTo || transferring}
                  style={{
                    padding: '0.4rem 0.85rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
                    border: 'none', cursor: transferTo ? 'pointer' : 'not-allowed',
                    background: transferTo ? 'var(--brand-600)' : 'var(--surface-3)',
                    color: transferTo ? '#fff' : 'var(--text-3)',
                    opacity: transferring ? 0.6 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {transferring ? 'Transferindo...' : 'Confirmar Transferência'}
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <SectionLabel title="Descrição" />
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.875rem', fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {task.description || 'Nenhuma descrição fornecida.'}
            </div>
          </div>

          {/* Reference link */}
          {task.reference && (
            <div>
              <SectionLabel icon={<LinkIcon size={13}/>} title="Referência" />
              <a href={task.reference} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', background: 'var(--brand-50)', border: '1px solid var(--brand-200)', borderRadius: 8, padding: '0.6rem 0.875rem', fontSize: '0.82rem', color: 'var(--brand-600)', wordBreak: 'break-all', textDecoration: 'none' }}
              >
                {task.reference}
              </a>
            </div>
          )}

          {/* Workflow stepper */}
          {task.steps && task.steps.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <SectionLabel icon={<GitCommit size={13}/>} title="Fluxo de Trabalho" />
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--brand-600)' }}>{progress}%</span>
              </div>
              {/* Progress bar */}
              <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 4, marginBottom: '1rem', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--brand-600)', borderRadius: 4, transition: 'width 500ms ease' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 11, top: 12, bottom: 12, width: 1.5, background: 'var(--border)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {task.steps.map((step: any, i: number) => {
                    const isCurrent = i === task.current_step_index && task.status !== 'done';
                    const isDone    = step.status === 'done' || task.status === 'done';
                    return (
                      <div key={step.id} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, position: 'relative', zIndex: 1, background: isDone ? '#22c55e' : isCurrent ? 'var(--brand-600)' : 'var(--surface-2)', border: `2px solid ${isDone ? '#22c55e' : isCurrent ? 'var(--brand-600)' : 'var(--border)'}`, color: isDone || isCurrent ? '#fff' : 'var(--text-3)', marginTop: 2 }}>
                          {isDone ? <Check size={12} strokeWidth={3}/> : i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: isDone ? 'var(--text-3)' : isCurrent ? 'var(--brand-600)' : 'var(--text-1)', textDecoration: isDone ? 'line-through' : 'none' }}>
                            {step.user_name || 'Usuário'}
                            {step.pieces > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 600, marginLeft: 8, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '0.15rem 0.5rem', borderRadius: 10, border: '1px solid var(--border)' }}>{step.pieces} peça{step.pieces !== 1 ? 's' : ''}</span>}
                            {isCurrent && <span style={{ fontSize: '0.7rem', fontWeight: 600, marginLeft: 8, color: 'var(--brand-600)', background: 'var(--brand-50)', padding: '0.15rem 0.5rem', borderRadius: 10, border: '1px solid var(--brand-200)' }}>Etapa atual</span>}
                          </p>
                          {step.instruction && (
                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: isCurrent ? 'var(--brand-700)' : 'var(--text-3)', background: isCurrent ? 'var(--brand-50)' : 'var(--surface-2)', border: `1px solid ${isCurrent ? 'var(--brand-200)' : 'var(--border)'}`, borderRadius: 6, padding: '0.35rem 0.6rem' }}>
                              <strong>Instrução:</strong> {step.instruction}
                            </p>
                          )}
                          {isDone && step.material_link && (
                            <a href={step.material_link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-600)', background: 'var(--brand-50)', padding: '0.25rem 0.5rem', borderRadius: 6, border: '1px solid var(--brand-200)', textDecoration: 'none' }}>
                              <LinkIcon size={11}/> Material Produzido
                            </a>
                          )}
                          {isDone && step.comments && (
                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-2)', background: 'var(--surface-2)', borderRadius: 6, padding: '0.35rem 0.6rem', border: '1px solid var(--border)' }}>
                              <strong>Obs:</strong> {step.comments}
                            </p>
                          )}
                          {isDone && step.completed_at && (
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: 'var(--text-3)' }}>
                              Concluído em {new Date(step.completed_at).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Time tracking */}
          <div>
            <SectionLabel icon={<Clock size={13}/>} title="Tempo Gasto" />
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-2)' }}>Total:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-600)', fontVariantNumeric: 'tabular-nums' }}>{fmtDuration(timeData?.total_seconds || 0)}</span>
              </div>
              {timeData && timeData.entries.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  {timeData.entries.map((e: any) => (
                    <div key={e.id} style={{ borderLeft: '2px solid var(--brand-300)', paddingLeft: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>{e.user_name}</span>
                        <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-2)' }}>{fmtDuration(getEntryDuration(e))}</span>
                      </div>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-3)' }}>
                        {new Date(e.start_time).toLocaleString('pt-BR')}{e.end_time && ` até ${new Date(e.end_time).toLocaleTimeString('pt-BR')}`}
                      </p>
                      {e.status === 'paused' && e.pause_reason && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: '0.35rem', fontSize: '0.75rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '0.3rem 0.5rem', borderRadius: 6 }}>
                          <PauseCircle size={12}/> <strong>Pausa:</strong> {e.pause_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-3)', fontStyle: 'italic' }}>Nenhum tempo registrado.</p>
              )}
            </div>
          </div>

          {/* Comments */}
          <div>
            <SectionLabel icon={<MessageSquare size={13}/>} title="Comentários e Links" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {comments.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', fontStyle: 'italic' }}>Nenhum comentário ainda.</p>
              ) : comments.map(c => (
                <div key={c.id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)' }}>{c.user_name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{new Date(c.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{c.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Adicione um comentário ou link..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button type="submit" disabled={loading || !newComment.trim()} className="btn-brand" style={{ flexShrink: 0, padding: '0 0.875rem' }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ icon, title }: { icon?: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
      {icon && <span style={{ color: 'var(--brand-600)', display: 'flex' }}>{icon}</span>}
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.75rem 0.875rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: '0.3rem', color: 'var(--text-3)' }}>
        {icon}
        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)' }}>{value}</p>
    </div>
  );
}
