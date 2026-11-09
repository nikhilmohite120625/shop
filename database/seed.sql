-- =========================================================
-- Narayani Sarees - Seed SQL Script
-- Tuljapur, Maharashtra
-- =========================================================
USE `saree_shop`;

-- Roles
INSERT INTO `roles` (`id`, `name`, `description`, `permissions`) VALUES
(1, 'Super Admin', 'Full unrestricted store access', '["*"]'),
(2, 'Manager', 'Product, Inventory, and Order management', '["products.*", "orders.*", "inventory.*", "coupons.*", "reviews.*"]'),
(3, 'Staff', 'Order processing and customer support', '["orders.read", "orders.update", "returns.read", "returns.update"]')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Admin Accounts (Passwords: Admin@123, Manager@123, Staff@123)
-- bcrypt hash for salt 10
INSERT INTO `admins` (`id`, `name`, `email`, `password_hash`, `role_id`, `phone`, `status`) VALUES
(1, 'Nikhil Mohite (Super Admin)', 'admin@narayanisarees.com', '$2a$10$tZzC81eH9R04f32GqjF7x.tV8wZ35gYvXoF5/1N9v3o01E7dGg9p.', 1, '+919359594007', 'active'),
(2, 'Store Manager', 'manager@narayanisarees.com', '$2a$10$tZzC81eH9R04f32GqjF7x.tV8wZ35gYvXoF5/1N9v3o01E7dGg9p.', 2, '+919359594008', 'active'),
(3, 'Operations Staff', 'staff@narayanisarees.com', '$2a$10$tZzC81eH9R04f32GqjF7x.tV8wZ35gYvXoF5/1N9v3o01E7dGg9p.', 3, '+919359594009', 'active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Sample Customer (Password: Customer@123)
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `role`, `is_verified`) VALUES
(1, 'Pooja Patil', 'customer@gmail.com', '9876543210', '$2a$10$tZzC81eH9R04f32GqjF7x.tV8wZ35gYvXoF5/1N9v3o01E7dGg9p.', 'customer', TRUE)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Sample Address
INSERT INTO `addresses` (`id`, `user_id`, `full_name`, `phone`, `address_line`, `landmark`, `city`, `state`, `pincode`, `address_type`, `is_default`) VALUES
(1, 1, 'Pooja Patil', '9876543210', 'Plot 14, Shanti Nagar, Near Bhavani Temple', 'Tulja Bhavani Temple Road', 'Tuljapur', 'Maharashtra', '413601', 'home', TRUE)
ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`);

-- Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image`, `is_featured`, `is_active`, `display_order`) VALUES
(1, 'Paithani Sarees', 'paithani-sarees', 'Royal Maharashtrian handwoven Paithani sarees with peacock motifs and pure zari borders.', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', TRUE, TRUE, 1),
(2, 'Banarasi Sarees', 'banarasi-sarees', 'Opulent Varanasi silk sarees woven with intricate gold and silver brocade.', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', TRUE, TRUE, 2),
(3, 'Silk Sarees', 'silk-sarees', 'Pure Kanjeevaram and Mysore silks radiating timeless elegance.', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', TRUE, TRUE, 3),
(4, 'Cotton Sarees', 'cotton-sarees', 'Breathable Chanderi, Mulmul and Kota Doria cottons for daily grace and comfort.', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80', TRUE, TRUE, 4),
(5, 'Wedding Sarees', 'wedding-sarees', 'Grand bridal weaves designed for your most unforgettable wedding moments.', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80', TRUE, TRUE, 5),
(6, 'Party Wear', 'party-wear', 'Contemporary organza, shimmer georgette and sequined drapes.', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80', TRUE, TRUE, 6),
(7, 'Daily Wear', 'daily-wear', 'Soft, easy-to-drape everyday sarees with vibrant prints and lightweight fabric.', 'https://images.unsplash.com/photo-1610030469668-9359e9849202?auto=format&fit=crop&w=800&q=80', FALSE, TRUE, 7),
(8, 'Designer Sarees', 'designer-sarees', 'Exclusive designer cutwork, thread embroidery and fusion styling.', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', FALSE, TRUE, 8)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
