import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  name: '__MSG_extName__',
  version: '1.0.0',
  manifest_version: 3,
  default_locale: 'en',
  description: '__MSG_extDescription__',
  icons: {
    16: 'icons/32-icon.png',
    48: 'icons/64-icon.png',
    128: 'icons/128-icon.png',
  },
  content_scripts: [
    {
      matches: ['https://www.youtube.com/*'],
      run_at: 'document_idle',
      all_frames: false,
      js: ['src/content.ts'],
    },
  ],
  host_permissions: ['https://www.youtube.com/*'],
  "action": {}
})
