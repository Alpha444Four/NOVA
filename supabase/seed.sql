INSERT INTO products (name, category, price, image, description, featured, stock) VALUES
('Minimalist Leather Tote', 'Fashion', 189, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80', 'Hand-stitched full-grain leather tote.', 1, 24),
('Merino Wool Sweater', 'Fashion', 128, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80', 'Ultra-soft merino, ethically sourced.', 1, 40),
('Wireless Noise-Canceling Earbuds', 'Tech', 199, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80', '30-hour battery, premium sound.', 1, 30),
('Linen Duvet Cover', 'Home', 159, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80', 'Breathable European flax linen.', 1, 22)
ON CONFLICT DO NOTHING;
