'use client';

import React, { useState } from 'react';
import { getApiBaseUrl } from '../../lib/auth-client';
import { SITE } from '../../lib/marketing/site';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [errorText, setErrorText] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorText('');
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/notifications/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Request failed (${res.status})`);
      }
      setStatus('ok');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setStatus('err');
      setErrorText(err?.message || 'Unable to send message. Email us directly.');
    }
  }

  return (
    <form className="mkt-card" onSubmit={onSubmit} noValidate>
      <div className="mkt-field">
        <label className="mkt-label" htmlFor="c-name">
          Full name
        </label>
        <input
          id="c-name"
          className="mkt-input"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="mkt-field">
        <label className="mkt-label" htmlFor="c-email">
          Email
        </label>
        <input
          id="c-email"
          className="mkt-input"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="mkt-field">
        <label className="mkt-label" htmlFor="c-topic">
          Topic
        </label>
        <select
          id="c-topic"
          className="mkt-input"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          <option value="general">General</option>
          <option value="support">Product support</option>
          <option value="billing">Billing</option>
          <option value="partnership">Partnership / media</option>
          <option value="compliance">Compliance</option>
        </select>
      </div>
      <div className="mkt-field">
        <label className="mkt-label" htmlFor="c-message">
          Message
        </label>
        <textarea
          id="c-message"
          className="mkt-input"
          name="message"
          required
          minLength={20}
          rows={6}
          style={{ minHeight: 140, resize: 'vertical' }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <button type="submit" className="mkt-btn mkt-btn-primary" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Send message'}
      </button>
      {status === 'ok' ? (
        <div className="mkt-toast ok" role="status">
          Thanks — your message was queued via our notification email channel. We typically reply
          within 2 business days.
        </div>
      ) : null}
      {status === 'err' ? (
        <div className="mkt-toast err" role="alert">
          {errorText} Or write to{' '}
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
        </div>
      ) : null}
    </form>
  );
}
