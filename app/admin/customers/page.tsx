'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  MoreVertical,
  Building
} from 'lucide-react';

// TODO: In production, use service role on the server via API routes

interface Customer {
  id: string;
  name: string;
  slug: string;
  contact_name: string;
  contact_email: string;
  tier: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled' | 'pending';
  created_at: string;
  api_keys_count?: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      // Mock data for now - replace with actual query
      setCustomers([
        {
          id: '1',
          name: 'Boston College',
          slug: 'boston-college',
          contact_name: 'John Smith',
          contact_email: 'jsmith@bc.edu',
          tier: 'pro',
          status: 'active',
          created_at: '2024-01-15T00:00:00Z',
          api_keys_count: 3,
        },
        {
          id: '2',
          name: 'Stanford Analytics',
          slug: 'stanford-analytics',
          contact_name: 'Jane Doe',
          contact_email: 'jdoe@stanford.edu',
          tier: 'enterprise',
          status: 'active',
          created_at: '2024-02-20T00:00:00Z',
          api_keys_count: 5,
        },
        {
          id: '3',
          name: 'MIT Career Services',
          slug: 'mit-career',
          contact_name: 'Bob Johnson',
          contact_email: 'bjohnson@mit.edu',
          tier: 'starter',
          status: 'active',
          created_at: '2024-03-10T00:00:00Z',
          api_keys_count: 1,
        },
      ]);
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
                Status
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                API Keys
              </th>
              <th className="text-left px-6 py-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                Created
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
                  No customers found
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
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${getStatusBadgeClass(customer.status)}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-white">{customer.api_keys_count}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-white/50">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors inline-flex"
                    >
                      <MoreVertical className="w-4 h-4 text-white/40" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal would go here */}
      {showCreateModal && (
        <CreateCustomerModal onClose={() => setShowCreateModal(false)} onCreated={loadCustomers} />
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // TODO: In production, call your API to create the customer
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setSaving(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setFormData({ ...formData, name, slug });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-strong rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-white mb-6">Add New Customer</h2>
        
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
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
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
              className="flex-1 glass-button px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

