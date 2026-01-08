'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Book, 
  Code, 
  Key, 
  Zap,
  Lock,
  Globe,
  ChevronRight,
  Copy,
  Check,
  Building,
  Shield,
  AlertCircle,
  MessageSquare,
  Play,
  Terminal,
  Loader2
} from 'lucide-react';
import { ContactModal } from '@/components/ContactForm';

export default function ApiDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [contactOpen, setContactOpen] = useState(false);
  
  // Playground state
  const [playgroundEndpoint, setPlaygroundEndpoint] = useState('/v1/institutions');
  const [playgroundApiKey, setPlaygroundApiKey] = useState('');
  const [playgroundResponse, setPlaygroundResponse] = useState<string | null>(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundError, setPlaygroundError] = useState<string | null>(null);

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const runPlaygroundRequest = async () => {
    if (!playgroundApiKey) {
      setPlaygroundError('Please enter your API key');
      return;
    }
    
    setPlaygroundLoading(true);
    setPlaygroundError(null);
    setPlaygroundResponse(null);

    try {
      const response = await fetch(`/api${playgroundEndpoint}`, {
        headers: {
          'Authorization': `Bearer ${playgroundApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setPlaygroundResponse(JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        setPlaygroundError(`Error ${response.status}: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      setPlaygroundError('Failed to make request. Check your API key and try again.');
      console.error(err);
    } finally {
      setPlaygroundLoading(false);
    }
  };

  const scopes = [
    { name: 'read:aggregates', description: 'Access location, employment, and grad school data', tier: 'All tiers' },
    { name: 'read:trends', description: 'Access historical trend data and time-series', tier: 'Pro+' },
    { name: 'read:compare', description: 'Compare data across multiple institutions', tier: 'Enterprise' },
    { name: 'read:flows', description: 'Access migration flow data between locations', tier: 'Enterprise' },
    { name: 'read:all', description: 'Full access to all current and future endpoints', tier: 'Enterprise' },
  ];

  const endpoints = [
    {
      method: 'GET',
      path: '/v1/institutions',
      description: 'List all institutions accessible to your API key',
      scope: 'read:aggregates',
      params: [],
      example: '/v1/institutions',
      response: `{
  "success": true,
  "data": {
    "institutions": [
      { 
        "id": "abc123-uuid", 
        "name": "Boston College", 
        "domain": "bc.edu", 
        "total_alumni": 2450 
      }
    ],
    "total": 1
  }
}`,
    },
    {
      method: 'GET',
      path: '/v1/institutions/:id',
      description: 'Get institution details and summary statistics',
      scope: 'read:aggregates',
      params: [],
      example: '/v1/institutions/abc123-uuid',
      response: `{
  "success": true,
  "data": {
    "institution": { 
      "id": "abc123-uuid", 
      "name": "Boston College", 
      "domain": "bc.edu", 
      "total_alumni": 2450 
    },
    "summary": {
      "total_users": 2450,
      "status_distribution": { 
        "employed": { "count": 1800, "percentage": 73.5 },
        "grad_school": { "count": 350, "percentage": 14.3 }
      },
      "top_cities": [
        { "city": "New York, NY", "count": 342 },
        { "city": "Boston, MA", "count": 298 }
      ],
      "last_updated": "2024-12-10T00:00:00Z"
    }
  }
}`,
    },
    {
      method: 'GET',
      path: '/v1/institutions/:id/locations',
      description: 'Get location distribution for alumni',
      scope: 'read:aggregates',
      params: [
        { name: 'granularity', type: 'string', default: 'city', description: 'city | state | country' },
        { name: 'grad_year_min', type: 'number', default: '-', description: 'Filter by graduation year (min)' },
        { name: 'grad_year_max', type: 'number', default: '-', description: 'Filter by graduation year (max)' },
        { name: 'min_count', type: 'number', default: '5', description: 'Minimum alumni count (k-anonymity)' },
      ],
      example: '/v1/institutions/abc123-uuid/locations?granularity=city',
      response: `{
  "success": true,
  "data": {
    "institution": { "id": "abc123-uuid", "name": "Boston College" },
    "filters": { "granularity": "city" },
    "total_alumni": 2450,
    "distribution": [
      { "location": "New York, NY", "count": 342, "percentage": 14.0 },
      { "location": "Boston, MA", "count": 298, "percentage": 12.2 },
      { "location": "San Francisco, CA", "count": 156, "percentage": 6.4 }
    ],
    "generated_at": "2024-12-10T12:00:00Z"
  }
}`,
    },
    {
      method: 'GET',
      path: '/v1/institutions/:id/employment',
      description: 'Get employment statistics and top employers',
      scope: 'read:aggregates',
      params: [
        { name: 'grad_year_min', type: 'number', default: '-', description: 'Filter by graduation year (min)' },
        { name: 'grad_year_max', type: 'number', default: '-', description: 'Filter by graduation year (max)' },
      ],
      example: '/v1/institutions/abc123-uuid/employment',
      response: `{
  "success": true,
  "data": {
    "institution": { "id": "abc123-uuid", "name": "Boston College" },
    "total_alumni": 2450,
    "status_breakdown": {
      "employed": { "count": 1800, "percentage": 73.5 },
      "grad_school": { "count": 350, "percentage": 14.3 },
      "looking": { "count": 200, "percentage": 8.2 },
      "internship": { "count": 100, "percentage": 4.0 }
    },
    "top_employers": [
      { "name": "Google", "count": 45 },
      { "name": "Goldman Sachs", "count": 38 },
      { "name": "McKinsey & Company", "count": 28 }
    ]
  }
}`,
    },
    {
      method: 'GET',
      path: '/v1/institutions/:id/grad-schools',
      description: 'Get graduate school placement data',
      scope: 'read:aggregates',
      params: [
        { name: 'grad_year_min', type: 'number', default: '-', description: 'Filter by graduation year (min)' },
        { name: 'grad_year_max', type: 'number', default: '-', description: 'Filter by graduation year (max)' },
      ],
      example: '/v1/institutions/abc123-uuid/grad-schools',
      response: `{
  "success": true,
  "data": {
    "institution": { "id": "abc123-uuid", "name": "Boston College" },
    "total_in_grad_school": 350,
    "top_schools": [
      { "name": "Harvard Business School", "count": 28 },
      { "name": "Stanford Law School", "count": 22 },
      { "name": "Columbia University", "count": 18 }
    ],
    "degree_breakdown": {
      "MBA": { "count": 120, "percentage": 34.3 },
      "JD": { "count": 80, "percentage": 22.9 },
      "MD": { "count": 50, "percentage": 14.3 }
    }
  }
}`,
    },
    {
      method: 'GET',
      path: '/v1/usage',
      description: 'Get your API usage statistics',
      scope: 'read:aggregates',
      params: [
        { name: 'start_date', type: 'string', default: '30 days ago', description: 'ISO 8601 date (YYYY-MM-DD)' },
        { name: 'end_date', type: 'string', default: 'today', description: 'ISO 8601 date (YYYY-MM-DD)' },
      ],
      example: '/v1/usage',
      response: `{
  "success": true,
  "data": {
    "customer": { "id": "uuid", "name": "Your Organization" },
    "period": { "start": "2024-11-10", "end": "2024-12-10" },
    "usage": {
      "total_requests": 450,
      "successful_requests": 445,
      "failed_requests": 5,
      "avg_response_time_ms": 142
    }
  }
}`,
    },
  ];

  const errorCodes = [
    { code: 'MISSING_API_KEY', status: 401, description: 'No API key provided in request' },
    { code: 'INVALID_API_KEY', status: 401, description: 'API key is invalid or inactive' },
    { code: 'INSUFFICIENT_SCOPE', status: 403, description: 'API key lacks required scope for endpoint' },
    { code: 'INSTITUTION_NOT_ALLOWED', status: 403, description: 'API key cannot access this institution' },
    { code: 'RATE_LIMIT_EXCEEDED', status: 429, description: 'Too many requests per minute' },
    { code: 'DAILY_LIMIT_EXCEEDED', status: 429, description: 'Daily request limit reached' },
    { code: 'INSTITUTION_NOT_FOUND', status: 404, description: 'Institution ID does not exist' },
    { code: 'NO_DATA_AVAILABLE', status: 404, description: 'No data matches the given filters' },
  ];

  const quickStartSteps = [
    {
      step: 1,
      title: 'Get your API key',
      description: 'Request access and receive your API key via email.',
      code: 'flock_sk_abc123...your_64_char_hex_key',
    },
    {
      step: 2,
      title: 'List your institutions',
      description: 'First, see which institutions you can access.',
      code: `curl -X GET "https://yoursite.com/api/v1/institutions" \\
  -H "Authorization: Bearer flock_sk_your_api_key"`,
    },
    {
      step: 3,
      title: 'Get location data',
      description: 'Use the institution ID to fetch alumni location distribution.',
      code: `curl -X GET "https://yoursite.com/api/v1/institutions/INST_ID/locations?granularity=city" \\
  -H "Authorization: Bearer flock_sk_your_api_key"`,
    },
    {
      step: 4,
      title: 'Filter by graduation year',
      description: 'Add filters to narrow down your data.',
      code: `curl -X GET "https://yoursite.com/api/v1/institutions/INST_ID/employment?grad_year_min=2020&grad_year_max=2024" \\
  -H "Authorization: Bearer flock_sk_your_api_key"`,
    },
  ];

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'quickstart', label: 'Quick Start', icon: Zap },
    { id: 'playground', label: 'Try It Out', icon: Play },
    { id: 'authentication', label: 'Authentication', icon: Lock },
    { id: 'endpoints', label: 'Endpoints', icon: Code },
    { id: 'scopes', label: 'Scopes & Tiers', icon: Shield },
    { id: 'rate-limits', label: 'Rate Limits', icon: Zap },
    { id: 'errors', label: 'Error Codes', icon: AlertCircle },
    { id: 'privacy', label: 'Privacy', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="glass-header sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-white/70" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
                <Book className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Flock API</h1>
                <span className="text-xs text-white/40">v1.0 Documentation</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setContactOpen(true)}
            className="glass-button px-4 py-2 rounded-lg text-sm font-medium hidden sm:inline-flex items-center gap-2"
          >
            Request API Access
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="sticky top-24 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    activeTab === item.id
                      ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="lg:col-span-4 space-y-16">
            {/* Overview */}
            <section id="overview">
              <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
              <p className="text-white/60 mb-6 leading-relaxed">
                The Flock API provides programmatic access to aggregated, anonymized alumni data across universities.
                Build career outcome dashboards, analyze employment trends, and integrate alumni insights into your applications.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="glass-card rounded-xl p-5">
                  <div className="text-sm font-medium text-white/70 mb-2">Base URL</div>
                  <code className="text-[var(--color-accent)] font-mono text-sm">https://yoursite.com/api/v1</code>
                </div>
                <div className="glass-card rounded-xl p-5">
                  <div className="text-sm font-medium text-white/70 mb-2">Response Format</div>
                  <code className="text-[var(--color-accent)] font-mono text-sm">JSON (application/json)</code>
                </div>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Key Features</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/60">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Alumni location distribution</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Employment statistics & top employers</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Graduate school placement data</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Filter by graduation year</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> K-anonymity privacy protection</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Real-time usage analytics</li>
                </ul>
              </div>
            </section>

            {/* Quick Start */}
            <section id="quickstart">
              <h2 className="text-2xl font-bold text-white mb-4">Quick Start</h2>
              <p className="text-white/60 mb-6">
                Get up and running with the Flock API in minutes. Here&apos;s a step-by-step guide.
              </p>
              
              <div className="space-y-6">
                {quickStartSteps.map((step) => (
                  <div key={step.step} className="glass-card rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-white/[0.06] flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] font-bold text-sm">
                        {step.step}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{step.title}</h3>
                        <p className="text-sm text-white/50">{step.description}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-black/20 relative">
                      <button 
                        onClick={() => copyCode(step.code, `step-${step.step}`)}
                        className="absolute top-3 right-3 p-1.5 rounded hover:bg-white/[0.05] transition-colors"
                      >
                        {copiedCode === `step-${step.step}` ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-white/40" />
                        )}
                      </button>
                      <pre className="text-sm font-mono text-white/80 overflow-x-auto pr-10">
                        {step.code}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Playground */}
            <section id="playground">
              <h2 className="text-2xl font-bold text-white mb-4">Try It Out</h2>
              <p className="text-white/60 mb-6">
                Test the API directly from this page. Enter your API key and select an endpoint to make a real request.
              </p>
              
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/[0.06] bg-black/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Terminal className="w-5 h-5 text-[var(--color-accent)]" />
                    <span className="font-semibold text-white">API Playground</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Your API Key</label>
                      <input
                        type="password"
                        value={playgroundApiKey}
                        onChange={(e) => setPlaygroundApiKey(e.target.value)}
                        placeholder="flock_sk_..."
                        className="glass-input w-full px-4 py-2.5 rounded-lg text-sm font-mono"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Endpoint</label>
                      <select
                        value={playgroundEndpoint}
                        onChange={(e) => setPlaygroundEndpoint(e.target.value)}
                        className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
                      >
                        {endpoints.map((ep) => (
                          <option key={ep.path} value={ep.example}>
                            {ep.method} {ep.path}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <button
                      onClick={runPlaygroundRequest}
                      disabled={playgroundLoading}
                      className="glass-button px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {playgroundLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Send Request
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white/50">Response</span>
                    {playgroundError && (
                      <span className="text-xs text-red-400">{playgroundError}</span>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-black/30 min-h-[200px] max-h-[400px] overflow-auto">
                    {playgroundResponse ? (
                      <pre className="text-xs font-mono text-white/80 whitespace-pre-wrap">
                        {playgroundResponse}
                      </pre>
                    ) : (
                      <p className="text-sm text-white/30 text-center py-8">
                        Response will appear here after you send a request
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-400">
                  <strong>Note:</strong> The playground makes real API requests. Your rate limits apply.
                  Don&apos;t have an API key yet?{' '}
                  <button onClick={() => setContactOpen(true)} className="underline hover:no-underline">
                    Request access
                  </button>
                </p>
              </div>
            </section>

            {/* Authentication */}
            <section id="authentication">
              <h2 className="text-2xl font-bold text-white mb-4">Authentication</h2>
              <p className="text-white/60 mb-6">
                All API requests require authentication via a Bearer token. Include your API key in the 
                <code className="mx-1 px-1.5 py-0.5 rounded bg-white/[0.05] text-white/80 text-sm">Authorization</code> 
                header.
              </p>
              
              <div className="glass-card rounded-xl overflow-hidden mb-6">
                <div className="flex items-center justify-between px-4 py-3 bg-black/20 border-b border-white/[0.06]">
                  <span className="text-xs text-white/40 font-mono">Example Request</span>
                  <button 
                    onClick={() => copyCode('Authorization: Bearer flock_sk_your_api_key_here', 'auth')}
                    className="p-1.5 rounded hover:bg-white/[0.05] transition-colors"
                  >
                    {copiedCode === 'auth' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/40" />
                    )}
                  </button>
                </div>
                <pre className="p-4 text-sm font-mono text-white/80 overflow-x-auto">
{`curl -X GET "https://yoursite.com/api/v1/institutions" \\
  -H "Authorization: Bearer flock_sk_your_api_key_here" \\
  -H "Content-Type: application/json"`}
                </pre>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">API Key Format</h3>
                <p className="text-sm text-white/60 mb-3">
                  API keys follow this format: <code className="px-1.5 py-0.5 rounded bg-white/[0.05] text-[var(--color-accent)]">flock_sk_</code> followed by 64 hexadecimal characters.
                </p>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-400">
                    <strong>Keep your API key secure!</strong> Never expose it in client-side code or public repositories.
                  </p>
                </div>
              </div>
            </section>

            {/* Endpoints */}
            <section id="endpoints">
              <h2 className="text-2xl font-bold text-white mb-4">Endpoints</h2>
              <p className="text-white/60 mb-6">
                All endpoints return JSON responses with a consistent structure: <code className="px-1.5 py-0.5 rounded bg-white/[0.05] text-white/80 text-sm">{`{ success: true, data: {...} }`}</code>
              </p>
              
              <div className="space-y-6">
                {endpoints.map((endpoint, idx) => (
                  <div key={idx} className="glass-card rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-white/[0.06]">
                      <div className="flex items-start gap-3 mb-2">
                        <span className="px-2 py-1 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400">
                          {endpoint.method}
                        </span>
                        <code className="text-sm font-mono text-white">{endpoint.path}</code>
                      </div>
                      <p className="text-sm text-white/50">{endpoint.description}</p>
                      <div className="mt-2">
                        <span className="text-xs text-white/30">Required scope: </span>
                        <code className="text-xs text-[var(--color-accent)]">{endpoint.scope}</code>
                      </div>
                    </div>
                    
                    {endpoint.params.length > 0 && (
                      <div className="p-4 border-b border-white/[0.06] bg-black/10">
                        <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Query Parameters</h4>
                        <div className="space-y-2">
                          {endpoint.params.map((param) => (
                            <div key={param.name} className="flex items-start gap-4 text-sm">
                              <code className="text-[var(--color-accent)] w-28 shrink-0">{param.name}</code>
                              <span className="text-white/40 w-16 shrink-0">{param.type}</span>
                              <span className="text-white/60">{param.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 bg-black/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">Example Response</h4>
                        <button 
                          onClick={() => copyCode(endpoint.response, `ep-${idx}`)}
                          className="p-1.5 rounded hover:bg-white/[0.05] transition-colors"
                        >
                          {copiedCode === `ep-${idx}` ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-white/40" />
                          )}
                        </button>
                      </div>
                      <pre className="text-xs font-mono text-white/70 overflow-x-auto">
                        {endpoint.response}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Scopes & Tiers */}
            <section id="scopes">
              <h2 className="text-2xl font-bold text-white mb-4">Scopes & Access Tiers</h2>
              <p className="text-white/60 mb-6">
                Each API key is assigned scopes based on the customer&apos;s tier. Higher tiers unlock additional capabilities.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="glass-card rounded-xl p-5 border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">STARTER</span>
                    <span className="text-xs text-white/40">Free</span>
                  </div>
                  <ul className="space-y-2 text-sm text-white/60">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 1 institution</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 10 req/minute</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 100 req/day</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> read:aggregates</li>
                  </ul>
                </div>
                
                <div className="glass-card rounded-xl p-5 border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400">PRO</span>
                    <span className="text-xs text-white/40">Contact us</span>
                  </div>
                  <ul className="space-y-2 text-sm text-white/60">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" /> 5 institutions</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" /> 60 req/minute</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" /> 5,000 req/day</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" /> + read:trends</li>
                  </ul>
                </div>
                
                <div className="glass-card rounded-xl p-5 border-violet-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-500/10 text-violet-400">ENTERPRISE</span>
                    <span className="text-xs text-white/40">Custom</span>
                  </div>
                  <ul className="space-y-2 text-sm text-white/60">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-400" /> All institutions</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-400" /> 500 req/minute</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-400" /> 100,000 req/day</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-400" /> read:all scopes</li>
                  </ul>
                </div>
              </div>

              <div className="glass-card rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Scope</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Description</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Available In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopes.map((scope) => (
                      <tr key={scope.name} className="border-b border-white/[0.06] last:border-0">
                        <td className="px-4 py-3">
                          <code className="text-sm text-[var(--color-accent)]">{scope.name}</code>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/60">{scope.description}</td>
                        <td className="px-4 py-3 text-sm text-white/50">{scope.tier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Rate Limits */}
            <section id="rate-limits">
              <h2 className="text-2xl font-bold text-white mb-4">Rate Limits</h2>
              <p className="text-white/60 mb-6">
                Rate limits protect the API and ensure fair usage. Exceeding limits returns a <code className="px-1.5 py-0.5 rounded bg-white/[0.05] text-white/80 text-sm">429 Too Many Requests</code> response.
              </p>
              
              <div className="glass-card rounded-xl overflow-hidden mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Tier</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Per Minute</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Per Day</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Institutions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/[0.06]">
                      <td className="px-4 py-3 text-sm text-white">Starter (Free)</td>
                      <td className="px-4 py-3 text-sm text-white/60">10</td>
                      <td className="px-4 py-3 text-sm text-white/60">100</td>
                      <td className="px-4 py-3 text-sm text-white/60">1</td>
                    </tr>
                    <tr className="border-b border-white/[0.06]">
                      <td className="px-4 py-3 text-sm text-white">Pro</td>
                      <td className="px-4 py-3 text-sm text-white/60">60</td>
                      <td className="px-4 py-3 text-sm text-white/60">5,000</td>
                      <td className="px-4 py-3 text-sm text-white/60">5</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-white">Enterprise</td>
                      <td className="px-4 py-3 text-sm text-white/60">500</td>
                      <td className="px-4 py-3 text-sm text-white/60">100,000</td>
                      <td className="px-4 py-3 text-sm text-white/60">All</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Rate Limit Headers</h3>
                <p className="text-sm text-white/60 mb-3">
                  Every response includes headers to help you track your usage:
                </p>
                <div className="space-y-1 text-sm font-mono">
                  <div className="text-white/50"><span className="text-[var(--color-accent)]">X-RateLimit-Limit-Minute:</span> 10</div>
                  <div className="text-white/50"><span className="text-[var(--color-accent)]">X-RateLimit-Remaining-Minute:</span> 8</div>
                  <div className="text-white/50"><span className="text-[var(--color-accent)]">X-RateLimit-Reset-Minute:</span> 2024-12-10T12:01:00Z</div>
                </div>
              </div>
            </section>

            {/* Error Codes */}
            <section id="errors">
              <h2 className="text-2xl font-bold text-white mb-4">Error Codes</h2>
              <p className="text-white/60 mb-6">
                All errors follow a consistent format with a machine-readable code and human-readable message.
              </p>
              
              <div className="glass-card rounded-xl overflow-hidden mb-6">
                <div className="p-4 border-b border-white/[0.06] bg-black/20">
                  <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Error Response Format</h4>
                  <pre className="text-xs font-mono text-white/70">
{`{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds."
  }
}`}
                  </pre>
                </div>
              </div>

              <div className="glass-card rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Code</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">HTTP</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-white/70">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorCodes.map((err) => (
                      <tr key={err.code} className="border-b border-white/[0.06] last:border-0">
                        <td className="px-4 py-3">
                          <code className="text-xs text-red-400">{err.code}</code>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/60">{err.status}</td>
                        <td className="px-4 py-3 text-sm text-white/60">{err.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Privacy */}
            <section id="privacy">
              <h2 className="text-2xl font-bold text-white mb-4">Privacy & Data Protection</h2>
              <p className="text-white/60 mb-6">
                The Flock API is built with privacy at its core. All data is aggregated and anonymized.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-[var(--color-accent)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white mb-1">K-Anonymity (k=5)</h3>
                      <p className="text-sm text-white/50">
                        All data points must represent at least 5 individuals. Smaller cohorts are excluded.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-[var(--color-accent)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white mb-1">No PII</h3>
                      <p className="text-sm text-white/50">
                        The API never returns individual user data. Only aggregate counts and percentages.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5 text-[var(--color-accent)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white mb-1">Institution Scoping</h3>
                      <p className="text-sm text-white/50">
                        API keys are restricted to specific institutions. Enterprise can access all.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                      <Key className="w-5 h-5 text-[var(--color-accent)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white mb-1">Audit Logging</h3>
                      <p className="text-sm text-white/50">
                        Every request is logged for security auditing. Usage is tracked per API key.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="glass-card rounded-xl p-8 text-center">
              <h3 className="text-xl font-bold text-white mb-3">Ready to integrate?</h3>
              <p className="text-white/50 mb-6 max-w-md mx-auto">
                Get started with free API access. Need higher limits or custom features? Just reach out.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setContactOpen(true)}
                  className="inline-flex items-center justify-center gap-2 glass-button px-6 py-3 rounded-lg text-sm font-medium"
                >
                  Request Access
                  <ChevronRight className="w-4 h-4" />
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-white/60 hover:text-white border border-white/[0.06] hover:bg-white/[0.03] transition-all"
                >
                  Learn More About Flock
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>

      <ContactModal 
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        subject="API Access Request"
        title="Request API Access"
      />
    </div>
  );
}
