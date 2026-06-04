const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isLoggedIn, isManagerOrAdmin } = require('../models/auth');

// List all products
router.get('/', isLoggedIn, async (req, res) => {
  const search = req.query.search || '';
  const category = req.query.category || '';
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (search) { query += ' AND name LIKE ?'; params.push(`%${search}%`); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  query += ' ORDER BY name';
  const [products] = await db.query(query, params);
  const [categories] = await db.query('SELECT DISTINCT category FROM products ORDER BY category');
  res.render('products/index', { title: 'Stock Inventory', products, categories, search, category });
});

// Add product form
router.get('/add', isLoggedIn, isManagerOrAdmin, (req, res) => {
  res.render('products/form', { title: 'Add Product', product: {} });
});

// Add product
router.post('/add', isLoggedIn, isManagerOrAdmin, async (req, res) => {
  const { name, category, unit, cost_price, selling_price, quantity, min_stock_level, description } = req.body;
  if (parseFloat(selling_price) <= parseFloat(cost_price)) {
    req.flash('error', 'Selling price must be greater than cost price');
    return res.redirect('/products/add');
  }
  await db.query(
    'INSERT INTO products (name, category, unit, cost_price, selling_price, quantity, min_stock_level, description) VALUES (?,?,?,?,?,?,?,?)',
    [name, category, unit, cost_price, selling_price, quantity, min_stock_level || 5, description]
  );
  req.flash('success', 'Product added successfully');
  res.redirect('/products');
});

// Edit form
router.get('/edit/:id', isLoggedIn, isManagerOrAdmin, async (req, res) => {
  const [[product]] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) { req.flash('error', 'Product not found'); return res.redirect('/products'); }
  res.render('products/form', { title: 'Edit Product', product });
});

// Update product
router.post('/edit/:id', isLoggedIn, isManagerOrAdmin, async (req, res) => {
  const { name, category, unit, cost_price, selling_price, quantity, min_stock_level, description } = req.body;
  if (parseFloat(selling_price) <= parseFloat(cost_price)) {
    req.flash('error', 'Selling price must be greater than cost price');
    return res.redirect(`/products/edit/${req.params.id}`);
  }
  await db.query(
    'UPDATE products SET name=?, category=?, unit=?, cost_price=?, selling_price=?, quantity=?, min_stock_level=?, description=? WHERE id=?',
    [name, category, unit, cost_price, selling_price, quantity, min_stock_level || 5, description, req.params.id]
  );
  req.flash('success', 'Product updated successfully');
  res.redirect('/products');
});

// Delete
router.post('/delete/:id', isLoggedIn, isManagerOrAdmin, async (req, res) => {
  await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  req.flash('success', 'Product deleted');
  res.redirect('/products');
});

// Restock
router.post('/restock/:id', isLoggedIn, isManagerOrAdmin, async (req, res) => {
  const { quantity } = req.body;
  await db.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [quantity, req.params.id]);
  req.flash('success', `Added ${quantity} units to stock`);
  res.redirect('/products');
});

module.exports = router;
