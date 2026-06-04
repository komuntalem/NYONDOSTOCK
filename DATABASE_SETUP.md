# NyondoStock Database Setup

## Problem
You're seeing "check database" error because **MySQL is not running**.

## Solution

### Step 1: Start MySQL Server
You need to start MySQL on your system. 

**Windows:**
- Open Services (services.msc)
- Find "MySQL80" or "MySQL57" (depending on your version)
- Right-click → Start

Or use command line:
```powershell
# If installed as a service
net start MySQL80
# or
sc start MySQL80
```

### Step 2: Create Database & Tables
Once MySQL is running, run the seed file to create the database and add the admin user:

```bash
mysql -u root < config/seed.sql
```

Or use MySQL Workbench/phpMyAdmin and paste the contents of `config/seed.sql`.

### Step 3: Login
Now you can login with:
- **Email:** `admin@nyondo.com`
- **Password:** `password`

---

## Login Credentials (After Setup)

| Email | Password | Role |
|-------|----------|------|
| admin@nyondo.com | password | Admin |

---

## Need to Reset Password?

If you need to add more users or reset the admin password, the bcryptjs hashed password for "password" is:

```
$2a$10$hhcDWn.9rPVTf3H.6yL0rOxDVJ1fH7D6bVGOm3u8nH8Zn8u5q9R.u
```

You can run this SQL to reset:
```sql
UPDATE users SET password = '$2a$10$hhcDWn.9rPVTf3H.6yL0rOxDVJ1fH7D6bVGOm3u8nH8Zn8u5q9R.u' WHERE email = 'admin@nyondo.com';
```

---

## Verify Database Connection

After MySQL is running, test the connection:

```bash
mysql -u root -h localhost
```

You should see a `mysql>` prompt. If not, MySQL isn't running properly.
