import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDemoSchema } from '@/lib/schema'
import { executeSQL } from '@/lib/executeSQL'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

// Tool definition — Claude decides when to call this
const tools = [
    {
        name: 'execute_sql',
        description:
            'Executes a SQL SELECT query against the connected PostgreSQL e-commerce database and returns the results. Use this to answer the user\'s question by querying the live data.',
        input_schema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'A valid PostgreSQL SELECT query to execute against the database.',
                },
                explanation: {
                    type: 'string',
                    description: 'A brief plain-English explanation of what this query does.',
                },
            },
            required: ['query', 'explanation'],
        },
    },
]

export async function POST(req) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { prompt } = await req.json()
        if (!prompt?.trim()) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        // Load live schema to ground Claude's SQL generation
        const { schemaText } = await getDemoSchema()

        const systemPrompt = `You are an expert SQL assistant connected to a live PostgreSQL e-commerce database.

Here is the exact database schema you are working with:

${schemaText}

Your job is to:
1. Understand the user's question in plain English
2. Call the execute_sql tool with the correct SELECT query to answer it
3. After receiving the results, explain them clearly in plain English

Rules:
- Only use tables and columns that exist in the schema above
- Always use the execute_sql tool — never just write SQL without executing it
- Only generate SELECT queries — no INSERT, UPDATE, DELETE, or DROP
- If the question is ambiguous, make a reasonable assumption and state it
- Keep explanations concise and focused on the actual data returned`

        // --- Agentic loop ---
        const messages = [{ role: 'user', content: prompt }]

        let sqlQuery = null
        let sqlExplanation = null
        let queryResult = null
        let finalExplanation = null

        // Round 1 — send prompt to Claude with tool available
        const round1 = await anthropic.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 1024,
            system: systemPrompt,
            tools,
            messages,
        })

        // Check if Claude wants to call the tool
        const toolUseBlock = round1.content.find((b) => b.type === 'tool_use')

        if (!toolUseBlock) {
            // Claude answered directly without using the tool
            const textBlock = round1.content.find((b) => b.type === 'text')
            return NextResponse.json({
                explanation: textBlock?.text || 'No response generated.',
                sql: null,
                sqlExplanation: null,
                result: null,
            })
        }

        // Extract the tool call details
        sqlQuery = toolUseBlock.input.query
        sqlExplanation = toolUseBlock.input.explanation

        // Execute the SQL on our PostgreSQL database
        queryResult = await executeSQL(sqlQuery)

        // Round 2 — send tool result back to Claude for explanation
        const round2 = await anthropic.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 1024,
            system: systemPrompt,
            tools,
            messages: [
                ...messages,
                { role: 'assistant', content: round1.content },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'tool_result',
                            tool_use_id: toolUseBlock.id,
                            content: queryResult.error
                                ? `Error executing query: ${queryResult.error}`
                                : JSON.stringify({
                                    rowCount: queryResult.rowCount,
                                    columns: queryResult.columns,
                                    rows: queryResult.rows.slice(0, 50), // cap at 50 rows for context
                                }),
                        },
                    ],
                },
            ],
        })

        // Extract Claude's final explanation
        const finalText = round2.content.find((b) => b.type === 'text')
        finalExplanation = finalText?.text || 'Query executed successfully.'

        // Save to query history
        await prisma.queryHistory.create({
            data: {
                userId: session.user.id,
                prompt,
                generatedSql: sqlQuery,
                explanation: finalExplanation,
                resultCount: queryResult.rowCount ?? 0,
            },
        })

        return NextResponse.json({
            sql: sqlQuery,
            sqlExplanation,
            explanation: finalExplanation,
            result: queryResult,
        })
    } catch (err) {
        console.error('Query agent error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}