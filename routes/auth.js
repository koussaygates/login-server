const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../database');
const router  = express.Router();

// ── PARSE USER AGENT ─────────────────────────────
function parseUserAgent(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };

  let browser = 'Unknown';
  let os      = 'Unknown';
  let device  = 'Desktop';

  // Browser
  if (ua.includes('Chrome') && !ua.includes('Edg'))  browser = 'Chrome';
  else if (ua.includes('Firefox'))                    browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg'))                        browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  else if (ua.includes('curl'))                       browser = 'curl';
  else if (ua.includes('Postman'))                    browser = 'Postman';

  // OS
  if (ua.includes('Windows NT 10'))      os = 'Windows 10/11';
  else if (ua.includes('Windows NT 6'))  os = 'Windows 7/8';
  else if (ua.includes('Windows'))       os = 'Windows';
  else if (ua.includes('Mac OS X'))      os = 'macOS';
  else if (ua.includes('Linux'))         os = 'Linux';
  else if (ua.includes('Android'))       os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Device
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) device = 'Mobile';
  else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet';

  return { browser, os, device };
}

// ── GET REAL IP ───────────────────────────────────
function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'Unknown'
  ).replace('::ffff:', ''); // strip IPv6 prefix
}

// ── LOG TO DB ─────────────────────────────────────
function logLogin(userId, username, ip, geo, ua, status) {
  const { browser, os, device } = parseUserAgent(ua);
  db.run(
    `INSERT INTO login_logs (user_id, username, ip, country, city, isp, device, browser, os, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, username, ip, geo.country, geo.city, geo.isp, device, browser, os, status]
  );
}

// ── GEO LOOKUP ────────────────────────────────────
async function geoLookup(ip) {
  try {
    // Skip for localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
      return { country: 'localhost', city: 'localhost', isp: 'local network' };
    }
    const res  = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,isp,status`);
    const data = await res.json();
    if (data.status === 'success') return data;
    return { country: 'Unknown', city: 'Unknown', isp: 'Unknown' };
  } catch {
    return { country: 'Unknown', city: 'Unknown', isp: 'Unknown' };
  }
}

// ── REGISTER ─────────────────────────────────────
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  const hash = bcrypt.hashSync(password, 10);
  db.run(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, hash],
    function (err) {
      if (err) return res.status(409).json({ error: 'Username already exists' });
      res.status(201).json({ message: 'User created', id: this.lastID });
    }
  );
});

// ── LOGIN ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const ip = getIP(req);
  const ua = req.headers['user-agent'] || '';
  const geo = await geoLookup(ip);

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) {
      logLogin(null, username, ip, geo, ua, 'FAILED');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      logLogin(user.id, username, ip, geo, ua, 'FAILED');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    logLogin(user.id, username, ip, geo, ua, 'SUCCESS');

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      meta: { ip, ...geo, ...parseUserAgent(ua) }
    });
  });
});

module.exports = router;