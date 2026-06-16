import React, { useState, useEffect } from 'react'
import './NotesApp.css'

/**
 * NotesApp
 * A working Notes app: create, edit (title + body), and delete notes. Content
 * persists in localStorage so it survives reloads.
 */
const STORAGE_KEY = 'shreyas-notes-v1'

const SEED = [
  {
    id: 'welcome',
    title: 'Welcome 👋',
    date: 'Today',
    body: `Hey — thanks for clicking around.

This whole desktop is a little playground. Open the Portfolio app to see what I've built, check Finder for my resume, or hit Safari for links.

Made with too much coffee.`,
  },
  {
    id: 'what',
    title: 'What I do',
    date: 'Pinned',
    body: `I build AI systems end-to-end — data + retrieval pipelines, backends, and the interfaces people actually use.

I like problems where the modeling is only half the work and the other half is making it real.`,
  },
  {
    id: 'now',
    title: 'Currently',
    date: 'This week',
    body: `• Shipping product work
• Reading about retrieval + evals
• Open to interesting roles and collaborations`,
  },
]

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return SEED
}

let NOTE_SEQ = 0
const uid = () => `n${Date.now()}-${NOTE_SEQ++}`

const todayLabel = () =>
  new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })

export default function NotesApp() {
  const [notes, setNotes]           = useState(loadNotes)
  const [selectedId, setSelectedId] = useState(() => loadNotes()[0]?.id ?? null)

  // Persist on every change.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)) } catch { /* ignore */ }
  }, [notes])

  const selected = notes.find(n => n.id === selectedId) || notes[0] || null

  // Keep a valid selection if the selected note was deleted.
  useEffect(() => {
    if (!selected && notes.length) setSelectedId(notes[0].id)
  }, [notes, selected])

  const newNote = () => {
    const note = { id: uid(), title: '', body: '', date: todayLabel() }
    setNotes(ns => [note, ...ns])
    setSelectedId(note.id)
  }

  const update = (field, value) =>
    setNotes(ns => ns.map(n => (n.id === selected.id ? { ...n, [field]: value } : n)))

  const remove = (id, e) => {
    e.stopPropagation()
    setNotes(ns => ns.filter(n => n.id !== id))
  }

  return (
    <div className="notes">
      <aside className="notes-list">
        <div className="notes-list-head">
          <span>Notes</span>
          <button type="button" className="notes-new" onClick={newNote} aria-label="New note">
            ＋
          </button>
        </div>

        {notes.length === 0 && <p className="notes-empty">No notes yet</p>}

        {notes.map(n => (
          <div
            key={n.id}
            className={`notes-item${selected && selected.id === n.id ? ' active' : ''}`}
            onClick={() => setSelectedId(n.id)}
          >
            <span className="notes-item-title">{n.title || 'New Note'}</span>
            <span className="notes-item-meta">
              <span className="notes-item-date">{n.date}</span>
              <button
                type="button"
                className="notes-item-del"
                onClick={e => remove(n.id, e)}
                aria-label="Delete note"
              >
                🗑
              </button>
            </span>
          </div>
        ))}
      </aside>

      <section className="notes-content">
        {selected ? (
          <>
            <input
              className="notes-title-input"
              value={selected.title}
              onChange={e => update('title', e.target.value)}
              placeholder="Title"
            />
            <textarea
              className="notes-body-input"
              value={selected.body}
              onChange={e => update('body', e.target.value)}
              placeholder="Start writing…"
            />
          </>
        ) : (
          <div className="notes-placeholder">Select or create a note</div>
        )}
      </section>
    </div>
  )
}
