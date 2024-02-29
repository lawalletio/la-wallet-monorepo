import * as esbuild from 'esbuild';
import { esbuildConfig } from './esbuild.config.js';

async function watch() {
  let ctx = await esbuild.context(esbuildConfig);

  await ctx.watch();
  console.log('Watching...');
}

await watch();
