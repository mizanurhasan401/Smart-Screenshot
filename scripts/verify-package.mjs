import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('..', import.meta.url)))
const distDir = join(root, 'dist')
const releaseDir = join(root, 'release')

const DEV_PATTERNS = [/localhost/i, /:5173/, /__LIVE_RELOAD__/, /@crx\/client-worker/]

function fail(msg) {
  console.error(`\n✗ ${msg}`)
  process.exit(1)
}

function ok(msg) {
  console.log(`✓ ${msg}`)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function walkFiles(dir, files = []) {
  if (!existsSync(dir)) return files
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) walkFiles(path, files)
    else files.push(path)
  }
  return files
}

function scanForDevArtifacts(dir) {
  const hits = []
  for (const file of walkFiles(dir)) {
    if (!/\.(js|json|html)$/i.test(file)) continue
    const text = readFileSync(file, 'utf8')
    for (const pattern of DEV_PATTERNS) {
      if (pattern.test(text)) {
        hits.push({ file: relative(root, file), pattern: pattern.source })
      }
    }
  }
  return hits
}

function findReleaseZip() {
  if (!existsSync(releaseDir)) return null
  const zips = readdirSync(releaseDir).filter((f) => f.endsWith('.zip'))
  if (zips.length === 0) return null
  zips.sort()
  return join(releaseDir, zips[zips.length - 1])
}

// --- checks ---

const pkg = readJson(join(root, 'package.json'))
const manifestPath = join(distDir, 'manifest.json')

if (!existsSync(manifestPath)) {
  fail('dist/manifest.json not found. Run: npm run build')
}

const manifest = readJson(manifestPath)

if (manifest.manifest_version !== 3) {
  fail(`Expected manifest_version 3, got ${manifest.manifest_version}`)
}
ok('manifest_version is 3')

if (manifest.version !== pkg.version) {
  fail(`Version mismatch: package.json=${pkg.version}, manifest.json=${manifest.version}`)
}
ok(`Version ${pkg.version} matches package.json`)

const ALLOWED_PERMISSIONS = new Set(['activeTab', 'tabs', 'scripting'])
const permissions = manifest.permissions ?? []

if (permissions.includes('storage')) {
  fail('manifest.json must not request unused "storage" permission')
}

for (const perm of permissions) {
  if (!ALLOWED_PERMISSIONS.has(perm)) {
    fail(`Unexpected permission "${perm}". Allowed: ${[...ALLOWED_PERMISSIONS].join(', ')}`)
  }
}
ok(`Permissions OK: ${permissions.join(', ')}`)

if (manifest.content_scripts?.length) {
  fail('manifest.json should not declare content_scripts (use scripting on user action)')
}
ok('No content_scripts in manifest')

const devHits = scanForDevArtifacts(distDir)
if (devHits.length > 0) {
  console.error('\nDev artifacts found in dist/:')
  for (const h of devHits) console.error(`  - ${h.file} (${h.pattern})`)
  fail('Production dist/ contains dev-only references. Run a fresh npm run build.')
}
ok('No dev artifacts (localhost, HMR) in dist/')

const zipPath = findReleaseZip()
if (!zipPath) {
  fail('No .zip found in release/. Run: npm run build')
}
ok(`Release ZIP found: ${relative(root, zipPath)}`)

// Verify ZIP contains manifest at root using unzip -l via dynamic import is heavy;
// read first bytes isn't reliable. Use AdmZip? Not in deps. Shell unzip -l.
import { execSync } from 'node:child_process'
let zipListing = ''
try {
  zipListing = execSync(`unzip -l "${zipPath}"`, { encoding: 'utf8' })
} catch {
  fail('Could not read ZIP. Is unzip installed?')
}

if (!zipListing.includes('manifest.json')) {
  fail('ZIP does not contain manifest.json')
}
ok('ZIP contains manifest.json')

if (zipListing.includes('localhost') || zipListing.includes('5173')) {
  fail('ZIP listing suggests dev artifacts inside archive')
}
ok('ZIP listing looks clean')

console.log('\nAll package checks passed. Ready for Chrome Web Store upload.\n')
