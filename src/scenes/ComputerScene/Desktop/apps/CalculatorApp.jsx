import React, { useState, useRef, useEffect } from 'react'
import './CalculatorApp.css'

/**
 * CalculatorApp
 * The macOS Basic calculator: dark panel, orange operators, AC/±/% row.
 * Immediate-execution model with mac niceties — the pending operator stays
 * highlighted, "=" repeats the last operation, and the keyboard works
 * (digits, . + - * / % Enter Escape Backspace) while the window is focused.
 */

const fmt = n => {
  if (!Number.isFinite(n)) return 'Not a number'
  // Up to 9 significant digits, like the real one; exponent for the extremes.
  if (Math.abs(n) >= 1e9 || (n !== 0 && Math.abs(n) < 1e-8)) {
    return n.toExponential(4).replace('e+', 'e')
  }
  return String(Number(n.toPrecision(10)))
}

const apply = (a, op, b) => {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return a / b
    default:  return b
  }
}

export default function CalculatorApp() {
  const [entry, setEntry]   = useState('0')  // what the display shows
  const [acc, setAcc]       = useState(null) // left operand waiting for = / next op
  const [op, setOp]         = useState(null) // pending operator
  const [fresh, setFresh]   = useState(true) // next digit starts a new entry
  const [dirty, setDirty]   = useState(false) // entry holds a new operand since the last op/=
  const [last, setLast]     = useState(null) // { op, operand } for repeat-equals
  const rootRef = useRef(null)

  useEffect(() => { rootRef.current?.focus() }, [])

  const inputDigit = d => {
    setEntry(e => {
      if (fresh) return d === '.' ? '0.' : d
      if (d === '.' && e.includes('.')) return e
      if (e.replace(/[-.]/g, '').length >= 9 ) return e
      return e === '0' && d !== '.' ? d : e + d
    })
    setFresh(false)
    setDirty(true)
  }

  const chooseOp = nextOp => {
    const b = parseFloat(entry)
    if (op && dirty) {
      const r = apply(acc, op, b)
      setEntry(fmt(r))
      setAcc(r)
    } else {
      setAcc(b)
    }
    setOp(nextOp)
    setFresh(true)
    setDirty(false)
    setLast(null)
  }

  const equals = () => {
    // The display always holds the operand to use: the typed number, a percent
    // result, or (for "5 + =") the still-shown left operand.
    const b = parseFloat(entry)
    if (op) {
      const r = apply(acc, op, b)
      setEntry(fmt(r))
      setAcc(r)
      setLast({ op, operand: b })
      setOp(null)
    } else if (last) {
      // Repeat the previous operation on the current value, like real macOS.
      const r = apply(b, last.op, last.operand)
      setEntry(fmt(r))
      setAcc(r)
    }
    setFresh(true)
    setDirty(false)
  }

  const clearAll = () => { setEntry('0'); setAcc(null); setOp(null); setFresh(true); setDirty(false); setLast(null) }
  const negate   = () => { setEntry(e => (e.startsWith('-') ? e.slice(1) : e === '0' ? e : '-' + e)); setDirty(true) }

  // Like the real one: with + or − pending, % means "that percent of the left
  // operand" (200 + 10% → 220); otherwise it's a plain /100.
  const percent = () => {
    const v = parseFloat(entry)
    const r = op && acc !== null && (op === '+' || op === '-') ? (acc * v) / 100 : v / 100
    setEntry(fmt(r))
    setFresh(true)
    setDirty(true)
  }

  const backspace = () => {
    if (fresh) return
    setEntry(e => (e.length > 1 && e !== '-0' ? e.slice(0, -1) : '0'))
  }

  const onKeyDown = e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return // leave copy/paste & app shortcuts alone
    const k = e.key
    if (/^[0-9]$/.test(k) || k === '.') { e.preventDefault(); inputDigit(k) }
    else if (['+', '-', '*', '/'].includes(k)) { e.preventDefault(); chooseOp(k) }
    else if (k === 'Enter' || k === '=') { e.preventDefault(); equals() }
    else if (k === '%') { e.preventDefault(); percent() }
    else if (k === 'Backspace') { e.preventDefault(); backspace() }
    else if (k === 'Escape' || k.toLowerCase() === 'c') {
      // Escape would otherwise close the window (Desktop hotkey) mid-calculation.
      e.preventDefault(); e.stopPropagation(); clearAll()
    }
  }

  // Shrink the readout as the number grows so it never clips.
  const displayText = /[a-z]/i.test(entry) ? entry : (() => {
    const [int, dec] = entry.split('.')
    const neg = int.startsWith('-')
    const grouped = Math.abs(parseInt(int || '0', 10)).toLocaleString('en-US')
    return `${neg ? '-' : ''}${grouped}${dec !== undefined ? '.' + dec : ''}`
  })()
  const sizeClass = displayText.length > 12 ? ' tiny' : displayText.length > 8 ? ' small' : ''

  const KEYS = [
    { label: entry === '0' && acc === null && !op ? 'AC' : 'C', cls: 'fn', act: clearAll },
    { label: '⁺∕₋', cls: 'fn', act: negate },
    { label: '%',   cls: 'fn', act: percent },
    { label: '÷',   cls: 'op', act: () => chooseOp('/'), sym: '/' },
    { label: '7', act: () => inputDigit('7') }, { label: '8', act: () => inputDigit('8') },
    { label: '9', act: () => inputDigit('9') },
    { label: '×', cls: 'op', act: () => chooseOp('*'), sym: '*' },
    { label: '4', act: () => inputDigit('4') }, { label: '5', act: () => inputDigit('5') },
    { label: '6', act: () => inputDigit('6') },
    { label: '−', cls: 'op', act: () => chooseOp('-'), sym: '-' },
    { label: '1', act: () => inputDigit('1') }, { label: '2', act: () => inputDigit('2') },
    { label: '3', act: () => inputDigit('3') },
    { label: '+', cls: 'op', act: () => chooseOp('+'), sym: '+' },
    { label: '0', cls: 'zero', act: () => inputDigit('0') },
    { label: '.', act: () => inputDigit('.') },
    { label: '=', cls: 'op', act: equals },
  ]

  return (
    <div className="calc" ref={rootRef} tabIndex={0} onKeyDown={onKeyDown}>
      <div className={`calc-display${sizeClass}`}>{displayText}</div>
      <div className="calc-keys">
        {KEYS.map(k => (
          <button
            key={k.label}
            type="button"
            className={`calc-key ${k.cls || ''}${k.sym && op === k.sym && fresh ? ' active' : ''}`}
            onClick={k.act}
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  )
}
