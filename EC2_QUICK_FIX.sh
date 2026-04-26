#!/bin/bash
# EC2 Quick Fix Script - Run this on your EC2 instance
# Usage: bash EC2_QUICK_FIX.sh

set -e

echo "🔧 Medical Dashboard - EC2 Database Setup"
echo "=========================================="

# 1. Check PostgreSQL service
echo ""
echo "📋 Checking PostgreSQL service..."
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL not running - starting it..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    echo "✅ PostgreSQL started"
fi

# 2. Check if vanshi user exists
echo ""
echo "📋 Checking database user 'vanshi'..."
if sudo -u postgres psql -c "\du" | grep -q vanshi; then
    echo "✅ User 'vanshi' exists"
else
    echo "⚠️  User 'vanshi' not found - creating it..."
    echo "📝 Enter password for vanshi user:"
    sudo -u postgres createuser -P vanshi
    echo "✅ User 'vanshi' created"
fi

# 3. Check if database exists
echo ""
echo "📋 Checking database 'medical_dashboard'..."
if sudo -u postgres psql -l | grep -q medical_dashboard; then
    echo "✅ Database 'medical_dashboard' exists"
else
    echo "⚠️  Database not found - creating it..."
    sudo -u postgres createdb medical_dashboard
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE medical_dashboard TO vanshi;"
    echo "✅ Database 'medical_dashboard' created"
fi

# 4. Check PostgreSQL port
echo ""
echo "📋 Checking PostgreSQL port 5432..."
if sudo netstat -tuln | grep -q 5432; then
    echo "✅ Port 5432 is listening"
else
    echo "❌ Port 5432 not listening - check PostgreSQL logs"
fi

# 5. Test direct connection
echo ""
echo "📋 Testing database connection..."
if PGPASSWORD='' psql -U vanshi -h localhost -d medical_dashboard -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Direct connection works (no password)"
else
    echo "⚠️  Connection failed - may need password configured"
    echo "    Update .env with your database password"
fi

echo ""
echo "✅ Setup check complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update /backend/.env with your database password (if any)"
echo "2. cd /path/to/backend"
echo "3. npm install"
echo "4. npm start"
echo ""
echo "Expected output: '✅ Database ready, starting server...'"
