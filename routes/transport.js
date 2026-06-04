const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isLoggedIn } = require('../models/auth');

router.get('/', isLoggedIn, async (req, res) => {
  const [records] = await db.query(`
    SELECT t.*, s.grand_total as sale_total FROM transport t 
    LEFT JOIN sales s ON t.sale_id=s.id ORDER BY t.transport_date DESC LIMIT 50`);
  res.render('transport/index', { title: 'Transport Records', records });
});

// Transport charge calculator: free within 10km for orders >= 500,000
router.post('/calculate', isLoggedIn, (req, res) => {
  const { distance_km, order_amount } = req.body;
  const km = parseFloat(distance_km);
  const amount = parseFloat(order_amount);
  let charge = 0;
  let is_free = false;
  if (amount >= 500000 && km <= 10) {
    is_free = true;
    charge = 0;
  } else {
    charge = 30000 + (km > 10 ? (km - 10) * 3000 : 0);
  }
  res.json({ charge, is_free });
});

module.exports = router;
