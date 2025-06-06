const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  socketPath: '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock',
  user: 'exam',
  password: 'alif',
  database: 'institute_exams',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;