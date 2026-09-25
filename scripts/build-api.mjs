import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['server/vercelHandler.ts'],
  outfile: 'api/review.js',
  bundle: true,
  platform: 'node',
  target: 'node20',
  // package.json has "type": "module", so the function must be ESM.
  format: 'esm',
  logLevel: 'info',
})
