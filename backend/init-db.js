const fs = require('fs');
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://dhako_user:eH4lDu614dfwTpVVqXp1VvPFUqA3Uzgj@dpg-da7vmi0ae00c73a9i5i0-a.onrender.com:5432/dhako';

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false },
});

async function initializeDatabase() {
  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('Reading SQL script...');
    const sql = fs.readFileSync('./init-database.sql', 'utf8');

    console.log('Executing SQL...');
    await client.query(sql);
    console.log('✅ Database initialized successfully!');

    await client.end();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
