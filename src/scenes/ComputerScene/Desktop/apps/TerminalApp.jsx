import React, { useState, useRef, useEffect } from 'react'
import { projects } from '../../../../data/projects.js'
import './TerminalApp.css'

/**
 * TerminalApp
 * A playful fake shell that prints real info about Shreyas. Type `help`.
 *
 * Props:
 *   api {object} — { openApp(id), openAbout() } for the `open` command
 */
const BANNER = `shreyas@portfolio ~ %  type "help" to get started`

function runCommand(raw, api) {
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
      return 'Shreyas Kumar — AI Engineer. I build AI systems end-to-end, from data + retrieval pipelines to the interfaces people use.'
    case 'ls':
      return 'projects   work   glassdoor   resume.pdf   contact'
    case 'projects':
      return projects.map(p => `  ${p.title.padEnd(16)} ${p.hook.slice(0, 48)}…`).join('\n')
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
      window.open('/resume.pdf', '_blank', 'noopener')
      return 'Opening resume.pdf…'
    case 'contact':
      return 'Email: you@example.com   GitHub: github.com/Shreyas0Kumar   (or open the Mail app)'
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
  const [lines, setLines] = useState([BANNER])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView() }, [lines])

  const submit = e => {
    e.preventDefault()
    const out = runCommand(input, api)
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
