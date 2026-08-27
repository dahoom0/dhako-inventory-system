const { Client } = require('pg');
const fs = require('fs');

// Using external URL (will work from anywhere)
const client = new Client({
  connectionString: 'postgresql://dhako_user:eH4lDu614dfwTpVVqXp1VvPFUqA3Uzgj@dpg-da7vmi0ae00c73a9i5i0-a.onrender.com:5432/dhako',
  ssl: { rejectUnauthorized: false },
  connect_timeout: 10
});

async function initializeDatabase() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📝 Running initialization SQL...');
    const sql = fs.readFileSync('./init-database.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    let success = 0;
    let skipped = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt) {
        try {
          await client.query(stmt);
          success++;
          process.stdout.write('.');
        } catch (err) {
          // Ignore "already exists" errors
          if (err.message.includes('already exists')) {
            skipped++;
            process.stdout.write('⚠');
          } else {
            console.error(`\n❌ Error on statement ${i + 1}:`, err.message);
            throw err;
          }
        }
      }
    }

    console.log(`\n✅ Executed: ${success}, Skipped (already exists): ${skipped}\n`);
    
    // Verify data
    console.log('📊 Verifying tables:');
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    result.rows.forEach(row => console.log(`  ✓ ${row.table_name}`));

    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n👤 Users: ${userCount.rows[0].count}`);

    const productCount = await client.query('SELECT COUNT(*) as count FROM products');
    console.log(`📦 Products: ${productCount.rows[0].count}`);

    const locationCount = await client.query('SELECT COUNT(*) as count FROM locations');
    console.log(`📍 Locations: ${locationCount.rows[0].count}`);

    console.log('\n🎉 Database ready! You can now:\n');
    console.log('  1. Start backend: npm run dev');
    console.log('  2. Login with: admin@dhako.com / admin123\n');

  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    console.error('\nMake sure:');
    console.error('  - PostgreSQL database is available');
    console.error('  - Connection string is correct');
    console.error('  - Your firewall allows outbound connections\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

initializeDatabase();


