const fs = require('fs');
const path = require('path');

async function initializeDatabase(db) {
  try {
    console.log('🔍 Checking database schema...');

    // Check if users table exists
    const tableCheck = await db.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')`
    );

    if (!tableCheck.rows[0].exists) {
      console.log('📝 Creating database schema...');

      // Read the init SQL file
      const initSqlPath = path.join(__dirname, 'init.sql');
      const initSql = fs.readFileSync(initSqlPath, 'utf8');

      // Execute the init script
      await db.query(initSql);
      console.log('✅ Database schema created successfully!');
    } else {
      console.log('✅ Database schema already exists');
    }

    // Verify all required tables exist
    const requiredTables = ['users', 'patients', 'providers', 'medical_records', 'prescriptions', 'appointments', 'documents'];

    for (const table of requiredTables) {
      const check = await db.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
        [table]
      );

      if (!check.rows[0].exists) {
        throw new Error(`Required table '${table}' is missing`);
      }
    }

    console.log('✅ All required tables verified');
    return true;
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  }
}

module.exports = initializeDatabase;
