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
    default_title: 'Take Screenshot',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: ['activeTab', 'tabs', 'storage', 'scripting'],
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content/fullPageHelper.ts'],
      run_at: 'document_idle',
    },
  ],
  options_page: 'src/editor/index.html',
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
})
