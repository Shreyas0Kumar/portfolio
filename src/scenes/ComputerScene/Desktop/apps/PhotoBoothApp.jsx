import React, { useState, useEffect, useRef, useCallback } from 'react'
import './PhotoBoothApp.css'

/**
 * PhotoBoothApp
 * macOS Photo Booth: live mirrored camera preview, an effects rail (CSS
 * filters), a red shutter with the 3-2-1 countdown + white flash, and a photo
 * strip along the bottom where each shot can be downloaded or removed.
 *
 * The camera starts when the window opens and every track is stopped when it
 * closes. Nothing is uploaded anywhere — shots live only in this window.
 */

const EFFECTS = [
  { id: 'normal',  name: 'Normal',      css: 'none' },
  { id: 'sepia',   name: 'Sepia',       css: 'sepia(0.85)' },
  { id: 'noir',    name: 'Noir',        css: 'grayscale(1) contrast(1.25)' },
  { id: 'vivid',   name: 'Comic Pop',   css: 'saturate(2.4) contrast(1.1)' },
  { id: 'thermal', name: 'Thermal',     css: 'hue-rotate(120deg) saturate(2.6) contrast(1.2)' },
  { id: 'xray',    name: 'X-Ray',       css: 'invert(1) grayscale(1)' },
  { id: 'dream',   name: 'Dream',       css: 'blur(1.5px) brightness(1.15) saturate(1.3)' },
  { id: 'vintage', name: 'Vintage',     css: 'sepia(0.4) contrast(0.9) brightness(1.05) saturate(0.8)' },
]

const MAX_SHOTS = 24 // strip cap — full-res data URLs get heavy fast

export default function PhotoBoothApp({ minimized = false }) {
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const closedRef = useRef(false) // set on unmount so an in-flight getUserMedia stops its tracks
  const [status, setStatus]     = useState('starting') // starting | live | denied | unavailable
  const [effect, setEffect]     = useState(EFFECTS[0])
  const [countdown, setCountdown] = useState(0)        // 3‥1 while armed, 0 idle
  const [flash, setFlash]       = useState(false)
  const [photos, setPhotos]     = useState([])         // [{ id, url, effect }]
  const shotSeq = useRef(1)

  // The countdown's interval closes over an old render — read the effect from
  // a ref at capture time so switching effects mid-countdown shoots what the
  // preview shows at the flash.
  const effectRef = useRef(effect)
  effectRef.current = effect

  const startCamera = useCallback(async () => {
    setStatus('starting')
    try {
      if (!navigator.mediaDevices?.getUserMedia) { setStatus('unavailable'); return }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      })
      // The window may have closed while the permission prompt was up
      // (StrictMode also double-mounts in dev) — don't leave the camera on.
      if (closedRef.current) { stream.getTracks().forEach(t => t.stop()); return }
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setStatus('live')
    } catch (err) {
      setStatus(err?.name === 'NotFoundError' ? 'unavailable' : 'denied')
    }
  }, [])

  // Camera lifecycle: on while the window is visible, fully released when it
  // closes or minimizes — no webcam light with nothing on screen.
  useEffect(() => {
    closedRef.current = false
    if (!minimized) startCamera()
    return () => {
      closedRef.current = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [startCamera, minimized])

  // Freeze the current frame. The draw is mirrored so the photo matches the
  // preview; ctx.filter bakes the effect in where supported (everywhere
  // modern — worst case the shot saves unfiltered). JPEG keeps each shot a
  // few hundred KB instead of multi-MB PNG.
  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const fx = effectRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (fx.css !== 'none' && 'filter' in ctx) ctx.filter = fx.css
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    setPhotos(ps => [
      { id: shotSeq.current++, url: canvas.toDataURL('image/jpeg', 0.92), effect: fx.name },
      ...ps,
    ].slice(0, MAX_SHOTS))
  }

  const tickRef = useRef(null)
  useEffect(() => () => clearInterval(tickRef.current), [])

  const shoot = () => {
    if (status !== 'live' || countdown) return
    let n = 3
    setCountdown(n)
    tickRef.current = setInterval(() => {
      n -= 1
      if (n > 0) { setCountdown(n); return }
      clearInterval(tickRef.current)
      setCountdown(0)
      setFlash(true)
      capture()
      setTimeout(() => setFlash(false), 420)
    }, 800)
  }

  const removePhoto = id => setPhotos(ps => ps.filter(p => p.id !== id))

  return (
    <div className="booth">
      <div className="booth-stage">
        <video
          ref={videoRef}
          className="booth-video"
          style={{ filter: effect.css === 'none' ? undefined : effect.css }}
          playsInline
          muted
        />

        {status !== 'live' && (
          <div className="booth-empty">
            {status === 'starting' && <p>Warming up the camera…</p>}
            {status === 'denied' && (
              <>
                <p className="booth-empty-title">Camera access is off</p>
                <p>Photos never leave this window. Allow the camera in your browser and try again.</p>
                <button type="button" className="booth-retry" onClick={startCamera}>Try again</button>
              </>
            )}
            {status === 'unavailable' && (
              <>
                <p className="booth-empty-title">No camera found</p>
                <p>Plug one in (or try another device) and hit retry.</p>
                <button type="button" className="booth-retry" onClick={startCamera}>Try again</button>
              </>
            )}
          </div>
        )}

        {countdown > 0 && <div key={countdown} className="booth-count">{countdown}</div>}
        <div className={`booth-flash${flash ? ' on' : ''}`} />
      </div>

      <div className="booth-controls">
        <div className="booth-effects">
          {EFFECTS.map(fx => (
            <button
              key={fx.id}
              type="button"
              className={`booth-fx${fx.id === effect.id ? ' active' : ''}`}
              onClick={() => setEffect(fx)}
            >
              {fx.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="booth-shutter"
          onClick={shoot}
          disabled={status !== 'live' || countdown > 0}
          aria-label="Take photo"
          title="Take photo"
        >
          {/* White camera silhouette, like the real capture button */}
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path
              fill="#ffffff"
              d="M9.4 5.2c.3-.7 1-1.2 1.8-1.2h1.6c.8 0 1.5.5 1.8 1.2l.5 1.1h2.4A2.5 2.5 0 0 1 20 8.8v8.2a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17V8.8a2.5 2.5 0 0 1 2.5-2.5h2.4l.5-1.1z"
            />
            <circle cx="12" cy="12.7" r="3.4" fill="#d92a1f" />
            <circle cx="12" cy="12.7" r="2.1" fill="#ffffff" opacity="0.9" />
          </svg>
        </button>
      </div>

      {photos.length > 0 && (
        <div className="booth-strip">
          {photos.map(p => (
            <figure key={p.id} className="booth-shot">
              <img src={p.url} alt={`Photo (${p.effect})`} />
              <figcaption className="booth-shot-tools">
                <a href={p.url} download={`photo-booth-${p.id}.jpg`} title="Save photo">⬇</a>
                <button type="button" onClick={() => removePhoto(p.id)} title="Delete photo">✕</button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  )
}
