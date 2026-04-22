-- SellerMate Seed Data
-- Sample products and orders for hackathon demo

-- Insert sample products
INSERT INTO products (id, sku, name, size, price, stock) VALUES
  ('prod-001', 'BKM-001-S', 'Baju Kurung Moden Pastel', 'S', 89.90, 0),
  ('prod-002', 'BKM-001-M', 'Baju Kurung Moden Pastel', 'M', 89.90, 3),
  ('prod-003', 'BKM-001-L', 'Baju Kurung Moden Pastel', 'L', 89.90, 12),
  ('prod-004', 'BKM-001-XL', 'Baju Kurung Moden Pastel', 'XL', 89.90, 2),
  ('prod-005', 'BBS-003-S', 'Blouse Batik Selangor', 'S', 65.00, 8),
  ('prod-006', 'BBS-003-M', 'Blouse Batik Selangor', 'M', 65.00, 3),
  ('prod-007', 'BBS-003-L', 'Blouse Batik Selangor', 'L', 65.00, 15),
  ('prod-008', 'TKL-005-M', 'Tudung Khimar Lace', 'M', 45.00, 22),
  ('prod-009', 'TKL-005-L', 'Tudung Khimar Lace', 'L', 45.00, 1),
  ('prod-010', 'KBT-007-S', 'Kebaya Teluk Belanga', 'S', 120.00, 6),
  ('prod-011', 'KBT-007-M', 'Kebaya Teluk Belanga', 'M', 120.00, 9),
  ('prod-012', 'KBT-007-XL', 'Kebaya Teluk Belanga', 'XL', 120.00, 4)
ON CONFLICT (id) DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  size = EXCLUDED.size,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock;

-- Insert sample orders for sales analytics
INSERT INTO orders (product_id, quantity, total_price, status, created_at) VALUES
  ('prod-002', 2, 179.80, 'completed', NOW() - INTERVAL '1 day'),
  ('prod-003', 1, 89.90, 'completed', NOW() - INTERVAL '2 days'),
  ('prod-005', 3, 195.00, 'completed', NOW() - INTERVAL '3 days'),
  ('prod-007', 2, 130.00, 'completed', NOW() - INTERVAL '4 days'),
  ('prod-008', 5, 225.00, 'completed', NOW() - INTERVAL '5 days'),
  ('prod-010', 1, 120.00, 'completed', NOW() - INTERVAL '6 days'),
  ('prod-011', 2, 240.00, 'completed', NOW() - INTERVAL '7 days'),
  ('prod-002', 1, 89.90, 'pending', NOW()),
  ('prod-006', 2, 130.00, 'shipped', NOW() - INTERVAL '12 hours'),
  ('prod-003', 3, 269.70, 'completed', NOW() - INTERVAL '8 days'),
  ('prod-008', 4, 180.00, 'completed', NOW() - INTERVAL '9 days'),
  ('prod-005', 2, 130.00, 'completed', NOW() - INTERVAL '10 days');
