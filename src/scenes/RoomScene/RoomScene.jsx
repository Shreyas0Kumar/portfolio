import React, { useRef, useEffect, useState } from 'react'
import Spline from '@splinetool/react-spline'
import { usePortfolio } from '../../data/portfolio.jsx'
import './RoomScene.css'

/**
 * RoomScene
 * Full-viewport live Spline 3D room. Clicking the "MAC" object kicks off the
 * scene's own camera zoom; App then runs the fade-to-black handoff to the
 * portfolio overlay. Returning to the room replays the Spline return-camera
 * via emitEvent (driven off the `visible` prop flipping back).
 *
 * Props:
 *   visible          {boolean}  — fades out when false (room stays mounted)
 *   introDone        {boolean}  — true once the first-load IntroScreen is gone;
 *                                 gates the idle hint so it can't fire behind it
 *   onEnterComputer  {function} — fired the instant the MAC object is clicked
 */

const SPLINE_SCENE = 'https://prod.spline.design/RL1dd8KHhJOf0Rlg/scene.splinecode'
const MAC_OBJECT   = 'MAC'
const RETURN_EVENT = '2368049b-f194-404b-b619-dd4b5056a128'

// First-visit nudge: if the visitor hasn't clicked the monitor within this many
// ms of the room becoming interactive, surface a hint pointing them at it.
const HINT_DELAY_MS = 5000

// Cap the WebGL render resolution as a defensive ceiling. Spline defaults to the
// full window.devicePixelRatio, so very high-DPI screens (2×/3× phones, Retina)
// draw 4–9 GPU pixels per CSS pixel — pure fill-rate cost on this live scene.
// Clamping to 1.5 is a no-op on standard 1×/1.5× displays (no visible change)
// while sparing the heaviest devices. Pixel work scales with DPR², so the cap
// only ever trims, never blurs, mainstream displays. Raise to 2 for maximum
// fidelity on high-DPI, lower toward 1 for more headroom on weak hardware.
const MAX_PIXEL_RATIO = 1.5

// Reaches into the runtime's internal renderer (no public API exists for this).
// Wrapped so a future @splinetool/runtime shape change degrades to a no-op
// instead of throwing. setPixelRatio re-applies the render size immediately.
function capPixelRatio(spline, max = MAX_PIXEL_RATIO) {
  try {
    const renderer = spline?._renderer
    if (!renderer || typeof renderer.setPixelRatio !== 'function') return
    const target = Math.min(window.devicePixelRatio || 1, max)
    renderer.setPixelRatio(target)
  } catch {
    /* internal shape changed — leave Spline's default ratio in place */
  }
}

export default function RoomScene({ visible, introDone, onEnterComputer }) {
  const { profile } = usePortfolio()
  const splineRef = useRef(null)
  const wasVisible = useRef(visible)
  const [loading, setLoading] = useState(true)
  const [showHint, setShowHint] = useState(false)
  // Once the visitor has clicked into the desktop, the hint has served its
  // purpose — never replay it on later returns to the room.
  const hintUsed = useRef(false)

  function handleLoad(spline) {
    splineRef.current = spline
    capPixelRatio(spline)
    setLoading(false)
  }

  // Spline fires this for any object; gate on the MAC monitor by name.
  // Fire at t=0 — the Spline camera zoom plays while App runs the fade timeline.
  function handleMouseDown(e) {
    if (e.target?.name === MAC_OBJECT) {
      hintUsed.current = true
      setShowHint(false)
      onEnterComputer()
    }
  }

  // Start the idle-hint countdown once the room is loaded, on screen, AND the
  // first-load intro has cleared (so the 5s reflects time the visitor can
  // actually see the room). Reset on any change so it doesn't fire while the
  // desktop overlay or intro covers it; skip entirely after the first click-in.
  useEffect(() => {
    if (loading || !visible || !introDone || hintUsed.current) {
      setShowHint(false)
      return
    }
    const id = setTimeout(() => setShowHint(true), HINT_DELAY_MS)
    return () => clearTimeout(id)
  }, [loading, visible, introDone])

  // Pause Spline's render loop while the desktop overlay covers the room, and
  // resume on the way back. `visible` flips false only once the fade is fully
  // black and ComputerScene is mounted (t=4s) — after the zoom has rendered —
  // so stopping there is safe. On return we MUST play() before emitting the
  // return camera, or the pan-out would be processed against a stopped loop and
  // never animate. Neither branch fires on first mount (wasVisible starts true).
  useEffect(() => {
    const spline = splineRef.current
    if (!spline) return
    if (visible && !wasVisible.current) {
      spline.play()
      spline.emitEvent('mouseUp', RETURN_EVENT)
    } else if (!visible && wasVisible.current) {
      spline.stop()
    }
    wasVisible.current = visible
  }, [visible])

  return (
    <div className={`room-scene${visible ? '' : ' hidden'}`}>
      {loading && (
        <div className="room-loading">
          <span className="room-loading-text">entering the room…</span>
        </div>
      )}

      <Spline
        className="room-spline"
        scene={SPLINE_SCENE}
        onLoad={handleLoad}
        onSplineMouseDown={handleMouseDown}
      />

      {/* Name + tagline — floats over the scene, bottom-left */}
      <div className="room-nameplate">
        <span className="room-name">{profile.name}</span>
        <span className="room-tagline">{profile.role} · {profile.location}</span>
      </div>

      {/* Idle nudge — appears bottom-center if the monitor goes unclicked */}
      {showHint && (
        <div className="room-hint" role="status">
          <span className="room-hint-dot" aria-hidden="true" />
          <span>Click the monitor to step inside</span>
        </div>
      )}
    </div>
  )
}
