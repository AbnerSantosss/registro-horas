import { useState } from 'react';
import { Settings as SettingsIcon, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useTags } from '../context/TagContext';
import { usePlatforms } from '../context/PlatformContext';
import { Tag, Platform } from '../types';

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6366f1', '#0ea5e9', '#84cc16', '#64748b',
];

function ColorDot({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundColor: color }}
      className={`w-6 h-6 rounded-full border-2 transition-transform ${
        selected ? 'border-white scale-125' : 'border-transparent hover:scale-110'
      }`}
    />
  );
}

function TagChip({ tag }: { tag: Tag }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: tag.color }}
    >
      {tag.name}
    </span>
  );
}

export default function Settings() {
  const { tags, createTag, updateTag, deleteTag } = useTags();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[8]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { platforms, createPlatform, updatePlatform, deletePlatform } = usePlatforms();
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformIcon, setNewPlatformIcon] = useState('');
  const [newPlatformColor, setNewPlatformColor] = useState(PALETTE[0]);
  
  const [editingPlatformId, setEditingPlatformId] = useState<string | null>(null);
  const [editPlatformName, setEditPlatformName] = useState('');
  const [editPlatformIcon, setEditPlatformIcon] = useState('');
  const [editPlatformColor, setEditPlatformColor] = useState('');
  const [confirmPlatformDelete, setConfirmPlatformDelete] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createTag(newName.trim(), newColor);
      setNewName('');
      setNewColor(PALETTE[8]);
    } catch {
      setError('Erro ao criar tag. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setLoading(true);
    try {
      await updateTag(editingId, editName.trim(), editColor);
      setEditingId(null);
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteTag(id);
      setConfirmDelete(null);
    } catch {
      setError('Erro ao excluir tag.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlatform = async () => {
    if (!newPlatformName.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createPlatform(newPlatformName.trim(), newPlatformColor, newPlatformIcon.trim());
      setNewPlatformName('');
      setNewPlatformIcon('');
      setNewPlatformColor(PALETTE[0]);
    } catch {
      setError('Erro ao criar plataforma.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlatform = (platform: Platform) => {
    setEditingPlatformId(platform.id);
    setEditPlatformName(platform.name);
    setEditPlatformIcon(platform.icon || '');
    setEditPlatformColor(platform.color);
  };

  const handleSaveEditPlatform = async () => {
    if (!editingPlatformId || !editPlatformName.trim()) return;
    setLoading(true);
    try {
      await updatePlatform(editingPlatformId, editPlatformName.trim(), editPlatformColor, editPlatformIcon.trim());
      setEditingPlatformId(null);
    } catch {
      setError('Erro ao salvar plataforma.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlatform = async (id: string) => {
    setLoading(true);
    try {
      await deletePlatform(id);
      setConfirmPlatformDelete(null);
    } catch {
      setError('Erro ao excluir plataforma.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-indigo-500/20">
          <SettingsIcon size={24} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Configurações</h1>
          <p className="text-sm text-gray-400">Gerencie os recursos do sistema</p>
        </div>
      </div>

      {/* Tags Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-5">Tags</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Create form */}
        <div className="flex flex-col gap-3 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Nova tag</p>
          <div className="flex gap-3 items-center">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nome da tag..."
              className="flex-1 bg-transparent border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400"
            />
            <button
              onClick={handleCreate}
              disabled={loading || !newName.trim()}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded-lg text-sm text-white font-medium transition-colors"
            >
              <Plus size={15} />
              Criar
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {PALETTE.map(c => (
              <ColorDot key={c} color={c} selected={newColor === c} onClick={() => setNewColor(c)} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Prévia:</span>
            {newName.trim() && (
              <TagChip tag={{ id: 'preview', name: newName.trim(), color: newColor }} />
            )}
          </div>
        </div>

        {/* Tags list */}
        {tags.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-6">
            Nenhuma tag criada ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {tags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
              >
                {editingId === tag.id ? (
                  /* Editing mode */
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="bg-transparent border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-400"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {PALETTE.map(c => (
                        <ColorDot key={c} color={c} selected={editColor === c} onClick={() => setEditColor(c)} />
                      ))}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={handleSaveEdit}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg text-xs text-green-400 transition-colors"
                      >
                        <Check size={13} /> Salvar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-xs text-gray-400 transition-colors"
                      >
                        <X size={13} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <>
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="flex-1 text-sm text-white">{tag.name}</span>
                    <span className="text-xs text-gray-500 font-mono">{tag.color}</span>
                    <button
                      onClick={() => handleEdit(tag)}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    {confirmDelete === tag.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-red-400">Confirmar?</span>
                        <button
                          onClick={() => handleDelete(tag.id)}
                          className="px-2 py-0.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded text-xs text-red-400"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/20 rounded text-xs text-gray-400"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(tag.id)}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platforms Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
        <h2 className="text-base font-semibold text-white mb-5">Plataformas (Redes)</h2>

        {/* Create form */}
        <div className="flex flex-col gap-3 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Nova plataforma</p>
          <div className="flex gap-3 items-center">
            <input
              value={newPlatformName}
              onChange={e => setNewPlatformName(e.target.value)}
              placeholder="Nome (ex: Instagram, TikTok)"
              className="flex-1 bg-transparent border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400"
            />
            <button
              onClick={handleCreatePlatform}
              disabled={loading || !newPlatformName.trim()}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded-lg text-sm text-white font-medium transition-colors"
            >
              <Plus size={15} />
              Criar
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {PALETTE.map(c => (
              <ColorDot key={c} color={c} selected={newPlatformColor === c} onClick={() => setNewPlatformColor(c)} />
            ))}
          </div>
        </div>

        {/* Platforms list */}
        {platforms.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-6">
            Nenhuma plataforma criada ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {platforms.map(platform => (
              <div
                key={platform.id}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
              >
                {editingPlatformId === platform.id ? (
                  /* Editing mode */
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      value={editPlatformName}
                      onChange={e => setEditPlatformName(e.target.value)}
                      className="bg-transparent border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-400"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {PALETTE.map(c => (
                        <ColorDot key={c} color={c} selected={editPlatformColor === c} onClick={() => setEditPlatformColor(c)} />
                      ))}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={handleSaveEditPlatform}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg text-xs text-green-400 transition-colors"
                      >
                        <Check size={13} /> Salvar
                      </button>
                      <button
                        onClick={() => setEditingPlatformId(null)}
                        className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-xs text-gray-400 transition-colors"
                      >
                        <X size={13} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <>
                    <div className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: platform.color }} />
                    <span className="flex-1 text-sm text-white">{platform.name}</span>
                    <button
                      onClick={() => handleEditPlatform(platform)}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    {confirmPlatformDelete === platform.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-red-400">Confirmar?</span>
                        <button
                          onClick={() => handleDeletePlatform(platform.id)}
                          className="px-2 py-0.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded text-xs text-red-400"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setConfirmPlatformDelete(null)}
                          className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/20 rounded text-xs text-gray-400"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmPlatformDelete(platform.id)}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
