import React from 'react'
import { usePortfolio } from '../../../../data/portfolio.jsx'
import './AboutMe.css'

/**
 * AboutMe
 * Small centered dialog launched from the Apple menu (" > About Me").
 * Profile + contact content all comes from public/portfolio.json.
 *
 * Props:
 *   onClose {function} — close the dialog
 */
const initials = name =>
  (name || '').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()

const short = url => (url || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

export default function AboutMe({ onClose }) {
  const { profile } = usePortfolio()

  const contacts = [
    { label: 'Email',    value: profile.email,            href: `mailto:${profile.email}` },
    { label: 'GitHub',   value: short(profile.links.github),   href: profile.links.github },
    { label: 'LinkedIn', value: short(profile.links.linkedin), href: profile.links.linkedin },
  ].filter(c => c.href)

  return (
    <div className="about-window">
      <div className="about-titlebar">
        <div className="about-lights">
          <button
            type="button"
            className="about-light close"
            aria-label="Close"
            onClick={onClose}
          />
          <span className="about-light minimize" />
          <span className="about-light maximize" />
        </div>
        <div className="about-titletext">About Me</div>
      </div>

      <div className="about-body">
        <div className="about-avatar">{initials(profile.name)}</div>
        <h2 className="about-name">{profile.name}</h2>
        <p className="about-role">{profile.role} · {profile.location}</p>

        <p className="about-bio">{profile.tagline}</p>

        <ul className="about-contacts">
          {contacts.map(c => (
            <li key={c.label} className="about-contact">
              <span className="about-contact-label">{c.label}</span>
              <a
                className="about-contact-value"
                href={c.href}
                target="_blank"
                rel="noreferrer"
              >
                {c.value}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
