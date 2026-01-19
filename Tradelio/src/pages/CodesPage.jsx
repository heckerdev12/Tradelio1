import { useState, useEffect } from 'react';
import { Copy, Check, Plus, Trash2, Edit, Code2, Eye, Search, Filter, X } from 'lucide-react';
import { invoke } from "@tauri-apps/api/core";
import { showToast } from '../utils/toastConfig';

function CodeManagerPage() {
  const [view, setView] = useState('list');
  const [snippets, setSnippets] = useState([]);
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    language: 'mql4',
    code: '',
    description: ''
  });

  useEffect(() => {
    loadSnippets();
  }, []);

  const loadSnippets = async () => {
    try {
        const snippets = await invoke('get_code_snippets');
        setSnippets(snippets);
    } catch (err) {
        console.error('Failed to load snippets:', err);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddSnippet = async () => {
    if (!formData.title || !formData.code) return;

    try {
        const newSnippetId = await invoke('add_code_snippet', {
        title: formData.title,
        language: formData.language,
        code: formData.code,
        description: formData.description,
        });
        // Refresh the list
        loadSnippets();
        setFormData({ title: '', language: 'mql4', code: '', description: '' });
        setView('list');
    } catch (err) {
        console.error('Failed to add snippet:', err);
    }
  };


  const handleEditSnippet = async () => {
    if (!formData.title || !formData.code || !selectedSnippet) return;

    try {
        await invoke('edit_code_snippet', {
        id: selectedSnippet.id,
        title: formData.title,
        language: formData.language,
        code: formData.code,
        description: formData.description,
        });
        // Refresh the list
        loadSnippets();
        setView('list');
    } catch (err) {
        console.error('Failed to edit snippet:', err);
    }
  };


  const handleDeleteSnippet = async (id) => {
    if (!confirm('Delete this code snippet?')) return;

    try {
        await invoke('remove_code_snippet', { id });
        // Refresh the list
        loadSnippets();
        if (view === 'view') setView('list');
    } catch (err) {
        console.error('Failed to delete snippet:', err);
    }
  };

  const startEdit = (snippet) => {
    setSelectedSnippet(snippet);
    setFormData({
      title: snippet.title,
      language: snippet.language,
      code: snippet.code,
      description: snippet.description || ''
    });
    setView('edit');
  };

  const viewSnippet = async (snippet) => {
    setSelectedSnippet(snippet);
    setView('view');
  };

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         snippet.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = filterLanguage === 'all' || snippet.language === filterLanguage;
    return matchesSearch && matchesLanguage;
  });

  const languages = ['all', ...new Set(snippets.map(s => s.language))];

  // List View
  if (view === 'list') {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Code Snippets</h1>
              <p className="text-zinc-400">Manage and organize your code snippets</p>
            </div>
            <button
              onClick={() => {
                setFormData({ title: '', language: 'mql4', code: '', description: '' });
                setView('add');
              }}
              className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg hover:bg-zinc-100 transition-all font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Snippet
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search snippets..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative min-w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang === 'all' ? 'All Languages' : lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm text-zinc-400">
            <span>{filteredSnippets.length} snippet{filteredSnippets.length !== 1 ? 's' : ''}</span>
            {searchQuery && <span>• Filtered by "{searchQuery}"</span>}
            {filterLanguage !== 'all' && <span>• {filterLanguage.toUpperCase()}</span>}
          </div>
        </div>

        {/* Empty State */}
        {filteredSnippets.length === 0 && snippets.length === 0 ? (
          <div className="bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-xl p-12 text-center">
            <div className="bg-zinc-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Code2 className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No code snippets yet</h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Start building your code library by adding your first snippet
            </p>
            <button
              onClick={() => setView('add')}
              className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg hover:bg-zinc-100 transition-all font-medium"
            >
              <Plus className="w-4 h-4" />
              Add your first snippet
            </button>
          </div>
        ) : filteredSnippets.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-zinc-400">No snippets match your search</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredSnippets.map((snippet) => (
              <div
                key={snippet.id}
                className="group bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => viewSnippet(snippet)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold group-hover:text-white transition-colors truncate">
                        {snippet.title}
                      </h3>
                      <span className="flex-shrink-0 bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md text-xs font-mono uppercase border border-zinc-700">
                        {snippet.language}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm line-clamp-2">
                      {snippet.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewSnippet(snippet);
                      }}
                      className="p-2 bg-zinc-800 rounded-md hover:bg-zinc-700 transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(snippet);
                      }}
                      className="p-2 bg-zinc-800 rounded-md hover:bg-zinc-700 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSnippet(snippet.id);
                      }}
                      className="p-2 bg-zinc-800 rounded-md hover:bg-red-900 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // View Code
  if (view === 'view' && selectedSnippet) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Back to snippets
        </button>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          {/* Header */}
          <div className="border-b border-zinc-800 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{selectedSnippet.title}</h1>
                <p className="text-zinc-400">{selectedSnippet.description || 'No description'}</p>
              </div>
              <span className="bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-sm font-mono uppercase border border-zinc-700">
                {selectedSnippet.language}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(selectedSnippet.code)}
                className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-lg hover:bg-zinc-700 transition-all font-medium border border-zinc-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </>
                )}
              </button>
              <button
                onClick={() => startEdit(selectedSnippet)}
                className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-lg hover:bg-zinc-700 transition-all font-medium border border-zinc-700"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteSnippet(selectedSnippet.id)}
                className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-lg hover:bg-red-900 transition-all font-medium border border-zinc-700 ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Code Block */}
          <div className="bg-black">
            <div className="p-6 overflow-x-auto">
              <pre className="text-sm text-zinc-300 font-mono leading-relaxed">
                {selectedSnippet.code}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add/Edit Form
  if (view === 'add' || view === 'edit') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Back to snippets
        </button>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold mb-8">
            {view === 'add' ? 'Create New Snippet' : 'Edit Snippet'}
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2.5 text-zinc-300">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all"
                placeholder="e.g., MT4 Trade Export EA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2.5 text-zinc-300">
                Language <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all"
              >
                <option value="mql4">MQL4</option>
                <option value="mql5">MQL5</option>
                <option value="rust">Rust</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="c-sharp">C#</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2.5 text-zinc-300">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all"
                placeholder="Brief description of what this code does"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2.5 text-zinc-300">
                Code <span className="text-red-400">*</span>
              </label>
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-zinc-600 transition-all">
                <textarea
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-transparent px-4 py-3 font-mono text-sm focus:outline-none min-h-96 resize-y"
                  placeholder="Paste your code here..."
                  spellCheck="false"
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {formData.code.split('\n').length} lines • {formData.code.length} characters
              </p>
            </div>

            <div className="flex gap-3 pt-6 border-t border-zinc-800">
              <button
                onClick={view === 'add' ? handleAddSnippet : handleEditSnippet}
                disabled={!formData.title || !formData.code}
                className="bg-white text-black px-6 py-2.5 rounded-lg hover:bg-zinc-100 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white shadow-sm"
              >
                {view === 'add' ? 'Create Snippet' : 'Save Changes'}
              </button>
              <button
                onClick={() => setView('list')}
                className="bg-zinc-800 px-6 py-2.5 rounded-lg hover:bg-zinc-700 transition-all font-medium border border-zinc-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default CodeManagerPage;
