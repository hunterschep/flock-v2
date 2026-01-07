'use client';

import { useState } from 'react';
import { Send, Check, X, Loader2 } from 'lucide-react';

interface ContactFormProps {
  subject?: string;
  onClose?: () => void;
  className?: string;
}

export function ContactForm({ subject: initialSubject = '', onClose, className = '' }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: initialSubject,
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  if (status === 'success') {
    return (
      <div className={`glass-card rounded-xl p-8 text-center ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
        <p className="text-white/60 mb-6">
          Thanks for reaching out. We&apos;ll get back to you as soon as possible.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="glass-button px-6 py-2.5 rounded-lg text-sm font-medium"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-white/70 mb-2">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          required
          value={formData.subject}
          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
          className="glass-input w-full px-4 py-2.5 rounded-lg text-sm"
          placeholder="What's this about?"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-white/70 mb-2">
          Message
        </label>
        <textarea
          id="message"
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          className="glass-input w-full px-4 py-2.5 rounded-lg text-sm resize-none"
          placeholder="Tell us more..."
        />
      </div>

      {status === 'error' && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <X className="w-4 h-4" />
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.03] transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="glass-button px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Message
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// Modal wrapper for the contact form
interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject?: string;
  title?: string;
}

export function ContactModal({ isOpen, onClose, subject = '', title = 'Contact Us' }: ContactModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg glass-card rounded-2xl p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>
        
        <ContactForm subject={subject} onClose={onClose} />
      </div>
    </div>
  );
}

