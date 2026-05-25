'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'

export default function Sidebar() {
    const { data: session } = useSession()
    const [schemaData, setSchemaData] = useState(null)
    const [expandedTables, setExpandedTables] = useState({})

    useEffect(() => {
        fetchSchema()
    }, [])

    async function fetchSchema() {
        const res = await fetch('/api/schema')
        const data = await res.json()
        setSchemaData(data)
    }

    function toggleTable(table) {
        setExpandedTables((prev) => ({ ...prev, [table]: !prev[table] }))
    }

    function parseSchema(schemaText) {
        if (!schemaText) return {}
        const tables = {}
        const blocks = schemaText.split('\n\n')
        for (const block of blocks) {
            const tableMatch = block.match(/CREATE TABLE (\w+)/)
            if (!tableMatch) continue
            const tableName = tableMatch[1]
            const lines = block.split('\n').slice(1, -1)
            tables[tableName] = lines
                .filter((l) => !l.trim().startsWith('--') && l.trim())
                .map((l) => {
                    const parts = l.trim().replace(/,$/, '').split(/\s+/)
                    return { name: parts[0], type: parts[1] || '' }
                })
        }
        return tables
    }

    const parsedTables = schemaData ? parseSchema(schemaData.schemaText) : {}

    return (
        <div className="hidden md:flex flex-col w-72 bg-gray-900 border-r border-gray-800 h-screen">
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    S
                </div>
                <span className="text-white font-semibold">SQL Query Agent</span>
            </div>

            {/* Schema header */}
            <div className="px-4 py-3 border-b border-gray-800">
                <p className="text-xs font-semibold tracking-wider uppercase text-gray-500">
                    📋 Database Schema
                </p>
                <p className="text-xs text-gray-600 mt-0.5">E-commerce demo database</p>
            </div>

            {/* Schema viewer */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {Object.entries(parsedTables).map(([table, columns]) => (
                    <div key={table}>
                        <button
                            onClick={() => toggleTable(table)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-left cursor-pointer"
                        >
                            <span className="text-gray-400 text-xs">
                                {expandedTables[table] ? '▼' : '▶'}
                            </span>
                            <span className="text-sm text-gray-200 font-medium">📦 {table}</span>
                        </button>
                        {expandedTables[table] && (
                            <div className="ml-6 mb-1 space-y-0.5">
                                {columns.map((col) => (
                                    <div
                                        key={col.name}
                                        className="flex items-center justify-between px-2 py-1 rounded text-xs"
                                    >
                                        <span className="text-gray-300">{col.name}</span>
                                        <span className="text-gray-600 font-mono">{col.type}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* User footer */}
            <div className="border-t border-gray-800 px-4 py-3 flex items-center justify-between">
                <div>
                    <p className="text-sm text-white font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500">{session?.user?.email}</p>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="text-xs text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                >
                    Sign out
                </button>
            </div>
        </div>
    )
}