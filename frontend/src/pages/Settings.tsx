import { useState } from 'react';
import { Settings as SettingsIcon, Plus, Pencil, Trash2, Check, X, Globe } from 'lucide-react';
import { SiInstagram, SiYoutube, SiTiktok, SiFacebook, SiPinterest } from 'react-icons/si';
import { FaXTwitter, FaLinkedin } from 'react-icons/fa6';
import { useTags } from '../context/TagContext';
import { usePlatforms } from '../context/PlatformContext';
import { useAuth } from '../context/AuthContext';
import { useBrand, BrandOption } from '../context/BrandContext';
import { Tag, Platform } from '../types';

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6366f1', '#0ea5e9', '#84cc16', '#64748b',
];

const PRESET_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: 'instagram', color: '#E1306C', IconCmp: SiInstagram },
  { id: 'youtube', label: 'YouTube', icon: 'youtube', color: '#FF0000', IconCmp: SiYoutube },
  { id: 'tiktok', label: 'TikTok', icon: 'tiktok', color: '#010101', IconCmp: SiTiktok },
  { id: 'facebook', label: 'Facebook', icon: 'facebook', color: '#1877F2', IconCmp: SiFacebook },
  { id: 'twitter', label: 'X (Twitter)', icon: 'twitter', color: '#000000', IconCmp: FaXTwitter },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', color: '#0A66C2', IconCmp: FaLinkedin },
  { id: 'pinterest', label: 'Pinterest', icon: 'pinterest', color: '#E60023', IconCmp: SiPinterest },
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
  const { token } = useAuth();
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
  
  const [showCustomPlatform, setShowCustomPlatform] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  
  const { brands, createBrand, updateBrand, deleteBrand } = useBrand();
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandColor, setNewBrandColor] = useState(PALETTE[0]);
  const [newBrandLogo, setNewBrandLogo] = useState('');
  const [newBrandIcon, setNewBrandIcon] = useState('');
  
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandColor, setEditBrandColor] = useState('');
  const [editBrandLogo, setEditBrandLogo] = useState('');
  const [editBrandIcon, setEditBrandIcon] = useState('');
  const [confirmBrandDelete, setConfirmBrandDelete] = useState<string | null>(null);
  const [uploadingBrandAsset, setUploadingBrandAsset] = useState(false);

  const [activeTab, setActiveTab] = useState<'tags' | 'platforms' | 'brands'>('tags');

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('icon', file);

    setUploadingIcon(true);
    try {
      const res = await fetch('/api/platforms/upload-icon', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setNewPlatformIcon(data.url);
      } else {
        alert('Erro ao fazer upload do ícone.');
      }
    } catch {
      alert('Erro de conexão ao fazer upload.');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleEditIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('icon', file);

    setUploadingIcon(true);
    try {
      const res = await fetch('/api/platforms/upload-icon', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setEditPlatformIcon(data.url);
      } else {
        alert('Erro ao fazer upload do ícone.');
      }
    } catch {
      alert('Erro de conexão ao fazer upload.');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleBrandUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'icon', isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(type, file);

    setUploadingBrandAsset(true);
    try {
      const res = await fetch(`/api/brands/upload-${type}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (isEdit) {
          if (type === 'logo') setEditBrandLogo(data.url);
          else setEditBrandIcon(data.url);
        } else {
          if (type === 'logo') setNewBrandLogo(data.url);
          else setNewBrandIcon(data.url);
        }
      } else {
        alert(`Erro ao fazer upload do ${type}.`);
      }
    } catch {
      alert('Erro de conexão ao fazer upload.');
    } finally {
      setUploadingBrandAsset(false);
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createBrand({ name: newBrandName.trim(), color: newBrandColor, logoUrl: newBrandLogo, iconUrl: newBrandIcon });
      setNewBrandName('');
      setNewBrandLogo('');
      setNewBrandIcon('');
      setNewBrandColor(PALETTE[0]);
    } catch {
      setError('Erro ao criar marca.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBrand = (b: BrandOption) => {
    setEditingBrandId(b.id);
    setEditBrandName(b.name);
    setEditBrandColor(b.color);
    setEditBrandLogo(b.logoUrl || '');
    setEditBrandIcon(b.iconUrl || '');
  };

  const handleSaveEditBrand = async () => {
    if (!editingBrandId || !editBrandName.trim()) return;
    setLoading(true);
    try {
      await updateBrand(editingBrandId, { name: editBrandName.trim(), color: editBrandColor, logoUrl: editBrandLogo, iconUrl: editBrandIcon });
      setEditingBrandId(null);
    } catch {
      setError('Erro ao salvar marca.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    setLoading(true);
    try {
      await deleteBrand(id);
      setConfirmBrandDelete(null);
    } catch {
      setError('Erro ao excluir marca.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreatePlatform = async (presetLabel?: string, presetColor?: string, presetIcon?: string) => {
    const finalName = presetLabel || newPlatformName.trim();
    if (!finalName) return;
    setLoading(true);
    setError('');
    try {
      await createPlatform(finalName, presetColor || newPlatformColor, presetIcon || newPlatformIcon.trim() || 'globe');
      setNewPlatformName('');
      setNewPlatformIcon('');
      setNewPlatformColor(PALETTE[0]);
      setShowCustomPlatform(false);
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20">
            <SettingsIcon size={24} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Configurações</h1>
            <p className="text-sm text-gray-400">Gerencie os recursos do sistema</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 border-b border-white/10 mb-6">
        <button onClick={() => setActiveTab('tags')} className={`pb-3 text-sm font-medium transition-colors ${activeTab==='tags' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>Tags</button>
        <button onClick={() => setActiveTab('platforms')} className={`pb-3 text-sm font-medium transition-colors ${activeTab==='platforms' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>Plataformas / Redes</button>
        <button onClick={() => setActiveTab('brands')} className={`pb-3 text-sm font-medium transition-colors ${activeTab==='brands' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>Marcas</button>
      </div>

      {/* Tags Section */}
      {activeTab === 'tags' && (
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
      )}

      {/* Redes e Plataformas */}
      {activeTab === 'platforms' && (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
        <h2 className="text-base font-semibold text-white mb-5">Plataformas (Redes)</h2>

        {/* Create form */}
        <div className="flex flex-col gap-3 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Adicionar nova plataforma</p>
          
          {!showCustomPlatform ? (
            <div className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                {PRESET_PLATFORMS.map(preset => (
                  <button 
                    key={preset.id}
                    onClick={() => handleCreatePlatform(preset.label, preset.color, preset.icon)}
                    disabled={loading}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all hover:-translate-y-1 disabled:opacity-50"
                  >
                    <preset.IconCmp size={24} color={preset.color} />
                    <span className="text-[10px] text-gray-400 font-medium truncate w-full text-center">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex justify-center mt-2 border-t border-white/10 pt-4">
                <button 
                  onClick={() => setShowCustomPlatform(true)} 
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1"
                >
                  <Plus size={14} /> Nenhuma dessas? Adicionar personalizada
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">Criando Plataforma Manualmente</span>
                <button 
                  onClick={() => setShowCustomPlatform(false)} 
                  className="text-xs text-indigo-400 hover:text-white transition-colors"
                >
                  Voltar para ícones
                </button>
              </div>
              <div className="flex gap-3 items-center">
                <label className="p-2 bg-black/20 rounded-lg flex items-center justify-center border border-white/10 cursor-pointer hover:bg-white/10 transition-colors relative overflow-hidden" title="Fazer upload de ícone">
                  {uploadingIcon ? (
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : newPlatformIcon ? (
                    <img src={newPlatformIcon} alt="Custom icon" className="w-[18px] h-[18px] object-contain" />
                  ) : (
                    <Globe size={18} className="text-gray-400" />
                  )}
                  <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" />
                </label>
                <input
                  value={newPlatformName}
                  onChange={e => setNewPlatformName(e.target.value)}
                  placeholder="Nome da Plataforma"
                  className="flex-1 bg-transparent border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400"
                />
                <button
                  onClick={() => handleCreatePlatform()}
                  disabled={loading || !newPlatformName.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded-lg text-sm text-white font-medium transition-colors"
                >
                  <Plus size={15} /> Adicionar
                </button>
              </div>
              <div className="flex gap-2 flex-wrap items-center mt-2">
                <span className="text-xs text-gray-500 border-r border-white/10 pr-2 mr-1">Cor customizada:</span>
                {PALETTE.map(c => (
                  <ColorDot key={c} color={c} selected={newPlatformColor === c} onClick={() => setNewPlatformColor(c)} />
                ))}
              </div>
            </div>
          )}
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
                    <div className="flex gap-2 items-center">
                      <label className="p-1.5 bg-black/20 rounded-lg flex items-center justify-center border border-white/10 cursor-pointer hover:bg-white/10 transition-colors relative overflow-hidden shrink-0 h-[34px] w-[34px]" title="Modificar ícone">
                        {uploadingIcon ? (
                          <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : editPlatformIcon?.startsWith('/uploads/') ? (
                          <img src={editPlatformIcon} alt="Custom icon" className="w-[18px] h-[18px] object-contain" />
                        ) : (() => {
                          const preset = PRESET_PLATFORMS.find(p => p.icon === editPlatformIcon || p.label.toLowerCase() === editPlatformName.toLowerCase());
                          if (preset) return <preset.IconCmp size={16} />;
                          return <Globe size={16} className="text-gray-400" />;
                        })()}
                        <input type="file" accept="image/*" onChange={handleEditIconUpload} className="hidden" />
                      </label>
                      <input
                        value={editPlatformName}
                        onChange={e => setEditPlatformName(e.target.value)}
                        className="flex-1 bg-transparent border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap mt-1">
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
                    <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-white/5 border border-white/10" style={{ color: platform.color }}>
                      {(() => {
                         if (platform.icon?.startsWith('/uploads/')) {
                           return <img src={platform.icon} alt={platform.name} className="w-4 h-4 object-contain" style={{ filter: `drop-shadow(0px 0px 4px ${platform.color}40)` }} />;
                         }
                         const preset = PRESET_PLATFORMS.find(p => p.icon === platform.icon || p.label.toLowerCase() === platform.name.toLowerCase());
                         if (preset) {
                           return <preset.IconCmp size={16} />;
                         }
                         return <Globe size={16} />;
                      })()}
                    </div>
                    <span className="flex-1 text-sm text-white font-medium">{platform.name}</span>
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
      )}

      {/* Marcas */}
      {activeTab === 'brands' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
          <h2 className="text-base font-semibold text-white mb-5">Marcas</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Create form */}
          <div className="flex flex-col gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Nova Marca</p>
            <div className="flex gap-3 items-center">
              <input
                value={newBrandName}
                onChange={e => setNewBrandName(e.target.value)}
                placeholder="Nome da marca..."
                className="flex-1 bg-transparent border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400"
              />
              <button
                onClick={handleCreateBrand}
                disabled={loading || !newBrandName.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded-lg text-sm text-white font-medium transition-colors"
              >
                <Plus size={15} />
                Criar
              </button>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map(c => (
                <ColorDot key={c} color={c} selected={newBrandColor === c} onClick={() => setNewBrandColor(c)} />
              ))}
            </div>

            <div className="flex gap-4 mt-2">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Ícone</label>
                <div className="flex gap-2 items-center">
                  {newBrandIcon && <img src={newBrandIcon} alt="Icon" className="w-8 h-8 object-contain rounded bg-white/5" />}
                  <input type="file" accept="image/*" onChange={e => handleBrandUpload(e, 'icon', false)} className="text-xs text-gray-400" />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Logo</label>
                <div className="flex gap-2 items-center">
                  {newBrandLogo && <img src={newBrandLogo} alt="Logo" className="w-16 h-8 object-contain rounded bg-white/5" />}
                  <input type="file" accept="image/*" onChange={e => handleBrandUpload(e, 'logo', false)} className="text-xs text-gray-400" />
                </div>
              </div>
            </div>
            {uploadingBrandAsset && <span className="text-xs text-amber-400">Fazendo upload...</span>}
          </div>

          {/* Brands List */}
          {brands.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-6">Nenhuma marca cadastrada.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {brands.map(brand => (
                <div key={brand.id} className="flex gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  {editingBrandId === brand.id ? (
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          value={editBrandName}
                          onChange={e => setEditBrandName(e.target.value)}
                          className="flex-1 bg-black/20 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-400"
                        />
                        <button onClick={handleSaveEditBrand} disabled={loading} className="p-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingBrandId(null)} className="p-1.5 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded">
                          <X size={14} />
                        </button>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        {PALETTE.map(c => (
                          <ColorDot key={c} color={c} selected={editBrandColor === c} onClick={() => setEditBrandColor(c)} />
                        ))}
                      </div>

                      <div className="flex gap-4 mt-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-400 mb-1 block">Ícone</label>
                          <div className="flex gap-2 items-center">
                            {editBrandIcon && <img src={editBrandIcon} className="w-6 h-6 object-contain bg-white/10 p-1 rounded" />}
                            <input type="file" accept="image/*" onChange={e => handleBrandUpload(e, 'icon', true)} className="text-xs text-gray-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-400 mb-1 block">Logo</label>
                          <div className="flex gap-2 items-center">
                            {editBrandLogo && <img src={editBrandLogo} className="w-12 h-6 object-contain bg-white/10 p-1 rounded" />}
                            <input type="file" accept="image/*" onChange={e => handleBrandUpload(e, 'logo', true)} className="text-xs text-gray-400" />
                          </div>
                        </div>
                      </div>
                      {uploadingBrandAsset && <span className="text-xs text-amber-400">Fazendo upload...</span>}
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center bg-white/5 border border-white/10" style={{ borderColor: brand.color }}>
                        {brand.iconUrl ? <img src={brand.iconUrl} alt="icon" className="w-8 h-8 object-contain" /> : <Globe size={20} />}
                      </div>
                      <div className="flex-1 flex flex-col justify-center overflow-hidden">
                         <span className="text-sm text-white font-medium">{brand.name}</span>
                         {brand.logoUrl && <img src={brand.logoUrl} alt="logo" className="h-4 object-contain opacity-50 max-w-[100px] mt-1" style={{ alignSelf: 'flex-start' }} />}
                      </div>
                      
                      <div className="flex items-center">
                        <button onClick={() => handleEditBrand(brand)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Editar">
                          <Pencil size={14} />
                        </button>
                        {confirmBrandDelete === brand.id ? (
                          <div className="flex items-center gap-1.5 ml-2">
                            <span className="text-xs text-red-400">Confirmar?</span>
                            <button onClick={() => handleDeleteBrand(brand.id)} className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 rounded text-xs text-red-400">Sim</button>
                            <button onClick={() => setConfirmBrandDelete(null)} className="px-2 py-0.5 bg-white/5 border border-white/20 rounded text-xs text-gray-400">Não</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmBrandDelete(brand.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors ml-1" title="Excluir">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
