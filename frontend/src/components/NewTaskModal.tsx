import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import { useTags } from '../context/TagContext';
import { usePlatforms } from '../context/PlatformContext';
import { X, Plus, Trash2, Layers, Target, Tag, Link2, Globe, UploadCloud, File as FileIcon } from 'lucide-react';
import { SiInstagram, SiYoutube, SiTiktok, SiFacebook, SiPinterest } from 'react-icons/si';
import { FaXTwitter, FaLinkedin } from 'react-icons/fa6';
import type { IconType } from 'react-icons';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from 'date-fns/locale/pt-BR';

registerLocale('pt-BR', ptBR);

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

const NETWORKS = ['Instagram', 'YouTube', 'Site', 'X (Twitter)', 'TikTok', 'LinkedIn'];
const PLACEMENTS = ['Orgânico', 'Tráfego Pago', 'Afiliados'];
const FORMATS_BY_NETWORK: Record<string, string[]> = {
  'Instagram': ['Feed', 'Stories', 'Reels', 'Carrossel'],
  'Site': ['Banner Esportivo', 'Banner Home', 'CRM', 'Landing Page'],
  'YouTube': ['Thumbnail', 'Vídeo Longo', 'Shorts', 'Capa do Canal'],
  'X (Twitter)': ['Post', 'Thread', 'Capa'],
  'TikTok': ['Vídeo', 'Carrossel'],
  'LinkedIn': ['Post', 'Artigo', 'Banner'],
};

/** Metadados visuais de cada rede social */
interface NetworkMeta {
  icon: IconType | React.FC<{ size?: number; color?: string }>;
  color: string;
  label: string;
}

const NETWORK_META: Record<string, NetworkMeta> = {
  'Instagram': { icon: SiInstagram, color: '#E1306C', label: 'Instagram' },
  'instagram': { icon: SiInstagram, color: '#E1306C', label: 'Instagram' },
  'YouTube':   { icon: SiYoutube,   color: '#FF0000', label: 'YouTube' },
  'youtube':   { icon: SiYoutube,   color: '#FF0000', label: 'YouTube' },
  'Site':      { icon: Globe as any, color: '#6366f1', label: 'Site' },
  'X (Twitter)': { icon: FaXTwitter, color: '#000000', label: 'X (Twitter)' },
  'twitter': { icon: FaXTwitter, color: '#000000', label: 'X (Twitter)' },
  'TikTok':    { icon: SiTiktok,    color: '#010101', label: 'TikTok' },
  'tiktok':    { icon: SiTiktok,    color: '#010101', label: 'TikTok' },
  'LinkedIn':  { icon: FaLinkedin,  color: '#0A66C2', label: 'LinkedIn' },
  'linkedin':  { icon: FaLinkedin,  color: '#0A66C2', label: 'LinkedIn' },
  'facebook':  { icon: SiFacebook,  color: '#1877F2', label: 'Facebook' },
  'Facebook':  { icon: SiFacebook,  color: '#1877F2', label: 'Facebook' },
  'pinterest': { icon: SiPinterest, color: '#E60023', label: 'Pinterest' },
  'Pinterest': { icon: SiPinterest, color: '#E60023', label: 'Pinterest' },
};

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal', color: '#22c55e' },
  { value: 'alta',   label: 'Alta',   color: '#f59e0b' },
  { value: 'urgente',label: 'Urgente',color: '#ef4444' },
];

export default function NewTaskModal({ isOpen, onClose, onTaskCreated }: NewTaskModalProps) {
  const { token, user } = useAuth();
  const { tags, createTag } = useTags();
  const { platforms } = usePlatforms();
  const { brands } = useBrand();
  
  const isSolicitante = user?.role === 'solicitante';
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline]     = useState<Date | null>(null);
  const [users, setUsers]           = useState<any[]>([]);
  const [network, setNetwork]       = useState('');
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats]       = useState<string[]>([]);
  const [sectorType, setSectorType] = useState('Marketing');
  const [customSector, setCustomSector] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [reference, setReference]   = useState('');
  const [priority, setPriority]     = useState('normal');
  const [brand, setBrand]           = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagColor, setTagColor]     = useState('#8b5cf6');
  const [steps, setSteps]           = useState<{ id: string; user_id: string; instruction: string; pieces: number }[]>([]);
  const [materialType, setMaterialType] = useState('');
  const [customMaterial, setCustomMaterial] = useState('');
  const [subMaterial, setSubMaterial] = useState('');
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [shouldLoadDraft, setShouldLoadDraft] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setTitle(''); setDescription(''); setDeadline(null);
      setNetwork(''); setSelectedPlacements([]); setSelectedFormats([]);
      setSectorType('Marketing'); setCustomSector(''); setReference(''); setPriority('normal'); setBrand('');
      setCustomBrand(''); setMaterialType(''); setSubMaterial(''); setReferenceFiles([]);
      setSelectedTags([]); setTagColor('#8b5cf6');
      setSteps([{ id: crypto.randomUUID(), user_id: '', instruction: '', pieces: 0 }]);
      setIsCreatingTag(false); setNewTagName('');

      const draft = localStorage.getItem('draft_new_task');
      if (draft && shouldLoadDraft) {
        try {
          const p = JSON.parse(draft);
          if (p.title) setTitle(p.title);
          if (p.description) setDescription(p.description);
          if (p.deadline) setDeadline(new Date(p.deadline));
          if (p.materialType) setMaterialType(p.materialType);
          if (p.customMaterial) setCustomMaterial(p.customMaterial);
          if (p.subMaterial) setSubMaterial(p.subMaterial);
          if (p.network) setNetwork(p.network);
          if (p.brand) setBrand(p.brand);
          if (p.customBrand) setCustomBrand(p.customBrand);
          if (p.reference) setReference(p.reference);
        } catch(e){}
      }
      setShouldLoadDraft(false);
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUsers(await res.json());
    } catch {}
  };

  useEffect(() => {
    if (!shouldLoadDraft && title) {
      const draft = { title, description, deadline, materialType, customMaterial, subMaterial, network, brand, customBrand, reference };
      localStorage.setItem('draft_new_task', JSON.stringify(draft));
    }
  }, [title, description, deadline, materialType, customMaterial, subMaterial, network, brand, customBrand, reference, shouldLoadDraft]);

  const addStep    = () => setSteps(s => [...s, { id: crypto.randomUUID(), user_id: '', instruction: '', pieces: 0 }]);
  const removeStep = (id: string) => setSteps(s => s.length > 1 ? s.filter(x => x.id !== id) : s);
  const changeStep = (id: string, field: 'user_id' | 'instruction' | 'pieces', value: string | number) =>
    setSteps(s => s.map(x => x.id === id ? { ...x, [field]: value } : x));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReferenceFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setReferenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialType) { alert('Selecione o tipo de material.'); return; }
    if (materialType === 'Tráfego Pago' && !subMaterial) { alert('Selecione a rede de tráfego pago.'); return; }

    const validSteps = steps.filter(s => s.user_id !== '');
    if (!validSteps.length) { alert('Adicione pelo menos um responsável.'); return; }
    try {
      let uploadedUrls: string[] = [];
      if (referenceFiles.length > 0) {
        uploadedUrls = await Promise.all(referenceFiles.map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
          });
        }));
      }

      const finalSector = sectorType === 'Outro' ? customSector : sectorType;
      const finalBrand = brand === 'Outros' ? customBrand : brand;
      let finalMaterial = materialType;
      if (materialType === 'Tráfego Pago') finalMaterial = `Tráfego Pago - ${subMaterial}`;
      if (materialType === 'Outro') finalMaterial = customMaterial;
      
      const placementsToCreate = selectedPlacements.length > 0 ? selectedPlacements : [''];
      const formatsToCreate = selectedFormats.length > 0 ? selectedFormats : [''];

      for (const p of placementsToCreate) {
        for (const f of formatsToCreate) {
          const suffix = (selectedPlacements.length > 1 || selectedFormats.length > 1) ? ` - ${[f, p].filter(Boolean).join(' ')}` : '';
          
          await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ 
              title: `${title.trim()}${suffix}`, 
              description, type: 'Arte', deadline: deadline ? deadline.toISOString() : null, 
              network, placement: p, format: f, sector: finalSector, reference,
              referenceFiles: uploadedUrls.length ? uploadedUrls : undefined,
              materialType: finalMaterial,
              priority, brand: finalBrand || null, tag_ids: selectedTags, steps: validSteps 
            }),
          });
        }
      }
      localStorage.removeItem('draft_new_task');
      onTaskCreated(); 
      onClose();
    } catch {}
  };

  if (!isOpen) return null;
  
  const matchedFormatKey = Object.keys(FORMATS_BY_NETWORK).find(k => k.toLowerCase() === network?.toLowerCase());
  const availableFormats = matchedFormatKey ? FORMATS_BY_NETWORK[matchedFormatKey] : ['Vídeo', 'Imagem', 'Ambos'];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl max-h-[94vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus size={18} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)' }}>Nova Tarefa</h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-3)' }}>Preencha os detalhes da tarefa</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-3)', borderRadius: 6, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <form id="task-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Informações Iniciais */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: isSolicitante ? '1fr' : '1fr auto', gap: '0.75rem' }}>
                <FormField label="Título da Tarefa *">
                  <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Arte para campanha de verão" className="form-input" style={{ fontSize: '1.1rem', padding: '0.75rem 1rem', borderColor: 'var(--brand-300)' }} autoFocus />
                </FormField>
                {!isSolicitante && (
                  <FormField label="Prioridade">
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 4 }}>
                      {PRIORITY_OPTIONS.map(p => (
                        <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                          style={{
                            padding: '0.4rem 0.8rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                            border: `1.5px solid ${priority === p.value ? p.color : 'var(--border)'}`,
                            background: priority === p.value ? p.color + '20' : 'var(--surface-2)',
                            color: priority === p.value ? p.color : 'var(--text-2)',
                            transition: 'all 150ms',
                          }}
                        >{p.label}</button>
                      ))}
                    </div>
                  </FormField>
                )}
              </div>

              {/* Tipo de Material */}
              <div style={{ padding: '1.25rem', background: 'var(--brand-50)', border: '1px solid var(--brand-200)', borderRadius: 12 }}>
                <SectionLabel icon={<Layers size={14} color="var(--brand-600)" />} title="Categoria de Divulgação (Obrigatório)" />
                <div style={{ display: 'grid', gridTemplateColumns: (materialType === 'Tráfego Pago' || materialType === 'Outro') ? '1fr 1fr' : '1fr', gap: '1rem', marginTop: 12 }}>
                  <FormField label="Tipo de Divulgação">
                    <select value={materialType} onChange={e => { setMaterialType(e.target.value); setSubMaterial(''); setCustomMaterial(''); }} className="form-input" style={{ borderColor: 'var(--brand-300)' }} required>
                      <option value="">Selecione...</option>
                      <option value="Orgânico">Orgânico</option>
                      <option value="Tráfego Pago">Tráfego Pago</option>
                      <option value="Outro">Outro...</option>
                    </select>
                  </FormField>
                  {materialType === 'Tráfego Pago' && (
                    <FormField label="Rede de Anúncios">
                      <select value={subMaterial} onChange={e => setSubMaterial(e.target.value)} className="form-input" style={{ borderColor: 'var(--brand-300)' }} required>
                        <option value="">Selecione...</option>
                        <option value="Meta Ads">Meta Ads</option>
                        <option value="Google Ads">Google Ads</option>
                        <option value="Taboola">Taboola</option>
                        <option value="Kwai Ads">Kwai Ads</option>
                        <option value="TikTok Ads">TikTok Ads</option>
                        <option value="X Ads">X Ads</option>
                        <option value="Outro">Outro...</option>
                      </select>
                    </FormField>
                  )}
                  {materialType === 'Outro' && (
                    <FormField label="Especifique a Categoria">
                      <input required value={customMaterial} onChange={e => setCustomMaterial(e.target.value)} placeholder="Ex: Material Interno" className="form-input" style={{ borderColor: 'var(--brand-300)' }} />
                    </FormField>
                  )}
                </div>
              </div>
            </section>

            {/* Complementares */}
            <section>
              <SectionLabel icon={<Tag size={14} />} title="Informações Complementares" />


              <FormField label="Descrição">
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Briefing, copy, detalhes..." className="form-input" style={{ resize: 'vertical' }} />
              </FormField>

              {!isSolicitante && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <FormField label="Setor">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <select value={sectorType} onChange={e => setSectorType(e.target.value)} className="form-input">
                        <option value="Marketing">Marketing</option>
                        <option value="Outro">Outro...</option>
                      </select>
                      {sectorType === 'Outro' && (
                        <input value={customSector} onChange={e => setCustomSector(e.target.value)} placeholder="Qual setor?" className="form-input" autoFocus />
                      )}
                    </div>
                  </FormField>
                  <FormField label="Marca / Cliente">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <select value={brand} onChange={e => setBrand(e.target.value)} className="form-input">
                        <option value="">Selecione...</option>
                        <option value="Logame">Logame</option>
                        <option value="Officom">Officom</option>
                        {brands.filter(b => b.name !== 'Logame' && b.name !== 'Officom').map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        <option value="Outros">Outros...</option>
                      </select>
                      {brand === 'Outros' && (
                        <input value={customBrand} onChange={e => setCustomBrand(e.target.value)} placeholder="Especifique a marca" className="form-input" autoFocus />
                      )}
                    </div>
                  </FormField>
                  <FormField label="Prazo de Entrega">
                    <div style={{ position: 'relative', width: '100%' }}>
                      <DatePicker
                        selected={deadline}
                        onChange={(date: Date | null) => setDeadline(date)}
                        locale="pt-BR"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Selecione uma data"
                        className="form-input"
                        wrapperClassName="w-full"
                      />
                    </div>
                  </FormField>
                </div>
              )}

              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <FormField label="Referências e Materiais de Apoio">
                  <textarea value={reference} onChange={e => setReference(e.target.value)} rows={2} placeholder="Links, ideias, referências..." className="form-input" style={{ resize: 'vertical' }} />
                </FormField>
                <div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.8rem', background: 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-2)' }}>
                    <UploadCloud size={14} /> Anexar Arquivos
                    <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                  {referenceFiles.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {referenceFiles.map((file, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--surface-2)', borderRadius: 4, fontSize: '0.7rem' }}>
                          <FileIcon size={12} color="var(--brand-500)" />
                          <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                          <button type="button" onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 2 }}><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {!isSolicitante && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={14} color="var(--brand-500)"/> Tags de Identificação</label>
                    {!isCreatingTag && (
                      <button type="button" onClick={() => setIsCreatingTag(true)} style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Plus size={12} /> Nova Tag
                      </button>
                    )}
                  </div>
                  
                  {isCreatingTag && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <input type="color" value={tagColor} onChange={e => setTagColor(e.target.value)} style={{ width: 30, height: 30, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} title="Cor da Tag" />
                      <input
                        autoFocus
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        onKeyDown={async e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTagName.trim()) {
                              await createTag(newTagName.trim(), tagColor);
                              setNewTagName('');
                              setIsCreatingTag(false);
                            }
                          }
                        }}
                        placeholder="Nome da tag (Enter para salvar)"
                        className="form-input"
                        style={{ flex: 1, padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                      />
                      <button type="button" onClick={() => setIsCreatingTag(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}>
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {tags.map(tag => {
                        const selected = selectedTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => setSelectedTags(prev =>
                              selected ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                            )}
                            style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: 20,
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: `1.5px solid ${selected ? tag.color : 'var(--border)'}`,
                              background: selected ? tag.color + '25' : 'var(--surface-2)',
                              color: selected ? tag.color : 'var(--text-2)',
                              transition: 'all 150ms',
                            }}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Distribuição */}
            <section>
              <SectionLabel icon={<Layers size={14} />} title="Distribuição" />

              {/* ── Network picker com ícones ── */}
              <FormField label="Rede / Plataforma">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {platforms.length > 0 ? (
                    platforms.map(p => {
                      const isSelected = network === p.name;
                      const IconComp = NETWORK_META[p.icon]?.icon || NETWORK_META[p.name]?.icon || NETWORK_META[p.name.toLowerCase()]?.icon || Globe;
                      const isCustomIcon = p.icon?.startsWith('/uploads/');
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setNetwork(isSelected ? '' : p.name); setSelectedFormats([]); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '0.4rem 0.85rem', borderRadius: 10,
                            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                            border: `1.5px solid ${isSelected ? p.color : 'var(--border)'}`,
                            background: isSelected ? p.color + '25' : 'var(--surface-2)',
                            color: isSelected ? p.color : 'var(--text-2)',
                            transition: 'all 150ms',
                            opacity: isSelected ? 1 : 0.85
                          }}
                        >
                          {isCustomIcon ? (
                             <img src={p.icon} alt={p.name} style={{ width: 14, height: 14, objectFit: 'contain', filter: isSelected ? `drop-shadow(0px 0px 4px ${p.color}80)` : 'grayscale(100%) opacity(50%)' }} />
                          ) : (
                             <IconComp size={14} color={isSelected ? p.color : 'var(--text-3)'} />
                          )}
                          {p.name}
                        </button>
                      );
                    })
                  ) : (
                    NETWORKS.map(n => {
                      const meta = NETWORK_META[n];
                      const isSelected = network === n;
                      const IconComp = meta.icon || Globe;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => { setNetwork(isSelected ? '' : n); setSelectedFormats([]); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '0.4rem 0.85rem', borderRadius: 10,
                            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                            border: `1.5px solid ${isSelected ? (meta?.color || '#000') : 'var(--border)'}`,
                            background: isSelected ? (meta?.color || '#000') + '18' : 'var(--surface-2)',
                            color: isSelected ? (meta?.color || '#000') : 'var(--text-2)',
                            transition: 'all 180ms ease',
                            boxShadow: isSelected ? `0 2px 8px ${(meta?.color || '#000')}30` : 'none',
                          }}
                        >
                          <IconComp size={16} color={isSelected ? (meta?.color || '#000') : 'var(--text-3)'} />
                          {meta?.label || n}
                        </button>
                      );
                    })
                  )}
                </div>
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: isSolicitante ? '1fr' : '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                <FormField label="Formatos">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: 4 }}>
                    {!network && <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Selecione a rede primeiro</span>}
                    {availableFormats.map(f => {
                      const selected = selectedFormats.includes(f);
                      return (
                        <button
                          key={f} type="button"
                          onClick={() => setSelectedFormats(prev => selected ? prev.filter(x => x !== f) : [...prev, f])}
                          style={{
                            padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                            border: `1.5px solid ${selected ? 'var(--brand-500)' : 'var(--border)'}`,
                            background: selected ? 'var(--brand-50)' : 'var(--surface-2)',
                            color: selected ? 'var(--brand-600)' : 'var(--text-2)',
                            transition: 'all 150ms',
                          }}
                        >
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </FormField>
                {!isSolicitante && (
                  <FormField label="Posicionamentos">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: 4 }}>
                      {PLACEMENTS.map(p => {
                        const selected = selectedPlacements.includes(p);
                        return (
                          <button
                            key={p} type="button"
                            onClick={() => setSelectedPlacements(prev => selected ? prev.filter(x => x !== p) : [...prev, p])}
                            style={{
                              padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                              border: `1.5px solid ${selected ? 'var(--brand-500)' : 'var(--border)'}`,
                              background: selected ? 'var(--brand-50)' : 'var(--surface-2)',
                              color: selected ? 'var(--brand-600)' : 'var(--text-2)',
                              transition: 'all 150ms',
                            }}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                )}
              </div>
            </section>

            {/* Fluxo */}
            {!isSolicitante && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <SectionLabel icon={<Target size={14} />} title="Fluxo de Trabalho" />
                  <button type="button" onClick={addStep} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px dashed var(--brand-400)', color: 'var(--brand-600)', borderRadius: 6, padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    <Plus size={14} /> Etapa
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {steps.map((step, i) => (
                    <div key={step.id} style={{ background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)', padding: '0.875rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select required value={step.user_id} onChange={e => changeStep(step.id, 'user_id', e.target.value)} className="form-input" style={{ fontSize: '0.85rem', flex: 1 }}>
                            <option value="">Responsável...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.position})</option>)}
                          </select>
                          <input type="number" min={0} value={step.pieces || ''} onChange={e => changeStep(step.id, 'pieces', parseInt(e.target.value) || 0)} placeholder="Peças" className="form-input" style={{ fontSize: '0.85rem', width: 80, textAlign: 'center' }} title="Quantidade de peças" />
                        </div>
                        <input type="text" value={step.instruction} onChange={e => changeStep(step.id, 'instruction', e.target.value)} placeholder="Instrução específica (opcional)" className="form-input" style={{ fontSize: '0.8rem' }} />
                      </div>
                      {steps.length > 1 && (
                        <button type="button" onClick={() => removeStep(step.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 4, display: 'flex', marginTop: 2 }}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.5rem' }}>
                  A tarefa passará automaticamente para o próximo responsável ao ser concluída.
                </p>
              </section>
            )}
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
          <button type="submit" form="task-form" className="btn-brand" style={{ gap: 6 }}>
            <Plus size={16} /> Criar Tarefa
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
      <span style={{ color: 'var(--brand-600)', display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-2)' }}>{label}</label>
      {children}
    </div>
  );
}
