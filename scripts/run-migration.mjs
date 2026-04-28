import { readFileSync } from 'node:fs'

// Parse .env.local
const env = readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) { console.error('DATABASE_URL missing'); process.exit(1) }
const url = new URL(dbUrl)
const httpUrl = `https://${url.hostname}/sql`

async function exec(sql) {
  const res = await fetch(httpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Neon-Connection-String': dbUrl },
    body: JSON.stringify({ query: sql, params: [] }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json()
}

const file = process.argv[2]
if (!file) { console.error('Usage: node run-migration.mjs <sql-file>'); process.exit(1) }
const text = readFileSync(file, 'utf8')
const stmts = text
  .split(/;\s*\n/)
  .map(s =>
    // strip leading comment-only lines, keep the statement
    s.replace(/^(\s*--[^\n]*\n)+/g, '').trim()
  )
  .filter(s => s.length > 0)

for (const s of stmts) {
  console.log('>', s.slice(0, 90).replace(/\n/g, ' '))
  try { await exec(s); console.log('  OK') } catch (e) { console.error('  ERR:', e.message) }
}
console.log('Done.')
