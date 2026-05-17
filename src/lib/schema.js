import { Client } from 'pg'

export async function getDemoSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    })

    await client.connect()

    try {
        // Get all tables in public schema (excluding Prisma/NextAuth internal tables)
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('_prisma_migrations', 'User', 'QueryHistory', 'users', 'query_histories')
      ORDER BY table_name;
    `)

        const tables = tablesResult.rows.map((r) => r.table_name)
        const schemaDefinitions = []

        for (const table of tables) {
            // Get columns for each table
            const columnsResult = await client.query(`
        SELECT 
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          CASE WHEN pk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END as is_primary_key
        FROM information_schema.columns c
        LEFT JOIN (
          SELECT ku.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage ku
            ON tc.constraint_name = ku.constraint_name
          WHERE tc.table_name = $1
            AND tc.constraint_type = 'PRIMARY KEY'
        ) pk ON c.column_name = pk.column_name
        WHERE c.table_name = $1
          AND c.table_schema = 'public'
        ORDER BY c.ordinal_position;
      `, [table])

            // Get foreign keys for each table
            const fkResult = await client.query(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table,
          ccu.column_name AS foreign_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = $1
          AND tc.constraint_type = 'FOREIGN KEY';
      `, [table])

            // Build CREATE TABLE style definition
            const columns = columnsResult.rows.map((col) => {
                let def = `  ${col.column_name} ${col.data_type.toUpperCase()}`
                if (col.is_primary_key === 'YES') def += ' PRIMARY KEY'
                if (col.is_nullable === 'NO' && col.is_primary_key === 'NO') def += ' NOT NULL'
                return def
            })

            const fkLines = fkResult.rows.map(
                (fk) => `  -- FK: ${fk.column_name} → ${fk.foreign_table}.${fk.foreign_column}`
            )

            schemaDefinitions.push(
                `CREATE TABLE ${table} (\n${[...columns, ...fkLines].join(',\n')}\n);`
            )
        }

        return {
            tables,
            schemaText: schemaDefinitions.join('\n\n'),
        }
    } finally {
        await client.end()
    }
}