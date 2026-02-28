import { defineConfig } from 'tsup'

export default defineConfig({
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
})
