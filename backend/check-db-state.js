const mysql = require('mysql2/promise');

async function checkDB() {
  const connection = await mysql.createConnection({
    host: '103.199.17.33',
    user: 'petcarehub',
    password: 'G1x8aSSDv38eAgyzeJ9p',
    database: 'petcarehub'
  });

  try {
    console.log('=== Current Database State ===\n');

    // Check column definition
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM posts WHERE Field = 'type'"
    );
    console.log('Column definition:');
    console.log(columns[0]);

    // Check data
    const [rows] = await connection.execute(
      'SELECT id, type, title FROM posts'
    );
    console.log('\nCurrent posts:');
    console.log(rows);

    // Check if there are any user_post values
    const [userPostRows] = await connection.execute(
      "SELECT COUNT(*) as count FROM posts WHERE type = 'user_post'"
    );
    console.log(`\nPosts with type 'user_post': ${userPostRows[0].count}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkDB();
