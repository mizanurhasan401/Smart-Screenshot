import path from 'node:path'
import type { Plugin } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import zip from 'vite-plugin-zip-pack'
import manifest from './manifest.config.js'
import { name, version } from './package.json'

const liveReload = false

/** CRXJS only replaces the first __LIVE_RELOAD__ occurrence (.replace vs .replaceAll). */
function fixCrxLiveReloadConstants(enabled: boolean): Plugin {
  const value = String(enabled)
  return {
    name: 'fix-crx-live-reload',
    apply: 'serve',
    transform(code, id) {
      if (!id.includes('client-worker') && !id.includes('hmr-content-port')) return
      if (!code.includes('__LIVE_RELOAD__') && !code.includes('__CRX_LIVE_RELOAD__')) return
      return code
        .replaceAll('__LIVE_RELOAD__', value)
        .replaceAll('__CRX_LIVE_RELOAD__', value)
    },
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '@': `${path.resolve(__dirname, 'src')}`,
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest, liveReload }),
    fixCrxLiveReloadConstants(liveReload),
    zip({ outDir: 'release', outFileName: `crx-${name}-${version}.zip` }),
  ],
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
})
