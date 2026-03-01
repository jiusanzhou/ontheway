import { defineConfig } from 'tsup'

export default defineConfig([
  // ESM + CJS builds (npm package)
  {
    entry: {
      index: 'src/index.ts',
      react: 'src/react.tsx',
      components: 'src/components.tsx',
      checklist: 'src/checklist.tsx',
      devtools: 'src/devtools.tsx',
    },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: ['react', 'react-dom', 'driver.js'],
  },
  // IIFE build for CDN <script> tag
  {
    entry: { cdn: 'src/cdn.ts' },
    format: ['iife'],
    globalName: 'OnTheWaySDK',
    outExtension: () => ({ js: '.global.js' }),
    sourcemap: true,
    treeshake: true,
    minify: true,
    noExternal: ['driver.js'],
    platform: 'browser',
  },
])
