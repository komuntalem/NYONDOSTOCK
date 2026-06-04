const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isLoggedIn, isManagerOrAdmin } = require('../models/auth');

router.get('/', isLoggedIn, async (req, res) => {
  const [suppliers] = await db.query('SELECT * FROM suppliers ORDER BY name');
  res.render('suppliers/index', { title: 'Suppliers', suppliers });
});

router.get('/add', isLoggedIn, isManagerOrAdmin, (req, res) => {
  res.render('suppliers/form', { title: 'Add Supplier', supplier: {} });
});

router.post('/add', isLoggedIn, isManagerOrAdmin, async (req, res) => {
  const { name, phone, email, address, credit_limit } = req.body;
  await db.query('INSERT INTO suppliers (name, phone, email, address, credit_limit) VALUES (?,?,?,?,?)',
    [name, phone, email, address, credit_limit || 0]);
  req.flash('success', 'Supplier added');
  res.redirect('/suppliers');
});

router.get('/edit/:id', isLoggedIn, isManagerOrAdmin, async (req, res) => {
  const [[supplier]] = await db.query('SELECT * FROM suppliers WHERE id=?', [req.params.id]);
  res.render('suppliers/form', { title: 'Edit Supplier', supplier });
});

router.post('/edit/:id', isLoggedIn, isManagerOrAdmin, async (req, res) => {
  const { name, phone, email, address, credit_limit } = req.body;
  await db.query('UPDATE suppliers SET name=?, phone=?, email=?, address=?, credit_limit=? WHERE id=?',
    [name, phone, email, address, credit_limit, req.params.id]);
  req.flash('success', 'Supplier updated');
  res.redirect('/suppliers');
});

// Credit records for a supplier
router.get('/:id/credit', isLoggedIn, async (req, res) => {
  const [[supplier]] = await db.query('SELECT * FROM suppliers WHERE id=?', [req.params.id]);
  const [credits] = await db.query(`
    SELECT sc.*, p.name as product_name FROM supplier_credit sc 
    JOIN products p ON sc.product_id=p.id WHERE sc.supplier_id=? ORDER BY sc.created_at DESC`, [req.params.id]);
  const [products] = await db.query('SELECT id, name FROM products ORDER BY name');
  res.render('suppliers/credit', { title: `Credit - ${supplier.name}`, supplier, credits, products });
});

// Add credit entry
router.post('/:id/credit/add', isLoggedIn, isManagerOrAdmin, async (req, res) => {
  const { product_id, quantity, unit_cost, selling_price, delivery_date, notes, payment_method } = req.body;
  const total = quantity * unit_cost;
  
  // Normalize payment method to lowercase
  const method = (payment_method || 'credit').toLowerCase().trim();
  const isCredit = method === 'credit';
  
  // Determine amount paid based on payment method
  const amount_paid = isCredit ? 0 : total;
  const status = isCredit ? 'pending' : 'paid';
  
  // Update product with new selling price and stock
  await db.query('UPDATE products SET quantity = quantity + ?, selling_price = ? WHERE id = ?', 
    [quantity, selling_price, product_id]);
  
  // Record the transaction
  await db.query(
    'INSERT INTO supplier_credit (supplier_id, product_id, quantity, unit_cost, total_amount, amount_paid, delivery_date, notes, status) VALUES (?,?,?,?,?,?,?,?,?)',
    [req.params.id, product_id, quantity, unit_cost, total, amount_paid, delivery_date, notes, status]
  );
  
  // Update supplier balance only if on credit (cash means no balance owed)
  if (isCredit) {
    await db.query('UPDATE suppliers SET current_balance = current_balance + ? WHERE id = ?', [total, req.params.id]);
  }
  
  const msg = isCredit ? 'Stock recorded & supplier credit added' : 'Stock recorded & payment marked as paid';
  req.flash('success', msg);
  res.redirect(`/suppliers/${req.params.id}/credit`);
});

// Record payment
router.post('/credit/pay/:credit_id', isLoggedIn, async (req, res) => {
  const { amount, supplier_id } = req.body;
  await db.query('UPDATE supplier_credit SET amount_paid = amount_paid + ?, status = CASE WHEN amount_paid + ? >= total_amount THEN "paid" WHEN amount_paid + ? > 0 THEN "partial" ELSE "pending" END WHERE id = ?',
    [amount, amount, amount, req.params.credit_id]);
  await db.query('UPDATE suppliers SET current_balance = current_balance - ? WHERE id = ?', [amount, supplier_id]);
  req.flash('success', 'Payment recorded');
  res.redirect(`/suppliers/${supplier_id}/credit`);
});

module.exports = router;
