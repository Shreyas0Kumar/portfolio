import React, { useRef, useEffect, useState } from 'react'
import Spline from '@splinetool/react-spline'
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
 *   onEnterComputer  {function} — fired the instant the MAC object is clicked
 */

const SPLINE_SCENE = 'https://prod.spline.design/RL1dd8KHhJOf0Rlg/scene.splinecode'
const MAC_OBJECT   = 'MAC'
const RETURN_EVENT = '2368049b-f194-404b-b619-dd4b5056a128'

export default function RoomScene({ visible, onEnterComputer }) {
  const splineRef = useRef(null)
  const wasVisible = useRef(visible)
  const [loading, setLoading] = useState(true)

  function handleLoad(spline) {
    splineRef.current = spline
    setLoading(false)
  }

  // Spline fires this for any object; gate on the MAC monitor by name.
  // Fire at t=0 — the Spline camera zoom plays while App runs the fade timeline.
  function handleMouseDown(e) {
    if (e.target?.name === MAC_OBJECT) onEnterComputer()
  }

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
        <span className="room-name">Shreyas Kumar</span>
        <span className="room-tagline">AI Engineer · builder of real systems</span>
      </div>
    </div>
  )
}
