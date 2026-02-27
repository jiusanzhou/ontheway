// Neon HTTP database client
// Uses fetch to call Neon's serverless HTTP API
// No npm packages needed

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const url = new URL(dbUrl)
  const httpUrl = `https://${url.hostname}/sql`

  const res = await fetch(httpUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': dbUrl,
    },
    body: JSON.stringify({ query: sql, params }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Database query failed (${res.status}): ${text}`)
  }

  const data = await res.json()

  // Neon returns { rows: [...], columns: [...], ... }
  // rows is array of arrays, columns is array of column names
  // Convert to array of objects
  if (!data.rows || !data.columns) return []

  return data.rows.map((row: unknown[]) => {
    const obj: Record<string, unknown> = {}
    data.columns.forEach((col: string, i: number) => {
      obj[col] = row[i]
    })
    return obj as T
  })
}

// Helper for queries that return a single row
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] || null
}

// Helper for count queries
export async function queryCount(
  sql: string,
  params: unknown[] = []
): Promise<number> {
  const row = await queryOne<{ count: string | number }>(sql, params)
  if (!row) return 0
  return typeof row.count === 'string' ? parseInt(row.count, 10) : row.count
}
