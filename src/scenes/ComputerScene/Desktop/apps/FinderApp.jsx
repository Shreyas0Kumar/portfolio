import React, { useState } from 'react'
import './FinderApp.css'

/**
 * FinderApp
 * A lightweight Finder: a sidebar of locations and a file grid. Documents holds
 * the resume. Click a file to select it; press Space (or click again) to Quick
 * Look — PDFs preview inline.
 *
 * TODO: drop the real file at public/resume.pdf so "Resume.pdf" previews/opens.
 */
const LOCATIONS = ['Documents', 'Projects', 'Downloads']

const FILES = {
  Documents: [
    { name: 'Resume.pdf',        kind: 'PDF',    icon: '📄', href: '/resume.pdf', preview: 'pdf' },
    { name: 'About Shreyas.txt', kind: 'Text',   icon: '📃' },
    { name: 'Certificates',      kind: 'Folder', icon: '📁' },
  ],
  Projects: [
    { name: 'Lumo',       kind: 'Folder', icon: '📁' },
    { name: 'Cuse-Rank',  kind: 'Folder', icon: '📁' },
    { name: 'ORACC',      kind: 'Folder', icon: '📁' },
  ],
  Downloads: [
    { name: 'headshot.png', kind: 'Image', icon: '🖼️' },
  ],
}

export default function FinderApp() {
  const [location, setLocation] = useState('Documents')
  const [selected, setSelected] = useState(null)
  const [quickLook, setQuickLook] = useState(null)
  const files = FILES[location] || []

  const open = file => {
    if (file.preview) setQuickLook(file)
    else if (file.href) window.open(file.href, '_blank', 'noopener')
  }

  const onKeyDown = e => {
    if (e.key === ' ' && selected) {
      e.preventDefault()
      const file = files.find(f => f.name === selected)
      if (file?.preview) setQuickLook(file)
    } else if (e.key === 'Escape') {
      setQuickLook(null)
    }
  }

  return (
    <div className="finder" tabIndex={0} onKeyDown={onKeyDown}>
      <aside className="finder-sidebar">
        <p className="finder-sidebar-head">Favorites</p>
        {LOCATIONS.map(loc => (
          <button
            key={loc}
            type="button"
            className={`finder-loc${location === loc ? ' active' : ''}`}
            onClick={() => { setLocation(loc); setSelected(null) }}
          >
            <span className="finder-loc-icon">📁</span>
            {loc}
          </button>
        ))}
      </aside>

      <section className="finder-main">
        <p className="finder-path">{location}</p>
        <div className="finder-grid">
          {files.map(file => (
            <button
              key={file.name}
              type="button"
              className={`finder-file${selected === file.name ? ' selected' : ''}`}
              onClick={() => setSelected(file.name)}
              onDoubleClick={() => open(file)}
            >
              <span className="finder-file-icon">{file.icon}</span>
              <span className="finder-file-name">{file.name}</span>
              <span className="finder-file-kind">{file.kind}</span>
            </button>
          ))}
        </div>
        <p className="finder-tip">Select a file and press Space to Quick Look.</p>
      </section>

      {quickLook && (
        <div className="finder-quicklook" onClick={() => setQuickLook(null)}>
          <div className="finder-ql-panel" onClick={e => e.stopPropagation()}>
            <div className="finder-ql-bar">
              <span className="finder-ql-title">{quickLook.name}</span>
              <a className="finder-ql-open" href={quickLook.href} target="_blank" rel="noreferrer">
                Open ↗
              </a>
              <button type="button" className="finder-ql-close" onClick={() => setQuickLook(null)}>
                ✕
              </button>
            </div>
            <iframe className="finder-ql-frame" src={quickLook.href} title={quickLook.name} />
          </div>
        </div>
      )}
    </div>
  )
}
