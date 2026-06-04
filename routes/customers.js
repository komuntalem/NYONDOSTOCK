const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isLoggedIn } = require('../models/auth');

// Validate Ugandan phone
function validPhone(phone) { return /^(07|06)\d{8}$/.test(phone.replace(/\s/g,'')); }

router.get('/', isLoggedIn, async (req, res) => {
  const search = req.query.search || '';
  // Get customers from database who match search
  const [customers] = await db.query(
    'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? ORDER BY name',
    [`%${search}%`, `%${search}%`, `%${search}%`]
  );
  res.render('customers/index', { title: 'Customers', customers, search });
});

router.get('/add', isLoggedIn, (req, res) => {
  res.render('customers/form', { title: 'Add Customer', customer: {} });
});

router.post('/add', isLoggedIn, async (req, res) => {
  const { name, phone, nin, email, address } = req.body;
  if (!validPhone(phone)) { req.flash('error', 'Invalid Ugandan phone number'); return res.redirect('/customers/add'); }
  await db.query('INSERT INTO customers (name, phone, nin, email, address, is_deposit_member) VALUES (?,?,?,?,?,?)',
    [name, phone, nin, email, address, 1]);
  req.flash('success', 'Customer added');
  res.redirect('/customers');
});

router.get('/edit/:id', isLoggedIn, async (req, res) => {
  const [[customer]] = await db.query('SELECT * FROM customers WHERE id=?', [req.params.id]);
  res.render('customers/form', { title: 'Edit Customer', customer });
});

router.post('/edit/:id', isLoggedIn, async (req, res) => {
  const { name, phone, nin, email, address } = req.body;
  if (!validPhone(phone)) { req.flash('error', 'Invalid Ugandan phone number'); return res.redirect(`/customers/edit/${req.params.id}`); }
  await db.query('UPDATE customers SET name=?, phone=?, nin=?, email=?, address=?, is_deposit_member=? WHERE id=?',
    [name, phone, nin, email, address, 1, req.params.id]);
  req.flash('success', 'Customer updated');
  res.redirect('/customers');
});

module.exports = router;
