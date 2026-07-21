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

      {/* Name + tagline (left column) and social logos (right column) —
          floats over the scene, bottom-left */}
      <div className="room-nameplate">
        <div className="room-text">
          <span className="room-name">{profile.name}</span>
          <span className="room-tagline">{profile.role} · {profile.location}</span>
        </div>
        {(profile.links?.linkedin || profile.links?.github) && (
          <div className="room-social">
            {profile.links?.linkedin && (
              <a
                className="room-social-btn"
                href={profile.links.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="Shreyas on LinkedIn"
                title="LinkedIn"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.73v20.54C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .78 23.2 0 22.22 0z" />
                </svg>
              </a>
            )}
            {profile.links?.github && (
              <a
                className="room-social-btn"
                href={profile.links.github}
                target="_blank"
                rel="noreferrer"
                aria-label="Shreyas on GitHub"
                title="GitHub"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.93.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
                </svg>
              </a>
            )}
          </div>
        )}
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
