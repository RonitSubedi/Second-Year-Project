/**
 * SEED SCRIPT — Run this after importing database.sql
 * This sets correct bcrypt hashed passwords for all accounts.
 *
 * Usage: node seed.js
 */

const bcrypt = require("bcryptjs");
const db = require("./config/db");
require("dotenv").config();

const accounts = [
  { email: "admin@iic.edu.np",              password: "Admin@123" },
  { email: "driver.biratnagar@iic.edu.np",  password: "Driver@123" },
  { email: "driver.damak@iic.edu.np",       password: "Driver@123" },
  { email: "driver.dharan@iic.edu.np",      password: "Driver@123" },
  { email: "driver.inaruwa@iic.edu.np",     password: "Driver@123" },
];

async function seed() {
  console.log("\n🔐 Setting passwords for all accounts...\n");

  for (const account of accounts) {
    const hash = await bcrypt.hash(account.password, 10);
    await new Promise((resolve, reject) => {
      db.query(
        "UPDATE users SET password = ? WHERE email = ?",
        [hash, account.email],
        (err, result) => {
          if (err) {
            console.error(`❌ Failed for ${account.email}:`, err.message);
            reject(err);
          } else if (result.affectedRows === 0) {
            console.warn(`⚠️  No user found with email: ${account.email}`);
            resolve();
          } else {
            console.log(`✅ Password set for: ${account.email}`);
            resolve();
          }
        }
      );
    });
  }

  console.log("\n🎉 All passwords set successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Admin    → admin@iic.edu.np     / Admin@123");
  console.log("  Drivers  → driver.xxx@iic.edu.np / Driver@123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
