import { defineManifest } from '@crxjs/vite-plugin'

export function createManifest(googleClientId: string) {
  return defineManifest({
    name: '__MSG_extName__',
    version: '1.0.0',
    manifest_version: 3,
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxjFlaKuVufluThpiSDnnr4SsyU9Sa9khBSkMC73xIaT17p9kOycRounjZmyf1Wh1x5wSl4IIcqM6S69k7/yvMFo5sQk0tm1hugEBR7ZZ9yzSHhuCyLB8X6R3i4m/cc3a+oeI5/mf+buBInmppW2/O2RFm/mQsY5TpvImmbFAWG2XK1RzrF6laWHkSYS7k5myo+yT3pZ+Pa86aC3Fg14S1kyi+Erw0k5woogw1qlXtqVjVe+NVHFf02q6Nuvtd0TMfw21XzQsTI8bhVMyqtC4lyTnurkBWCqxSCy6iOoLJIk/SmM7RnOHxo2TSSFK7Ojw+PW0p9Ci7AyJPgZzao8kZwIDAQAB',
    default_locale: 'en',
    description: '__MSG_extDescription__',
    icons: {
      16: 'icons/32-icon.png',
      48: 'icons/64-icon.png',
      128: 'icons/128-icon.png',
    },
    background: {
      service_worker: 'src/background/index.ts',
    },
    content_scripts: [
      {
        matches: ['https://www.youtube.com/*'],
        run_at: 'document_idle',
        all_frames: false,
        js: ['src/content/index.ts'],
      },
      {
        matches: ['https://www.youtube.com/*'],
        run_at: 'document_idle',
        all_frames: false,
        js: ['src/content/page-script.ts'],
        world: 'MAIN',
      } as const,
    ],
    permissions: ['storage', 'identity'],
    oauth2: {
      client_id: googleClientId,
      scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
    },
    host_permissions: ['https://www.youtube.com/*', 'https://www.googleapis.com/*'],
    action: {
      default_popup: 'src/popup/index.html',
    },
  })
}
