#!/usr/bin/env node
/**
 * create_admin.js
 * Usage (examples):
 *  node create_admin.js --email=admin@example.com --password=Secret123 --firstName=Admin --lastName=User --phone=1234567890 --department=ops --permissions=view,edit
 * Or set values with environment variables: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRSTNAME, etc.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/deliveryApp';

function parseArg(name) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  if (arg) return arg.split('=')[1];
  return process.env[name.toUpperCase()] || null;
}

function parsePositional(i) {
  // first two argv items are node and script path
  const val = process.argv[i + 2];
  return val || null;
}

(async () => {
  // Support both flags (--email=) and simple positional: node create_admin.js email password
  const email = parseArg('email') || parseArg('ADMIN_EMAIL') || parsePositional(0);
  const password = parseArg('password') || parseArg('ADMIN_PASSWORD') || parsePositional(1);
  const firstName = parseArg('firstName') || parseArg('ADMIN_FIRSTNAME') || parseArg('firstname') || 'Admin';
  const lastName = parseArg('lastName') || parseArg('ADMIN_LASTNAME') || 'User';
  const phone = parseArg('phone') || parseArg('ADMIN_PHONE') || '0000000000';
  const department = parseArg('department') || parseArg('ADMIN_DEPARTMENT') || 'operations';
  const permissionsArg = parseArg('permissions') || parseArg('ADMIN_PERMISSIONS') || 'view';
  const permissions = permissionsArg.split(',').map(p => p.trim()).filter(Boolean);

  if (!email || !password) {
    console.error('Error: email and password are required. Provide via flags, env vars, or positional args.');
    console.error('Examples:');
    console.error('  node server/create_admin.js --email=admin@example.com --password=Secret123');
    console.error('  node server/create_admin.js admin@example.com Secret123');
    console.error('  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=Secret123 node server/create_admin.js');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Minimal schemas for lookup (explicit collection names to match server)
    const lookupSchema = new mongoose.Schema({ email: String }, { strict: false });
    const Customer = mongoose.model('Customer', lookupSchema, 'customers');
    const Agent = mongoose.model('Agent', lookupSchema, 'agents');

    // Admin schema for creation
    const adminSchema = new mongoose.Schema({
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      phone: { type: String, required: true },
      role: { type: String, required: true, enum: ['customer', 'agent', 'admin'] },
      department: { type: String, required: true },
      permissions: [{ type: String }],
      createdAt: { type: Date, default: Date.now }
    }, { strict: false });

    const Admin = mongoose.model('Admin', adminSchema, 'admins');

    // Check existing email
    const [c, a, ad] = await Promise.all([
      Customer.findOne({ email }).lean(),
      Agent.findOne({ email }).lean(),
      Admin.findOne({ email }).lean()
    ]);

    if (c || a || ad) {
      console.error('A user with that email already exists in the database. Aborting.');
      process.exit(1);
    }

    // Hash password
    const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const newAdmin = await Admin.create({
      firstName,
      lastName,
      email,
      password: hashed,
      phone,
      role: 'admin',
      department,
      permissions
    });

    const out = newAdmin.toObject();
    delete out.password;

    console.log('Admin user created successfully:');
    console.log(JSON.stringify(out, null, 2));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(2);
  }
})();
