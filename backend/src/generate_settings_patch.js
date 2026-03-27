const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/Settings.tsx', 'utf8');

// 1. imports
content = content.replace(
  "import { useAuth } from '../context/AuthContext';",
  "import { useAuth } from '../context/AuthContext';\nimport { useBrand, BrandOption } from '../context/BrandContext';"
);

// 2. adding states inside component
const hookTarget = "const [uploadingIcon, setUploadingIcon] = useState(false);";
const brandState = `
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
`;
content = content.replace(hookTarget, hookTarget + '\n' + brandState);

// 3. adding handlers
const handlersTarget = "const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {";
const brandHandlers = `
  const handleBrandUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'icon', isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(type, file);

    setUploadingBrandAsset(true);
    try {
      const res = await fetch(\`/api/brands/upload-\${type}\`, {
        method: 'POST',
        headers: { Authorization: \`Bearer \${token}\` },
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
        alert(\`Erro ao fazer upload do \${type}.\`);
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
      setActiveTab('brands');
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

`;
content = content.replace(handlersTarget, brandHandlers + '\n' + handlersTarget);

// 4. Update JSX Header and Tabs
const jsxHeaderTarget = /<div className="flex items-center gap-3 mb-8">[\s\S]*?<\/div>\\s*<\/div>/m;
const newJsxHeader = \`<div className="flex items-center justify-between mb-6">
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
        <button onClick={() => setActiveTab('tags')} className={\`pb-3 text-sm font-medium transition-colors \${activeTab==='tags' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}\`}>Tags</button>
        <button onClick={() => setActiveTab('platforms')} className={\`pb-3 text-sm font-medium transition-colors \${activeTab==='platforms' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}\`}>Plataformas / Redes</button>
        <button onClick={() => setActiveTab('brands')} className={\`pb-3 text-sm font-medium transition-colors \${activeTab==='brands' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-white'}\`}>Marcas</button>
      </div>\`;
content = content.replace(jsxHeaderTarget, newJsxHeader);

// 5. Wrap tabs contents
const tagsSectionStart = '{/* Tags Section */}';
const tagsSectionEndRegex = /(<\\/div>\\s*)({\\/\\* Redes e Plataformas \\*\\/})/;

const tagsMatch = content.match(tagsSectionEndRegex);
if(tagsMatch) {
  content = content.substring(0, content.indexOf(tagsSectionStart)) + 
            "{activeTab === 'tags' && (\\n" +
            content.substring(content.indexOf(tagsSectionStart), tagsMatch.index) + 
            tagsMatch[1] + 
            ")}\\n\\n" +
            tagsMatch[2] + content.substring(tagsMatch.index + tagsMatch[0].length);
}

const platformsSectionStart = '{/* Redes e Plataformas */}';
const platformsSectionEndRegex = /<\\/div>\\s*<\\/div>\\s*\\)\\;\\s*\\}\\s*$/m;
const platMatch = content.match(platformsSectionEndRegex);
if(platMatch) {
  content = content.substring(0, content.indexOf(platformsSectionStart)) + 
            "{activeTab === 'platforms' && (\\n" +
            content.substring(content.indexOf(platformsSectionStart), platMatch.index) + 
            "</div>\\n)}\\n\\n";

  // now append brands tab
  const brandsSection = \`{activeTab === 'brands' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
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

                      <div className="flex gap-4">
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
\`

  content += brandsSection;
}

fs.writeFileSync('frontend/src/pages/Settings.tsx', content);
