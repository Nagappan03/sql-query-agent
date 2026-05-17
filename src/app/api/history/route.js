import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const history = await prisma.queryHistory.findMany({
            where: { userId: session.user.id },
            orderBy: { executedAt: 'desc' },
            take: 20,
        })

        return NextResponse.json(history)
    } catch (err) {
        console.error('History fetch error:', err)
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }
}

export async function DELETE(req) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await req.json()
        await prisma.queryHistory.delete({
            where: { id, userId: session.user.id },
        })
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('History delete error:', err)
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}