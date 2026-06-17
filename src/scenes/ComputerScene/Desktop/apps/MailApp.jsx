import React, { useState } from 'react'
import { usePortfolio } from '../../../../data/portfolio.jsx'
import './MailApp.css'

/**
 * MailApp
 * A Mail-style contact form. The recipient comes from public/portfolio.json
 * (profile.email). If FORMSPREE_ENDPOINT is set it POSTs there; otherwise it
 * falls back to a mailto: compose link (always works).
 *
 * To enable in-app sending, create a Formspree form and paste its endpoint
 * into FORMSPREE_ENDPOINT.
 */
const FORMSPREE_ENDPOINT = '' // e.g. 'https://formspree.io/f/xxxxxxx'

export default function MailApp() {
  const MAIL_TO = usePortfolio().profile.email
  const [from, setFrom]       = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody]       = useState('')
  const [status, setStatus]   = useState('idle') // idle | sending | sent | error

  const send = async e => {
    e.preventDefault()

    if (!FORMSPREE_ENDPOINT) {
      // Fallback: open the user's mail client.
      const url = `mailto:${MAIL_TO}?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(`${body}\n\n— ${from}`)}`
      window.location.href = url
      setStatus('sent')
      return
    }

    try {
      setStatus('sending')
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: from, subject, message: body }),
      })
      setStatus(res.ok ? 'sent' : 'error')
      if (res.ok) { setSubject(''); setBody('') }
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

        {status === 'sent'  && <p className="mail-status ok">Thanks — your message is on its way ✓</p>}
        {status === 'error' && <p className="mail-status err">Something went wrong. Try again or email directly.</p>}
      </form>
    </div>
  )
}
