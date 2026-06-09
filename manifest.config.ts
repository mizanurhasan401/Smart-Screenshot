import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'Chrome Screenshot Pro',
  description: 'Fast, private screenshot capture and annotation. No accounts, no cloud, no tracking.',
  version: pkg.version,
  icons: {
    16: 'public/icons/icon-16.png',
    48: 'public/icons/icon-48.png',
    128: 'public/icons/icon-128.png',
  },
  action: {
    default_icon: {
      16: 'public/icons/icon-16.png',
      48: 'public/icons/icon-48.png',
      128: 'public/icons/icon-128.png',
    },
    default_popup: 'src/popup/index.html',
    default_title: 'Chrome Screenshot Pro',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: [
    'activeTab',
    'tabs',
    'desktopCapture',
    'offscreen',
    'storage',
  ],
  // Register additional extension pages so CRXJS includes them in the build
  options_page: 'src/editor/index.html',
  devtools_page: 'src/offscreen/index.html',
  side_panel: {
    default_path: 'src/capture/index.html',
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
})
