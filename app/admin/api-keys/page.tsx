'use client';

import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Copy,
  Trash2,
  Key,
  Check,
  X,
  Loader2
} from 'lucide-react';

interface ApiKey {
  id: string;
  customer_id: string;
  customer_name: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  environment: 'production' | 'development' | 'test';
  is_active: boolean;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [keyName, setKeyName] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'development' | 'test'>('production');

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!customerName || !keyName) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          key_name: keyName,
          environment,
          scopes: ['read:aggregates'],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewKeyValue(data.key);
        setShowCreateModal(false);
        setCustomerName('');
        setKeyName('');
        setEnvironment('production');
        loadApiKeys(); // Reload the list
      }
    } catch (error) {
      console.error('Error creating API key:', error);
    } finally {
      setCreating(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) {
      return;
    }
    
    setDeleting(keyId);
    try {
      const response = await fetch(`/api/admin/api-keys?id=${keyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadApiKeys(); // Reload the list
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredKeys = apiKeys.filter(k =>
    k.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.key_prefix.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEnvBadgeClass = (env: string) => {
    switch (env) {
      case 'production': return 'bg-emerald-500/10 text-emerald-400';
      case 'development': return 'bg-amber-500/10 text-amber-400';
      case 'test': return 'bg-blue-500/10 text-blue-400';
      default: return 'bg-white/5 text-white/40';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">API Keys</h1>
          <p className="text-white/50 text-sm">
            Generate and manage API keys for customers
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="glass-button px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Generate Key
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keys..."
            className="glass-input w-full pl-10 pr-4 py-2.5 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* New Key Display */}
      {newKeyValue && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white mb-1">API Key Created</div>
              <p className="text-xs text-white/60 mb-3">
                Copy this key now. You won&apos;t be able to see it again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-black/30 text-emerald-400 text-sm font-mono truncate">
                  {newKeyValue}
                </code>
                <button
                  onClick={() => copyToClipboard(newKeyValue, 'new')}
                  className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  {copiedId === 'new' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={() => setNewKeyValue(null)}
              className="text-white/40 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                Key
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                Customer
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                Environment
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                Scopes
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                Usage
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                Last Used
              </th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-[var(--color-accent)] rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : filteredKeys.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-white/40 text-sm">
                  {apiKeys.length === 0 ? 'No API keys yet. Generate one to get started.' : 'No API keys found'}
                </td>
              </tr>
            ) : (
              filteredKeys.map((key) => (
                <tr key={key.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${key.is_active ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        <Key className={`w-4 h-4 ${key.is_active ? 'text-emerald-400' : 'text-red-400'}`} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{key.name}</div>
                        <code className="text-xs text-white/40 font-mono">{key.key_prefix}...</code>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-white">{key.customer_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${getEnvBadgeClass(key.environment)}`}>
                      {key.environment}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.slice(0, 2).map((scope) => (
                        <span key={scope} className="px-2 py-0.5 rounded text-xs bg-white/[0.03] text-white/50">
                          {scope.replace('read:', '')}
                        </span>
                      ))}
                      {key.scopes.length > 2 && (
                        <span className="px-2 py-0.5 rounded text-xs bg-white/[0.03] text-white/50">
                          +{key.scopes.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-white">{key.usage_count.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-white/50">
                      {key.last_used_at 
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(key.key_prefix, key.id)}
                        className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                        title="Copy key prefix"
                      >
                        {copiedId === key.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-white/40" />
                        )}
                      </button>
                      {key.is_active && (
                        <button
                          onClick={() => revokeApiKey(key.id)}
                          disabled={deleting === key.id}
                          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Revoke key"
                        >
                          {deleting === key.id ? (
                            <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-white/40 hover:text-red-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-md glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Generate API Key</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Customer / Organization Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
                  placeholder="e.g., Boston College"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
                  placeholder="e.g., Production Key"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Environment
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as 'production' | 'development' | 'test')}
                  className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
                >
                  <option value="production">Production</option>
                  <option value="development">Development</option>
                  <option value="test">Test</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.03] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={createApiKey}
                  disabled={!customerName || !keyName || creating}
                  className="glass-button px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Generate Key
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
