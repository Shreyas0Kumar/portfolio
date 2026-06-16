import { useEffect, useRef, useState } from 'react'

/**
 * useSquareSize
 * Measures the referenced element and returns the largest square (in px) that
 * fits inside it — so boards stay square and scale with the *window*, not the
 * viewport. Updates on any container resize (including window maximize).
 */
export function useSquareSize({ pad = 8, max = Infinity, min = 160 } = {}) {
  const ref = useRef(null)
  const [size, setSize] = useState(min)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      const s = Math.min(r.width, r.height) - pad
      setSize(Math.max(min, Math.floor(Math.min(s, max))))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [pad, max, min])

  return [ref, size]
}
