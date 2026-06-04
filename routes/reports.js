const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isLoggedIn, isManagerOrAdmin } = require('../models/auth');

router.get('/', isLoggedIn, isManagerOrAdmin, async (req, res) => {
  const from = req.query.from || new Date().toISOString().slice(0,10);
  const to = req.query.to || new Date().toISOString().slice(0,10);

  const [[revenue]] = await db.query(
    "SELECT COALESCE(SUM(grand_total),0) as total FROM sales WHERE DATE(sale_date) BETWEEN ? AND ? AND status='completed'", [from, to]);
  const [[cost]] = await db.query(
    `SELECT COALESCE(SUM(si.quantity * p.cost_price),0) as total 
     FROM sale_items si JOIN products p ON si.product_id=p.id 
     JOIN sales s ON si.sale_id=s.id WHERE DATE(s.sale_date) BETWEEN ? AND ? AND s.status='completed'`, [from, to]);
  const profit = revenue.total - cost.total;

  const [top_products] = await db.query(`
    SELECT p.name, SUM(si.quantity) as qty_sold, SUM(si.subtotal) as revenue
    FROM sale_items si JOIN products p ON si.product_id=p.id 
    JOIN sales s ON si.sale_id=s.id WHERE DATE(s.sale_date) BETWEEN ? AND ?
    GROUP BY p.id ORDER BY revenue DESC LIMIT 10`, [from, to]);

  const [daily_sales] = await db.query(`
    SELECT DATE(sale_date) as day, COUNT(*) as count, SUM(grand_total) as total
    FROM sales WHERE DATE(sale_date) BETWEEN ? AND ? AND status='completed'
    GROUP BY DATE(sale_date) ORDER BY day`, [from, to]);

  const [supplier_debts] = await db.query(`
    SELECT s.name, SUM(sc.balance) as total_debt FROM supplier_credit sc 
    JOIN suppliers s ON sc.supplier_id=s.id WHERE sc.status != 'paid' GROUP BY s.id`);

  res.render('reports/index', {
    title: 'Reports', from, to,
    revenue: revenue.total, cost: cost.total, profit,
    top_products, daily_sales, supplier_debts
  });
});

module.exports = router;
