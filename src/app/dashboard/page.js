'use client'

import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import SqlBlock from '@/components/SqlBlock'
import ResultTable from '@/components/ResultTable'

const EXAMPLE_PROMPTS = [
    'Show me the top 5 customers by total order value',
    'Which product categories have the most revenue?',
    'List all pending orders with customer names',
    'How many orders were delivered vs cancelled?',
    'What are the top 3 best-selling products?',
]

export default function DashboardPage() {
    const [messages, setMessages] = useState([])
    const [prompt, setPrompt] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function handleSubmit() {
        const trimmed = prompt.trim()
        if (!trimmed || loading) return

        console.log('Submitting prompt:', trimmed)

        const userMessage = { role: 'user', content: trimmed }
        setMessages((prev) => [...prev, userMessage])
        setPrompt('')
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: trimmed }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Something went wrong')
                setMessages((prev) => prev.slice(0, -1))
                return
            }

            const assistantMessage = {
                role: 'assistant',
                sql: data.sql,
                sqlExplanation: data.sqlExplanation,
                result: data.result,
            }

            setMessages((prev) => [...prev, assistantMessage])
        } catch (err) {
            console.error('Caught error:', err)
            setError('Network error. Please try again.')
            setMessages((prev) => prev.slice(0, -1))
        } finally {
            setLoading(false)
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    function handleExampleClick(example) {
        setPrompt(example)
    }

    function clearMessages() {
        setMessages([])
        setError('')
        setPrompt('')
    }

    return (
        <div className="flex h-screen bg-gray-950">
            <Sidebar />

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Navbar */}
                <div className="flex items-center justify-between px-3 sm:px-6 py-3 bg-gray-900 border-b border-gray-800">
                    <div>
                        <h1 className="text-white font-semibold">Query Console</h1>
                        <p className="text-xs text-gray-500">Ask anything about the e-commerce database</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {messages.length > 0 && (
                            <button
                                onClick={clearMessages}
                                className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
                            >
                                ✨ New conversation
                            </button>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                            <span className="hidden sm:inline text-xs text-gray-400">Connected to PostgreSQL</span>
                        </div>
                    </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">

                    {/* Empty state */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full gap-6">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                                    S
                                </div>
                                <h2 className="text-xl font-semibold text-white mb-2">
                                    Ask your database anything
                                </h2>
                                <p className="text-gray-400 text-sm max-w-md">
                                    Describe what data you need in plain English. Claude will generate the SQL,
                                    execute it, and explain the results.
                                </p>
                            </div>

                            {/* Example prompts */}
                            <div className="grid grid-cols-1 gap-2 w-full max-w-lg">
                                {EXAMPLE_PROMPTS.map((example) => (
                                    <button
                                        key={example}
                                        onClick={() => handleExampleClick(example)}
                                        className="text-left px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
                                    >
                                        💬 {example}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message thread */}
                    {messages.map((msg, i) => (
                        <div key={i} className="space-y-4">
                            {msg.role === 'user' && (
                                <div className="flex justify-end">
                                    <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%] text-sm">
                                        {msg.content}
                                    </div>
                                </div>
                            )}

                            {msg.role === 'assistant' && (
                                <div className="space-y-3 max-w-4xl">
                                    {/* SQL block */}
                                    {msg.sql && (
                                        <SqlBlock sql={msg.sql} explanation={msg.sqlExplanation} />
                                    )}

                                    {/* Results table */}
                                    {msg.result && (
                                        <ResultTable result={msg.result} />
                                    )}

                                </div>
                            )}
                        </div>
                    ))}

                    {/* Loading state */}
                    {loading && (
                        <div className="space-y-3 max-w-4xl">
                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl w-fit">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]"></span>
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]"></span>
                                </div>
                                <span className="text-xs text-gray-400">Generating and executing query...</span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-900 border-t border-gray-800">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-3 items-end">
                            <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask a question about the database... (Enter to send)"
                                    rows={1}
                                    className="w-full bg-transparent text-white text-sm px-4 py-3 resize-none focus:outline-none placeholder-gray-500"
                                    style={{ maxHeight: '120px' }}
                                    onInput={(e) => {
                                        e.target.style.height = 'auto'
                                        e.target.style.height = e.target.scrollHeight + 'px'
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !prompt.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed cursor-pointer text-white font-medium rounded-xl px-4 py-3 text-sm transition-colors shrink-0"
                            >
                                {loading ? '⏳' : '▶ Run'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 text-center">
                            Only SELECT queries are executed · Powered by Claude Haiku 4.5
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}