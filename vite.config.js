import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // The RoomScene/physics chunks are the Spline 3D runtime — large by nature
    // and already split out via React.lazy, so the 500 kB warning is just noise.
    chunkSizeWarningLimit: 2200,
  },
})
