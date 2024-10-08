import { build } from 'esbuild'

build({
    entryPoints: ['src/hide_seen_rows.js'],
    outfile: 'dist/hide_seen_rows.js',
    bundle: true,
    minify: false,
    sourcemap: false,
}).catch(() => process.exit(1));
