import React, { useState, useRef, useEffect } from 'react'
import { usePortfolio } from '../../../../data/portfolio.jsx'
import { driveFolderUrl } from './drive.js'
import './TerminalApp.css'

/**
 * TerminalApp
 * A playful fake shell that prints real info about Shreyas, sourced from
 * public/portfolio.json. Type `help`.
 *
 * Props:
 *   api {object} — { openApp(id), openAbout() } for the `open` command
 */
const BANNER = `shreyas@portfolio ~ %  type "help" to get started`

const short = url => (url || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

function runCommand(raw, api, data) {
  const { profile, projects, hackathons } = data
  const [cmd, ...args] = raw.trim().split(/\s+/)
  switch (cmd) {
    case '': return ''
    case 'help':
      return [
        'Available commands:',
        '  whoami        who is this',
        '  ls            list sections',
        '  projects      list projects',
        '  open <app>    open an app (portfolio, glassdoor, finder, safari, notes, mail)',
        '  about         open About Me',
        '  resume        open resume',
        '  contact       how to reach me',
        '  date          current date/time',
        '  clear         clear the screen',
      ].join('\n')
    case 'whoami':
      return `${profile.name} — ${profile.role}. ${profile.tagline}`
    case 'ls':
      return 'projects   hackathons   experience   glassdoor   resume   contact'
    case 'projects':
      return [...projects, ...hackathons]
        .map(p => `  ${p.name.padEnd(16)} ${(p.homepage?.tagline || '').slice(0, 48)}`)
        .join('\n')
    case 'open': {
      const target = (args[0] || '').toLowerCase()
      const known = ['portfolio', 'glassdoor', 'finder', 'safari', 'notes', 'mail']
      if (known.includes(target)) { api?.openApp?.(target); return `Opening ${target}…` }
      return `open: unknown app "${args[0] || ''}". try: ${known.join(', ')}`
    }
    case 'about':
      api?.openAbout?.()
      return 'Opening About Me…'
    case 'resume':
      window.open(driveFolderUrl(), '_blank', 'noopener')
      return 'Opening résumé in Google Drive…'
    case 'contact':
      return `Email: ${profile.email}   GitHub: ${short(profile.links.github)}   (or open the Mail app)`
    case 'date':
      return new Date().toString()
    case 'echo':
      return args.join(' ')
    case 'clear':
      return '__CLEAR__'
    default:
      return `zsh: command not found: ${cmd}. type "help".`
  }
}

export default function TerminalApp({ api }) {
  const data = usePortfolio()
  const [lines, setLines] = useState([BANNER])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView() }, [lines])

  const submit = e => {
    e.preventDefault()
    const out = runCommand(input, api, data)
    if (out === '__CLEAR__') {
      setLines([])
    } else {
      setLines(ls => [...ls, `➜  ${input}`, ...(out ? [out] : [])])
    }
    if (input.trim()) setHistory(h => [input, ...h])
    setHistIdx(-1)
    setInput('')
  }

  const onKeyDown = e => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHistIdx(i => {
        const ni = Math.min(i + 1, history.length - 1)
        if (history[ni] !== undefined) setInput(history[ni])
        return ni
      })
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHistIdx(i => {
        const ni = Math.max(i - 1, -1)
        setInput(ni === -1 ? '' : history[ni])
        return ni
      })
    }
  }

  return (
    <div className="terminal" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-out">
        {lines.map((line, i) => (
          <pre key={i} className="terminal-line">{line}</pre>
        ))}
        <form className="terminal-form" onSubmit={submit}>
          <span className="terminal-prompt">➜</span>
          <input
            ref={inputRef}
            className="terminal-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            spellCheck={false}
          />
        </form>
        <div ref={endRef} />
      </div>
    </div>
  )
}
