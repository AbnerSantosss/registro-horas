import React, { useState } from 'react';
import {
  CheckSquare, X, Trash2, ArrowRight, UserPlus,
} from 'lucide-react';

interface BulkActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onBulkStatus: (status: string) => void;
  onBulkAssign: (assigneeId: string) => void;
  onBulkDelete: () => void;
  users: { id: string; name: string }[];
}

const STATUS_TARGETS = [
  { value: 'todo',        label: 'A Fazer',      dot: 'hsl(220 13% 50%)' },
  { value: 'in_progress', label: 'Em Andamento', dot: 'hsl(210 100% 56%)' },
  { value: 'paused',      label: 'Pausado',      dot: 'hsl(38 92% 50%)' },
  { value: 'done',        label: 'Concluído',    dot: 'hsl(142 71% 45%)' },
];

export default function BulkActionBar({
  selectedIds, onClearSelection, onBulkStatus, onBulkAssign, onBulkDelete, users,
}: BulkActionBarProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAssign, setShowAssign]       = useState(false);
  const [showStatus, setShowStatus]       = useState(false);

  if (selectedIds.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl z-40"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--brand-200)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 40px rgb(0 0 0 / 0.3)',
      }}
    >
      {/* Count */}
      <div className="flex items-center gap-2 pr-3" style={{ borderRight: '1px solid var(--border)' }}>
        <CheckSquare size={16} style={{ color: 'var(--brand-500)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
          {selectedIds.length} selecionada{selectedIds.length > 1 ? 's' : ''}
        </span>
        <button
          onClick={onClearSelection}
          className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="Limpar seleção"
        >
          <X size={14} />
        </button>
      </div>

      {/* Move status */}
      <div className="relative">
        <button
          onClick={() => { setShowStatus(!showStatus); setShowAssign(false); setConfirmDelete(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border)' }}
        >
          <ArrowRight size={14} /> Mover
        </button>
        {showStatus && (
          <div
            className="absolute bottom-full left-0 mb-2 min-w-[160px] rounded-xl shadow-xl z-50 p-2"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
          >
            {STATUS_TARGETS.map(s => (
              <button
                key={s.value}
                onClick={() => { onBulkStatus(s.value); setShowStatus(false); }}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 hover:bg-[var(--surface-2)] transition-colors"
                style={{ color: 'var(--text-1)' }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Assign */}
      <div className="relative">
        <button
          onClick={() => { setShowAssign(!showAssign); setShowStatus(false); setConfirmDelete(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border)' }}
        >
          <UserPlus size={14} /> Atribuir
        </button>
        {showAssign && (
          <div
            className="absolute bottom-full left-0 mb-2 min-w-[180px] rounded-xl shadow-xl z-50 p-2 max-h-60 overflow-y-auto"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
          >
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => { onBulkAssign(u.id); setShowAssign(false); }}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-[var(--surface-2)] transition-colors"
                style={{ color: 'var(--text-1)' }}
              >
                {u.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      {!confirmDelete ? (
        <button
          onClick={() => { setConfirmDelete(true); setShowStatus(false); setShowAssign(false); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: 'rgb(239 68 68 / 0.1)', color: '#f87171', border: '1px solid rgb(239 68 68 / 0.25)' }}
        >
          <Trash2 size={14} /> Excluir
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium" style={{ color: '#f87171' }}>Confirmar?</span>
          <button
            onClick={() => { onBulkDelete(); setConfirmDelete(false); }}
            className="px-2 py-1 rounded-md text-xs font-semibold transition-all"
            style={{ background: '#ef4444', color: '#fff' }}
          >
            Sim
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-2 py-1 rounded-md text-xs font-medium transition-all"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
          >
            Não
          </button>
        </div>
      )}
    </div>
  );
}
