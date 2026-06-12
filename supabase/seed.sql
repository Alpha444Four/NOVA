-- Optional extra products (API also seeds catalog when products table is empty)
INSERT INTO products (name, category, price, image, description, featured, stock)
SELECT * FROM (VALUES
  ('Minimalist Leather Tote', 'Fashion', 189, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80', 'Hand-stitched full-grain leather tote.', 1, 24),
  ('Merino Wool Sweater', 'Fashion', 128, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80', 'Ultra-soft merino, ethically sourced.', 1, 40)
) AS v(name, category, price, image, description, featured, stock)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
