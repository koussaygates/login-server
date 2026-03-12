require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const authMiddleware = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));

app.get('/api/profile', authMiddleware, (req, res) => {
  res.json({ message: 'Welcome!', user: req.user });
});

app.get('/api/users', authMiddleware, (req, res) => {
  const db = require('./database');
  db.all('SELECT id, username, role, created_at FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
// View login logs (protected)
app.get('/api/logs', authMiddleware, (req, res) => {
  const db = require('./database');
  db.all('SELECT * FROM login_logs ORDER BY attempted_at DESC LIMIT 100', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});