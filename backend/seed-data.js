const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Using external URL (will work from anywhere)
const client = new Client({
  connectionString: 'postgresql://dhako_user:eH4lDu614dfwTpVVqXp1VvPFUqA3Uzgj@dpg-da7vmi0ae00c73a9i5i0-a.onrender.com:5432/dhako',
  ssl: { rejectUnauthorized: false },
  connect_timeout: 10
});

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🌱 Starting database seeding...\n');

    // ═══════════════════════════════════════════════════════════════════════
    // 1. SEED LOCATIONS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('📍 Locations seeding disabled');
    console.log('   ℹ️  Admin will register locations manually via the admin panel')

    // ═══════════════════════════════════════════════════════════════════════
    // 2. SEED USERS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n👤 Seeding Users...');
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    
    if (usersResult.rows[0].count === 0) {
      const users = [
        {
          name: 'System Admin',
          email: 'admin@dhako.com',
          password: 'admin123',
          role: 'ADMIN',
          locationId: null
        },
        {
          name: 'Ahmed Hassan (Inventory Manager)',
          email: 'ahmed@dhako.com',
          password: 'ahmed123',
          role: 'INVENTORY_MANAGER',
          locationId: null
        },
        {
          name: 'Fatima Mohamed (Branch Manager)',
          email: 'fatima@dhako.com',
          password: 'fatima123',
          role: 'BRANCH_MANAGER',
          locationId: null
        },
        {
          name: 'Hassan Ali (Branch Staff)',
          email: 'hassan@dhako.com',
          password: 'hassan123',
          role: 'BRANCH_STAFF',
          locationId: null
        }
      ];

      for (const user of users) {
        const passwordHash = await bcrypt.hash(user.password, 12);
        await client.query(
          'INSERT INTO users (name, email, password_hash, role, location_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, now(), now())',
          [user.name, user.email, passwordHash, user.role, user.locationId]
        );
      }
      console.log(`   ✅ Created ${users.length} users`);
      console.log('   Login credentials:');
      console.log('     - admin@dhako.com / admin123 (ADMIN)');
      console.log('     - ahmed@dhako.com / ahmed123 (INVENTORY_MANAGER)');
      console.log('     - fatima@dhako.com / fatima123 (BRANCH_MANAGER)');
      console.log('     - hassan@dhako.com / hassan123 (BRANCH_STAFF)');
    } else {
      console.log(`   ℹ️  Users already exist (${usersResult.rows[0].count})`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. SEED PRODUCTS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📦 Products seeding disabled');
    console.log('   ℹ️  Admin will create products manually via the admin panel')

    // ═══════════════════════════════════════════════════════════════════════
    // 4. SEED INITIAL STOCK MOVEMENTS (populate inventory)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📊 Stock movements seeding disabled');
    console.log('   ℹ️  Stock will be populated after locations are created')

    // ═══════════════════════════════════════════════════════════════════════
    // 5. SEED CUSTOMERS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n👥 Customers seeding disabled');
    console.log('   ℹ️  Customers can be created after locations are set up')

    // ═══════════════════════════════════════════════════════════════════════
    // 6. SUMMARY
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    console.log('📊 DATABASE SEEDING COMPLETE!\n');

    const counts = {
      locations: await client.query('SELECT COUNT(*) as count FROM locations'),
      users: await client.query('SELECT COUNT(*) as count FROM users'),
      products: await client.query('SELECT COUNT(*) as count FROM products'),
      movements: await client.query('SELECT COUNT(*) as count FROM stock_movements'),
      customers: await client.query('SELECT COUNT(*) as count FROM customers'),
    };

    console.log('📍 Locations:', counts.locations.rows[0].count, '(ready for admin to create)');
    console.log('👤 Users:', counts.users.rows[0].count);
    console.log('📦 Products:', counts.products.rows[0].count);
    console.log('📊 Stock Movements:', counts.movements.rows[0].count, '(ready after locations created)');
    console.log('👥 Customers:', counts.customers.rows[0].count, '(ready after locations created)');

    console.log('\n✅ Your database is ready!\n');
    console.log('🔐 Test Logins:');
    console.log('   Admin:              admin@dhako.com / admin123');
    console.log('   Inventory Manager:  ahmed@dhako.com / ahmed123');
    console.log('   Branch Manager:     fatima@dhako.com / fatima123');
    console.log('   Branch Staff:       hassan@dhako.com / hassan123\n');
    console.log('📝 Next Steps:');
    console.log('   1. Login as admin@dhako.com');
    console.log('   2. Go to Admin > Warehouses');
    console.log('   3. Register new locations (WAREHOUSE or BRANCH type)\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedDatabase();
