# GroupTube

A Chrome extension that lets you group YouTube subscriptions into custom categories for easier channel management.

## Tech Stack

- **TypeScript**
- **Vite** + **[@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)** — fast HMR-enabled Chrome extension development
- **Chrome Extensions Manifest V3**

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm

### Installation

```bash
npm install
```

### Development

Start the dev server with hot-reload:

```bash
npm run dev
```

Then load the extension in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the generated `dist` folder

### Production Build

```bash
npm run build
```

The built extension will be in the `dist` directory, ready to be packed or published.

## Project Structure

```
├── public/
│   ├── _locales/          # i18n strings (en, ru)
│   └── icons/             # Extension icons
├── src/
│   └── content.ts         # YouTube content script
├── manifest.config.ts     # Chrome extension manifest (MV3)
├── vite.config.ts         # Vite configuration
└── tsconfig.json          # TypeScript configuration
```

## Localization

The extension supports multiple languages via Chrome's `_locales` system:

- English (`en`)
- Russian (`ru`)
