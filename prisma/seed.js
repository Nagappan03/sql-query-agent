const { PrismaClient } = require('@prisma/client')
const { Client } = require('pg')

const prisma = new PrismaClient()

const client = new Client({
    connectionString: process.env.DATABASE_URL,
})

async function main() {
    await client.connect()

    console.log('🌱 Creating demo e-commerce schema...')

    // Drop tables if they exist (clean slate)
    await client.query(`
    DROP TABLE IF EXISTS order_items CASCADE;
    DROP TABLE IF EXISTS orders CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS categories CASCADE;
    DROP TABLE IF EXISTS customers CASCADE;
  `)

    // Create tables
    await client.query(`
    CREATE TABLE customers (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(150) UNIQUE NOT NULL,
      city        VARCHAR(100),
      country     VARCHAR(100),
      created_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE categories (
      id    SERIAL PRIMARY KEY,
      name  VARCHAR(100) NOT NULL,
      slug  VARCHAR(100) UNIQUE NOT NULL
    );

    CREATE TABLE products (
      id           SERIAL PRIMARY KEY,
      name         VARCHAR(200) NOT NULL,
      category_id  INT REFERENCES categories(id),
      price        NUMERIC(10,2) NOT NULL,
      stock        INT DEFAULT 0,
      created_at   TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE orders (
      id           SERIAL PRIMARY KEY,
      customer_id  INT REFERENCES customers(id),
      status       VARCHAR(50) DEFAULT 'pending',
      total        NUMERIC(10,2),
      created_at   TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE order_items (
      id          SERIAL PRIMARY KEY,
      order_id    INT REFERENCES orders(id),
      product_id  INT REFERENCES products(id),
      quantity    INT NOT NULL,
      unit_price  NUMERIC(10,2) NOT NULL
    );
  `)

    console.log('✅ Tables created')

    // Seed customers
    await client.query(`
    INSERT INTO customers (name, email, city, country) VALUES
      ('Alice Johnson', 'alice@example.com', 'New York', 'USA'),
      ('Bob Smith', 'bob@example.com', 'London', 'UK'),
      ('Carol White', 'carol@example.com', 'Toronto', 'Canada'),
      ('David Lee', 'david@example.com', 'Sydney', 'Australia'),
      ('Emma Davis', 'emma@example.com', 'Singapore', 'Singapore'),
      ('Frank Miller', 'frank@example.com', 'Berlin', 'Germany'),
      ('Grace Kim', 'grace@example.com', 'Seoul', 'South Korea'),
      ('Henry Brown', 'henry@example.com', 'New York', 'USA'),
      ('Isla Wilson', 'isla@example.com', 'London', 'UK'),
      ('James Moore', 'james@example.com', 'Toronto', 'Canada');
  `)

    // Seed categories
    await client.query(`
    INSERT INTO categories (name, slug) VALUES
      ('Electronics', 'electronics'),
      ('Clothing', 'clothing'),
      ('Books', 'books'),
      ('Home & Garden', 'home-garden'),
      ('Sports', 'sports');
  `)

    // Seed products
    await client.query(`
    INSERT INTO products (name, category_id, price, stock) VALUES
      ('MacBook Pro 14"', 1, 1999.99, 15),
      ('iPhone 15', 1, 999.99, 40),
      ('Sony WH-1000XM5', 1, 349.99, 25),
      ('Samsung 4K Monitor', 1, 599.99, 10),
      ('Wireless Keyboard', 1, 89.99, 50),
      ('Slim Fit Jeans', 2, 59.99, 100),
      ('Cotton T-Shirt', 2, 24.99, 200),
      ('Winter Jacket', 2, 149.99, 30),
      ('Running Shoes', 5, 119.99, 60),
      ('Yoga Mat', 5, 39.99, 80),
      ('Clean Code (Book)', 3, 34.99, 45),
      ('The Pragmatic Programmer', 3, 39.99, 35),
      ('Designing Data-Intensive Apps', 3, 44.99, 20),
      ('Garden Tool Set', 4, 79.99, 25),
      ('Indoor Plant Pot Set', 4, 29.99, 70);
  `)

    console.log('✅ Products, categories, customers seeded')

    // Seed orders + order items
    const orders = [
        { customer_id: 1, status: 'delivered', items: [{ product_id: 1, qty: 1, price: 1999.99 }, { product_id: 3, qty: 1, price: 349.99 }] },
        { customer_id: 2, status: 'delivered', items: [{ product_id: 2, qty: 1, price: 999.99 }] },
        { customer_id: 3, status: 'shipped', items: [{ product_id: 6, qty: 2, price: 59.99 }, { product_id: 7, qty: 3, price: 24.99 }] },
        { customer_id: 4, status: 'delivered', items: [{ product_id: 11, qty: 1, price: 34.99 }, { product_id: 12, qty: 1, price: 39.99 }] },
        { customer_id: 5, status: 'pending', items: [{ product_id: 4, qty: 1, price: 599.99 }, { product_id: 5, qty: 1, price: 89.99 }] },
        { customer_id: 6, status: 'delivered', items: [{ product_id: 9, qty: 1, price: 119.99 }, { product_id: 10, qty: 2, price: 39.99 }] },
        { customer_id: 7, status: 'cancelled', items: [{ product_id: 8, qty: 1, price: 149.99 }] },
        { customer_id: 8, status: 'delivered', items: [{ product_id: 13, qty: 1, price: 44.99 }, { product_id: 11, qty: 2, price: 34.99 }] },
        { customer_id: 9, status: 'shipped', items: [{ product_id: 14, qty: 1, price: 79.99 }, { product_id: 15, qty: 2, price: 29.99 }] },
        { customer_id: 10, status: 'delivered', items: [{ product_id: 1, qty: 1, price: 1999.99 }, { product_id: 5, qty: 2, price: 89.99 }] },
        { customer_id: 1, status: 'delivered', items: [{ product_id: 9, qty: 1, price: 119.99 }] },
        { customer_id: 2, status: 'pending', items: [{ product_id: 7, qty: 5, price: 24.99 }, { product_id: 6, qty: 1, price: 59.99 }] },
    ]

    for (const order of orders) {
        const total = order.items.reduce((sum, i) => sum + i.qty * i.price, 0)
        const orderResult = await client.query(
            `INSERT INTO orders (customer_id, status, total) VALUES ($1, $2, $3) RETURNING id`,
            [order.customer_id, order.status, total.toFixed(2)]
        )
        const orderId = orderResult.rows[0].id
        for (const item of order.items) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
                [orderId, item.product_id, item.qty, item.price]
            )
        }
    }

    console.log('✅ Orders and order items seeded')
    console.log('🎉 Demo database ready!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await client.end()
        await prisma.$disconnect()
    })