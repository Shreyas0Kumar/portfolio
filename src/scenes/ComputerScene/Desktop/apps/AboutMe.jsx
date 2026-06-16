import React from 'react'
import './AboutMe.css'

/**
 * AboutMe
 * Small centered dialog launched from the Apple menu (" > About Me").
 * Holds the contact / about content.
 *
 * TODO: fill in real contact values below (email, LinkedIn). GitHub is taken
 * from the public repos in projects.js.
 *
 * Props:
 *   onClose {function} — close the dialog
 */
const CONTACTS = [
  { label: 'Email',    value: 'shreyaskr2000@gmail.com',         href: 'shreyaskr2000@gmail.com' },
  { label: 'GitHub',   value: 'github.com/Shreyas0Kumar',        href: 'https://github.com/Shreyas0Kumar' },
  { label: 'LinkedIn', value: 'linkedin.com/in/shreyas0kumar/',     href: 'https://www.linkedin.com/in/shreyas0kumar/' },
]

export default function AboutMe({ onClose }) {
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
        <div className="about-avatar">SK</div>
        <h2 className="about-name">Shreyas Kumar</h2>
        <p className="about-role">AI Engineer · builder of real systems</p>

        <p className="about-bio">
          I build end-to-end AI products — from data and retrieval pipelines to
          the interfaces people actually use. I care about systems that are
          honest, useful, and shipped.
        </p>

        <ul className="about-contacts">
          {CONTACTS.map(c => (
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
