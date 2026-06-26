import React from 'react'
import './ControlCenter.css'

/**
 * ControlCenter
 * macOS-style Control Center panel that drops from the menu bar (top-right).
 * Some controls are wired to real desktop state (sound, wallpaper, brightness,
 * night light); Wi-Fi / Bluetooth / volume are cosmetic but behave like the
 * real toggles. The desktop dims behind the open panel — handled in Desktop.
 *
 * Props (all from Desktop):
 *   soundOn, onToggleSound        — master mute state
 *   volume, onVolume              — 0–100; 0 mutes, >0 unmutes
 *   brightness, onBrightness      — 20–100; dims the wallpaper for real
 *   nightLight, onToggleNightLight — warm yellow screen tint
 *   wifi, onToggleWifi             — cosmetic
 *   bluetooth, onToggleBluetooth   — cosmetic
 *   onCycleWallpaper               — advances the desktop wallpaper
 */
export default function ControlCenter({
  soundOn,
  volume,
  onVolume,
  onToggleSound,
  brightness,
  onBrightness,
  nightLight,
  onToggleNightLight,
  wifi,
  onToggleWifi,
  bluetooth,
  onToggleBluetooth,
  onCycleWallpaper,
}) {
  return (
    <div className="control-center" role="dialog" aria-label="Control Center" onClick={e => e.stopPropagation()}>
      {/* Connectivity */}
      <div className="cc-card cc-connectivity">
        <button
          type="button"
          className={`cc-conn${wifi ? ' on' : ''}`}
          onClick={onToggleWifi}
          aria-pressed={wifi}
        >
          <span className="cc-conn-icon">📶</span>
          <span className="cc-conn-text">
            <span className="cc-conn-label">Wi-Fi</span>
            <span className="cc-conn-state">{wifi ? 'shreyas.space' : 'Off'}</span>
          </span>
        </button>
        <button
          type="button"
          className={`cc-conn${bluetooth ? ' on' : ''}`}
          onClick={onToggleBluetooth}
          aria-pressed={bluetooth}
        >
          <span className="cc-conn-icon">{'ʘ'}</span>
          <span className="cc-conn-text">
            <span className="cc-conn-label">Bluetooth</span>
            <span className="cc-conn-state">{bluetooth ? 'On' : 'Off'}</span>
          </span>
        </button>
      </div>

      {/* Toggle tiles */}
      <button
        type="button"
        className={`cc-tile${soundOn ? ' on' : ''}`}
        onClick={onToggleSound}
        aria-pressed={soundOn}
      >
        <span className="cc-tile-icon">{soundOn ? '🔊' : '🔇'}</span>
        <span className="cc-tile-label">Sound</span>
        <span className="cc-tile-state">{soundOn ? 'On' : 'Muted'}</span>
      </button>

      <button
        type="button"
        className={`cc-tile${nightLight ? ' on' : ''}`}
        onClick={onToggleNightLight}
        aria-pressed={nightLight}
      >
        <span className="cc-tile-icon">{nightLight ? '🌙' : '☾'}</span>
        <span className="cc-tile-label">Night Light</span>
        <span className="cc-tile-state">{nightLight ? 'On' : 'Off'}</span>
      </button>

      <button type="button" className="cc-tile cc-tile--wide" onClick={onCycleWallpaper}>
        <span className="cc-tile-icon">🖼️</span>
        <span className="cc-tile-text">
          <span className="cc-tile-label">Wallpaper</span>
          <span className="cc-tile-state">Tap to change</span>
        </span>
      </button>

      {/* Sliders */}
      <div className="cc-card cc-slider-card">
        <span className="cc-slider-title">Display</span>
        <div className="cc-slider">
          <span className="cc-slider-icon">☀</span>
          <input
            type="range"
            min="20"
            max="100"
            value={brightness}
            onChange={e => onBrightness(Number(e.target.value))}
            aria-label="Display brightness"
          />
        </div>
      </div>

      <div className="cc-card cc-slider-card">
        <span className="cc-slider-title">Sound</span>
        <div className="cc-slider">
          <span className="cc-slider-icon">{volume === 0 ? '🔇' : '🔈'}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={e => onVolume(Number(e.target.value))}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  )
}
