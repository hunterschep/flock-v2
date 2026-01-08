'use client';

import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Building,
  Loader2,
  Edit2,
  Globe,
  X
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  slug: string;
  contact_name: string;
  contact_email: string;
  tier: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled' | 'pending';
  allowed_institution_ids: string[];
  created_at: string;
  api_keys_count?: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contact_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTierBadgeClass = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'pro': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-400';
      case 'suspended': return 'bg-amber-500/10 text-amber-400';
      case 'cancelled': return 'bg-red-500/10 text-red-400';
      default: return 'bg-white/5 text-white/40';
    }
  };

  const getInstitutionAccessLabel = (customer: Customer) => {
    if (customer.tier === 'enterprise' && customer.allowed_institution_ids.length === 0) {
      return 'All';
    }
    if (customer.allowed_institution_ids.length === 0) {
      return 'None';
    }
    return `${customer.allowed_institution_ids.length}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Customers</h1>
          <p className="text-white/50 text-sm">
            Manage API customers and their access
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="glass-button px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <h3 className="text-sm font-medium text-blue-400 mb-2">Institution Access Rules</h3>
        <ul className="text-sm text-white/60 space-y-1">
          <li>• <strong className="text-white/80">Enterprise</strong> with empty institution list = access to ALL institutions</li>
          <li>• <strong className="text-white/80">Starter/Pro</strong> must have specific institutions assigned</li>
          <li>• Add institution UUIDs to the allowed list to grant specific access</li>
        </ul>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers..."
            className="glass-input w-full pl-10 pr-4 py-2.5 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                Customer
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                Contact
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                Tier
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                Institutions
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                API Keys
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
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-white/40 text-sm">
                  {customers.length === 0 ? 'No customers yet. Add one to get started.' : 'No customers found'}
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
                        <Building className="w-4 h-4 text-[var(--color-accent)]" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{customer.name}</div>
                        <div className="text-xs text-white/40">{customer.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white">{customer.contact_name}</div>
                    <div className="text-xs text-white/40">{customer.contact_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${getTierBadgeClass(customer.tier)}`}>
                      {customer.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-white/30" />
                      <span className={`text-sm ${
                        getInstitutionAccessLabel(customer) === 'All' 
                          ? 'text-violet-400' 
                          : getInstitutionAccessLabel(customer) === 'None' 
                            ? 'text-amber-400' 
                            : 'text-white'
                      }`}>
                        {getInstitutionAccessLabel(customer)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${getStatusBadgeClass(customer.status)}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-white">{customer.api_keys_count || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setEditingCustomer(customer)}
                      className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors inline-flex"
                      title="Edit customer"
                    >
                      <Edit2 className="w-4 h-4 text-white/40" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCustomerModal onClose={() => setShowCreateModal(false)} onCreated={loadCustomers} />
      )}

      {/* Edit Modal */}
      {editingCustomer && (
        <EditCustomerModal 
          customer={editingCustomer} 
          onClose={() => setEditingCustomer(null)} 
          onUpdated={loadCustomers} 
        />
      )}
    </div>
  );
}

// Create Customer Modal
function CreateCustomerModal({ 
  onClose, 
  onCreated 
}: { 
  onClose: () => void; 
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_name: '',
    contact_email: '',
    tier: 'starter',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onCreated();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create customer');
      }
    } catch (err) {
      console.error('Error creating customer:', err);
      setError('Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setFormData({ ...formData, name, slug });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-strong rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Add New Customer</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.05]">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Organization Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
              placeholder="Boston College"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
              placeholder="boston-college"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Contact Name
            </label>
            <input
              type="text"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
              placeholder="John Smith"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
              placeholder="jsmith@bc.edu"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Tier
            </label>
            <select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
            >
              <option value="starter">Starter (Free) - 10 req/min, 100 req/day, 1 institution</option>
              <option value="pro">Pro - 60 req/min, 5,000 req/day, 5 institutions</option>
              <option value="enterprise">Enterprise - 500 req/min, 100k req/day, ALL institutions</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/70 hover:bg-white/[0.05] text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 glass-button px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Customer Modal
function EditCustomerModal({ 
  customer,
  onClose, 
  onUpdated 
}: { 
  customer: Customer;
  onClose: () => void; 
  onUpdated: () => void;
}) {
  const [formData, setFormData] = useState({
    tier: customer.tier,
    status: customer.status,
    contact_name: customer.contact_name,
    contact_email: customer.contact_email,
    allowed_institution_ids: customer.allowed_institution_ids.join('\n'),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Parse institution IDs from textarea (one per line)
    const institutionIds = formData.allowed_institution_ids
      .split('\n')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    try {
      const response = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: customer.id,
          tier: formData.tier,
          status: formData.status,
          contact_name: formData.contact_name,
          contact_email: formData.contact_email,
          allowed_institution_ids: institutionIds,
        }),
      });

      if (response.ok) {
        onUpdated();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update customer');
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      setError('Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-strong rounded-2xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit Customer</h2>
            <p className="text-sm text-white/50">{customer.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.05]">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Tier
              </label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value as Customer['tier'] })}
                className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Customer['status'] })}
                className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Allowed Institution IDs
              <span className="text-white/40 font-normal ml-2">(one UUID per line)</span>
            </label>
            <textarea
              value={formData.allowed_institution_ids}
              onChange={(e) => setFormData({ ...formData, allowed_institution_ids: e.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-lg text-sm font-mono h-32 resize-none"
              placeholder={formData.tier === 'enterprise' 
                ? "Leave empty for ALL institutions access"
                : "Enter institution UUIDs, one per line\ne.g.\n550e8400-e29b-41d4-a716-446655440000"}
            />
            {formData.tier === 'enterprise' && !formData.allowed_institution_ids.trim() && (
              <p className="text-xs text-violet-400 mt-1">
                ✓ Enterprise with empty list = access to ALL institutions
              </p>
            )}
            {formData.tier !== 'enterprise' && !formData.allowed_institution_ids.trim() && (
              <p className="text-xs text-amber-400 mt-1">
                ⚠ Non-enterprise customers need specific institution access to work
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/70 hover:bg-white/[0.05] text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 glass-button px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
