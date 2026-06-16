import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import IntroScreen from './scenes/IntroScreen/IntroScreen.jsx'
import { primeAudio, warmupAudio } from './scenes/ComputerScene/Desktop/sound.js'

// Code-split the scenes so each device only downloads its own path: the heavy
// Spline 3D runtime (RoomScene) and the desktop never ship to mobile, and the
// app shell paints before those chunks finish streaming in.
const RoomScene       = lazy(() => import('./scenes/RoomScene/RoomScene.jsx'))
const ComputerScene   = lazy(() => import('./scenes/ComputerScene/ComputerScene.jsx'))
const MobilePortfolio = lazy(() => import('./scenes/MobilePortfolio/MobilePortfolio.jsx'))

// Small / touch screens get a clean scrollable portfolio instead of the
// draggable desktop (which assumes a mouse and room to breathe).
function useIsMobile() {
  const query = '(max-width: 768px), (pointer: coarse)'
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = e => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return isMobile
}

// Scene states
// 'room'     — user sees the live Spline 3D room (its own camera zoom plays the
//              transition into the monitor)
// 'loading'  — XP boot screen is running
// 'desktop'  — retro browser window is open

// Entry-transition timing — tweak these two freely.
const FADE_DELAY    = 2000  // ms after the MAC click before the fade-to-black begins
const FADE_DURATION = 2000  // ms for the black fade — in (cover) and out (reveal)

export default function App() {
  const [scene, setScene]         = useState('room')
  const [fadeBlack, setFadeBlack] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const isMobile = useIsMobile()

  const timers = useRef([])
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  // MAC clicked (t=0): the Spline camera zoom is running underneath. Hold, then
  // fade to black, and only mount the boot loader once the screen is fully black —
  // so the scene swap is hidden behind the fade instead of cutting to boot.
  const handleEnterComputer = useCallback(() => {
    // This click is a user gesture — warm up audio now (cost hidden by the fade)
    // so the first in-desktop sound doesn't stall a later interaction.
    warmupAudio()
    clearTimers()
    timers.current.push(
      // t=FADE_DELAY: begin fading to black (full at FADE_DELAY+FADE_DURATION).
      setTimeout(() => setFadeBlack(true), FADE_DELAY),
      // Black is full: mount ComputerScene underneath, then fade the black out.
      setTimeout(() => {
        setScene('loading')
        setFadeBlack(false)
      }, FADE_DELAY + FADE_DURATION),
    )
  }, [])

  const handleLoadDone = useCallback(() => {
    setScene('desktop')
  }, [])

  const handleExitComputer = useCallback(() => {
    clearTimers()
    setFadeBlack(false)
    setScene('room')
  }, [])

  // Drop any pending entry timers if App ever unmounts.
  useEffect(() => clearTimers, [])

  // Build the AudioContext during idle (while the intro shows) so its ~200ms
  // construction never lands on a click; the MAC click then only resumes it.
  useEffect(() => {
    const w = window
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => primeAudio(), { timeout: 3000 })
      return () => w.cancelIdleCallback?.(id)
    }
    const id = setTimeout(() => primeAudio(), 1500)
    return () => clearTimeout(id)
  }, [])

  if (isMobile) {
    return (
      <Suspense fallback={null}>
        <MobilePortfolio />
      </Suspense>
    )
  }

  return (
    <>
      {/* Only the heavy, code-split scenes suspend; the intro + fade below stay
          mounted on top so the screen is never blank while a chunk streams in. */}
      <Suspense fallback={null}>
        {/* Room is always mounted so the scene doesn't re-render on exit */}
        <RoomScene
          visible={scene === 'room'}
          onEnterComputer={handleEnterComputer}
        />

        {(scene === 'loading' || scene === 'desktop') && (
          <ComputerScene
            phase={scene}
            onLoadDone={handleLoadDone}
            onExit={handleExitComputer}
          />
        )}
      </Suspense>

      {/* Fade-to-black bridging the Spline zoom and the XP boot. Always mounted
          so the opacity transition actually plays; inert (transparent, no hit
          testing) when at rest. */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 20,                 // above ComputerScene (z-index 10)
          background: '#000',
          opacity: fadeBlack ? 1 : 0,
          pointerEvents: 'none',
          transition: `opacity ${FADE_DURATION}ms ease`,
        }}
      />

      {/* First-load nudge to go full screen; fades out and reveals the room. */}
      {showIntro && <IntroScreen onDone={() => setShowIntro(false)} />}
    </>
  )
}
