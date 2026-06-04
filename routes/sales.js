const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isLoggedIn } = require('../models/auth');

// Sales list
router.get('/', isLoggedIn, async (req, res) => {
  const date = req.query.date || '';
  let query = `SELECT s.*, u.name as staff_name, c.name as cust_name 
               FROM sales s JOIN users u ON s.user_id=u.id 
               LEFT JOIN customers c ON s.customer_id=c.id WHERE 1=1`;
  const params = [];
  if (date) { query += ' AND DATE(s.sale_date) = ?'; params.push(date); }
  query += ' ORDER BY s.sale_date DESC LIMIT 100';
  const [sales] = await db.query(query, params);
  res.render('sales/index', { title: 'Sales Records', sales, date });
});


router.get('/new', isLoggedIn, async (req, res) => {
  const [products] = await db.query('SELECT * FROM products WHERE quantity > 0 ORDER BY name');
  const [customers] = await db.query('SELECT * FROM customers ORDER BY name');
  res.render('sales/new', { title: 'New Sale', products, customers });
});

// Create sale
router.post('/create', isLoggedIn, async (req, res) => {
  let conn;
  try {
    conn = await require('../config/db').getConnection();
    await conn.beginTransaction();
    const { customer_id, customer_name, customer_phone, payment_method, transport_cost, discount, notes, items } = req.body;
    
    console.log('Creating sale with data:', { customer_id, customer_name, customer_phone, payment_method });
    
    const parsedItems = JSON.parse(items);
    if (!parsedItems.length) throw new Error('No items selected');

    let total_amount = 0;
    for (const item of parsedItems) {
      total_amount += item.qty * item.price;
    }
    const grand_total = total_amount - (parseFloat(discount) || 0) + (parseFloat(transport_cost) || 0);

    let finalCustomerId = customer_id || null;

    if (customer_phone && customer_phone.trim()) {
      try {
        const [existing] = await conn.query('SELECT id FROM customers WHERE phone = ?', [customer_phone]);
        if (existing.length === 0) {
          const [result] = await conn.query(
            'INSERT INTO customers (name, phone) VALUES (?,?)',
            [customer_name || 'Customer', customer_phone]
          );
          finalCustomerId = result.insertId;
          console.log('Created customer:', finalCustomerId);
        } else {
          finalCustomerId = existing[0].id;
          console.log('Using existing customer:', finalCustomerId);
        }
      } catch (err) {
        console.error('Customer creation error:', err);
      }
    }

    const [result] = await conn.query(
      'INSERT INTO sales (customer_id, customer_name, user_id, total_amount, discount, transport_cost, grand_total, payment_method, notes) VALUES (?,?,?,?,?,?,?,?,?)',
      [finalCustomerId, customer_name || 'Walk-in', req.session.user.id, total_amount, discount || 0, transport_cost || 0, grand_total, payment_method || 'cash', notes]
    );
    const sale_id = result.insertId;

    for (const item of parsedItems) {
      await conn.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?,?,?,?,?)',
        [sale_id, item.product_id, item.qty, item.price, item.qty * item.price]
      );
      await conn.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [item.qty, item.product_id]);
    }

    if (parseFloat(transport_cost) > 0) {
      const destination = req.body.destination ? req.body.destination.trim() : '';
      await conn.query(
        'INSERT INTO transport (sale_id, destination, total_charge) VALUES (?,?,?)',
        [sale_id, destination || 'Local', transport_cost]
      );
    }

    await conn.commit();
    console.log('Sale created successfully:', sale_id);
    req.flash('success', `Sale #${sale_id} recorded successfully!`);
    res.json({ success: true, sale_id });
  } catch (err) {
    console.error('Sale creation error:', err);
    if (conn) await conn.rollback();
    res.json({ success: false, message: err.message });
  } finally {
    if (conn) conn.release();
  }
});

router.get('/receipt/:id', isLoggedIn, async (req, res) => {
  const [[sale]] = await db.query(`
    SELECT s.*, u.name as staff_name FROM sales s JOIN users u ON s.user_id=u.id WHERE s.id=?`, [req.params.id]);
  if (!sale) return res.redirect('/sales');
  const [items] = await db.query(
    'SELECT si.*, p.name as product_name, p.unit FROM sale_items si JOIN products p ON si.product_id=p.id WHERE si.sale_id=?',
    [req.params.id]
  );
  res.render('sales/receipt', { title: `Receipt #${req.params.id}`, sale, items });
});

module.exports = router;
