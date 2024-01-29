import * as esbuild from 'esbuild';
import styledComponentsPlugin from 'esbuild-plugin-styled-components';

await esbuild.build({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  minify: true,
  splitting: true,
  platform: 'node',
  sourcemap: true,
  format: 'esm',
  packages: 'external',
  outdir: 'dist',
  plugins: [
    styledComponentsPlugin({
      minify: true,
      meaninglessFileNames: ['index', 'style'],
      transpileTemplateLiterals: true,
    }),
  ],
});
