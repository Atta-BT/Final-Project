// const express = require('express');
// const mysql = require('mysql2');
// const cors = require('cors');
// const bcrypt = require('bcryptjs');

// // bcrypt.hash('151244', 10).then(console.log);

// const app = express();
// const PORT = 3001;

// app.use(cors());
// app.use(express.json());

// // DB connection
// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'login'
// });

// db.connect((err) => {
//   if (err) {
//     console.error('❌ Database connection failed:', err);
//   } else {
//     console.log('✅ Connected to MySQL');
//   }
// });

// app.post('/login', (req, res) => {
//   const { email, password } = req.body;

//   db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
//     if (err) {
//       console.error('❌ SQL Error:', err);  // ✅ ดูข้อความ error จริง
//       return res.status(500).json({ message: 'DB error' });
//     }

//     if (results.length === 0) {
//       return res.status(401).json({ message: 'Email not found' });
//     }

//     const user = results[0];
//     console.log('👉 password from input:', password);
//     console.log('👉 password from DB:', user.password);

//     bcrypt.compare(password, user.password, (err, isMatch) => {
//       if (err) {
//         console.error('❌ Compare error:', err);
//         return res.status(500).json({ message: 'Compare error' });
//       }

//       console.log('✅ isMatch:', isMatch); // ✅ log ผลลัพธ์

//       if (!isMatch) {
//         return res.status(401).json({ message: 'Incorrect password' });
//       }

//       res.json({
//         message: 'Login success',
//         user: {
//           id: user.id,
//           username: user.username,
//           email: user.email
//         }
//       });
//     });
//   });
// });




// app.listen(PORT, () => {
//   console.log(`🚀 Backend running at http://localhost:${PORT}`);
// });
