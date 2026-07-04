import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Phase 5 alignment fix (scope drift, acknowledged):
// `@` was originally aliased to `src`, which mismatched tsconfig.renderer.json
// (`@/*` → `src/renderer/*`). The mismatch stayed hidden because Phase 2/3/4
// never actually ran `vite build`. Without this fix, vite build fails to
// resolve `@/store/...` imports. Alias must match the tsconfig paths.

export default defineConfig({
  root: path.resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
  },
})
