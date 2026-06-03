// Helper cho test E2E: đọc mã OTP của một email, hoặc dọn tài khoản test.
// Dùng: node test-otp-helper.js get <email>
//       node test-otp-helper.js cleanup <emailPrefix>
const mysql = require('mysql2/promise');

const cfg = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'petcarehub',
};

async function main() {
  const [, , cmd, arg] = process.argv;
  const c = await mysql.createConnection(cfg);
  try {
    if (cmd === 'get') {
      const [rows] = await c.execute(
        'SELECT emailVerificationToken FROM users WHERE email = ?',
        [arg],
      );
      process.stdout.write(rows[0] ? rows[0].emailVerificationToken || '' : '');
    } else if (cmd === 'cleanup') {
      const like = `${arg}%`;
      await c.execute(
        'DELETE p FROM user_profiles p JOIN users u ON p.userId = u.id WHERE u.email LIKE ?',
        [like],
      );
      const [r] = await c.execute('DELETE FROM users WHERE email LIKE ?', [like]);
      process.stdout.write(`deleted ${r.affectedRows}`);
    }
  } finally {
    await c.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
