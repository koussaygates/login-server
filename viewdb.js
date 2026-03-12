const db = require('./database');

// ── COLORS ───────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bright: '\x1b[1m',
  dim:    '\x1b[2m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  magenta:'\x1b[35m',
  white:  '\x1b[97m',
  bgDark: '\x1b[40m',
};

const cyan   = t => `${C.cyan}${t}${C.reset}`;
const green  = t => `${C.green}${t}${C.reset}`;
const red    = t => `${C.red}${t}${C.reset}`;
const yellow = t => `${C.yellow}${t}${C.reset}`;
const dim    = t => `${C.dim}${t}${C.reset}`;
const bold   = t => `${C.bright}${t}${C.reset}`;
const white  = t => `${C.white}${t}${C.reset}`;

// ── HELPERS ──────────────────────────────────────
function pad(str, len) {
  const s = String(str ?? '—');
  return s.length > len ? s.slice(0, len - 1) + '…' : s.padEnd(len);
}

function line(char, len) {
  return char.repeat(len);
}

function header(title, icon) {
  const width = 72;
  console.log('');
  console.log(cyan('╔' + line('═', width) + '╗'));
  console.log(cyan('║') + bold(white(`  ${icon}  ${title}`)).padEnd(width + 10) + cyan('║'));
  console.log(cyan('╚' + line('═', width) + '╝'));
}

function divider() {
  console.log(dim('  ' + line('─', 70)));
}

// ── BANNER ───────────────────────────────────────
function showBanner() {
  console.clear();
  console.log('');
  console.log(cyan('  ██████╗ ██████╗     ██╗   ██╗██╗███████╗██╗    ██╗███████╗██████╗ '));
  console.log(cyan('  ██╔══██╗██╔══██╗    ██║   ██║██║██╔════╝██║    ██║██╔════╝██╔══██╗'));
  console.log(cyan('  ██║  ██║██████╔╝    ██║   ██║██║█████╗  ██║ █╗ ██║█████╗  ██████╔╝'));
  console.log(cyan('  ██║  ██║██╔══██╗    ╚██╗ ██╔╝██║██╔══╝  ██║███╗██║██╔══╝  ██╔══██╗'));
  console.log(cyan('  ██████╔╝██████╔╝     ╚████╔╝ ██║███████╗╚███╔███╔╝███████╗██║  ██║'));
  console.log(cyan('  ╚═════╝ ╚═════╝       ╚═══╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝'));
  console.log('');
  console.log(dim('  ') + yellow('⚡ Node.js SQLite Database Viewer') + dim('  —  login-server'));
  console.log(dim('  ') + dim(new Date().toLocaleString()));
  console.log('');
}

// ── USERS TABLE ──────────────────────────────────
function showUsers(rows) {
  header('USERS TABLE', '👤');
  console.log('');

  // Column headers
  console.log(
    dim('  ') +
    bold(cyan(pad('ID',   4))) + ' │ ' +
    bold(cyan(pad('USERNAME', 16))) + ' │ ' +
    bold(cyan(pad('ROLE',  8))) + ' │ ' +
    bold(cyan(pad('PASSWORD HASH', 20))) + ' │ ' +
    bold(cyan(pad('CREATED AT', 22)))
  );
  divider();

  if (rows.length === 0) {
    console.log(dim('  No users found.'));
  }

  rows.forEach((u, i) => {
    const roleColor = u.role === 'admin' ? red(pad(u.role, 8)) : green(pad(u.role, 8));
    const rowNum    = i % 2 === 0 ? white : (t => `${C.dim}${t}${C.reset}`);

    console.log(
      dim('  ') +
      yellow(pad(u.id, 4)) + ' │ ' +
      white(pad(u.username, 16)) + ' │ ' +
      roleColor + ' │ ' +
      dim(pad(u.password || '—', 20)) + ' │ ' +
      dim(pad(u.created_at, 22))
    );
  });

  console.log('');
  console.log(dim('  ') + green(`✓ ${rows.length} user(s) total`));
}

// ── LOGS TABLE ───────────────────────────────────
function showLogs(rows) {
  header('LOGIN LOGS', '📋');
  console.log('');

  // Column headers
  console.log(
    dim('  ') +
    bold(cyan(pad('ID',   4))) + ' │ ' +
    bold(cyan(pad('USERNAME', 12))) + ' │ ' +
    bold(cyan(pad('IP',  15))) + ' │ ' +
    bold(cyan(pad('COUNTRY', 12))) + ' │ ' +
    bold(cyan(pad('BROWSER', 10))) + ' │ ' +
    bold(cyan(pad('OS', 14))) + ' │ ' +
    bold(cyan(pad('STATUS',  8))) + ' │ ' +
    bold(cyan(pad('TIME', 20)))
  );
  divider();

  if (rows.length === 0) {
    console.log(dim('  No login attempts logged yet.'));
  }

  rows.forEach(log => {
    const statusColor = log.status === 'SUCCESS'
      ? green(pad(log.status, 8))
      : red(pad(log.status, 8));

    console.log(
      dim('  ') +
      yellow(pad(log.id, 4))           + ' │ ' +
      white(pad(log.username, 12))     + ' │ ' +
      cyan(pad(log.ip, 15))            + ' │ ' +
      dim(pad(log.country, 12))        + ' │ ' +
      dim(pad(log.browser, 10))        + ' │ ' +
      dim(pad(log.os, 14))             + ' │ ' +
      statusColor                      + ' │ ' +
      dim(pad(log.attempted_at, 20))
    );
  });

  console.log('');

  // Stats summary
  const success = rows.filter(r => r.status === 'SUCCESS').length;
  const failed  = rows.filter(r => r.status === 'FAILED').length;
  const ips     = [...new Set(rows.map(r => r.ip))].length;

  console.log(dim('  ') + green(`✓ ${success} successful`) + dim('  │  ') + red(`✗ ${failed} failed`) + dim('  │  ') + cyan(`◈ ${ips} unique IP(s)`));
}

// ── TABLES LIST ──────────────────────────────────
function showTables(rows) {
  header('DATABASE TABLES', '🗄️');
  console.log('');
  rows.forEach(r => {
    console.log(dim('  ') + cyan('◆') + '  ' + white(r.name));
  });
  console.log('');
}

// ── FOOTER ───────────────────────────────────────
function showFooter() {
  console.log('');
  console.log(cyan('  ' + line('═', 70)));
  console.log(dim('  Done. Run ') + yellow('node viewdb.js') + dim(' again to refresh.'));
  console.log('');
}

// ── MAIN ─────────────────────────────────────────
showBanner();

db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (!err) showTables(tables);

  db.all('SELECT id, username, role, password, created_at FROM users', [], (err, users) => {
    if (!err) showUsers(users);

    setTimeout(() => {
      db.all('SELECT * FROM login_logs ORDER BY attempted_at DESC LIMIT 50', [], (err, logs) => {
        if (!err) showLogs(logs);
        showFooter();
      });
    }, 300);
  });
});