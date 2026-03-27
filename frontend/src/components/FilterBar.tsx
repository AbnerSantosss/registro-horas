import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

export interface Filters {
  search: string;
  status: string[];
  priority: string[];
  assignee: string;
  tag: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  users: { id: string; name: string }[];
  tags: { id: string; name: string; color: string }[];
}

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'A Fazer',      dot: 'hsl(220 13% 50%)' },
  { value: 'in_progress', label: 'Em Andamento', dot: 'hsl(210 100% 56%)' },
  { value: 'paused',      label: 'Pausado',      dot: 'hsl(38 92% 50%)' },
  { value: 'done',        label: 'Concluído',    dot: 'hsl(142 71% 45%)' },
];

const PRIORITY_OPTIONS = [
  { value: 'urgente', label: 'Urgente', color: '#f87171' },
  { value: 'alta',    label: 'Alta',    color: '#fb923c' },
  { value: 'normal',  label: 'Normal',  color: '#4ade80' },
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Data de criação' },
  { value: 'due_date',   label: 'Prazo' },
  { value: 'priority',   label: 'Prioridade' },
  { value: 'title',      label: 'Título' },
];

function Dropdown({ label, children, active }: { label: string; children: React.ReactNode; active: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{
          background: active ? 'var(--brand-50)' : 'var(--surface-2)',
          color: active ? 'var(--brand-600)' : 'var(--text-2)',
          border: `1px solid ${active ? 'var(--brand-200)' : 'var(--border)'}`,
        }}
      >
        {label}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 min-w-[180px] rounded-xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-1"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({ filters, onFiltersChange, users, tags }: FilterBarProps) {
  const update = (partial: Partial<Filters>) => onFiltersChange({ ...filters, ...partial });

  const toggleArrayItem = (key: 'status' | 'priority', value: string) => {
    const arr = filters[key];
    update({ [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] });
  };

  const activeCount = [
    filters.search ? 1 : 0,
    filters.status.length,
    filters.priority.length,
    filters.assignee ? 1 : 0,
    filters.tag ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAll = () => onFiltersChange({
    search: '', status: [], priority: [], assignee: '', tag: '', sortBy: 'created_at', sortOrder: 'desc',
  });

  return (
    <div
      className="flex flex-wrap items-center gap-2 p-3 rounded-xl mb-4 shrink-0"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-[280px]">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
        <input
          type="text"
          placeholder="Buscar tarefa…"
          value={filters.search}
          onChange={e => update({ search: e.target.value })}
          className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            color: 'var(--text-1)',
            outline: 'none',
          }}
        />
      </div>

      {/* Divider */}
      <div className="w-px h-5" style={{ background: 'var(--border)' }} />

      {/* Status */}
      <Dropdown label="Status" active={filters.status.length > 0}>
        {STATUS_OPTIONS.map(s => (
          <label
            key={s.value}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs hover:bg-[var(--surface-2)] transition-colors"
            style={{ color: 'var(--text-1)' }}
          >
            <input
              type="checkbox"
              checked={filters.status.includes(s.value)}
              onChange={() => toggleArrayItem('status', s.value)}
              className="accent-[var(--brand-500)]"
            />
            <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
            {s.label}
          </label>
        ))}
      </Dropdown>

      {/* Priority */}
      <Dropdown label="Prioridade" active={filters.priority.length > 0}>
        {PRIORITY_OPTIONS.map(p => (
          <label
            key={p.value}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs hover:bg-[var(--surface-2)] transition-colors"
            style={{ color: 'var(--text-1)' }}
          >
            <input
              type="checkbox"
              checked={filters.priority.includes(p.value)}
              onChange={() => toggleArrayItem('priority', p.value)}
              className="accent-[var(--brand-500)]"
            />
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.label}
          </label>
        ))}
      </Dropdown>

      {/* Assignee */}
      <Dropdown label="Responsável" active={!!filters.assignee}>
        <button
          className="w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors"
          style={{
            color: !filters.assignee ? 'var(--brand-600)' : 'var(--text-2)',
            background: !filters.assignee ? 'var(--brand-50)' : 'transparent',
            fontWeight: !filters.assignee ? 600 : 400,
          }}
          onClick={() => update({ assignee: '' })}
        >
          Todos
        </button>
        {users.map(u => (
          <button
            key={u.id}
            className="w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              color: filters.assignee === u.id ? 'var(--brand-600)' : 'var(--text-2)',
              background: filters.assignee === u.id ? 'var(--brand-50)' : 'transparent',
              fontWeight: filters.assignee === u.id ? 600 : 400,
            }}
            onClick={() => update({ assignee: u.id })}
          >
            {u.name}
          </button>
        ))}
      </Dropdown>

      {/* Tags */}
      {tags.length > 0 && (
        <Dropdown label="Tag" active={!!filters.tag}>
          <button
            className="w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              color: !filters.tag ? 'var(--brand-600)' : 'var(--text-2)',
              background: !filters.tag ? 'var(--brand-50)' : 'transparent',
              fontWeight: !filters.tag ? 600 : 400,
            }}
            onClick={() => update({ tag: '' })}
          >
            Todas
          </button>
          {tags.map(t => (
            <button
              key={t.id}
              className="w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors"
              style={{
                color: filters.tag === t.id ? 'var(--brand-600)' : 'var(--text-2)',
                background: filters.tag === t.id ? 'var(--brand-50)' : 'transparent',
                fontWeight: filters.tag === t.id ? 600 : 400,
              }}
              onClick={() => update({ tag: t.id })}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
              {t.name}
            </button>
          ))}
        </Dropdown>
      )}

      {/* Divider */}
      <div className="w-px h-5" style={{ background: 'var(--border)' }} />

      {/* Sort */}
      <Dropdown label={`Ordenar: ${SORT_OPTIONS.find(s => s.value === filters.sortBy)?.label || 'Data'}`} active={filters.sortBy !== 'created_at' || filters.sortOrder !== 'desc'}>
        {SORT_OPTIONS.map(s => (
          <button
            key={s.value}
            className="w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              color: filters.sortBy === s.value ? 'var(--brand-600)' : 'var(--text-2)',
              background: filters.sortBy === s.value ? 'var(--brand-50)' : 'transparent',
              fontWeight: filters.sortBy === s.value ? 600 : 400,
            }}
            onClick={() => update({ sortBy: s.value })}
          >
            {s.label}
          </button>
        ))}
        <div className="mt-1 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            className="w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              color: filters.sortOrder === 'desc' ? 'var(--brand-600)' : 'var(--text-2)',
              fontWeight: filters.sortOrder === 'desc' ? 600 : 400,
            }}
            onClick={() => update({ sortOrder: 'desc' })}
          >
            ↓ Mais recentes
          </button>
          <button
            className="w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              color: filters.sortOrder === 'asc' ? 'var(--brand-600)' : 'var(--text-2)',
              fontWeight: filters.sortOrder === 'asc' ? 600 : 400,
            }}
            onClick={() => update({ sortOrder: 'asc' })}
          >
            ↑ Mais antigos
          </button>
        </div>
      </Dropdown>

      {/* Active filter count + clear */}
      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ml-auto"
          style={{ color: 'var(--brand-600)', background: 'var(--brand-50)' }}
        >
          <Filter size={12} />
          {activeCount} filtro{activeCount > 1 ? 's' : ''}
          <X size={12} />
        </button>
      )}
    </div>
  );
}
