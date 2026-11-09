/**
 * Narayani Sarees - CLI Tool to Update Super Admin Credentials
 * Tuljapur, Maharashtra
 *
 * Usage:
 *   node change_admin.js <new_email> <new_password>
 * Example:
 *   node change_admin.js nikhil@narayanisarees.com MySecretPass@2026
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const envPath = path.join(__dirname, '.env');
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
  =============================================================
  👑 NARAYANI SAREES - ADMIN CREDENTIALS CONFIGURATOR
  =============================================================
  
  Usage:
    node change_admin.js <new_email> <new_password>

  Example:
    node change_admin.js storeowner@gmail.com SareeOwner@2026

  Current configured admin in .env:
  `);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const emailMatch = envContent.match(/ADMIN_EMAIL=(.*)/);
    const passMatch = envContent.match(/ADMIN_PASSWORD=(.*)/);
    console.log(`  ADMIN_EMAIL:    ${emailMatch ? emailMatch[1].trim() : 'admin@narayanisarees.com'}`);
    console.log(`  ADMIN_PASSWORD: ${passMatch ? passMatch[1].trim() : 'Admin@123'}\n`);
  }
  process.exit(0);
}

const newEmail = args[0].trim().toLowerCase();
const newPassword = args[1].trim();

if (!newEmail.includes('@') || newPassword.length < 6) {
  console.error('\n❌ ERROR: Please provide a valid email address and a password with at least 6 characters.\n');
  process.exit(1);
}

// 1. Update or append in backend/.env
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

if (/ADMIN_EMAIL=/.test(envContent)) {
  envContent = envContent.replace(/ADMIN_EMAIL=.*/g, `ADMIN_EMAIL=${newEmail}`);
} else {
  envContent += `\nADMIN_EMAIL=${newEmail}`;
}

if (/ADMIN_PASSWORD=/.test(envContent)) {
  envContent = envContent.replace(/ADMIN_PASSWORD=.*/g, `ADMIN_PASSWORD=${newPassword}`);
} else {
  envContent += `\nADMIN_PASSWORD=${newPassword}`;
}

fs.writeFileSync(envPath, envContent, 'utf8');

// 2. If MySQL is configured and reachable, update MySQL admins table
async function updateDatabase() {
  try {
    const { isMysqlConnected, query } = require('./config/db');
    if (isMysqlConnected && isMysqlConnected()) {
      const hash = await bcrypt.hash(newPassword, 10);
      await query('UPDATE admins SET email = ?, password_hash = ? WHERE role_id = 1 OR id = 1', [newEmail, hash]);
      console.log('  ✅ MySQL Database `admins` table updated successfully.');
    }
  } catch (err) {
    // Ignore MySQL connection errors in local fallback mode
  }
}

updateDatabase().then(() => {
  console.log(`
  =============================================================
  ✨ ADMIN CREDENTIALS UPDATED SUCCESSFULLY! ✨
  =============================================================
  👑 Email:    ${newEmail}
  🔒 Password: ${newPassword}
  📁 Stored in: backend/.env
  🌐 Login at:  http://localhost:5000/pages/login.html
  =============================================================
  Restart your server if it is running to apply the changes.
  `);
  process.exit(0);
});
