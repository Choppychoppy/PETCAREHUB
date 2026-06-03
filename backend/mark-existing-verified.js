// Script chạy 1 lần: đánh dấu tất cả tài khoản hiện có là đã xác minh email.
// Mục đích: tránh khóa các tài khoản cũ (admin/seed) khi bật chặn đăng nhập với
// tài khoản chưa xác minh. Chỉ người đăng ký MỚI mới phải xác minh OTP.
//
// Cách chạy: node mark-existing-verified.js
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'petcarehub',
  });

  try {
    const [result] = await connection.execute(
      'UPDATE users SET emailVerified = 1, emailVerificationToken = NULL, emailVerificationExpires = NULL WHERE emailVerified = 0',
    );
    console.log(`Đã đánh dấu ${result.affectedRows} tài khoản cũ là đã xác minh email.`);
  } catch (error) {
    console.error('Lỗi:', error.message);
  } finally {
    await connection.end();
  }
}

run();
