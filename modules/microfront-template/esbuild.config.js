import * as esbuild from 'esbuild';
import styledComponentsPlugin from 'esbuild-plugin-styled-components';

export const esbuildConfig = {
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
};

async function build() {
  await esbuild.build(esbuildConfig);
}

build();
