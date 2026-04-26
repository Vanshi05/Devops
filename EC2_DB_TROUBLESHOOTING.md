# EC2 Database Setup & Troubleshooting Guide

## Issues Fixed
✅ **Server.js now calls database initialization on startup** - The `initializeDatabase()` function will now run when the server starts, creating tables automatically if they don't exist.

---

## Next Steps: Verify Your EC2 Setup

### 1. **Check PostgreSQL is Running on EC2**

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@98.82.133.159

# Check if PostgreSQL is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Auto-start on reboot
```

### 2. **Verify Database Credentials**

Your `.env` file currently has:
```
DB_USER=vanshi
DB_PASSWORD=        # ← EMPTY!
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medical_dashboard
```

**Check if PostgreSQL user exists and has password:**

```bash
sudo -u postgres psql

# Inside psql:
\du  # List all users
```

If `vanshi` user doesn't exist:
```bash
sudo -u postgres createuser -P vanshi  # -P prompts for password
sudo -u postgres psql -c "ALTER USER vanshi WITH SUPERUSER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE medical_dashboard TO vanshi;"
```

If user exists but you need to set/reset password:
```bash
sudo -u postgres psql -c "ALTER USER vanshi WITH PASSWORD 'your-password';"
```

Then update your `.env`:
```
DB_PASSWORD=your-password
```

### 3. **Verify Database Exists**

```bash
sudo -u postgres psql -l | grep medical_dashboard
```

If it doesn't exist:
```bash
sudo -u postgres createdb medical_dashboard
```

### 4. **Test Connection from Backend**

```bash
# SSH into EC2
cd /path/to/backend

# Test direct connection
psql -U vanshi -h localhost -d medical_dashboard

# If it connects, exit with \q
```

### 5. **Start the Backend Server**

```bash
cd backend
npm install  # If not done yet
npm start
```

**Expected startup output:**
```
🔍 Checking database schema...
✅ Database schema created successfully!
✅ All required tables verified
✅ Database ready, starting server...
Server running on port 5001
```

---

## Common Issues & Solutions

### Issue: "ECONNREFUSED - Connection refused"
**Cause:** PostgreSQL not running or port 5432 not accessible

**Fix:**
```bash
sudo systemctl start postgresql
# Verify port is open
sudo netstat -tuln | grep 5432
```

### Issue: "role vanshi does not exist"
**Cause:** Database user not created

**Fix:**
```bash
sudo -u postgres createuser -P vanshi
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE medical_dashboard TO vanshi;"
```

### Issue: "database medical_dashboard does not exist"
**Cause:** Database not created

**Fix:**
```bash
sudo -u postgres createdb medical_dashboard
# Then restart backend - initialization will create tables
```

### Issue: "password authentication failed"
**Cause:** `.env` password doesn't match PostgreSQL

**Fix:**
1. Check actual password: `sudo -u postgres psql -c "\du"`
2. Reset password: `sudo -u postgres psql -c "ALTER USER vanshi WITH PASSWORD 'newpass';"`
3. Update `.env` with new password

### Issue: "Cannot find module 'dbInit'"
**Cause:** initializeDatabase import failed

**Fix:**
- Verify file exists: `/backend/src/config/dbInit.js`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

---

## Verification Checklist

After startup, verify everything works:

```bash
# 1. Test registration (should succeed)
curl -X POST http://98.82.133.159:5001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","role":"patient","firstName":"Test","lastName":"User"}'

# 2. Check database has new user
sudo -u postgres psql -d medical_dashboard -c "SELECT id, email, role FROM users ORDER BY id DESC LIMIT 5;"

# 3. Test appointment scheduling (requires login first)
# First login to get token
TOKEN=$(curl -s -X POST http://98.82.133.159:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r '.token')

# Then schedule appointment
curl -X POST http://98.82.133.159:5001/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"patientId":1,"providerId":1,"scheduledDate":"2026-05-01T10:00:00","reason":"Checkup"}'
```

---

## File Changes Made

**Modified:** `/backend/src/server.js`
- Added import: `const initializeDatabase = require('./config/dbInit');`
- Wrapped server startup in `initializeDatabase()` call
- Server now waits for DB initialization before starting routes
- Database tables will be auto-created on first startup

**No changes needed to:**
- `/backend/src/config/dbInit.js` - Already correct
- `/backend/src/config/init.sql` - Schema is correct
- `/backend/src/routes/authRoutes.js` - Logic is correct
- `/backend/src/routes/appointmentRoutes.js` - Logic is correct

---

## Production Considerations

For EC2 production setup:

1. **Never use empty passwords** - Set strong DB password
2. **Update JWT_SECRET** in `.env` - Change from "test-secret-key-change-in-production"
3. **Use environment-specific .env** - Don't commit real credentials
4. **Enable PostgreSQL backups** - Use AWS RDS or automated backups
5. **Restrict access** - Only allow backend server to access DB port
6. **Monitor logs** - Check `/var/log/postgresql/` regularly
7. **Set connection limits** - Configure pool size in server.js based on traffic
