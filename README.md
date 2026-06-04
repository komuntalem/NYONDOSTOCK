# NyondoStock 🔨
**Hardware Inventory, Credit Scheme & Sales Management System**  
*NYONDO General Hardware LTD — Nansana, Uganda*

---

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up MySQL Database
Open MySQL and run:
```sql
SOURCE config/schema.sql;
```

Or manually create the database:
```bash
mysql -u root -p < config/schema.sql
```

### 3. Configure Environment
Edit `.env` file:
```
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=nyondostock
SESSION_SECRET=any_secret_string
PORT=3000
```

### 4. Start the App
```bash
node app.js
```
Visit: **http://localhost:3000**

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nyondo.com | password |
| Store Manager | manager@nyondo.com | password |
| Sales Attendant | sales@nyondo.com | password |

> ⚠️ The default password for all seeded accounts is **`password`** (not `admin123`). Change all passwords immediately after first login!

---

## 📦 Features

### ✅ Stock / Products
- Add, edit, delete products
- Track stock levels with alerts
- Restock functionality
- Categories: Cement, Iron Bars, Iron Sheets, Nails, Wire, etc.
- **Validation**: Selling price must be > cost price

### ✅ Sales (POS)
- Live point-of-sale with cart system
- Search and add products
- Transport cost calculator
- Discount management
- Printable receipt
- Payment methods: Cash, Mobile Money, Credit

### ✅ Supplier Credit Management
- Register suppliers
- Record stock arrivals on credit
- Track outstanding balances
- Record payments
- Auto-update inventory on delivery

### ✅ Deposit Scheme (Salary Earners)
- Register deposit members (need valid NIN + phone)
- Track savings progress for Cement, Iron Sheets & Bars
- Record payments with receipts
- Progress bar showing completion %

### ✅ Transport
- Auto-calculator: **FREE** for orders ≥ UGX 500,000 within 10km
- Base charge: UGX 30,000 + UGX 3,000/km beyond 10km
- Integrated into POS

### ✅ Reports (Manager/Admin)
- Revenue, Cost, Profit summary
- Top-selling products
- Daily sales breakdown
- Supplier outstanding debts

### ✅ User Management (Admin)
- Create users with roles
- Sales Attendant / Store Manager / Admin
- Ugandan phone validation

---

## 👥 User Roles & Permissions

| Feature | Sales Attendant | Store Manager | Admin |
|---------|:-:|:-:|:-:|
| View Stock | ✅ | ✅ | ✅ |
| Add/Edit Stock | ❌ | ✅ | ✅ |
| Record Sales | ✅ | ✅ | ✅ |
| View Reports | ❌ | ✅ | ✅ |
| Manage Suppliers | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ✅ |

---

## 🛠️ Tech Stack
- **Frontend**: Pug (templating), Bootstrap 5, Vanilla JS
- **Backend**: Node.js + Express.js
- **Database**: MySQL (mysql2)
- **Auth**: express-session + bcryptjs
- **Validation**: Ugandan phone numbers, price checks

---

## 📁 Project Structure
```
nyondostock/
├── app.js              ← Entry point
├── .env                ← Your config (edit this)
├── config/
│   ├── db.js           ← MySQL connection
│   └── schema.sql      ← Database setup
├── routes/             ← All route handlers
├── models/
│   └── auth.js         ← Auth middleware
├── views/
│   ├── layouts/        ← main.pug (base template)
│   ├── partials/       ← navbar.pug, sidebar.pug
│   ├── auth/           ← login.pug
│   ├── dashboard/
│   ├── products/
│   ├── sales/
│   ├── suppliers/
│   ├── customers/
│   ├── deposits/
│   ├── transport/
│   ├── reports/
│   └── users/
└── public/
    ├── css/style.css   ← Black/White/Yellow theme
    └── js/main.js
```

---

*Built for the Makerere/Phoenix Files Web Development Intake — Good luck! 🎓*
