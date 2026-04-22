-- SellerMate Database Schema
-- Run this script in Supabase SQL Editor

-- Products table (inventory)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  size TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (conversation history)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('customer', 'bot', 'owner')),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table (sales data)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);

-- Enable Row Level Security (RLS) - allowing public access for hackathon demo
-- In production, you would add proper auth policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public access policies for hackathon demo
CREATE POLICY "Allow public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public write products" ON products FOR ALL USING (true);

CREATE POLICY "Allow public read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow public write messages" ON messages FOR ALL USING (true);

CREATE POLICY "Allow public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public write orders" ON orders FOR ALL USING (true);
