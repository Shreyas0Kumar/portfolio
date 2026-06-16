import React, { useEffect, useMemo, useRef, useState } from 'react'
import './MusicApp.css'

/**
 * MusicApp
 * A little music player. Tracks are whatever audio files live in
 * src/assets/music/ — Vite bundles them at build time via import.meta.glob,
 * so dropping a file in that folder (and restarting/ rebuilding) makes it
 * appear here. See src/assets/music/README.md.
 */

// Eagerly resolve every audio file in the music folder to a URL.
const audioModules = import.meta.glob(
  '/src/assets/music/*.{mp3,m4a,ogg,wav,flac,MP3,M4A,OGG,WAV,FLAC}',
  { eager: true, query: '?url', import: 'default' }
)

function parseName(path) {
  const file = decodeURIComponent(path.split('/').pop()).replace(/\.[^.]+$/, '')
  if (file.includes(' - ')) {
    const [artist, ...rest] = file.split(' - ')
    return { artist: artist.trim(), title: rest.join(' - ').trim() }
  }
  return { artist: 'Unknown artist', title: file }
}

// Deterministic gradient "album art" from the track title.
function artFor(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  const a = h % 360
  const b = (a + 55) % 360
  return `linear-gradient(150deg, hsl(${a} 68% 56%), hsl(${b} 60% 38%))`
}

const TRACKS = Object.entries(audioModules)
  .map(([path, url]) => ({ url, ...parseName(path) }))
  .sort((x, y) => x.title.localeCompare(y.title))

const fmt = s => {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${m}:${String(r).padStart(2, '0')}`
}

export default function MusicApp() {
  const audioRef = useRef(null)
  const [idx, setIdx]         = useState(0)
  const [playing, setPlaying] = useState(false)
  const [cur, setCur]         = useState(0)
  const [dur, setDur]         = useState(0)
  const [vol, setVol]         = useState(0.8)
  const [repeat, setRepeat]   = useState(false)
  const [shuffle, setShuffle] = useState(false)

  const track = TRACKS[idx]

  // Load + (maybe) play whenever the track changes.
  useEffect(() => {
    const a = audioRef.current
    if (!a || !track) return
    a.src = track.url
    a.load()
    if (playing) a.play().catch(() => setPlaying(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  useEffect(() => {
    const a = audioRef.current
    if (a) a.volume = vol
  }, [vol])

  const pick = next => {
    if (TRACKS.length === 0) return
    if (shuffle && TRACKS.length > 1) {
      let n = idx
      while (n === idx) n = Math.floor(Math.random() * TRACKS.length)
      return n
    }
    return (idx + next + TRACKS.length) % TRACKS.length
  }

  const toggle = () => {
    const a = audioRef.current
    if (!a || !track) return
    if (a.paused) { a.play().then(() => setPlaying(true)).catch(() => {}) }
    else { a.pause(); setPlaying(false) }
  }

  const next = () => setIdx(pick(1))
  const prev = () => {
    const a = audioRef.current
    if (a && a.currentTime > 3) { a.currentTime = 0; return }
    setIdx(pick(-1))
  }

  const onEnded = () => {
    if (repeat) { const a = audioRef.current; a.currentTime = 0; a.play(); return }
    setIdx(pick(1))
  }

  const select = i => {
    setIdx(i)
    setPlaying(true)
    // ensure playback starts even if same-state
    requestAnimationFrame(() => { audioRef.current?.play().then(() => setPlaying(true)).catch(() => {}) })
  }

  const seek = e => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Number(e.target.value)
    setCur(a.currentTime)
  }

  const progress = dur ? (cur / dur) * 100 : 0

  if (TRACKS.length === 0) {
    return (
      <div className="music music-empty">
        <div className="music-empty-art">♫</div>
        <h2 className="music-empty-title">No music yet</h2>
        <p className="music-empty-note">
          Drop audio files into <code>src/assets/music/</code> and restart the
          dev server. Name them <code>Artist - Title.mp3</code> for nicer labels.
        </p>
      </div>
    )
  }

  return (
    <div className="music">
      <audio
        ref={audioRef}
        onLoadedMetadata={e => setDur(e.target.duration)}
        onTimeUpdate={e => setCur(e.target.currentTime)}
        onEnded={onEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Track list */}
      <div className="music-list">
        <div className="music-list-head">
          <span>Library</span>
          <span className="music-count">{TRACKS.length}</span>
        </div>
        {TRACKS.map((t, i) => (
          <button
            key={t.url}
            type="button"
            className={`music-row${i === idx ? ' active' : ''}`}
            onClick={() => select(i)}
          >
            <span className="music-row-art" style={{ background: artFor(t.title) }}>
              {i === idx && playing ? '▶' : ''}
            </span>
            <span className="music-row-meta">
              <span className="music-row-title">{t.title}</span>
              <span className="music-row-artist">{t.artist}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Now playing */}
      <div className="music-now">
        <div className="music-art-big" style={{ background: artFor(track.title) }}>
          <span className={`music-art-glyph${playing ? ' spin' : ''}`}>♫</span>
        </div>

        <h2 className="music-title">{track.title}</h2>
        <p className="music-artist">{track.artist}</p>

        <div className="music-seek">
          <span className="music-time">{fmt(cur)}</span>
          <input
            type="range"
            className="music-range"
            min={0}
            max={dur || 0}
            step="0.1"
            value={cur}
            onChange={seek}
            style={{ '--p': `${progress}%` }}
          />
          <span className="music-time">{fmt(dur)}</span>
        </div>

        <div className="music-controls">
          <button
            type="button"
            className={`music-ctl small${shuffle ? ' on' : ''}`}
            onClick={() => setShuffle(s => !s)}
            title="Shuffle"
          >⤮</button>
          <button type="button" className="music-ctl" onClick={prev} title="Previous">⏮</button>
          <button type="button" className="music-ctl play" onClick={toggle} title="Play / Pause">
            {playing ? '⏸' : '▶'}
          </button>
          <button type="button" className="music-ctl" onClick={next} title="Next">⏭</button>
          <button
            type="button"
            className={`music-ctl small${repeat ? ' on' : ''}`}
            onClick={() => setRepeat(r => !r)}
            title="Repeat"
          >↻</button>
        </div>

        <div className="music-vol">
          <span>🔈</span>
          <input
            type="range"
            className="music-range vol"
            min={0}
            max={1}
            step="0.01"
            value={vol}
            onChange={e => setVol(Number(e.target.value))}
            style={{ '--p': `${vol * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
