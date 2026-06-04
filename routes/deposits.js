const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isLoggedIn } = require('../models/auth');

router.get('/', isLoggedIn, async (req, res) => {
  const [deposits] = await db.query(`
    SELECT d.*, c.name as customer_name, c.phone, p.name as product_name, p.selling_price
    FROM deposits d JOIN customers c ON d.customer_id=c.id JOIN products p ON d.product_id=p.id
    ORDER BY d.created_at DESC`);
  res.render('deposits/index', { title: 'Deposit Scheme', deposits });
});

router.get('/add', isLoggedIn, async (req, res) => {
  const [customers] = await db.query("SELECT * FROM customers WHERE is_deposit_member=1 ORDER BY name");
  const [products] = await db.query("SELECT * FROM products WHERE category IN ('Cement','Iron Sheets','Iron Bars') ORDER BY name");
  res.render('deposits/form', { title: 'New Deposit Account', customers, products });
});

router.post('/add', isLoggedIn, async (req, res) => {
  const { customer_id, product_id, quantity } = req.body;
  const [[product]] = await db.query('SELECT selling_price FROM products WHERE id=?', [product_id]);
  if (!product) {
    req.flash('error', 'Selected product is not valid');
    return res.redirect('/deposits/add');
  }
  const qty = parseInt(quantity, 10) || 1;
  const target_amount = parseFloat(product.selling_price) * qty;
  await db.query('INSERT INTO deposits (customer_id, product_id, quantity, target_amount) VALUES (?,?,?,?)',
    [customer_id, product_id, qty, target_amount]);
  req.flash('success', 'Deposit account created');
  res.redirect('/deposits');
});

router.get('/:id', isLoggedIn, async (req, res) => {
  const [[deposit]] = await db.query(`
    SELECT d.*, c.name as customer_name, c.phone, c.nin, p.name as product_name, p.selling_price, p.unit
    FROM deposits d JOIN customers c ON d.customer_id=c.id JOIN products p ON d.product_id=p.id WHERE d.id=?`, [req.params.id]);
  if (!deposit) return res.redirect('/deposits');
  const [payments] = await db.query(`
    SELECT dp.*, u.name as recorded_by_name FROM deposit_payments dp 
    LEFT JOIN users u ON dp.recorded_by=u.id WHERE dp.deposit_id=? ORDER BY dp.payment_date DESC`, [req.params.id]);
  res.render('deposits/view', { title: `Deposit - ${deposit.customer_name}`, deposit, payments });
});

router.get('/:id/collect', isLoggedIn, async (req, res) => {
  const [[deposit]] = await db.query(`
    SELECT d.*, c.name as customer_name, c.phone, c.nin, p.name as product_name, p.selling_price, p.unit
    FROM deposits d JOIN customers c ON d.customer_id=c.id JOIN products p ON d.product_id=p.id WHERE d.id=?`, [req.params.id]);
  if (!deposit) return res.redirect('/deposits');
  if (deposit.status !== 'active') {
    req.flash('error', 'Only active deposits can be collected');
    return res.redirect(`/deposits/${req.params.id}`);
  }
  res.render('deposits/collect', { title: `Collect Goods - ${deposit.customer_name}`, deposit });
});

router.post('/:id/collect', isLoggedIn, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[deposit]] = await conn.query(`
      SELECT d.*, c.name as customer_name, c.id as customer_id, p.name as product_name, p.selling_price, p.quantity as stock_quantity
      FROM deposits d
      JOIN customers c ON d.customer_id=c.id
      JOIN products p ON d.product_id=p.id
      WHERE d.id=? FOR UPDATE`, [req.params.id]);
    if (!deposit) {
      throw new Error('Deposit record not found');
    }
    if (deposit.status !== 'active') {
      throw new Error('Deposit is already completed or cancelled');
    }
    if (deposit.stock_quantity < deposit.quantity) {
      throw new Error('Insufficient stock to complete this collection');
    }

    const current_total = parseFloat(deposit.selling_price) * deposit.quantity;
    const amount_deposited = parseFloat(deposit.amount_deposited);
    const balance_due = current_total - amount_deposited;
    const final_payment = balance_due > 0 ? balance_due : 0;
    const payment_method = req.body.payment_method || 'cash';
    const notes = balance_due < 0
      ? `Deposit exceeded current price. Refund due UGX ${Math.abs(balance_due).toFixed(2)}.`
      : `Deposit collection completed. Previous deposits UGX ${amount_deposited.toFixed(2)}.`;

    const [saleResult] = await conn.query(
      'INSERT INTO sales (customer_id, customer_name, user_id, total_amount, discount, transport_cost, grand_total, payment_method, notes) VALUES (?,?,?,?,?,?,?,?,?)',
      [deposit.customer_id, deposit.customer_name, req.session.user.id, current_total, 0, 0, final_payment, payment_method, notes]
    );
    const saleId = saleResult.insertId;

    await conn.query(
      'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?,?,?,?,?)',
      [saleId, deposit.product_id, deposit.quantity, deposit.selling_price, current_total]
    );
    await conn.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [deposit.quantity, deposit.product_id]);
    await conn.query('UPDATE deposits SET status = ?, completed_at = ? WHERE id = ?', ['completed', new Date(), req.params.id]);
    await conn.commit();

    req.flash('success', 'Goods collected and sale recorded successfully');
    res.redirect(`/sales/receipt/${saleId}`);
  } catch (err) {
    await conn.rollback();
    req.flash('error', err.message || 'Unable to complete collection');
    res.redirect(`/deposits/${req.params.id}`);
  } finally {
    if (conn) conn.release();
  }
});

router.post('/:id/pay', isLoggedIn, async (req, res) => {
  const { amount } = req.body;
  const [[deposit]] = await db.query('SELECT * FROM deposits WHERE id=?', [req.params.id]);
  if (!deposit || deposit.status !== 'active') {
    req.flash('error', 'Cannot record payment for this deposit');
    return res.redirect(`/deposits/${req.params.id}`);
  }
  const new_total = parseFloat(deposit.amount_deposited) + parseFloat(amount);
  await db.query('UPDATE deposits SET amount_deposited=? WHERE id=?', [new_total, req.params.id]);
  await db.query('INSERT INTO deposit_payments (deposit_id, amount, recorded_by) VALUES (?,?,?)',
    [req.params.id, amount, req.session.user.id]);
  req.flash('success', `Payment of UGX ${parseInt(amount).toLocaleString()} recorded`);
  res.redirect(`/deposits/${req.params.id}`);
});

module.exports = router;
