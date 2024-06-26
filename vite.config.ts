import esbuild from 'esbuild';
import fs from 'fs-extra';
import path from 'path';
import * as Vite from 'vite';
import checker from 'vite-plugin-checker';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tsconfigPaths from 'vite-tsconfig-paths';
import packageJSON from './package.json' assert { type: 'json' };

const EN_JSON = JSON.parse(
  fs.readFileSync('./static/lang/en.json', { encoding: 'utf-8' })
);

const config = Vite.defineConfig(({ command, mode }): Vite.UserConfig => {
  const buildMode = mode === 'production' ? 'production' : 'development';

  const outDir = 'dist';
  const plugins = [checker({ typescript: true }), tsconfigPaths()];

  if (buildMode === 'production') {
    plugins.push(
      {
        name: 'minify',
        renderChunk: {
          order: 'post',
          async handler(code, chunk) {
            return chunk.fileName.endsWith('.mjs')
              ? esbuild.transform(code, {
                  keepNames: true,
                  minifyIdentifiers: false,
                  minifySyntax: true,
                  minifyWhitespace: true,
                  sourcemap: true
                })
              : code;
          }
        }
      },
      ...viteStaticCopy({
        targets: [{ src: 'CHANGELOG.md', dest: '.' }]
      })
    );
  } else {
    plugins.push(
      // Foundry expects all esm files listed in system.json to exist: create empty vendor module when in dev mode
      {
        name: 'touch-vendor-mjs',
        apply: 'build',
        writeBundle: {
          async handler() {
            fs.closeSync(fs.openSync(path.resolve(outDir, 'vendor.mjs'), 'w'));
          }
        }
      },
      // Vite HMR is only preconfigured for css files: add handler for HBS templates
      {
        name: 'hmr-handler',
        apply: 'serve',
        handleHotUpdate(context) {
          if (context.file.startsWith(outDir)) return;

          if (context.file.endsWith('en.json')) {
            const basePath = context.file.slice(context.file.indexOf('lang/'));
            console.log(`Updating lang file at ${basePath}`);
            fs.promises
              .copyFile(context.file, `${outDir}/${basePath}`)
              .then(() => {
                context.server.ws.send({
                  type: 'custom',
                  event: 'lang-update',
                  data: { path: `modules/pf2e-partyeffects/${basePath}` }
                });
              });
          } else if (context.file.endsWith('.hbs')) {
            const basePath = context.file.slice(
              context.file.indexOf('templates/')
            );
            console.log(`Updating template file at ${basePath}`);
            fs.promises
              .copyFile(context.file, `${outDir}/${basePath}`)
              .then(() => {
                context.server.ws.send({
                  type: 'custom',
                  event: 'template-update',
                  data: { path: `modules/pf2e-partyeffects/${basePath}` }
                });
              });
          }
        }
      }
    );
  }

  // Create dummy files for vite dev server
  if (command === 'serve') {
    const message =
      'This file is for a running vite dev server and is not copied to a build';
    fs.writeFileSync('./index.html', `<h1>${message}</h1>\n`);
    if (!fs.existsSync('./styles')) fs.mkdirSync('./styles');
    fs.writeFileSync('./styles/pf2e-partyeffects.css', `/** ${message} */\n`);
    fs.writeFileSync(
      './pf2e-partyeffects.mjs',
      `/** ${message} */\n\nimport "./src/pf2e-partyeffects.ts";\n`
    );
    fs.writeFileSync('./vendor.mjs', `/** ${message} */\n`);
  }

  return {
    base: command === 'build' ? './' : '/modules/pf2e-partyeffects/',
    publicDir: 'static',
    define: {
      BUILD_MODE: JSON.stringify(buildMode),
      EN_JSON: JSON.stringify(EN_JSON),
      fu: 'foundry.utils'
    },
    esbuild: { keepNames: true },
    build: {
      outDir,
      emptyOutDir: false, // fails if world is running due to compendium locks. We do it in "npm run clean" instead.
      minify: false,
      sourcemap: buildMode === 'development',
      lib: {
        name: 'pf2e-partyeffects',
        entry: 'src/main.ts',
        formats: ['es'],
        fileName: 'pf2e-partyeffects'
      },
      rollupOptions: {
        output: {
          assetFileNames: ({ name }): string =>
            name === 'style.css' ? 'styles/pf2e-partyeffects.css' : name ?? '',
          chunkFileNames: '[name].mjs',
          entryFileNames: 'pf2e-partyeffects.mjs',
          manualChunks: {
            vendor:
              buildMode === 'production'
                ? Object.keys(packageJSON.dependencies)
                : []
          }
        },
        watch: { buildDelay: 100 }
      }
    },
    server: {
      port: 30001,
      open: '/game',
      proxy: {
        '^(?!/modules/pf2e-partyeffects/)': 'http://localhost:30000/',
        '/socket.io': {
          target: 'ws://localhost:30000',
          ws: true,
          secure: false,
          changeOrigin: true
        }
      }
    },
    plugins,
    css: {
      devSourcemap: buildMode === 'development'
    }
  };
});

export default config;
