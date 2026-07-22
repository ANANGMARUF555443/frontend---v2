// Verifikasi statis: pastikan SEMUA import relatif di setiap file .js/.jsx
// benar-benar menunjuk ke file yang ada di disk. Ini pengganti `vite build`
// karena sandbox ini tidak punya akses npm registry untuk install vite.
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', 'src')
let totalFiles = 0
let totalImports = 0
let errors = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(jsx?|css)$/.test(entry.name)) checkFile(full)
  }
}

function resolveImport(fromFile, importPath) {
  const baseDir = path.dirname(fromFile)
  const resolved = path.resolve(baseDir, importPath)

  // Coba langsung (untuk .css atau path yg sudah lengkap)
  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return resolved

  // Coba tambah ekstensi umum
  for (const ext of ['.jsx', '.js', '.json']) {
    if (fs.existsSync(resolved + ext)) return resolved + ext
  }

  // Coba sebagai folder + index
  for (const ext of ['/index.jsx', '/index.js']) {
    if (fs.existsSync(resolved + ext)) return resolved + ext
  }

  return null
}

function checkFile(file) {
  totalFiles++
  const content = fs.readFileSync(file, 'utf8')
  if (!file.endsWith('.css')) {
    // Match: import X from '...'   /   import '...'   /  import { X } from '...'
    const importRegex = /import\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g
    let m
    while ((m = importRegex.exec(content))) {
      const importPath = m[1]
      if (!importPath.startsWith('.')) continue // skip package imports (react, dll)
      totalImports++
      const resolved = resolveImport(file, importPath)
      if (!resolved) {
        errors.push(`${path.relative(path.join(__dirname, '..'), file)}  ->  import "${importPath}" TIDAK DITEMUKAN`)
      }
    }
  } else {
    // CSS: cek @import kalau ada (biasanya tidak ada di project ini, tapi jaga-jaga)
    const importRegex = /@import\s+['"]([^'"]+)['"]/g
    let m
    while ((m = importRegex.exec(content))) {
      const importPath = m[1]
      if (!importPath.startsWith('.')) continue
      totalImports++
      const resolved = resolveImport(file, importPath)
      if (!resolved) {
        errors.push(`${path.relative(path.join(__dirname, '..'), file)}  ->  @import "${importPath}" TIDAK DITEMUKAN`)
      }
    }
  }
}

walk(SRC)

console.log(`Diperiksa: ${totalFiles} file, ${totalImports} import relatif`)
if (errors.length === 0) {
  console.log('✅ SEMUA IMPORT VALID — tidak ada path yang rusak.')
} else {
  console.log(`❌ Ditemukan ${errors.length} import bermasalah:\n`)
  errors.forEach((e) => console.log('  - ' + e))
  process.exitCode = 1
}
