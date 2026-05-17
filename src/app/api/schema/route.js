import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDemoSchema } from '@/lib/schema'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const schema = await getDemoSchema()
        return NextResponse.json(schema)
    } catch (err) {
        console.error('Schema load error:', err)
        return NextResponse.json({ error: 'Failed to load schema' }, { status: 500 })
    }
}