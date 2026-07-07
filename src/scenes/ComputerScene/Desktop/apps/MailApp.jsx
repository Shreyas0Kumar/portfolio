import React, { useState } from 'react'
import { usePortfolio } from '../../../../data/portfolio.jsx'
import './MailApp.css'

/**
 * MailApp
 * A Mail-style contact form that sends *in-app* — the visitor never leaves the
 * desktop. It POSTs to Formspree (a hosted form backend), which emails the
 * message straight to profile.email. The visitor's address is sent as the
 * reply-to, so replying lands back in their inbox.
 *
 * Setup (one-time): create a free form at https://formspree.io, then paste its
 * endpoint below — or set VITE_FORMSPREE_ENDPOINT at build time. The endpoint is
 * not a secret (it's a public form URL), so committing it is fine.
 *
 * Until an endpoint is configured, "Send" can't deliver, so we surface a clear
 * "email directly" link instead of silently failing.
 */
const FORMSPREE_ENDPOINT =
  import.meta.env.VITE_FORMSPREE_ENDPOINT || '' // e.g. 'https://formspree.io/f/xxxxxxxx'

export default function MailApp() {
  const MAIL_TO = usePortfolio().profile.email
  const [from, setFrom]       = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody]       = useState('')
  const [trap, setTrap]       = useState('') // honeypot — real people leave it blank
  const [status, setStatus]   = useState('idle') // idle | sending | sent | error

  const configured = Boolean(FORMSPREE_ENDPOINT)

  const send = async e => {
    e.preventDefault()
    if (trap) return // bot caught in the honeypot — pretend nothing happened
    if (!configured) { setStatus('error'); return }

    try {
      setStatus('sending')
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: from, // Formspree uses this as the reply-to address
          _subject: subject
            ? `Portfolio · ${subject}`
            : 'New message from your portfolio',
          message: `${body}\n\nSent from the portfolio Mail app by ${from}`,
          _gotcha: trap, // empty for real people; lets Formspree drop bots server-side too
        }),
      })
      if (res.ok) {
        setStatus('sent')
        setSubject(''); setBody('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="mail">
      <div className="mail-toolbar">
        <span className="mail-toolbar-title">New Message</span>
        <button type="submit" form="mail-form" className="mail-send" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send'}
        </button>
      </div>

      <form id="mail-form" className="mail-form" onSubmit={send}>
        <label className="mail-field">
          <span className="mail-label">To:</span>
          <span className="mail-static">{MAIL_TO}</span>
        </label>
        <label className="mail-field">
          <span className="mail-label">From:</span>
          <input
            className="mail-input"
            type="email"
            required
            value={from}
            onChange={e => setFrom(e.target.value)}
            placeholder="your@email.com"
          />
        </label>
        <label className="mail-field">
          <span className="mail-label">Subject:</span>
          <input
            className="mail-input"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Let's talk"
          />
        </label>
        <textarea
          className="mail-body"
          required
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your message…"
        />

        {/* Honeypot: hidden from people, tempting to bots. Kept out of the tab order. */}
        <input
          type="text"
          name="_gotcha"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={e => setTrap(e.target.value)}
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
          aria-hidden="true"
        />

        {status === 'sent'  && <p className="mail-status ok">Thanks, your message is on its way ✓</p>}
        {status === 'error' && (
          <p className="mail-status err">
            Couldn’t send right now. Email me directly at{' '}
            <a href={`mailto:${MAIL_TO}`}>{MAIL_TO}</a>.
          </p>
        )}
      </form>
    </div>
  )
}
