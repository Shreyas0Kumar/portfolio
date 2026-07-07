import React, { useState, useEffect } from 'react'
import './FinderApp.css'
import {
  driveConfigured, driveEmbedUrl, driveFolderUrl,
  drivePreviewUrl, driveFileViewUrl, listDriveFiles,
} from './drive.js'

/**
 * FinderApp
 * A lightweight Finder: a sidebar of locations and a file grid. "Documents" is
 * backed by a public Google Drive folder — its live contents (resume, cover
 * letter, certificates) load in an embedded view, so uploading to Drive updates
 * it with no code change. Other locations show flavor content; click a file and
 * press Space (or double-click) to Quick Look.
 */
const DRIVE_LOCATION = 'Documents'
const LOCATIONS = [DRIVE_LOCATION, 'Projects', 'Downloads']

const FILES = {
  Projects: [
    { name: 'Lumo',       kind: 'Folder', icon: '📁' },
    { name: 'Cuse-Rank',  kind: 'Folder', icon: '📁' },
    { name: 'ORACC',      kind: 'Folder', icon: '📁' },
  ],
  Downloads: [
    { name: 'headshot.png', kind: 'Image', icon: '🖼️' },
  ],
}

export default function FinderApp({ api }) {
  const [location, setLocation] = useState(DRIVE_LOCATION)
  const [selected, setSelected] = useState(null)
  const [quickLook, setQuickLook] = useState(null)
  const files = FILES[location] || []
  const onDrive = location === DRIVE_LOCATION

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
            <span className="finder-loc-icon">{loc === DRIVE_LOCATION ? '☁️' : '📁'}</span>
            {loc}
          </button>
        ))}
      </aside>

      <section className="finder-main">
        <p className="finder-path">{location}</p>

        {onDrive ? (
          <DriveView api={api} />
        ) : (
          <>
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
          </>
        )}
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

const fileIcon = m =>
  m === 'application/pdf' ? '📄'
  : (m?.includes('word') || m?.includes('document')) ? '📝'
  : m?.startsWith('image/') ? '🖼️'
  : '📄'

const fileKind = m =>
  m === 'application/pdf' ? 'PDF'
  : (m?.includes('word') || m?.includes('document')) ? 'Doc'
  : m?.startsWith('image/') ? 'Image'
  : 'File'

// Drop a trailing extension for a cleaner label (keep the full name in title).
const cleanName = name => name.replace(/\.[^.]+$/, '').trim()

/**
 * DriveView
 * Lists the public Drive folder via our /api/drive Pages Function and renders an
 * in-app grid — clicking a file previews it inside the desktop (no new tab). If
 * the function is unavailable (e.g. local `vite dev`, or env vars not set yet),
 * it degrades to the keyless folder embed; with no folder configured at all, a
 * setup note.
 */
function DriveView({ api }) {
  const [files, setFiles] = useState(null) // null = loading
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!driveConfigured) return
    let alive = true
    listDriveFiles()
      .then(f => { if (alive) setFiles(f) })
      .catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [])

  // No folder configured yet.
  if (!driveConfigured) {
    return (
      <div className="finder-drive-empty">
        <span className="finder-drive-empty-icon">☁️</span>
        <p className="finder-drive-empty-title">Documents are coming from Google Drive</p>
        <p className="finder-drive-empty-sub">
          Add your public folder link in <code>drive.js</code> and your resume,
          cover letter, and certificates will show up here automatically.
        </p>
        <a className="finder-drive-empty-link" href={driveFolderUrl()} target="_blank" rel="noreferrer">
          Open in Google Drive ↗
        </a>
      </div>
    )
  }

  // Live list unavailable → keyless embed (files open in a new tab on click).
  if (failed) {
    return (
      <div className="finder-drive">
        <iframe
          className="finder-drive-frame"
          src={driveEmbedUrl('grid')}
          title="Documents · Google Drive"
          loading="lazy"
        />
        <a className="finder-drive-open" href={driveFolderUrl()} target="_blank" rel="noreferrer">
          Open in Google Drive ↗
        </a>
      </div>
    )
  }

  if (files === null) {
    return <p className="finder-drive-loading">Loading documents…</p>
  }

  return (
    <>
      <div className="finder-grid">
        {files.map(f => (
          <button
            key={f.id}
            type="button"
            className="finder-file"
            title={f.name}
            onClick={() => api?.quickLook({
              name: cleanName(f.name),
              src: drivePreviewUrl(f.id),
              openHref: driveFileViewUrl(f.id),
            })}
          >
            <span className="finder-file-icon">{fileIcon(f.mimeType)}</span>
            <span className="finder-file-name">{cleanName(f.name)}</span>
            <span className="finder-file-kind">{fileKind(f.mimeType)}</span>
          </button>
        ))}
      </div>
      <p className="finder-tip">Click a document to preview it right here.</p>
    </>
  )
}
