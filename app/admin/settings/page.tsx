'use client';

import { useState } from 'react';
import { Save, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    kAnonymityThreshold: 5,
    defaultRateLimitMinute: 60,
    defaultRateLimitDay: 10000,
    cacheExpirationHours: 24,
    enableWebhooks: false,
    maintenanceMode: false,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-white/50 text-sm">
          Configure API behavior and defaults
        </p>
      </div>

      {/* Privacy Settings */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Privacy</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              K-Anonymity Threshold
            </label>
            <input
              type="number"
              value={settings.kAnonymityThreshold}
              onChange={(e) => setSettings({ ...settings, kAnonymityThreshold: Number(e.target.value) })}
              className="glass-input w-full max-w-xs px-4 py-2.5 rounded-lg text-sm"
              min={1}
              max={100}
            />
            <p className="text-xs text-white/40 mt-2">
              Minimum number of users required to include a data point in API responses.
              Lower values reveal more granular data but reduce privacy.
            </p>
          </div>
        </div>
      </div>

      {/* Rate Limiting */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Rate Limiting</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Default Per-Minute Limit
            </label>
            <input
              type="number"
              value={settings.defaultRateLimitMinute}
              onChange={(e) => setSettings({ ...settings, defaultRateLimitMinute: Number(e.target.value) })}
              className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Default Per-Day Limit
            </label>
            <input
              type="number"
              value={settings.defaultRateLimitDay}
              onChange={(e) => setSettings({ ...settings, defaultRateLimitDay: Number(e.target.value) })}
              className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
              min={1}
            />
          </div>
        </div>
        <p className="text-xs text-white/40 mt-4">
          These are the default limits for the Starter tier. Pro and Enterprise tiers have higher limits.
        </p>
      </div>

      {/* Caching */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Caching</h2>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Aggregation Cache Duration (hours)
          </label>
          <input
            type="number"
            value={settings.cacheExpirationHours}
            onChange={(e) => setSettings({ ...settings, cacheExpirationHours: Number(e.target.value) })}
            className="glass-input w-full max-w-xs px-4 py-2.5 rounded-lg text-sm"
            min={1}
            max={168}
          />
          <p className="text-xs text-white/40 mt-2">
            How long pre-computed aggregations are cached before being recomputed.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Features</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:bg-white/[0.03] transition-all">
            <div>
              <div className="text-sm font-medium text-white">Webhooks</div>
              <div className="text-xs text-white/40">Allow enterprise customers to receive webhooks</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enableWebhooks}
              onChange={(e) => setSettings({ ...settings, enableWebhooks: e.target.checked })}
              className="h-5 w-5 rounded border-white/20 bg-white/10 text-[var(--color-accent)]"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card rounded-xl p-6 mb-6 border-red-500/20">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
        </div>
        <label className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-all">
          <div>
            <div className="text-sm font-medium text-white">Maintenance Mode</div>
            <div className="text-xs text-white/40">Disable all API endpoints (returns 503)</div>
          </div>
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            className="h-5 w-5 rounded border-white/20 bg-white/10 text-red-500"
          />
        </label>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="glass-button px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && (
          <span className="text-sm text-emerald-400">Settings saved successfully</span>
        )}
      </div>
    </div>
  );
}

