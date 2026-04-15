import { neon } from '@neondatabase/serverless'

// Public read-only connection (used in pages/components)
export function sql() {
  return neon(process.env.DATABASE_URL!)
}

// Convenience: run a query and return rows
export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const db = sql()
  return db(strings, ...values) as Promise<T[]>
}
