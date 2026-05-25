'use client'

import { useState } from 'react'

export default function SqlBlock({ sql, explanation }) {
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        await navigator.clipboard.writeText(sql)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="rounded-xl border border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wider uppercase text-gray-400">
                        🔍 Generated SQL
                    </span>
                </div>
                <button
                    onClick={handleCopy}
                    className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded px-2 py-1 transition-colors cursor-pointer"
                >
                    {copied ? '✅ Copied' : '📋 Copy'}
                </button>
            </div>

            {/* SQL */}
            <pre className="px-4 py-3 bg-gray-900 text-green-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {sql}
            </pre>

            {/* Explanation of what the query does */}
            {explanation && (
                <div className="px-4 py-2.5 bg-gray-800/50 border-t border-gray-700">
                    <p className="text-xs text-gray-400">
                        <span className="text-gray-500">What this query does: </span>
                        {explanation}
                    </p>
                </div>
            )}
        </div>
    )
}