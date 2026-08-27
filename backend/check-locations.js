const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: 'postgresql://dhako_user:eH4lDu614dfwTpVVqXp1VvPFUqA3Uzgj@dpg-da7vmi0ae00c73a9i5i0-a.c.db.onrender.com:5432/dhako',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    const result = await pool.query('SELECT id, name, type FROM locations ORDER BY type, name');
    console.log('\n📍 LOCATIONS IN PRODUCTION DATABASE:\n');
    if (result.rows.length === 0) {
      console.log('❌ TABLE IS EMPTY! No locations found.');
      console.log('\nYou need to seed the database with locations.');
    } else {
      console.log('✅ ' + result.rows.length + ' locations found:\n');
      result.rows.forEach((row, i) => {
        console.log((i+1) + '. ' + row.name + ' (' + row.type + ')');
        console.log('   ID: ' + row.id + '\n');
      });
    }
  } catch(e) { 
    console.error('❌ Error connecting to database:', e.message); 
  }
  process.exit(0);
})();
