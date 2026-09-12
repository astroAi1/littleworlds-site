import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const projectRoot = new URL('../', import.meta.url)
const dist = new URL('../dist/', import.meta.url)

await rm(dist, { recursive: true, force: true })
await mkdir(new URL('./assets/', dist), { recursive: true })
async function copyWebAssets(source, destination) {
  await mkdir(destination, { recursive: true })
  const entries = await readdir(source, { withFileTypes: true })
  await Promise.all(entries.map(async (entry) => {
    const from = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, source)
    const to = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, destination)
    if (entry.isDirectory()) return copyWebAssets(from, to)
    if (entry.name.endsWith('.webp')) return copyFile(from, to)
    return undefined
  }))
}

await copyWebAssets(new URL('../public/', import.meta.url), dist)

execFileSync(join(projectRoot.pathname, 'node_modules/.bin/esbuild'), [
  'src/main.jsx', '--bundle', '--minify', '--sourcemap', '--format=esm', '--target=es2022',
  '--external:/textures/*', '--outfile=dist/assets/little-worlds-v4.js',
], { cwd: projectRoot.pathname, stdio: 'inherit' })

const source = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const html = source
  .replace('<script type="module" src="/src/main.jsx"></script>', '<script type="module" src="/assets/little-worlds-v4.js"></script>')
  .replace('</head>', '    <link rel="stylesheet" href="/assets/little-worlds-v4.css" />\n  </head>')
await writeFile(new URL('./index.html', dist), html)
