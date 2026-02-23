const mysql = require('mysql2/promise');

async function fixPostsType() {
  const connection = await mysql.createConnection({
    host: '103.199.17.33',
    user: 'petcarehub',
    password: 'G1x8aSSDv38eAgyzeJ9p',
    database: 'petcarehub'
  });

  try {
    console.log('Connected to database');

    // First, let's check the current column definition
    const [colsBefore] = await connection.execute(
      "SHOW COLUMNS FROM posts WHERE Field = 'type'"
    );
    console.log('Current column definition:', colsBefore[0]);

    // First, let's see what data we have
    const [rows] = await connection.execute('SELECT id, type FROM posts');
    console.log(`Found ${rows.length} posts`);

    if (rows.length > 0) {
      console.log('Sample data:', rows.slice(0, 5));
    }

    // Step 1: Alter the column to include all possible values
    console.log('\nStep 1: Altering column to include all enum values...');
    await connection.execute(
      "ALTER TABLE posts MODIFY COLUMN type ENUM('blog', 'user', 'user_post', 'news', 'question') NOT NULL DEFAULT 'user'"
    );
    console.log('Column altered successfully');

    // Step 2: Update user_post to user
    console.log('\nStep 2: Updating user_post values to user...');
    const [result] = await connection.execute(
      "UPDATE posts SET type = 'user' WHERE type = 'user_post'"
    );
    console.log(`Updated ${result.affectedRows} rows from 'user_post' to 'user'`);

    // Check the result
    const [rowsAfter] = await connection.execute('SELECT id, type FROM posts');
    console.log('\nData after update:', rowsAfter.slice(0, 5));

    console.log('\n✅ Database fixed successfully!');
    console.log('You can now restart the backend server.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await connection.end();
  }
}

fixPostsType();
