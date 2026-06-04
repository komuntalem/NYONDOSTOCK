-- NyondoStock Database Schema
-- Run this SQL in your MySQL database to set up the project

CREATE DATABASE IF NOT EXISTS nyondostock;
USE nyondostock;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('sales_attendant', 'store_manager', 'admin') NOT NULL DEFAULT 'sales_attendant',
  phone VARCHAR(20),
  nin VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock / Products Table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  unit VARCHAR(50) DEFAULT 'unit',
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantity INT NOT NULL DEFAULT 0,
  min_stock_level INT DEFAULT 5,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Credit / Stock Arrivals
CREATE TABLE IF NOT EXISTS supplier_credit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  balance DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
  delivery_date DATE,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  nin VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  is_deposit_member BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  customer_name VARCHAR(200),
  user_id INT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  transport_cost DECIMAL(12,2) DEFAULT 0,
  grand_total DECIMAL(12,2) NOT NULL,
  payment_method ENUM('cash', 'mobile_money', 'credit') DEFAULT 'cash',
  status ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed',
  notes TEXT,
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Sale Items Table
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Deposit Scheme Table (Salary Earner Deposits)
CREATE TABLE IF NOT EXISTS deposits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  target_amount DECIMAL(12,2) NOT NULL,
  amount_deposited DECIMAL(12,2) DEFAULT 0,
  balance DECIMAL(12,2) GENERATED ALWAYS AS (target_amount - amount_deposited) STORED,
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Deposit Payments
CREATE TABLE IF NOT EXISTS deposit_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deposit_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_by INT,
  notes TEXT,
  FOREIGN KEY (deposit_id) REFERENCES deposits(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Transport Records
CREATE TABLE IF NOT EXISTS transport (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT,
  destination VARCHAR(200) NOT NULL,
  distance_km DECIMAL(8,2),
  base_charge DECIMAL(10,2) DEFAULT 30000,
  extra_charge DECIMAL(10,2) DEFAULT 0,
  total_charge DECIMAL(10,2) NOT NULL,
  is_free BOOLEAN DEFAULT FALSE,
  transport_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- Seed admin user (password: admin123)
INSERT IGNORE INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@nyondo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Store Manager', 'manager@nyondo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'store_manager'),
('Sales Staff', 'sales@nyondo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'sales_attendant');

-- Sample products
INSERT IGNORE INTO products (name, category, unit, cost_price, selling_price, quantity) VALUES
('Cement (cem iiN)', 'Cement', 'bag', 28000, 32000, 150),
('Cement (cem iiN)', 'Cement', 'bag', 26000, 30000, 200),
('Iron Bar 10mm', 'Iron Bars', 'piece', 18000, 22000, 300),
('Iron Bar 12mm', 'Iron Bars', 'piece', 25000, 30000, 200),
('Iron Bar 16mm', 'Iron Bars', 'piece', 45000, 52000, 100),
('Roofing Nails 1kg pack', 'Nails', 'pack', 4500, 6000, 500),
('Wire Mesh', 'Wire', 'roll', 85000, 100000, 50),
('Iron Sheet (26 gauge)', 'Iron Sheets', 'sheet', 55000, 65000, 200),
('Wheelbarrow', 'Tools', 'piece', 120000, 145000, 30),
('Barbed Wire (High Tensile)', 'Wire', 'roll', 95000, 115000, 40);
