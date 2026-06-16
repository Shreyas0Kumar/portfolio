import React, { useRef } from 'react'
import './AppWindow.css'

/**
 * AppWindow
 * Reusable, draggable macOS-style window with working traffic lights:
 *   red    → close          (onClose)
 *   yellow → minimize        (onMinimize — hides to the dock)
 *   green  → maximize/restore (onToggleMaximize)
 * Drag by the title bar (disabled while maximized); double-click the title bar
 * to toggle maximize; click anywhere to bring to front.
 *
 * Props:
 *   title    {string}   — centered window title
 *   x, y     {number}   — top-left position (px)
 *   w, h     {number}   — size (px)
 *   z        {number}   — stacking order
 *   focused  {boolean}  — is this the frontmost window
 *   minimized{boolean}  — hidden to the dock (kept mounted to preserve state)
 *   maximized{boolean}  — filling the workspace
 *   onClose / onFocus / onMinimize / onToggleMaximize / onMove — handlers
 *   children {node}     — app content
 */
export default function AppWindow({
  title, x, y, w, h, z, focused, minimized, maximized,
  onClose, onFocus, onMinimize, onToggleMaximize, onMove, children,
}) {
  const drag = useRef(null)

  const startDrag = e => {
    if (e.target.closest('.app-lights')) return // don't drag from the buttons
    onFocus()
    if (maximized) return                        // maximized windows are pinned
    drag.current = { sx: e.clientX, sy: e.clientY, ox: x, oy: y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onDrag = e => {
    if (!drag.current) return
    const { sx, sy, ox, oy } = drag.current
    let nx = ox + (e.clientX - sx)
    let ny = oy + (e.clientY - sy)
    nx = Math.max(8, Math.min(nx, window.innerWidth - 120))
    ny = Math.max(34, Math.min(ny, window.innerHeight - 80))
    onMove(nx, ny)
  }

  const endDrag = e => {
    drag.current = null
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  return (
    <div
      className={`app-window${focused ? ' focused' : ''}${maximized ? ' maximized' : ''}${minimized ? ' minimized' : ''}`}
      style={{ left: x, top: y, width: w, height: h, zIndex: z }}
      onMouseDown={onFocus}
    >
      <div
        className="app-titlebar"
        onPointerDown={startDrag}
        onPointerMove={onDrag}
        onPointerUp={endDrag}
        onDoubleClick={onToggleMaximize}
      >
        <div className="app-lights">
          <button
            type="button"
            className="app-light close"
            aria-label="Close"
            onClick={onClose}
          />
          <button
            type="button"
            className="app-light minimize"
            aria-label="Minimize"
            onClick={onMinimize}
          />
          <button
            type="button"
            className="app-light maximize"
            aria-label="Maximize"
            onClick={onToggleMaximize}
          />
        </div>
        <div className="app-title">{title}</div>
      </div>

      <div className="app-body">{children}</div>
    </div>
  )
}
