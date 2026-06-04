require('dotenv').config();
const db = require('./config/db');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const [result] = await db.query('SELECT 1 as connected');
    console.log('✅ Database connected:', result);

    console.log('\n📋 Checking tables...');
    const [tables] = await db.query('SHOW TABLES');
    console.log('Tables:', tables.map(t => Object.values(t)[0]));

    console.log('\n👥 Checking customers table structure...');
    const [customers] = await db.query('DESCRIBE customers');
    console.log('Customers columns:', customers.map(c => `${c.Field} (${c.Type})`));

    console.log('\n📦 Sample customers:');
    const [sampleCustomers] = await db.query('SELECT * FROM customers LIMIT 5');
    console.log('Found', sampleCustomers.length, 'customers:', sampleCustomers);

    process.exit(0);
  } catch (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  }
}

testConnection();
