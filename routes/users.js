const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { isLoggedIn, isAdmin } = require('../models/auth');

router.get('/', isLoggedIn, isAdmin, async (req, res) => {
  const [users] = await db.query('SELECT id, name, email, role, phone, created_at FROM users ORDER BY name');
  res.render('users/index', { title: 'User Management', users });
});

router.get('/add', isLoggedIn, isAdmin, (req, res) => {
  res.render('users/form', { title: 'Add User', user: {} });
});

router.post('/add', isLoggedIn, isAdmin, async (req, res) => {
  const { name, email, password, role, phone, nin } = req.body;
  if (!phone || !/^(07|06)\d{8}$/.test(phone.replace(/\s/g,''))) {
    req.flash('error', 'Valid Ugandan phone required'); return res.redirect('/users/add');
  }
  const hash = await bcrypt.hash(password, 10);
  await db.query('INSERT INTO users (name, email, password, role, phone, nin) VALUES (?,?,?,?,?,?)',
    [name, email, hash, role, phone, nin]);
  req.flash('success', 'User created');
  res.redirect('/users');
});

router.post('/delete/:id', isLoggedIn, isAdmin, async (req, res) => {
  if (req.params.id == req.session.user.id) { req.flash('error', 'Cannot delete yourself'); return res.redirect('/users'); }
  await db.query('DELETE FROM users WHERE id=?', [req.params.id]);
  req.flash('success', 'User deleted');
  res.redirect('/users');
});

module.exports = router;
