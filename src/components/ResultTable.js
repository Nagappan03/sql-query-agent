'use client'

export default function ResultTable({ result }) {
    if (!result) return null

    if (result.error) {
        return (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                ⚠️ Query error: {result.error}
            </div>
        )
    }

    if (!result.rows || result.rows.length === 0) {
        return (
            <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-sm">
                No rows returned.
            </div>
        )
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-800 border-b border-gray-700">
                        {result.columns.map((col) => (
                            <th
                                key={col}
                                className="px-4 py-2.5 text-left text-xs font-semibold tracking-wider uppercase text-gray-400"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {result.rows.map((row, i) => (
                        <tr
                            key={i}
                            className={`border-b border-gray-800 transition-colors hover:bg-gray-800/50 ${i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/50'
                                }`}
                        >
                            {result.columns.map((col) => (
                                <td key={col} className="px-4 py-2.5 text-gray-300 font-mono text-xs">
                                    {row[col] === null ? (
                                        <span className="text-gray-600 italic">null</span>
                                    ) : (
                                        String(row[col])
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-800">
                <span className="text-xs text-gray-500">
                    {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'} returned
                </span>
            </div>
        </div>
    )
}