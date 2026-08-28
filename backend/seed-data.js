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
    console.log('📍 Seeding Locations...');
    const locationsResult = await client.query('SELECT COUNT(*) as count FROM locations');
    
    if (locationsResult.rows[0].count === 0) {
      const locations = [
        { name: 'Warehouse Mogadishu', type: 'WAREHOUSE' },
        { name: 'Warehouse Hargeisa', type: 'WAREHOUSE' },
        { name: 'Warehouse Kismayo', type: 'WAREHOUSE' },
        { name: 'Branch Mogadishu Center', type: 'BRANCH' },
        { name: 'Branch Hargeisa Downtown', type: 'BRANCH' },
        { name: 'Branch Kismayo Port', type: 'BRANCH' },
      ];

      for (const loc of locations) {
        await client.query(
          'INSERT INTO locations (name, type, created_at) VALUES ($1, $2, now())',
          [loc.name, loc.type]
        );
      }
      console.log(`   ✅ Created ${locations.length} locations`);
    } else {
      console.log(`   ℹ️  Locations already exist (${locationsResult.rows[0].count})`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. SEED USERS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n👤 Seeding Users...');
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    
    if (usersResult.rows[0].count === 0) {
      // Get location IDs for user assignment
      const locIds = await client.query('SELECT id FROM locations ORDER BY created_at');
      const warehouseIds = locIds.rows.slice(0, 3).map(r => r.id);
      const branchIds = locIds.rows.slice(3, 6).map(r => r.id);

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
          locationId: warehouseIds[0]
        },
        {
          name: 'Fatima Mohamed (Branch Manager)',
          email: 'fatima@dhako.com',
          password: 'fatima123',
          role: 'BRANCH_MANAGER',
          locationId: branchIds[0]
        },
        {
          name: 'Hassan Ali (Branch Staff)',
          email: 'hassan@dhako.com',
          password: 'hassan123',
          role: 'BRANCH_STAFF',
          locationId: branchIds[0]
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
    console.log('\n📦 Seeding Products...');
    const productsResult = await client.query('SELECT COUNT(*) as count FROM products');
    
    if (productsResult.rows[0].count === 0) {
      const products = [
        { name: 'Coca Cola 330ml', sku: 'SKU-001', category: 'Beverages', unit: 'can', qty_per_ctn: 24, cost_per_ctn: 240, sell_per_ctn: 360, min_stock_ctn: 5 },
        { name: 'Pepsi 330ml', sku: 'SKU-002', category: 'Beverages', unit: 'can', qty_per_ctn: 24, cost_per_ctn: 220, sell_per_ctn: 340, min_stock_ctn: 5 },
        { name: 'Sprite 330ml', sku: 'SKU-003', category: 'Beverages', unit: 'can', qty_per_ctn: 24, cost_per_ctn: 200, sell_per_ctn: 320, min_stock_ctn: 5 },
        { name: 'Fanta Orange 330ml', sku: 'SKU-004', category: 'Beverages', unit: 'can', qty_per_ctn: 24, cost_per_ctn: 180, sell_per_ctn: 300, min_stock_ctn: 4 },
        { name: 'Mineral Water 600ml', sku: 'SKU-005', category: 'Beverages', unit: 'bottle', qty_per_ctn: 12, cost_per_ctn: 60, sell_per_ctn: 120, min_stock_ctn: 3 },
        { name: 'Instant Noodles Chicken', sku: 'SKU-006', category: 'Snacks', unit: 'pack', qty_per_ctn: 30, cost_per_ctn: 420, sell_per_ctn: 600, min_stock_ctn: 10 },
        { name: 'Instant Noodles Beef', sku: 'SKU-007', category: 'Snacks', unit: 'pack', qty_per_ctn: 30, cost_per_ctn: 420, sell_per_ctn: 600, min_stock_ctn: 10 },
        { name: 'Crackers Mixed', sku: 'SKU-008', category: 'Snacks', unit: 'pack', qty_per_ctn: 20, cost_per_ctn: 350, sell_per_ctn: 500, min_stock_ctn: 5 },
        { name: 'Biscuits Assorted', sku: 'SKU-009', category: 'Snacks', unit: 'pack', qty_per_ctn: 15, cost_per_ctn: 525, sell_per_ctn: 750, min_stock_ctn: 3 },
        { name: 'Cooking Oil 1L', sku: 'SKU-010', category: 'Cooking', unit: 'bottle', qty_per_ctn: 12, cost_per_ctn: 660, sell_per_ctn: 960, min_stock_ctn: 4 },
        { name: 'Rice 2kg Bag', sku: 'SKU-011', category: 'Dry Goods', unit: 'bag', qty_per_ctn: 10, cost_per_ctn: 400, sell_per_ctn: 600, min_stock_ctn: 5 },
        { name: 'Sugar 1kg Bag', sku: 'SKU-012', category: 'Dry Goods', unit: 'bag', qty_per_ctn: 20, cost_per_ctn: 300, sell_per_ctn: 450, min_stock_ctn: 5 },
        { name: 'Salt 1kg Bag', sku: 'SKU-013', category: 'Dry Goods', unit: 'bag', qty_per_ctn: 30, cost_per_ctn: 180, sell_per_ctn: 300, min_stock_ctn: 10 },
        { name: 'Milk Powder 900g', sku: 'SKU-014', category: 'Dairy', unit: 'can', qty_per_ctn: 12, cost_per_ctn: 840, sell_per_ctn: 1200, min_stock_ctn: 3 },
        { name: 'Yogurt 500ml', sku: 'SKU-015', category: 'Dairy', unit: 'pack', qty_per_ctn: 24, cost_per_ctn: 480, sell_per_ctn: 720, min_stock_ctn: 5 },
      ];

      for (const prod of products) {
        await client.query(
          'INSERT INTO products (name, sku, category, unit, qty_per_ctn, cost_per_ctn, sell_per_ctn, min_stock_ctn, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())',
          [prod.name, prod.sku, prod.category, prod.unit, prod.qty_per_ctn, prod.cost_per_ctn, prod.sell_per_ctn, prod.min_stock_ctn, 'ACTIVE']
        );
      }
      console.log(`   ✅ Created ${products.length} products`);
    } else {
      console.log(`   ℹ️  Products already exist (${productsResult.rows[0].count})`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. SEED INITIAL STOCK MOVEMENTS (populate inventory)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📊 Seeding Initial Stock...');
    const movementsResult = await client.query('SELECT COUNT(*) as count FROM stock_movements');
    
    if (movementsResult.rows[0].count === 0) {
      // Get IDs we need
      const adminUser = await client.query('SELECT id FROM users WHERE email = $1', ['admin@dhako.com']);
      const userId = adminUser.rows[0].id;

      const locations = await client.query('SELECT id, type FROM locations ORDER BY created_at');
      const warehouseIds = locations.rows.filter(r => r.type === 'WAREHOUSE').map(r => r.id);
      const branchIds = locations.rows.filter(r => r.type === 'BRANCH').map(r => r.id);

      const products = await client.query('SELECT id, cost_per_ctn FROM products ORDER BY created_at');

      let movementCount = 0;

      // Add initial stock to warehouses
      for (const warehouse of warehouseIds) {
        for (const product of products.rows) {
          const qty = Math.floor(Math.random() * 30) + 10; // 10-40 cartoons per product per warehouse
          await client.query(
            'INSERT INTO stock_movements (type, product_id, from_location_id, to_location_id, qty_ctn, cost_per_ctn, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, now())',
            ['STOCK_RECEIVED', product.id, null, warehouse, qty, product.cost_per_ctn, userId]
          );
          movementCount++;
        }
      }

      // Add some stock to branches
      for (const branch of branchIds) {
        for (const product of products.rows.slice(0, 10)) { // Only first 10 products
          const qty = Math.floor(Math.random() * 15) + 3; // 3-18 cartoons
          await client.query(
            'INSERT INTO stock_movements (type, product_id, from_location_id, to_location_id, qty_ctn, cost_per_ctn, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, now())',
            ['STOCK_RECEIVED', product.id, null, branch, qty, product.cost_per_ctn, userId]
          );
          movementCount++;
        }
      }

      console.log(`   ✅ Created ${movementCount} stock movements`);
    } else {
      console.log(`   ℹ️  Stock movements already exist (${movementsResult.rows[0].count})`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. SEED CUSTOMERS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n👥 Seeding Customers...');
    const customersResult = await client.query('SELECT COUNT(*) as count FROM customers');
    
    if (customersResult.rows[0].count === 0) {
      const locations = await client.query('SELECT id FROM locations WHERE type = $1 ORDER BY created_at', ['BRANCH']);
      const branchIds = locations.rows.map(r => r.id);

      const customers = [
        { name: 'Ali Mohamed Store', phone: '+252615123456', email: 'ali@store.com', locationId: branchIds[0] },
        { name: 'Habiba Trading', phone: '+252614234567', email: 'habiba@trade.com', locationId: branchIds[0] },
        { name: 'Hassan General Goods', phone: '+252613345678', email: 'hassan@goods.com', locationId: branchIds[1] },
        { name: 'Zainab Wholesale', phone: '+252612456789', email: 'zainab@whole.com', locationId: branchIds[1] },
        { name: 'Ibrahim Market', phone: '+252611567890', email: 'ibrahim@market.com', locationId: branchIds[2] },
        { name: 'Amina Retail Shop', phone: '+252610678901', email: 'amina@retail.com', locationId: branchIds[2] },
      ];

      for (const cust of customers) {
        await client.query(
          'INSERT INTO customers (name, phone, email, location_id, created_at) VALUES ($1, $2, $3, $4, now())',
          [cust.name, cust.phone, cust.email, cust.locationId]
        );
      }
      console.log(`   ✅ Created ${customers.length} customers`);
    } else {
      console.log(`   ℹ️  Customers already exist (${customersResult.rows[0].count})`);
    }

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

    console.log('📍 Locations:', counts.locations.rows[0].count);
    console.log('👤 Users:', counts.users.rows[0].count);
    console.log('📦 Products:', counts.products.rows[0].count);
    console.log('📊 Stock Movements:', counts.movements.rows[0].count);
    console.log('👥 Customers:', counts.customers.rows[0].count);

    console.log('\n✅ Your database is now ready to use!\n');
    console.log('🔐 Test Logins:');
    console.log('   Admin:              admin@dhako.com / admin123');
    console.log('   Inventory Manager:  ahmed@dhako.com / ahmed123');
    console.log('   Branch Manager:     fatima@dhako.com / fatima123');
    console.log('   Branch Staff:       hassan@dhako.com / hassan123\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedDatabase();
