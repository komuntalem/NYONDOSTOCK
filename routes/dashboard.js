const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isLoggedIn } = require('../models/auth');

router.get('/', isLoggedIn, async (req, res) => {
  try {
    const [[{ total_products }]] = await db.query('SELECT COUNT(*) as total_products FROM products');
    const [[{ total_sales }]] = await db.query('SELECT COUNT(*) as total_sales FROM sales WHERE DATE(sale_date) = CURDATE()');
    const [[{ today_revenue }]] = await db.query("SELECT COALESCE(SUM(grand_total),0) as today_revenue FROM sales WHERE DATE(sale_date) = CURDATE() AND status='completed'");
    const [[{ low_stock }]] = await db.query('SELECT COUNT(*) as low_stock FROM products WHERE quantity <= min_stock_level');
    const [[{ pending_supplier }]] = await db.query("SELECT COALESCE(SUM(balance),0) as pending_supplier FROM supplier_credit WHERE status != 'paid'");
    const [[{ active_deposits }]] = await db.query("SELECT COUNT(*) as active_deposits FROM deposits WHERE status='active'");

    const [recent_sales] = await db.query(`
      SELECT s.*, u.name as staff_name 
      FROM sales s JOIN users u ON s.user_id = u.id 
      ORDER BY s.sale_date DESC LIMIT 5
    `);

    const [low_stock_products] = await db.query(
      'SELECT * FROM products WHERE quantity <= min_stock_level ORDER BY quantity ASC LIMIT 5'
    );

    res.render('dashboard/index', {
      title: 'Dashboard - NyondoStock',
      stats: { total_products, total_sales, today_revenue, low_stock, pending_supplier, active_deposits },
      recent_sales,
      low_stock_products
    });
  } catch (err) {
    console.error(err);
    res.render('dashboard/index', { title: 'Dashboard', stats: {}, recent_sales: [], low_stock_products: [] });
  }
});

module.exports = router;
