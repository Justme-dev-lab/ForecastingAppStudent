import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  // Agar frontend bisa dibuka lewat alamat tunnel (mis. xxxx-5173.asse.devtunnels.ms).
  // Tanpa ini Vite menolak host selain localhost ("Blocked request. This host is not allowed").
  // Hanya untuk pengembangan; jangan dipakai di server produksi.
  server: { 
    host: true, 
    port: 5173, 
    allowedHosts: ['.devtunnels.ms'] // Hanya mengizinkan domain devtunnels.ms
  },
  preview: { host: true, port: 4173, allowedHosts: true },
})