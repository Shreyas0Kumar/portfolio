import React from 'react'

/**
 * ErrorBoundary
 * Catches render/chunk-load errors from the lazy scenes so a failed dynamic
 * import (flaky network, deploy mid-visit) shows a themed retry screen instead
 * of a permanently blank page. Reload re-fetches the failed chunk — React.lazy
 * caches a rejected import, so a plain re-render can't recover on its own.
 */
export default class ErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('Scene failed to load:', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center',
        padding: 24, background: '#1a1208', color: '#e8a55a',
        fontFamily: 'var(--font-body)',
      }}>
        <p style={{ margin: 0 }}>Something didn’t load. Likely a network hiccup.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 22px', borderRadius: 999, cursor: 'pointer',
            border: '1px solid #e8a55a', background: 'transparent',
            color: '#e8a55a', font: 'inherit',
          }}
        >
          Reload
        </button>
      </div>
    )
  }
}
