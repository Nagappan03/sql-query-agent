import { Client } from 'pg'

export async function executeSQL(query) {
    // Safety guard — only allow SELECT statements
    const normalized = query.trim().toLowerCase()
    if (!normalized.startsWith('select')) {
        return {
            error: 'Only SELECT queries are allowed for safety reasons.',
            rows: [],
            rowCount: 0,
            columns: [],
        }
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    })

    await client.connect()

    try {
        const result = await client.query(query)
        return {
            rows: result.rows,
            rowCount: result.rowCount,
            columns: result.fields.map((f) => f.name),
            error: null,
        }
    } catch (err) {
        return {
            error: err.message,
            rows: [],
            rowCount: 0,
            columns: [],
        }
    } finally {
        await client.end()
    }
}