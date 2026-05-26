# SQL Query Agent

A natural language to SQL agent powered by Claude's tool calling API. Describe what data you need in plain English — the agent generates the query, executes it against a live PostgreSQL database, and returns the results.

🔗 **Live demo:** [sql-query-agent.vercel.app](https://sql-query-agent.vercel.app)

---

## What it does

- **Natural language input** — ask questions like "show me the top 5 customers by order value"
- **Agentic tool calling** — Claude decides to call `execute_sql`, generates the query, we execute it, results come back
- **Live execution** — queries run against a real PostgreSQL database, not mocked
- **Schema-aware** — Claude reads the live database schema at runtime so queries are always accurate
- **Result display** — clean tabular view of query results with column headers

---

## Architecture

```
User prompt
  → Claude Haiku 4.5 (with execute_sql tool defined)
    → Claude calls execute_sql("SELECT ...")
      → App executes query on PostgreSQL
        → Results returned to user
```

The key AI engineering pattern here is **tool use / function calling** — Claude doesn't just generate SQL text, it acts as an agent that decides to invoke a tool, we run it, and return structured results.

---

## Tech stack

- **Frontend:** Next.js 16 (App Router), Tailwind CSS
- **Auth:** NextAuth.js (credentials)
- **ORM:** Prisma 6
- **Database:** PostgreSQL (Supabase)
- **LLM:** Claude Haiku 4.5 via Anthropic API
- **Deployment:** Vercel

---

## Demo database

Ships with a pre-seeded e-commerce schema:

| Table | Description |
|---|---|
| `customers` | 10 customers across multiple countries |
| `products` | 15 products across 5 categories |
| `categories` | Electronics, Clothing, Books, Sports, Home & Garden |
| `orders` | 12 orders with various statuses |
| `order_items` | Line items linking orders to products |

---

## Running locally

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, ANTHROPIC_API_KEY

# Run migrations
npx prisma migrate dev

# Seed demo data
npm run seed

# Start dev server
npm run dev
```

---

## Future improvements

- Accept user-provided PostgreSQL connection strings to query any database
- Support MySQL, SQLite, and other databases
- Query history and saved queries
- Export results as CSV
- Natural language chart generation from query results
