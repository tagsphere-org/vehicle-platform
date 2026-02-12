/**
 * Script to create an admin user
 *
 * Usage: node scripts/createAdmin.js <phone> <name>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const phone = process.argv[2];
const name = process.argv[3] || 'Admin';

if (!phone) {
  console.error('Usage: node scripts/createAdmin.js <phone> <name>');
  console.error('Example: node scripts/createAdmin.js 9876543210 "Admin User"');
  process.exit(1);
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user exists
    let user = await User.findByPhone(phone);

    if (user) {
      // Update to admin
      user.role = 'admin';
      await user.save();
      console.log(`User ${user.name} upgraded to admin`);
    } else {
      // Create new admin user
      user = new User({
        name,
        phone,
        isVerified: true,
        role: 'admin'
      });
      await user.save();
      console.log(`Admin user created: ${name}`);
    }

    console.log(`Phone: ${phone}`);
    console.log(`Role: admin`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
